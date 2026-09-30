import { z } from 'zod'
export function persistenceEnvelopeSchema<T extends z.ZodType>(dataSchema: T) {
  return z.strictObject({
    schemaVersion: z.literal(1),
    collectedAt: z.iso.datetime(),
    sourceVersion: z.string().trim().min(1),
    ttlMs: z.number().int().positive(),
    data: dataSchema,
  })
}
