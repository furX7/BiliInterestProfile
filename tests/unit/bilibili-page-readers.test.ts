import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readDynamicCards } from '../../src/sources/bilibili/dynamics/read-dynamic-cards'
import { readProfileContext } from '../../src/sources/bilibili/profile/read-profile-context'

const fixturePath = resolve('tests/fixtures/synthetic/profile-valid.html')
const syntheticHtml = readFileSync(fixturePath, 'utf8')
const dynamicFixturePath = resolve('tests/fixtures/synthetic/dynamic-valid.html')
const dynamicSyntheticHtml = readFileSync(dynamicFixturePath, 'utf8')
const parse = (html = syntheticHtml) => new DOMParser().parseFromString(html, 'text/html')

describe('profile context reader (synthetic DOM only)', () => {
  it('accepts matching positive route UID and visible profile UID', () => {
    const result = readProfileContext(parse(), new URL('https://space.bilibili.com/123/dynamic?source=test'))
    expect(result).toEqual({
      status: 'available',
      data: {
        userId: '123',
        displayName: 'Example User',
        description: 'Example biography',
        sourceUrl: 'https://space.bilibili.com/123',
      },
      warnings: [],
    })
  })

  it('rejects a non-positive or non-space route instead of guessing a profile', () => {
    for (const url of ['https://space.bilibili.com/0', 'https://space.bilibili.com/name', 'https://www.bilibili.com/123']) {
      const result = readProfileContext(parse(), new URL(url))
      expect(result.data).toBeNull()
      expect(result.status).not.toBe('available')
    }
  })

  it('rejects a profile UID that disagrees with the route', () => {
    const html = syntheticHtml.replace('UID: 123', 'UID: 456')
    const result = readProfileContext(parse(html), new URL('https://space.bilibili.com/123'))
    expect(result.status).toBe('unknown')
    expect(result.data).toBeNull()
    expect(result.warnings[0]?.code).toBe('identity_mismatch')
  })

  it('does not accept a missing or hidden identity as a valid profile', () => {
    const missingName = syntheticHtml.replace('class="nickname"', 'class="other"')
    const hiddenUid = syntheticHtml.replace('class="sic-fsp-uid_line"', 'class="sic-fsp-uid_line" hidden')
    for (const html of [missingName, hiddenUid]) {
      const result = readProfileContext(parse(html), new URL('https://space.bilibili.com/123'))
      expect(result.status).toBe('unknown')
      expect(result.data).toBeNull()
    }
  })

  it('does not use an ambiguous duplicate nickname', () => {
    const html = syntheticHtml + '<div class="nickname">Other User</div>'
    const result = readProfileContext(parse(html), new URL('https://space.bilibili.com/123'))
    expect(result.status).toBe('unknown')
    expect(result.data).toBeNull()
  })
})

describe('dynamic card reader (synthetic DOM only)', () => {
  const dynamicUrl = new URL('https://space.bilibili.com/123/dynamic?source=test')
  const parseDynamic = (html = dynamicSyntheticHtml) => new DOMParser().parseFromString(html, 'text/html')

  it('reads a visible card only when login and page identity are confirmed', () => {
    expect(readDynamicCards(parseDynamic(), dynamicUrl)).toEqual({
      status: 'available',
      data: [{
        routeUserId: '123',
        headerDisplayName: 'Example User',
        cardAuthorDisplayName: 'Example User',
        text: 'Original synthetic post',
        title: null,
        dateLabel: null,
        sourceUrl: 'https://space.bilibili.com/123/dynamic',
        hasReference: false,
        identity: 'confirmed',
        rejectionReason: null,
      }],
      warnings: [],
    })
  })

  it('marks missing or mismatched top-level authors unusable without using similar content as a substitute', () => {
    for (const html of [
      dynamicSyntheticHtml.replace('>Example User</span>', '></span>'),
      dynamicSyntheticHtml.replace('>Example User</span>', '>Other User</span>'),
    ]) {
      const result = readDynamicCards(parseDynamic(html), dynamicUrl)
      expect(result.status).toBe('partial')
      expect(result.data?.[0]).toMatchObject({ text: null, rejectionReason: 'identity_mismatch' })
      expect(result.warnings[0]?.code).toBe('identity_mismatch')
    }
  })

  it('uses the forwarding description and never falls back to content inside the reference subtree', () => {
    const html = dynamicSyntheticHtml.replace(
      '<p class="bili-dyn-content__orig__desc">Original synthetic post</p>',
      '<p class="bili-dyn-content__forw__desc">Forwarding comment</p><section class="bili-dyn-content__orig reference"><p class="bili-dyn-content__orig__desc">Referenced author text</p></section>',
    )
    const result = readDynamicCards(parseDynamic(html), dynamicUrl)
    expect(result.data?.[0]).toMatchObject({ text: 'Forwarding comment', hasReference: true, rejectionReason: null })
  })

  it('rejects a generic share label and a reference without a forwarding description', () => {
    const share = dynamicSyntheticHtml.replace('Original synthetic post', '分享动态')
    const referenceOnly = dynamicSyntheticHtml.replace(
      '<p class="bili-dyn-content__orig__desc">Original synthetic post</p>',
      '<section class="bili-dyn-content__orig reference"><p class="bili-dyn-content__orig__desc">Referenced author text</p></section>',
    )
    for (const html of [share, referenceOnly]) {
      const result = readDynamicCards(parseDynamic(html), dynamicUrl)
      expect(result.status).toBe('partial')
      expect(result.data?.[0]).toMatchObject({ text: null, rejectionReason: 'content_unusable' })
    }
  })

  it('does not treat a hidden empty state as empty when rendered cards exist', () => {
    const html = dynamicSyntheticHtml + '<p hidden>好像没有东西诶</p>'
    expect(readDynamicCards(parseDynamic(html), dynamicUrl).status).toBe('available')
  })

  it('returns empty only for a visible explicit empty state after login and identity checks', () => {
    const html = dynamicSyntheticHtml.replace(/<main[\s\S]*<\/main>/, '<main class="bili-dyn-list"><p>好像没有东西诶</p></main>')
    expect(readDynamicCards(parseDynamic(html), dynamicUrl)).toEqual({ status: 'empty', data: [], warnings: [] })
  })

  it('returns unknown for a zero-card page with a loading or unconfirmed login state', () => {
    const zeroCards = dynamicSyntheticHtml.replace(/<main[\s\S]*<\/main>/, '<main class="bili-dyn-list"><p>正在玩命加载…</p></main>')
    const signedOut = dynamicSyntheticHtml.replace(/<section class="message-entry">[\s\S]*?<\/section>/, '')
    for (const html of [zeroCards, signedOut]) {
      const result = readDynamicCards(parseDynamic(html), dynamicUrl)
      expect(result.status).toBe('unknown')
      expect(result.data).toBeNull()
      expect(result.warnings[0]?.code).toBe('page_state_uncertain')
    }
  })
})
