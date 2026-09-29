export const runtimeErrorKinds = {
  RUNTIME_EXECUTION_FAILED: 'execution-error',
  RUNTIME_RESPONSE_UNAVAILABLE: 'connection-unavailable',
} as const

export type ErrorCode = keyof typeof runtimeErrorKinds
