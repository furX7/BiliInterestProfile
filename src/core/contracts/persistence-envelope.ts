/** Future storage record only; ttlMs is a duration, not a cleanup operation. */
export interface PersistenceEnvelope<T> {
  schemaVersion: 1
  collectedAt: string
  sourceVersion: string
  ttlMs: number
  data: T
}
