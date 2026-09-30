import { z } from 'zod'
import type { PersistenceEnvelope } from './persistence-envelope'
export function persistenceEnvelopeSchema<T extends z.ZodType>(dataSchema: T) {
  const envelope = z.strictObject({
    schemaVersion: z.literal(1),
    collectedAt: z.iso.datetime(),
    sourceVersion: z.string().trim().min(1),
    ttlMs: z.number().int().positive(),
    data: dataSchema,
  })
  // The pre-parse own-key guard proves presence even when T accepts undefined.
  return z.preprocess((input, context) => {
    if (typeof input === 'object' && input !== null && !Object.hasOwn(input, 'data')) {
      context.addIssue({
        code: 'custom',
        path: ['data'],
        message: 'Envelope requires an explicit data field',
      })
      return z.NEVER
    }
    return input
  }, envelope) as unknown as z.ZodType<PersistenceEnvelope<z.output<T>>>
}
