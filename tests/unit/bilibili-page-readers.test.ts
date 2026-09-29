import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readDynamicCards } from '../../src/sources/bilibili/dynamics/read-dynamic-cards'
import { readProfileContext } from '../../src/sources/bilibili/profile/read-profile-context'

const fixtureDirectory = 'tests/fixtures/phase0'
const profileFixturePath = resolve(fixtureDirectory, 'profile-valid.html')
const dynamicFixturePath = resolve(fixtureDirectory, 'dynamic-valid.html')
const identityMismatchFixturePath = resolve(fixtureDirectory, 'dynamic-identity-mismatch.html')
const referenceFixturePath = resolve(fixtureDirectory, 'dynamic-reference.html')
const profileHtml = readFileSync(profileFixturePath, 'utf8')
const dynamicHtml = readFileSync(dynamicFixturePath, 'utf8')
const identityMismatchHtml = readFileSync(identityMismatchFixturePath, 'utf8')
const referenceHtml = readFileSync(referenceFixturePath, 'utf8')
const parse = (html = profileHtml) => new DOMParser().parseFromString(html, 'text/html')

describe('profile context reader (deidentified DOM fixtures)', () => {
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
    const html = profileHtml.replace('UID: 123', 'UID: 456')
    const result = readProfileContext(parse(html), new URL('https://space.bilibili.com/123'))
    expect(result.status).toBe('unknown')
    expect(result.data).toBeNull()
    expect(result.warnings[0]?.code).toBe('identity_mismatch')
  })

  it('does not accept a missing or hidden identity as a valid profile', () => {
    const missingName = profileHtml.replace('class="nickname"', 'class="other"')
    const hiddenUid = profileHtml.replace('class="sic-fsp-uid_line"', 'class="sic-fsp-uid_line" hidden')
    for (const html of [missingName, hiddenUid]) {
      const result = readProfileContext(parse(html), new URL('https://space.bilibili.com/123'))
      expect(result.status).toBe('unknown')
      expect(result.data).toBeNull()
    }
  })

  it('rejects profile identity text that exists only in hidden descendants', () => {
    const hiddenName = profileHtml.replace('>Example User</div>', '><span hidden>Example User</span></div>')
    const hiddenUid = profileHtml.replace('>UID: 123</div>', '><span hidden>UID: 123</span></div>')
    for (const html of [hiddenName, hiddenUid]) {
      const result = readProfileContext(parse(html), new URL('https://space.bilibili.com/123/dynamic'))
      expect(result.status).toBe('unknown')
      expect(result.data).toBeNull()
    }
  })

  it('does not use an ambiguous duplicate nickname', () => {
    const html = profileHtml + '<div class="nickname">Other User</div>'
    const result = readProfileContext(parse(html), new URL('https://space.bilibili.com/123'))
    expect(result.status).toBe('unknown')
    expect(result.data).toBeNull()
  })
})

