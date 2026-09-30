import { describe, expect, expectTypeOf, it } from 'vitest'
import { z } from 'zod'
import { persistenceEnvelopeSchema } from '../../src/core/contracts/persistence-envelope.schema'
import type { PersistenceEnvelope } from '../../src/core/contracts/persistence-envelope'
import { syntheticEnvelope } from '../fixtures/contracts/persistence-v1.synthetic'

describe('future persistence envelope schema compatibility', () => {
  const schema = persistenceEnvelopeSchema(z.strictObject({ value: z.string() }))
  it('accepts a synthetic v1 envelope with its actual payload type', () => {
    const output = schema.parse(syntheticEnvelope)
    expect(output).toEqual(syntheticEnvelope)
    expectTypeOf(output).toEqualTypeOf<PersistenceEnvelope<{ value: string }>>()
  })
  it.each([
    { schemaVersion: 2 },
    { schemaVersion: '1' },
    { ttlMs: 0 },
    { ttlMs: -1 },
    { ttlMs: 0.5 },
    { sourceVersion: undefined },
    { sourceVersion: ' ' },
    { collectedAt: 'yesterday' },
    { data: { value: 42 } },
    { data: { value: 'synthetic', raw: {} } },
    { raw: {} },
  ])('rejects incompatible record %j without converting its version', (fields) => {
    expect(schema.safeParse({ ...syntheticEnvelope, ...fields }).success).toBe(false)
  })
})
