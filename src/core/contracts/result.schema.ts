import { z } from 'zod'
import { appWarningSchema } from './app-issue.schema'
import type { Result } from './result'

export function resultSchema<T extends z.ZodType, E extends z.ZodType>(
  dataSchema: T,
  errorSchema: E,
) {
  const branches = z.discriminatedUnion('ok', [
    z.strictObject({ ok: z.literal(true), data: dataSchema, warnings: z.array(appWarningSchema) }),
    z.strictObject({ ok: z.literal(false), error: errorSchema, recoverable: z.boolean() }),
  ])
  // Require the payload key before optional/default parameter schemas can erase or fabricate it.
  // Zod's generic object inference makes optional payload keys optional in the output type.
  // The own-key guard proves the stronger required-key Contract at runtime.
  return z.preprocess((input, context) => {
    if (typeof input === 'object' && input !== null) {
      const value = input as Record<string, unknown>
      const field = value.ok === true ? 'data' : value.ok === false ? 'error' : null
      if (field && !Object.hasOwn(value, field)) {
        context.addIssue({
          code: 'custom',
          path: [field],
          message: 'Result requires an explicit payload field',
        })
        return z.NEVER
      }
    }
    return input
  }, branches) as unknown as z.ZodType<Result<z.output<T>, z.output<E>>>
}
