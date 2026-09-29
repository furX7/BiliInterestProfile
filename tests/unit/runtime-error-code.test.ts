import { describe, expect, it } from 'vitest'
import { runtimeErrorKinds } from '../../src/core/runtime/error-code'

describe('current Phase 1 runtime error classification', () => {
  it('keeps collection execution failures on the existing neutral response kind', () => {
    expect(runtimeErrorKinds.RUNTIME_EXECUTION_FAILED).toBe('execution-error')
  })

  it('keeps missing or invalid popup responses on the existing neutral response kind', () => {
    expect(runtimeErrorKinds.RUNTIME_RESPONSE_UNAVAILABLE).toBe('connection-unavailable')
  })

  it('contains no source, adapter, or network error categories', () => {
    expect(Object.keys(runtimeErrorKinds)).toEqual([
      'RUNTIME_EXECUTION_FAILED',
      'RUNTIME_RESPONSE_UNAVAILABLE',
    ])
  })
})
