import { describe, expect, expectTypeOf, it } from 'vitest'
import { z } from 'zod'
import {
  rawSourceResultSchema,
  sourceAdapterDescriptorSchema,
} from '../../src/sources/contracts/raw-source.schema'
import type { RawSourceResult, SourceAdapter } from '../../src/sources/contracts/raw-source'
import { appErrorSchema } from '../../src/core/contracts/app-issue.schema'
import { resultSchema } from '../../src/core/contracts/result.schema'
import { syntheticAppWarning, syntheticFailure } from '../fixtures/contracts/result-v1.synthetic'
import { syntheticRaw, syntheticRawUnknown } from '../fixtures/contracts/raw-source-v1.synthetic'

describe('Source boundary v1 and two result layers', () => {
  const payload = z.strictObject({ token: z.literal('synthetic') }).array()
  const inner = rawSourceResultSchema(payload)
  const outer = resultSchema(inner, appErrorSchema)
  it('preserves outer success with inner unknown and both distinct warning lists', () => {
    const value = { ok: true, data: syntheticRawUnknown, warnings: [syntheticAppWarning] }
    expect(outer.parse(value)).toEqual(value)
    expectTypeOf<z.infer<typeof inner>>().toExtend<RawSourceResult<(typeof syntheticRaw)[]>>()
  })
  it('preserves outer failure without inventing an inner unavailable result', () => {
    expect(outer.parse(syntheticFailure)).toEqual(syntheticFailure)
    expect(outer.safeParse({ ...syntheticFailure, data: syntheticRawUnknown }).success).toBe(false)
    expect(outer.safeParse({ ok: true, data: syntheticRawUnknown }).success).toBe(false)
  })
  it.each(['available', 'partial'])(
    'accepts valid %s raw and rejects null or malformed payload',
    (status) => {
      const base = { ...syntheticRawUnknown, status }
      expect(inner.parse({ ...base, data: [syntheticRaw] }).data).toEqual([syntheticRaw])
      expect(inner.safeParse({ ...base, data: null }).success).toBe(false)
      expect(inner.safeParse({ ...base, data: [{ token: 'invalid' }] }).success).toBe(false)
    },
  )
  it.each(['unknown', 'unavailable'])('requires null for %s without erasing warnings', (status) => {
    expect(inner.parse({ ...syntheticRawUnknown, status }).data).toBeNull()
    expect(inner.safeParse({ ...syntheticRawUnknown, status, data: [syntheticRaw] }).success).toBe(
      false,
    )
  })
  it('checks empty structure without supplying or proving cross-time proof', () => {
    const base = { ...syntheticRawUnknown, status: 'empty' }
    expect(inner.parse({ ...base, data: [] }).data).toEqual([])
    expect(inner.safeParse({ ...base, data: null }).success).toBe(false)
    expect(inner.safeParse({ ...base, data: [syntheticRaw] }).success).toBe(false)
    const objectSchema = rawSourceResultSchema(z.strictObject({ token: z.literal('synthetic') }))
    expect(objectSchema.safeParse({ ...base, data: [] }).success).toBe(false)
  })
  it('rejects AppWarnings in the Source warning slot and extra raw fields', () => {
    expect(
      inner.safeParse({ ...syntheticRawUnknown, warnings: [syntheticAppWarning] }).success,
    ).toBe(false)
    expect(inner.safeParse({ ...syntheticRawUnknown, sourceId: '' }).success).toBe(false)
    expect(inner.safeParse({ ...syntheticRawUnknown, raw: {} }).success).toBe(false)
  })
  it('validates synthetic Adapter metadata, signature and independently parsed output', async () => {
    const adapter: SourceAdapter<(typeof syntheticRaw)[], { fixture: true }> = {
      sourceId: 'synthetic_source',
      apiVersion: 1,
      read: async () => ({
        ok: true,
        data: { ...syntheticRawUnknown, warnings: [...syntheticRawUnknown.warnings] },
        warnings: [syntheticAppWarning],
      }),
    }
    expect(sourceAdapterDescriptorSchema.parse(adapter).sourceId).toBe('synthetic_source')
    expect(outer.parse(await adapter.read({ fixture: true })).ok).toBe(true)
    expect(sourceAdapterDescriptorSchema.safeParse({ ...adapter, apiVersion: 2 }).success).toBe(
      false,
    )
    expect(
      sourceAdapterDescriptorSchema.safeParse({ sourceId: adapter.sourceId, read: adapter.read })
        .success,
    ).toBe(false)
    expect(
      sourceAdapterDescriptorSchema.safeParse({ ...adapter, read: 'not callable' }).success,
    ).toBe(false)
  })
})
