import type { z } from 'zod'
import type { evidenceIdSchema } from './analysis-evidence.schema'
import type { EvidenceItem } from './source'

/** P2 v1 syntactic identity; no producer or cross-session guarantee. */
export type EvidenceId = z.infer<typeof evidenceIdSchema>
export type IdentifiedEvidenceItem = EvidenceItem & { evidenceId: EvidenceId }
