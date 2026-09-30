import { describe, expect, expectTypeOf, it } from 'vitest'
import { z } from 'zod'
import { appErrorSchema, appWarningSchema } from '../../src/core/contracts/app-issue.schema'
import { resultSchema } from '../../src/core/contracts/result.schema'
import type { Result } from '../../src/core/contracts/result'
import type { AppError } from '../../src/core/contracts/app-issue'
import {
  syntheticAppWarning,
  syntheticFailure,
  syntheticSuccess,
} from '../fixtures/contracts/result-v1.synthetic'

describe('Result v1 contract', () => {
  const schema = resultSchema(z.number(), appErrorSchema)
  it('requires explicit branch payloads even when their schemas accept absence or supply defaults', () => {
    const optional = resultSchema(z.string().optional(), z.string().optional())
    expect(optional.safeParse({ ok: true, warnings: [] }).success).toBe(false)
    expect(optional.safeParse({ ok: false, recoverable: true }).success).toBe(false)
    const defaulted = resultSchema(z.string().default('synthetic'), z.string().default('synthetic'))
    expect(defaulted.safeParse({ ok: true, warnings: [] }).success).toBe(false)
    expect(defaulted.safeParse({ ok: false, recoverable: true }).success).toBe(false)
    const present = optional.parse({ ok: true, data: undefined, warnings: [] })
    expect(Object.hasOwn(present, 'data')).toBe(true)
    expectTypeOf(present).toEqualTypeOf<Result<string | undefined, string | undefined>>()
  })
  it('preserves success data and independent AppWarnings', () => {
    const value = { ...syntheticSuccess, warnings: [syntheticAppWarning] }
    expect(schema.parse(value)).toEqual(value)
    const typed: Result<number, AppError> = value
    if (typed.ok) expectTypeOf(typed.data).toEqualTypeOf<number>()
  })
  it('preserves failure and recoverability without success fields', () => {
    expect(schema.parse(syntheticFailure)).toEqual(syntheticFailure)
  })
  it.each([
    { ...syntheticSuccess, error: syntheticFailure.error },
    { ok: true, data: 42 },
    { ok: true, data: 'wrong', warnings: [] },
    { ok: false, error: syntheticFailure.error },
    { ...syntheticFailure, data: 42 },
    { ...syntheticFailure, warnings: [] },
    { ...syntheticFailure, recoverable: 'yes' },
  ])('rejects mixed or malformed branches: %j', (value) => {
    expect(schema.safeParse(value).success).toBe(false)
  })
  it.each([
    { code: '', message: 'message' },
    { code: 'BAD-CODE', message: 'message' },
    { code: '1invalid', message: 'message' },
    { code: 'valid', message: '   ' },
    { code: 'valid', message: 'message', raw: {} },
  ])('rejects malformed public issue: %j', (value) => {
    expect(appErrorSchema.safeParse(value).success).toBe(false)
    expect(appWarningSchema.safeParse(value).success).toBe(false)
  })
})
