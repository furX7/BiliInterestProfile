import {
  parseAnalyzeInterestResponse,
  type AnalyzeInterestRequest,
  type AnalyzeInterestResponse,
} from '../../core/runtime/analysis-message'

export interface ActiveTabMessenger {
  query(queryInfo: { active: true; currentWindow: true }): Promise<Array<{ id?: number }>>
  sendMessage(tabId: number, request: AnalyzeInterestRequest): Promise<unknown>
}

export type PopupAnalysisResponse =
  | AnalyzeInterestResponse
  | { kind: 'connection-unavailable' }

const analysisRequest: AnalyzeInterestRequest = { type: 'analyze-interest' }

export async function requestAnalysis(
  messenger: ActiveTabMessenger,
): Promise<PopupAnalysisResponse> {
  try {
    const [activeTab] = await messenger.query({ active: true, currentWindow: true })
    if (typeof activeTab?.id !== 'number') {
      return { kind: 'connection-unavailable' }
    }

    const response = await messenger.sendMessage(activeTab.id, analysisRequest)
    return parseAnalyzeInterestResponse(response) ?? { kind: 'connection-unavailable' }
  } catch {
    return { kind: 'connection-unavailable' }
  }
}
