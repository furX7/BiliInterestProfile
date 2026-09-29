import { describe, expect, it, vi } from 'vitest'
import type { ApprovedSourceCollection } from '../../src/core/pipeline/collect-approved-sources'
import {
  createAnalysisHandler,
  isSupportedDynamicUrl,
} from '../../src/core/runtime/create-analysis-handler'

const collection: ApprovedSourceCollection = {
  context: {
    status: 'available',
    data: {
      userId: '123',
      displayName: 'Synthetic profile',
      description: null,
      sourceUrl: 'https://space.bilibili.com/123/dynamic',
    },
    warnings: [],
  },
  dynamic: {
    status: 'partial',
    data: [
      {
        source: 'dynamic',
        userId: '123',
        title: null,
        text: 'Synthetic dynamic text',
        timestamp: null,
        sourceUrl: 'https://space.bilibili.com/123/dynamic',
        traceGranularity: 'page',
      },
    ],
    warnings: [],
  },
  behaviorEvidenceSources: ['dynamic'],
}

const dynamicUrl = new URL('https://space.bilibili.com/123/dynamic?from=test')
const documentForMessage = new DOMParser().parseFromString('<main></main>', 'text/html')

describe('content analysis handler', () => {
  it('does not collect until it receives the fixed analysis request', async () => {
    const collect = vi.fn(() => collection)
    const handler = createAnalysisHandler(collect)

    expect(collect).not.toHaveBeenCalled()
    await expect(
      handler({ type: 'other' }, documentForMessage, dynamicUrl),
    ).resolves.toBeUndefined()
    expect(collect).not.toHaveBeenCalled()
  })

  it('collects exactly once with the current document and URL on a supported dynamic route', async () => {
    const collect = vi.fn(() => collection)
    const handler = createAnalysisHandler(collect)

    await expect(
      handler({ type: 'analyze-interest' }, documentForMessage, dynamicUrl),
    ).resolves.toEqual({
      kind: 'collection',
      summary: {
        contextStatus: 'available',
        dynamicStatus: 'partial',
        evidenceCount: 1,
        warningCodes: [],
      },
    })
    expect(collect).toHaveBeenCalledTimes(1)
    expect(collect).toHaveBeenCalledWith(documentForMessage, dynamicUrl)
  })

  it.each([
    'https://space.bilibili.com/123',
    'https://space.bilibili.com/0/dynamic',
    'https://space.bilibili.com/not-a-user/dynamic',
    'https://www.bilibili.com/123/dynamic',
  ])('does not collect from an unsupported route: %s', async (href) => {
    const collect = vi.fn(() => collection)
    const handler = createAnalysisHandler(collect)

    await expect(
      handler({ type: 'analyze-interest' }, documentForMessage, new URL(href)),
    ).resolves.toEqual({
      kind: 'unsupported',
    })
    expect(collect).not.toHaveBeenCalled()
  })

  it('accepts a trailing slash on a supported dynamic route', () => {
    expect(isSupportedDynamicUrl(new URL('https://space.bilibili.com/123/dynamic/'))).toBe(true)
  })

  it('does not start a second collection while the first explicit request is running', async () => {
    let resolveCollection: ((value: ApprovedSourceCollection) => void) | undefined
    const collect = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<ApprovedSourceCollection>((resolve) => {
            resolveCollection = resolve
          }),
      )
      .mockReturnValue(collection)
    const handler = createAnalysisHandler(collect)

    const firstRun = handler({ type: 'analyze-interest' }, documentForMessage, dynamicUrl)
    await expect(
      handler({ type: 'analyze-interest' }, documentForMessage, dynamicUrl),
    ).resolves.toEqual({
      kind: 'execution-error',
    })
    expect(collect).toHaveBeenCalledTimes(1)

    resolveCollection?.(collection)
    await expect(firstRun).resolves.toMatchObject({ kind: 'collection' })

    await handler({ type: 'analyze-interest' }, documentForMessage, dynamicUrl)
    expect(collect).toHaveBeenCalledTimes(2)
  })

  it('returns a generic execution error when collection throws', async () => {
    const handler = createAnalysisHandler(() => {
      throw new Error('Sensitive source failure')
    })

    const response = await handler({ type: 'analyze-interest' }, documentForMessage, dynamicUrl)
    expect(response).toEqual({ kind: 'execution-error' })
    expect(JSON.stringify(response)).not.toContain('Sensitive')
  })
})
