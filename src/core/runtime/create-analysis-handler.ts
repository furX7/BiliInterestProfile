import type { ApprovedSourceCollection } from '../pipeline/collect-approved-sources'
import {
  isAnalyzeInterestRequest,
  summarizeCollection,
  type AnalyzeInterestResponse,
} from './analysis-message'
import { runtimeErrorKinds } from './error-code'

export type ApprovedSourceCollector = (
  document: Document,
  url: URL,
) => ApprovedSourceCollection | Promise<ApprovedSourceCollection>

export type AnalysisMessageHandler = (
  message: unknown,
  document: Document,
  url: URL,
) => Promise<AnalyzeInterestResponse | undefined>

export function isSupportedDynamicUrl(url: URL): boolean {
  return (
    url.origin === 'https://space.bilibili.com' && /^\/[1-9]\d*\/dynamic\/?$/.test(url.pathname)
  )
}

export function createAnalysisHandler(collect: ApprovedSourceCollector): AnalysisMessageHandler {
  let collectionInProgress = false

  return async (message, document, url) => {
    if (!isAnalyzeInterestRequest(message)) {
      return undefined
    }

    if (!isSupportedDynamicUrl(url)) {
      return { kind: 'unsupported' }
    }

    if (collectionInProgress) {
      return { kind: runtimeErrorKinds.RUNTIME_EXECUTION_FAILED }
    }

    collectionInProgress = true
    try {
      return {
        kind: 'collection',
        summary: summarizeCollection(await collect(document, url)),
      }
    } catch {
      return { kind: runtimeErrorKinds.RUNTIME_EXECUTION_FAILED }
    } finally {
      collectionInProgress = false
    }
  }
}
