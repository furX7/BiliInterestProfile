import type { AppWarning } from './app-issue'

export type Result<T, E> =
  { ok: true; data: T; warnings: AppWarning[] } | { ok: false; error: E; recoverable: boolean }
