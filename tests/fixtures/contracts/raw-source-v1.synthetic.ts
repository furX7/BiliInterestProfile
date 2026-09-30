// Fictional raw payload, no Bilibili fields, credentials, or production Adapter.
export const syntheticRaw = { token: 'synthetic' }
export const syntheticRawUnknown = {
  sourceId: 'synthetic_source', status: 'unknown', data: null,
  warnings: [{ code: 'page_state_uncertain', message: 'Synthetic source uncertainty' }],
} as const
