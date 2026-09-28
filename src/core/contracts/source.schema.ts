import { z } from 'zod'

const userIdSchema = z.string().regex(/^[1-9]\d*$/)
const nonblankSchema = z.string().trim().min(1)

export const profileContextSchema = z.strictObject({
  userId: userIdSchema,
  displayName: nonblankSchema,
  description: z.string().nullable(),
  sourceUrl: z.url(),
})

export const evidenceItemSchema = z.strictObject({
  source: z.literal('dynamic'),
  userId: userIdSchema,
  title: z.string().nullable(),
  text: nonblankSchema,
  timestamp: z.iso.datetime().nullable(),
  sourceUrl: z.url(),
  traceGranularity: z.enum(['page', 'item']),
})

export const sourceWarningSchema = z.strictObject({
  code: z.enum(['identity_mismatch', 'content_unusable', 'page_state_uncertain']),
  message: nonblankSchema,
})

export function sourceResultSchema<T extends z.ZodType>(dataSchema: T) {
  return z.strictObject({
    status: z.enum(['available', 'partial', 'empty', 'unavailable', 'unknown']),
    data: z.unknown(),
    warnings: z.array(sourceWarningSchema),
  }).superRefine((result, context) => {
    if (result.data !== null && !dataSchema.safeParse(result.data).success) {
      context.addIssue({ code: 'custom', message: 'Source data does not match its contract' })
    }
    if (result.status === 'unknown' || result.status === 'unavailable') {
      if (result.data !== null) context.addIssue({ code: 'custom', message: 'Unconfirmed source cannot contain data' })
    } else if (result.status === 'empty') {
      if (!Array.isArray(result.data) || result.data.length !== 0) {
        context.addIssue({ code: 'custom', message: 'Empty requires a confirmed empty collection' })
      }
    } else if (result.data === null) {
      context.addIssue({ code: 'custom', message: 'Available or partial source requires data' })
    }
  })
}
