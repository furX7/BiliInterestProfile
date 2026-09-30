import type { EvidenceId, IdentifiedEvidenceItem } from './analysis-evidence'
import type { AppError } from './app-issue'
import type { Result } from './result'

export interface AnalysisContext {
  userId: string
  asOf: string
}
export interface InterestSignal {
  analyzerId: string
  topicId: string
  topicName: string
  parentTopicId: string | null
  relevance: number
  confidence: number
  evidenceIds: EvidenceId[]
  reasons: string[]
  timestamp: string
}
export interface AnalyzerResult {
  analyzerId: string
  apiVersion: 1
  signals: InterestSignal[]
}
/** Contract only; P2 supplies no real Analyzer. */
export interface Analyzer {
  analyzerId: string
  apiVersion: 1
  analyze(input: {
    evidence: readonly IdentifiedEvidenceItem[]
    context: AnalysisContext
  }): Promise<Result<AnalyzerResult, AppError>>
}
