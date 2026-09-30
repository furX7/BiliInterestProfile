import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  evidenceIdSchema,
  identifiedEvidenceItemSchema,
  identifiedEvidenceListSchema,
} from '../../src/core/contracts/analysis-evidence.schema'
import type { EvidenceId, IdentifiedEvidenceItem } from '../../src/core/contracts/analysis-evidence'
import { evidenceItemSchema } from '../../src/core/contracts/source.schema'
import { syntheticEvidence } from '../fixtures/contracts/evidence-v1.synthetic'

describe('analysis evidence v1', () => {
  it('parses an opaque syntactic ID without claiming stable production identity', () => {
    expect(evidenceIdSchema.parse('ev_synthetic_1')).toBe('ev_synthetic_1')
    const item = identifiedEvidenceItemSchema.parse(syntheticEvidence)
    expectTypeOf(item).toExtend<IdentifiedEvidenceItem>()
    expectTypeOf<IdentifiedEvidenceItem>().toExtend<typeof item>()
    expectTypeOf<string>().not.toExtend<EvidenceId>()
    expect(item).toEqual(syntheticEvidence)
  })
  it.each([
    '',
    '0',
    '123',
    'https://space.bilibili.com/123/dynamic',
    '.bili-dyn-item:nth-child(1)',
    'ev_',
    'ev_foo/bar',
  ])('rejects direct location or malformed identity %s', (value) => {
    expect(evidenceIdSchema.safeParse(value).success).toBe(false)
  })
  it('rejects duplicate IDs instead of deduplicating the input', () => {
    expect(
      identifiedEvidenceListSchema.safeParse([syntheticEvidence, syntheticEvidence]).success,
    ).toBe(false)
    expect(
      identifiedEvidenceListSchema.parse([
        syntheticEvidence,
        { ...syntheticEvidence, evidenceId: 'ev_synthetic_2' },
      ]),
    ).toHaveLength(2)
  })
  it('rejects raw fields and missing identity, while preserving unmodified P1 input', () => {
    expect(identifiedEvidenceItemSchema.safeParse({ ...syntheticEvidence, raw: {} }).success).toBe(
      false,
    )
    const p1: Record<string, unknown> = { ...syntheticEvidence }
    delete p1.evidenceId
    expect(identifiedEvidenceItemSchema.safeParse(p1).success).toBe(false)
    expect(evidenceItemSchema.parse(p1)).toEqual(p1)
  })
})
