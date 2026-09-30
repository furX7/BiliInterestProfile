import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  analysisContextSchema,
  interestSignalSchema,
  analyzerResultSchema,
  analyzerDescriptorSchema,
  analysisExchangeSchema,
} from '../../src/core/contracts/analyzer.schema'
import type {
  Analyzer,
  AnalyzerResult,
  AnalysisContext,
  InterestSignal,
} from '../../src/core/contracts/analyzer'
import { resultSchema } from '../../src/core/contracts/result.schema'
import { appErrorSchema } from '../../src/core/contracts/app-issue.schema'
import {
  syntheticExchange,
  syntheticSignal,
  syntheticContext,
  syntheticAnalyzerResult,
} from '../fixtures/contracts/analyzer-v1.synthetic'
import { syntheticEvidence } from '../fixtures/contracts/evidence-v1.synthetic'

describe('Analyzer v1 contract', () => {
  it('validates local shape and a closed same-user exchange', () => {
    expect(analysisExchangeSchema.parse(syntheticExchange)).toEqual(syntheticExchange)
    expectTypeOf(analysisContextSchema.parse(syntheticContext)).toEqualTypeOf<AnalysisContext>()
    expectTypeOf(interestSignalSchema.parse(syntheticSignal)).toEqualTypeOf<InterestSignal>()
    expectTypeOf(
      analyzerResultSchema.parse(syntheticAnalyzerResult),
    ).toEqualTypeOf<AnalyzerResult>()
  })
  it('accepts no signals without producing a profile or fabricating evidence', () => {
    expect(
      analysisExchangeSchema.safeParse({
        ...syntheticExchange,
        evidence: [],
        result: { ...syntheticAnalyzerResult, signals: [] },
      }).success,
    ).toBe(true)
  })
  it.each([
    { relevance: -0.1 },
    { relevance: 1.1 },
    { confidence: -0.1 },
    { confidence: 1.1 },
    { evidenceIds: [] },
    { reasons: [] },
    { reasons: [' '] },
    { timestamp: 'yesterday' },
    { analyzerId: '' },
    { topicId: '' },
    { topicName: '' },
    { parentTopicId: '' },
    { raw: {} },
  ])('rejects malformed signal %j', (fields) => {
    expect(interestSignalSchema.safeParse({ ...syntheticSignal, ...fields }).success).toBe(false)
  })
  it.each([{ userId: '0' }, { asOf: 'yesterday' }, { raw: {} }])(
    'rejects nonstandard context %j',
    (fields) => {
      expect(analysisContextSchema.safeParse({ ...syntheticContext, ...fields }).success).toBe(
        false,
      )
    },
  )
  it('rejects mismatched analyzer and version', () => {
    expect(
      analyzerResultSchema.safeParse({ ...syntheticAnalyzerResult, analyzerId: 'other' }).success,
    ).toBe(false)
    expect(
      analyzerResultSchema.safeParse({ ...syntheticAnalyzerResult, apiVersion: 2 }).success,
    ).toBe(false)
  })
  it('rejects dangling references even when the individual signal is structurally valid', () => {
    const result = {
      ...syntheticAnalyzerResult,
      signals: [{ ...syntheticSignal, evidenceIds: ['ev_missing'] }],
    }
    expect(interestSignalSchema.safeParse(result.signals[0]).success).toBe(true)
    expect(analysisExchangeSchema.safeParse({ ...syntheticExchange, result }).success).toBe(false)
  })
  it('rejects duplicates, other-user context and mixed-user input even if references resolve', () => {
    expect(
      analysisExchangeSchema.safeParse({
        ...syntheticExchange,
        evidence: [syntheticEvidence, syntheticEvidence],
      }).success,
    ).toBe(false)
    expect(
      analysisExchangeSchema.safeParse({
        ...syntheticExchange,
        context: { ...syntheticContext, userId: '456' },
      }).success,
    ).toBe(false)
    const other = { ...syntheticEvidence, evidenceId: 'ev_other_user', userId: '456' }
    const result = {
      ...syntheticAnalyzerResult,
      signals: [{ ...syntheticSignal, evidenceIds: ['ev_other_user'] }],
    }
    expect(
      analysisExchangeSchema.safeParse({
        ...syntheticExchange,
        evidence: [syntheticEvidence, other],
        result,
      }).success,
    ).toBe(false)
  })
  it('validates only metadata and typed synthetic call results, not a real Analyzer', async () => {
    const result = analyzerResultSchema.parse(syntheticAnalyzerResult)
    const analyzer: Analyzer = {
      analyzerId: result.analyzerId,
      apiVersion: 1,
      analyze: async () => ({ ok: true, data: result, warnings: [] }),
    }
    expect(analyzerDescriptorSchema.parse(analyzer).apiVersion).toBe(1)
    expect(analyzerDescriptorSchema.safeParse({ ...analyzer, analyze: null }).success).toBe(false)
    expect(analyzerDescriptorSchema.safeParse({ ...analyzer, apiVersion: 2 }).success).toBe(false)
    const input = analysisExchangeSchema.parse(syntheticExchange)
    expect(
      resultSchema(analyzerResultSchema, appErrorSchema).parse(await analyzer.analyze(input)).ok,
    ).toBe(true)
  })
})
