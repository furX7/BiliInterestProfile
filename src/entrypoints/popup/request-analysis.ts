import {
  parseAnalyzeInterestResponse,
  type AnalyzeInterestRequest,
  type AnalyzeInterestResponse,
} from '../../core/runtime/analysis-message'
import { runtimeErrorKinds } from '../../core/runtime/error-code'

export interface ActiveTabMessenger {
  query(queryInfo: { active: true; currentWindow: true }): Promise<Array<{ id?: number }>>
  sendMessage(tabId: number, request: AnalyzeInterestRequest): Promise<unknown>
}

export type PopupAnalysisResponse = AnalyzeInterestResponse | { kind: 'connection-unavailable' }

const analysisRequest: AnalyzeInterestRequest = { type: 'analyze-interest' }

export async function requestAnalysis(
  messenger: ActiveTabMessenger,
): Promise<PopupAnalysisResponse> {
  try {
    const [activeTab] = await messenger.query({ active: true, currentWindow: true })
    if (typeof activeTab?.id !== 'number') {
      return { kind: runtimeErrorKinds.RUNTIME_RESPONSE_UNAVAILABLE }
    }

    const response = await messenger.sendMessage(activeTab.id, analysisRequest)
    return (
      parseAnalyzeInterestResponse(response) ?? {
        kind: runtimeErrorKinds.RUNTIME_RESPONSE_UNAVAILABLE,
      }
    )
  } catch {
    return { kind: runtimeErrorKinds.RUNTIME_RESPONSE_UNAVAILABLE }
  }
}
