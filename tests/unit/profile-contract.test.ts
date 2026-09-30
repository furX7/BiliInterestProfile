import { describe, expect, expectTypeOf, it } from 'vitest'
import { interestNodeSchema, interestProfileSchema } from '../../src/core/contracts/profile.schema'
import type { InterestNode, InterestProfile } from '../../src/core/contracts/profile'
import { syntheticNode, syntheticProfile } from '../fixtures/contracts/profile-v1.synthetic'

describe('profile data v1 contract only', () => {
  it('accepts a synthetic shape and preserves uncomputed null values', () => {
    const profile = interestProfileSchema.parse(syntheticProfile)
    expect(profile).toEqual(syntheticProfile)
    expect(profile.confidence).toBeNull()
    expect(profile.trends).toBeNull()
    expectTypeOf(profile).toEqualTypeOf<InterestProfile>()
    expectTypeOf(interestNodeSchema.parse(syntheticNode)).toEqualTypeOf<InterestNode>()
    expect(interestProfileSchema.parse({ ...syntheticProfile, confidence: 0 }).confidence).toBe(0)
  })
  it.each([
    { strength: -1 },
    { strength: 101 },
    { confidence: -0.1 },
    { confidence: 1.1 },
    { evidenceIds: [] },
    { evidenceIds: ['123'] },
    { topicId: '' },
    { topicName: '' },
    { parentTopicId: '' },
    { raw: {} },
  ])('rejects invalid node %j', (fields) => {
    expect(interestNodeSchema.safeParse({ ...syntheticNode, ...fields }).success).toBe(false)
  })
  it.each([
    { confidence: -0.1 },
    { confidence: 1.1 },
    { trends: [] },
    { userId: '0' },
    { userId: 'not_uid' },
    { generatedAt: 'yesterday' },
    { sampleSummary: undefined },
    { sampleSummary: { confirmedEvidenceCount: -1, coverage: 'current-rendered-cards' } },
    { sampleSummary: { confirmedEvidenceCount: 0.5, coverage: 'current-rendered-cards' } },
    { sampleSummary: { confirmedEvidenceCount: 1, coverage: 'full-history' } },
    { sampleSummary: { confirmedEvidenceCount: 1, coverage: 'current-rendered-cards', raw: {} } },
    { warnings: [{ code: '', message: 'invalid' }] },
    { raw: { mid: '123' } },
  ])('rejects invalid profile %j', (fields) => {
    expect(interestProfileSchema.safeParse({ ...syntheticProfile, ...fields }).success).toBe(false)
  })
})
