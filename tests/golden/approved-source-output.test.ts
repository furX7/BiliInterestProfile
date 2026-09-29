import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { collectApprovedSources } from '../../src/core/pipeline/collect-approved-sources'

// This fixture is deidentified/reconstructed test input, not a fresh site observation.
const fixtureHtml = readFileSync(resolve('tests/fixtures/phase0/dynamic-valid.html'), 'utf8')
const route = new URL('https://space.bilibili.com/123/dynamic?source=test')
const emptyCandidateHtml = fixtureHtml.replace(
  /<main[\s\S]*<\/main>/,
  '<main class="space-main route_dynamic"><div class="bili-dyn-list"><div class="bili-dyn-list__items"></div><div class="bili-dyn-list-loading" hidden>正在玩命加载…</div><div class="bili-dyn-list-empty"><div class="bili-dyn-list-empty__inner"><div class="bili-dyn-list-empty__text"><span>好像没有东西诶</span></div></div></div></div></main>',
)

function project(html: string) {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const collection = collectApprovedSources(document, route)
  return {
    contextStatus: collection.context.status,
    dynamic: collection.dynamic,
    behaviorEvidenceSources: collection.behaviorEvidenceSources,
  }
}

describe('approved source output golden (deidentified fixture)', () => {
  it('matches the manually reviewed contract projection without turning candidate empty into proof', () => {
    const expected = JSON.parse(
      readFileSync(resolve('tests/golden/approved-source-output.json'), 'utf8'),
    )

    expect({
      visibleCard: project(fixtureHtml),
      singleSnapshotEmptyCandidate: project(emptyCandidateHtml),
    }).toEqual(expected)
  })
})
