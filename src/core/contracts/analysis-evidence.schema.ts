import { z } from 'zod'
import { evidenceItemSchema } from './source.schema'

// Namespace validation does not establish provenance or stability.
export const evidenceIdSchema = z
  .string()
  .regex(/^ev_[A-Za-z0-9_-]+$/)
  .brand<'EvidenceId'>()
export const identifiedEvidenceItemSchema = evidenceItemSchema.extend({
  evidenceId: evidenceIdSchema,
})
export const identifiedEvidenceListSchema = z
  .array(identifiedEvidenceItemSchema)
  .superRefine((items, context) => {
    const seen = new Set<string>()
    items.forEach((item, index) => {
      if (seen.has(item.evidenceId))
        context.addIssue({
          code: 'custom',
          path: [index, 'evidenceId'],
          message: 'Duplicate EvidenceId in analysis input',
        })
      seen.add(item.evidenceId)
    })
  })
