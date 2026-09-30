import { z } from 'zod'
import { sourceWarningSchema } from '../../core/contracts/source.schema'
import type { RawSourceResult } from './raw-source'

export function rawSourceResultSchema<T extends z.ZodType>(rawSchema: T) {
  const common = { sourceId: z.string().trim().min(1), warnings: z.array(sourceWarningSchema) }
  const present = rawSchema.refine(
    (value) => value !== null && value !== undefined,
    'Source requires raw data',
  )
  // Structural only; this branch cannot establish stability proof.
  const empty = rawSchema.refine(
    (value) => Array.isArray(value) && value.length === 0,
    'Empty requires an empty collection',
  )
  const branches = z.discriminatedUnion('status', [
    z.strictObject({ ...common, status: z.literal('unknown'), data: z.null() }),
    z.strictObject({ ...common, status: z.literal('unavailable'), data: z.null() }),
    z.strictObject({ ...common, status: z.literal('available'), data: present }),
    z.strictObject({ ...common, status: z.literal('partial'), data: present }),
    z.strictObject({ ...common, status: z.literal('empty'), data: empty }),
  ])
  return z.preprocess((input, context) => {
    if (typeof input === 'object' && input !== null) {
      const value = input as Record<string, unknown>
      const missing = !Object.hasOwn(value, 'data')
      const absentConfirmed =
        (value.status === 'available' || value.status === 'partial') &&
        (value.data === null || value.data === undefined)
      if (missing || absentConfirmed) {
        context.addIssue({
          code: 'custom',
          path: ['data'],
          message: 'Raw result requires explicit status-compatible data',
        })
        return z.NEVER
      }
    }
    return input
  }, branches) as z.ZodType<RawSourceResult<z.output<T>>>
}

/** Metadata only. Validate the read result separately with the supplied raw schema. */
export const sourceAdapterDescriptorSchema = z.strictObject({
  sourceId: z.string().trim().min(1),
  apiVersion: z.literal(1),
  read: z.custom<(input: never) => unknown>((value) => typeof value === 'function'),
})
