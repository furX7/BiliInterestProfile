import { z } from 'zod'
import { sourceWarningSchema } from '../../core/contracts/source.schema'

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
  return z.discriminatedUnion('status', [
    z.strictObject({ ...common, status: z.literal('unknown'), data: z.null() }),
    z.strictObject({ ...common, status: z.literal('unavailable'), data: z.null() }),
    z.strictObject({ ...common, status: z.literal('available'), data: present }),
    z.strictObject({ ...common, status: z.literal('partial'), data: present }),
    z.strictObject({ ...common, status: z.literal('empty'), data: empty }),
  ])
}

/** Metadata only. Validate the read result separately with the supplied raw schema. */
export const sourceAdapterDescriptorSchema = z.strictObject({
  sourceId: z.string().trim().min(1),
  apiVersion: z.literal(1),
  read: z.custom<(input: never) => unknown>((value) => typeof value === 'function'),
})
