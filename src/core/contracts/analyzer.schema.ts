import { z } from 'zod'
import { evidenceIdSchema, identifiedEvidenceListSchema } from './analysis-evidence.schema'

const nonblank = z.string().trim().min(1)
export const analysisContextSchema = z.strictObject({
  userId: z.string().regex(/^[1-9]\d*$/),
  asOf: z.iso.datetime(),
})
export const interestSignalSchema = z.strictObject({
  analyzerId: nonblank,
  topicId: nonblank,
  topicName: nonblank,
  parentTopicId: nonblank.nullable(),
  relevance: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  evidenceIds: z.array(evidenceIdSchema).min(1),
  reasons: z.array(nonblank).min(1),
  timestamp: z.iso.datetime(),
})
export const analyzerResultSchema = z
  .strictObject({
    analyzerId: nonblank,
    apiVersion: z.literal(1),
    signals: z.array(interestSignalSchema),
  })
  .superRefine((result, context) => {
    result.signals.forEach((signal, index) => {
      if (signal.analyzerId !== result.analyzerId)
        context.addIssue({
          code: 'custom',
          path: ['signals', index, 'analyzerId'],
          message: 'Signal belongs to another Analyzer',
        })
    })
  })
export const analyzerDescriptorSchema = z.strictObject({
  analyzerId: nonblank,
  apiVersion: z.literal(1),
  analyze: z.custom<(input: never) => unknown>((value) => typeof value === 'function'),
})
/** Local signal parsing cannot prove references; validate the entire exchange. */
export const analysisExchangeSchema = z
  .strictObject({
    context: analysisContextSchema,
    evidence: identifiedEvidenceListSchema,
    result: analyzerResultSchema,
  })
  .superRefine((exchange, context) => {
    const ids = new Set(exchange.evidence.map((item) => item.evidenceId))
    exchange.evidence.forEach((item, index) => {
      if (item.userId !== exchange.context.userId)
        context.addIssue({
          code: 'custom',
          path: ['evidence', index, 'userId'],
          message: 'Evidence belongs to another user',
        })
    })
    exchange.result.signals.forEach((signal, index) => {
      signal.evidenceIds.forEach((id, reference) => {
        if (!ids.has(id))
          context.addIssue({
            code: 'custom',
            path: ['result', 'signals', index, 'evidenceIds', reference],
            message: 'Unresolved Evidence reference',
          })
      })
    })
  })
