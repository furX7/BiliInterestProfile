// Future record shape only. No storage producer, migration, or TTL execution.
export const syntheticEnvelope = {
  schemaVersion: 1, collectedAt: '2026-09-30T00:00:00Z', sourceVersion: 'synthetic_v1',
  ttlMs: 60000, data: { value: 'synthetic' },
}
