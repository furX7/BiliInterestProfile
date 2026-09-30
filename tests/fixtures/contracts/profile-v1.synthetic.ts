// Schema examples only, not scores, taxonomy, or a produced interest profile.
export const syntheticNode = {
  topicId: 'synthetic_topic', topicName: 'Synthetic topic', parentTopicId: null,
  strength: 50, confidence: 0.5, evidenceIds: ['ev_synthetic_1'],
}
export const syntheticProfile = {
  userId: '123', generatedAt: '2026-09-30T00:00:00Z', topics: [syntheticNode],
  trends: null, confidence: null,
  sampleSummary: { confirmedEvidenceCount: 1, coverage: 'current-rendered-cards' }, warnings: [],
}
