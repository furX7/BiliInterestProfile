// Synthetic contract examples only; no runtime/source failure mapping.
export const syntheticSuccess = { ok: true, data: 42, warnings: [] } as const
export const syntheticAppError = { code: 'contract_invalid', message: 'Synthetic contract issue' }
export const syntheticAppWarning = { code: 'sample_partial', message: 'Synthetic limitation' }
export const syntheticFailure = { ok: false, error: syntheticAppError, recoverable: true } as const
