import { describe, expect, it } from 'vitest'
import { normalizeDynamicCandidate } from '../../src/normalize/dynamic'
import type { DynamicCardCandidate } from '../../src/sources/bilibili/dynamics/read-dynamic-cards'
import type { ProfileContext } from '../../src/core/contracts/source'

const context: ProfileContext = {
  userId: '123',
  displayName: 'Example User',
  description: null,
  sourceUrl: 'https://space.bilibili.com/123',
}

function candidate(overrides: Partial<DynamicCardCandidate> = {}): DynamicCardCandidate {
  return {
    routeUserId: '123',
    headerDisplayName: 'Example User',
    cardAuthorDisplayName: 'Example User',
    text: 'Synthetic current-user post',
    title: null,
    dateLabel: '3 days ago',
    sourceUrl: 'https://space.bilibili.com/123/dynamic',
    hasReference: false,
    identity: 'confirmed',
    rejectionReason: null,
    ...overrides,
  }
}

describe('dynamic candidate normalizer (synthetic inputs only)', () => {
  it('creates page-traceable partial evidence without inventing an exact timestamp', () => {
    expect(normalizeDynamicCandidate(candidate(), context)).toEqual({
      status: 'partial',
      data: {
        source: 'dynamic',
        userId: '123',
        title: null,
        text: 'Synthetic current-user post',
        timestamp: null,
        sourceUrl: 'https://space.bilibili.com/123/dynamic',
        traceGranularity: 'page',
      },
      warnings: [],
    })
  })

  it('keeps the reader-confirmed forwarding description and does not require reference content', () => {
    const result = normalizeDynamicCandidate(
      candidate({ hasReference: true, text: 'Synthetic forwarding comment' }),
      context,
    )
    expect(result.data).toMatchObject({
      text: 'Synthetic forwarding comment',
      title: null,
      traceGranularity: 'page',
    })
    expect(result.status).toBe('partial')
  })

  it('rejects candidates already marked unusable, including generic shares, reference-only cards, and placeholders', () => {
    for (const rejected of [
      candidate({ text: null, rejectionReason: 'content_unusable' }),
      candidate({ text: '分享动态', rejectionReason: 'content_unusable' }),
      candidate({ text: '-', rejectionReason: 'content_unusable' }),
      candidate({ hasReference: true, text: null, rejectionReason: 'content_unusable' }),
    ]) {
      expect(normalizeDynamicCandidate(rejected, context)).toEqual({
        status: 'unknown',
        data: null,
        warnings: [
          {
            code: 'content_unusable',
            message: 'Dynamic candidate is not usable as current-user evidence',
          },
        ],
      })
    }
  })

  it('rejects mismatched candidate identity or an uncertain page state without emitting evidence', () => {
    for (const rejected of [
      candidate({
        cardAuthorDisplayName: 'Other User',
        identity: 'mismatch',
        rejectionReason: 'identity_mismatch',
      }),
      candidate({
        identity: 'missing',
        cardAuthorDisplayName: null,
        rejectionReason: 'identity_mismatch',
      }),
      candidate({ rejectionReason: 'page_state_uncertain' }),
      candidate({ routeUserId: '456' }),
      candidate({ headerDisplayName: 'Other User' }),
    ]) {
      const result = normalizeDynamicCandidate(rejected, context)
      expect(result.status).toBe('unknown')
      expect(result.data).toBeNull()
      expect(result.warnings).not.toHaveLength(0)
    }
  })
})
