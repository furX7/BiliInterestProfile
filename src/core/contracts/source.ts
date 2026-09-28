export type SourceStatus = 'available' | 'partial' | 'empty' | 'unavailable' | 'unknown'

export interface ProfileContext {
  userId: string
  displayName: string
  description: string | null
  sourceUrl: string
}

export interface EvidenceItem {
  source: 'dynamic'
  userId: string
  title: string | null
  text: string
  timestamp: string | null
  sourceUrl: string
  traceGranularity: 'page' | 'item'
}

export interface SourceWarning {
  code: 'identity_mismatch' | 'content_unusable' | 'page_state_uncertain'
  message: string
}

export interface SourceResult<T> {
  status: SourceStatus
  data: T | null
  warnings: SourceWarning[]
}
