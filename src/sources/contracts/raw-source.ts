import type { AppError } from '../../core/contracts/app-issue'
import type { Result } from '../../core/contracts/result'
import type { SourceStatus, SourceWarning } from '../../core/contracts/source'

/** Source-local raw boundary, independent of outer call success. */
export interface RawSourceResult<TRaw> {
  sourceId: string
  status: SourceStatus
  data: TRaw | null
  warnings: SourceWarning[]
}

export interface SourceAdapter<TRaw, TInput> {
  sourceId: string
  apiVersion: 1
  read(input: TInput): Promise<Result<RawSourceResult<TRaw>, AppError>>
}
