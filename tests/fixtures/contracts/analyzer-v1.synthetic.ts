import { syntheticEvidence } from './evidence-v1.synthetic'
// Entire exchange is fictional contract input, not analysis or webpage evidence.
export const syntheticContext = { userId: '123', asOf: '2026-09-30T00:00:00Z' }
export const syntheticSignal = {
  analyzerId: 'synthetic_analyzer', topicId: 'synthetic_topic', topicName: 'Synthetic topic',
  parentTopicId: null, relevance: 0.5, confidence: 0.5,
  evidenceIds: ['ev_synthetic_1'], reasons: ['Synthetic reason'], timestamp: '2026-09-30T00:00:00Z',
}
export const syntheticAnalyzerResult = { analyzerId: 'synthetic_analyzer', apiVersion: 1, signals: [syntheticSignal] }
export const syntheticExchange = { context: syntheticContext, evidence: [syntheticEvidence], result: syntheticAnalyzerResult }
