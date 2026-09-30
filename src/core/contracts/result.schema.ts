import { z } from 'zod'
import { appWarningSchema } from './app-issue.schema'

export function resultSchema<T extends z.ZodType, E extends z.ZodType>(
  dataSchema: T,
  errorSchema: E,
) {
  return z.discriminatedUnion('ok', [
    z.strictObject({ ok: z.literal(true), data: dataSchema, warnings: z.array(appWarningSchema) }),
    z.strictObject({ ok: z.literal(false), error: errorSchema, recoverable: z.boolean() }),
  ])
}
