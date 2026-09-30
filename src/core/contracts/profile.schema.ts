import { z } from 'zod'
import { evidenceIdSchema } from './analysis-evidence.schema'
import { appWarningSchema } from './app-issue.schema'

const nonblank = z.string().trim().min(1)
export const interestNodeSchema = z.strictObject({
  topicId: nonblank,
  topicName: nonblank,
  parentTopicId: nonblank.nullable(),
  strength: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  evidenceIds: z.array(evidenceIdSchema).min(1),
})
export const interestProfileSchema = z.strictObject({
  userId: z.string().regex(/^[1-9]\d*$/),
  generatedAt: z.iso.datetime(),
  topics: z.array(interestNodeSchema),
  trends: z.null(),
  confidence: z.number().min(0).max(1).nullable(),
  sampleSummary: z.strictObject({
    confirmedEvidenceCount: z.number().int().min(0),
    coverage: z.literal('current-rendered-cards'),
  }),
  warnings: z.array(appWarningSchema),
})