describe('dynamic card reader (deidentified DOM fixtures)', () => {
  const dynamicUrl = new URL('https://space.bilibili.com/123/dynamic?source=test')
  const parseDynamic = (html = dynamicHtml) => new DOMParser().parseFromString(html, 'text/html')
  const statePage = (listContents: string) => dynamicHtml.replace(
    /<main[\s\S]*<\/main>/,
    `<main class="space-main route_dynamic"><div class="bili-dyn-list">${listContents}</div></main>`,
  )
  const emptyState = '<div class="bili-dyn-list-empty"><div class="bili-dyn-list-empty__inner"><div class="bili-dyn-list-empty__text"><span>好像没有东西诶</span></div></div></div>'
  const hiddenLoading = '<div class="bili-dyn-list-loading" hidden>正在玩命加载…</div>'

  it('reads a visible card only when login and page identity are confirmed', () => {
    expect(readDynamicCards(parseDynamic(), dynamicUrl)).toEqual({
      status: 'available',
      data: [{
        routeUserId: '123',
        headerDisplayName: 'Example User',
        cardAuthorDisplayName: 'Example User',
        text: 'Original synthetic post',
        title: null,
        dateLabel: '3 days ago · Posted a video',
        sourceUrl: 'https://space.bilibili.com/123/dynamic',
        hasReference: false,
        identity: 'confirmed',
        rejectionReason: null,
      }],
      warnings: [],
    })
  })

  it('does not read dynamic cards from a non-dynamic space route', () => {
    const result = readDynamicCards(parseDynamic(), new URL('https://space.bilibili.com/123/video'))
    expect(result.status).toBe('unknown')
    expect(result.data).toBeNull()
  })

  it('does not read cards outside the visible dynamic list', () => {
    const card = dynamicHtml.match(/<article[\s\S]*?<\/article>/)?.[0]
    expect(card).toBeDefined()
    const html = statePage('<div class="bili-dyn-list__items"></div>') + card
    const result = readDynamicCards(parseDynamic(html), dynamicUrl)
    expect(result.status).toBe('unknown')
    expect(result.data).toBeNull()
  })

  it('marks missing or mismatched top-level authors unusable without using similar content as a substitute', () => {
    for (const html of [
      dynamicHtml.replace('>Example User</span>', '></span>'),
      identityMismatchHtml,
    ]) {
      const result = readDynamicCards(parseDynamic(html), dynamicUrl)
      expect(result.status).toBe('partial')
      expect(result.data?.[0]).toMatchObject({ text: null, rejectionReason: 'identity_mismatch' })
      expect(result.warnings[0]?.code).toBe('identity_mismatch')
    }
  })

  it('ignores hidden descendants when comparing the visible top-level author', () => {
    const html = dynamicHtml.replace(
      '<span class="bili-dyn-title__text">Example User</span>',
      '<span class="bili-dyn-title__text">Example User<span hidden>Other User</span></span>',
    )

    const result = readDynamicCards(parseDynamic(html), dynamicUrl)

    expect(result.status).toBe('available')
    expect(result.data?.[0]).toMatchObject({ cardAuthorDisplayName: 'Example User', identity: 'confirmed', rejectionReason: null })
  })

  it('excludes hidden descendant text from the current-user post', () => {
    const html = dynamicHtml.replace(
      'Original synthetic post',
      'Original synthetic post<span aria-hidden="true">Referenced hidden text</span>',
    )

    const result = readDynamicCards(parseDynamic(html), dynamicUrl)

    expect(result.status).toBe('available')
    expect(result.data?.[0]).toMatchObject({ text: 'Original synthetic post', rejectionReason: null })
  })

  it('rejects a post whose only text is hidden in a descendant', () => {
    const html = dynamicHtml.replace(
      'Original synthetic post',
      '<span style="display:none">Hidden-only interest</span>',
    )

    const result = readDynamicCards(parseDynamic(html), dynamicUrl)

    expect(result.data?.[0]).toMatchObject({ text: null, rejectionReason: 'content_unusable' })
    expect(result.status).toBe('partial')
  })

  it('uses the forwarding description and never falls back to content inside the reference subtree', () => {
    const result = readDynamicCards(parseDynamic(referenceHtml), dynamicUrl)
    expect(result.data?.[0]).toMatchObject({ text: 'Deidentified forwarding comment', hasReference: true, rejectionReason: null })
  })

  it('rejects a generic share label and a reference without a forwarding description', () => {
    const share = dynamicHtml.replace('Original synthetic post', '分享动态')
    const referenceOnly = dynamicHtml.replace(
      '<p class="bili-dyn-content__orig__desc">Original synthetic post</p>',
      '<section class="bili-dyn-content__orig reference"><p class="bili-dyn-content__orig__desc">Referenced author text</p></section>',
    )
    for (const html of [share, referenceOnly]) {
      const result = readDynamicCards(parseDynamic(html), dynamicUrl)
      expect(result.status).toBe('partial')
      expect(result.data?.[0]).toMatchObject({ text: null, rejectionReason: 'content_unusable' })
    }
  })

  it('does not use a forwarding description nested inside a reference subtree', () => {
    const html = dynamicHtml.replace(
      '<p class="bili-dyn-content__orig__desc">Original synthetic post</p>',
      '<section class="bili-dyn-content__orig reference"><p class="bili-dyn-content__forw__desc">Referenced forwarding text</p></section>',
    )

    const result = readDynamicCards(parseDynamic(html), dynamicUrl)

    expect(result.status).toBe('partial')
    expect(result.data?.[0]).toMatchObject({ text: null, hasReference: true, rejectionReason: 'content_unusable' })
  })

  it('does not treat a hidden empty state as empty when rendered cards exist', () => {
    const card = dynamicHtml.match(/<article[\s\S]*?<\/article>/)?.[0]
    expect(card).toBeDefined()
    const html = statePage(`<div class="bili-dyn-list__items">${card}</div>${hiddenLoading}<div class="bili-dyn-list-empty" hidden><div class="bili-dyn-list-empty__inner"><div class="bili-dyn-list-empty__text"><span>好像没有东西诶</span></div></div></div>`)
    expect(readDynamicCards(parseDynamic(html), dynamicUrl).status).toBe('available')
  })

  it('keeps a single-snapshot empty-state candidate unknown without stability proof', () => {
    const html = statePage(`<div class="bili-dyn-list__items"></div>${hiddenLoading}${emptyState}`)
    expect(readDynamicCards(parseDynamic(html), dynamicUrl)).toMatchObject({
      status: 'unknown',
      data: null,
      warnings: [{ code: 'page_state_uncertain' }],
    })
  })

  it('does not treat matching text outside the dynamic list as a confirmed empty state', () => {
    const html = statePage('<div class="bili-dyn-list__items"></div>')
      + '<aside><p>好像没有东西诶</p></aside>'

    const result = readDynamicCards(parseDynamic(html), dynamicUrl)

    expect(result.status).toBe('unknown')
    expect(result.data).toBeNull()
  })

  it('keeps a zero-card page unknown while its dynamic loading node is visible', () => {
    const html = statePage('<div class="bili-dyn-list__items"></div><div class="bili-dyn-list-loading"></div>' + emptyState)

    const result = readDynamicCards(parseDynamic(html), dynamicUrl)

    expect(result.status).toBe('unknown')
    expect(result.data).toBeNull()
  })

  it('returns unknown for a zero-card page with a loading or unconfirmed login state', () => {
    const zeroCards = dynamicHtml.replace(/<main[\s\S]*<\/main>/, '<main class="bili-dyn-list"><p>正在玩命加载…</p></main>')
    const signedOut = dynamicHtml.replace(/<section class="message-entry">[\s\S]*?<\/section>/, '')
    for (const html of [zeroCards, signedOut]) {
      const result = readDynamicCards(parseDynamic(html), dynamicUrl)
      expect(result.status).toBe('unknown')
      expect(result.data).toBeNull()
      expect(result.warnings[0]?.code).toBe('page_state_uncertain')
    }
  })
})
