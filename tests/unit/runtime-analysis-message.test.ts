import { describe, expect, it } from 'vitest'
import type { ApprovedSourceCollection } from '../../src/core/pipeline/collect-approved-sources'
import {
  isAnalyzeInterestRequest,
  parseAnalyzeInterestResponse,
  summarizeCollection,
} from '../../src/core/runtime/analysis-message'

const evidence = {
  source: 'dynamic' as const,
  userId: '123',
  title: null,
  text: 'Synthetic current-user text',
  timestamp: null,
  sourceUrl: 'https://space.bilibili.com/123/dynamic',
  traceGranularity: 'page' as const,
}

const collection: ApprovedSourceCollection = {
  context: {
    status: 'available',
    data: {
      userId: '123',
      displayName: 'Synthetic profile',
      description: 'Sensitive profile context',
      sourceUrl: 'https://space.bilibili.com/123/dynamic',
    },
    warnings: [{ code: 'identity_mismatch', message: 'Sensitive context warning' }],
  },
  dynamic: {
    status: 'partial',
    data: [evidence],
    warnings: [
      { code: 'identity_mismatch', message: 'Duplicate sensitive warning' },
      { code: 'content_unusable', message: 'Sensitive dynamic warning' },
    ],
  },
  behaviorEvidenceSources: ['dynamic'],
}

describe('runtime analysis message contract', () => {
  it('recognizes only the fixed analysis request', () => {
    expect(isAnalyzeInterestRequest({ type: 'analyze-interest' })).toBe(true)
    expect(isAnalyzeInterestRequest({ type: 'analyze-interest', extra: true })).toBe(false)
    expect(isAnalyzeInterestRequest({ type: 'other' })).toBe(false)
    expect(isAnalyzeInterestRequest(null)).toBe(false)
  })

  it('summarizes confirmed dynamic evidence without exposing source content', () => {
    expect(summarizeCollection(collection)).toEqual({
      contextStatus: 'available',
      dynamicStatus: 'partial',
      evidenceCount: 1,
      warningCodes: ['identity_mismatch', 'content_unusable'],
    })
  })

  it.each(['unknown', 'unavailable'] as const)(
    'keeps %s dynamic data count unavailable even if malformed data is present',
    (status) => {
      const malformed = {
        ...collection,
        dynamic: {
          status,
          data: [evidence],
          warnings: [{ code: 'page_state_uncertain' as const, message: 'Sensitive warning' }],
        },
      } as unknown as ApprovedSourceCollection

      expect(summarizeCollection(malformed)).toEqual({
        contextStatus: 'available',
        dynamicStatus: status,
        evidenceCount: null,
        warningCodes: ['identity_mismatch', 'page_state_uncertain'],
      })
    },
  )

  it('projects only the approved response fields from a collection response', () => {
    const response = parseAnalyzeInterestResponse({
      kind: 'collection',
      summary: {
        contextStatus: 'available',
        dynamicStatus: 'partial',
        evidenceCount: 1,
        warningCodes: ['content_unusable'],
        profile: collection.context.data,
        evidence: collection.dynamic.data,
        warningMessage: 'Sensitive warning',
      },
      internalReason: 'Sensitive transport detail',
    })

    expect(response).toEqual({
      kind: 'collection',
      summary: {
        contextStatus: 'available',
        dynamicStatus: 'partial',
        evidenceCount: 1,
        warningCodes: ['content_unusable'],
      },
    })
    expect(JSON.stringify(response)).not.toContain('Synthetic')
    expect(JSON.stringify(response)).not.toContain('Sensitive')
  })

  it('rejects malformed responses instead of inventing a source result', () => {
    expect(parseAnalyzeInterestResponse({ kind: 'collection', summary: { evidenceCount: 0 } })).toBeNull()
    expect(parseAnalyzeInterestResponse({ kind: 'unknown', error: 'Sensitive error' })).toBeNull()
    expect(parseAnalyzeInterestResponse(null)).toBeNull()
  })
})
