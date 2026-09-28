import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { collectApprovedSources } from '../../src/core/pipeline/collect-approved-sources'
import { approvedSourceRegistry } from '../../src/sources/bilibili/registry'

const fixturePath = resolve('tests/fixtures/synthetic/dynamic-valid.html')
const syntheticHtml = readFileSync(fixturePath, 'utf8')
const url = new URL('https://space.bilibili.com/123/dynamic?source=test')
const parse = (html = syntheticHtml) => new DOMParser().parseFromString(html, 'text/html')

describe('approved Bilibili source pipeline (synthetic DOM only)', () => {
  it('exposes only profile context and dynamic collection from the approved source registry', () => {
    expect(Object.keys(approvedSourceRegistry)).toEqual([
      'profileContextReader',
      'dynamicCardReader',
      'dynamicCandidateNormalizer',
    ])
  })

  it('keeps profile context separate and emits dynamic as the sole behavior evidence source', () => {
    const result = collectApprovedSources(parse(), url)
    expect(result.context.status).toBe('available')
    expect(result.context.data).toMatchObject({ userId: '123', displayName: 'Example User' })
    expect(result.dynamic).toEqual({
      status: 'partial',
      data: [{
        source: 'dynamic',
        userId: '123',
        title: null,
        text: 'Original synthetic post',
        timestamp: null,
        sourceUrl: 'https://space.bilibili.com/123/dynamic',
        traceGranularity: 'page',
      }],
      warnings: [],
    })
    expect(result.behaviorEvidenceSources).toEqual(['dynamic'])
  })

  it('preserves a confirmed empty dynamic page as empty with an empty collection', () => {
    const emptyHtml = syntheticHtml.replace(/<main[\s\S]*<\/main>/, '<main class="bili-dyn-list"><p>好像没有东西诶</p></main>')
    const result = collectApprovedSources(parse(emptyHtml), url)
    expect(result.dynamic).toEqual({ status: 'empty', data: [], warnings: [] })
  })

  it('preserves an uncertain zero-card page as unknown with null data', () => {
    const loadingHtml = syntheticHtml.replace(/<main[\s\S]*<\/main>/, '<main class="bili-dyn-list"><p>正在玩命加载…</p></main>')
    const result = collectApprovedSources(parse(loadingHtml), url)
    expect(result.dynamic.status).toBe('unknown')
    expect(result.dynamic.data).toBeNull()
    expect(result.dynamic.warnings[0]?.code).toBe('page_state_uncertain')
  })

  it('keeps rejected cards as warnings instead of an empty evidence collection', () => {
    const mismatchedAuthor = syntheticHtml.replace('>Example User</span>', '>Other User</span>')
    const result = collectApprovedSources(parse(mismatchedAuthor), url)
    expect(result.dynamic.status).toBe('unknown')
    expect(result.dynamic.data).toBeNull()
    expect(result.dynamic.warnings.some((warning) => warning.code === 'identity_mismatch')).toBe(true)
  })
})
