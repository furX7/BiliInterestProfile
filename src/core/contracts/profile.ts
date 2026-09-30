import type { EvidenceId } from './analysis-evidence'
import type { AppWarning } from './app-issue'

export interface InterestNode {
  topicId: string
  topicName: string
  parentTopicId: string | null
  strength: number
  confidence: number
  evidenceIds: EvidenceId[]
}
/** Data contract only. P2 has no score, trend, or profile producer. */
export interface InterestProfile {
  userId: string
  generatedAt: string
  topics: InterestNode[]
  trends: null
  confidence: number | null
  sampleSummary: { confirmedEvidenceCount: number; coverage: 'current-rendered-cards' }
  warnings: AppWarning[]
}
