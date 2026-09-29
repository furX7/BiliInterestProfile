import type { SourceStatus, SourceWarning } from '../contracts/source'
import type { ApprovedSourceCollection } from '../pipeline/collect-approved-sources'

const sourceStatuses = new Set<SourceStatus>([
  'available',
  'partial',
  'empty',
  'unavailable',
  'unknown',
])

const warningCodes = new Set<SourceWarning['code']>([
  'identity_mismatch',
  'content_unusable',
  'page_state_uncertain',
])

export type AnalyzeInterestRequest = {
  type: 'analyze-interest'
}

export type CollectionSummary = {
  contextStatus: SourceStatus
  dynamicStatus: SourceStatus
  evidenceCount: number | null
  warningCodes: SourceWarning['code'][]
}

export type AnalyzeInterestResponse =
  | { kind: 'unsupported' }
  | { kind: 'execution-error' }
  | { kind: 'collection'; summary: CollectionSummary }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSourceStatus(value: unknown): value is SourceStatus {
  return typeof value === 'string' && sourceStatuses.has(value as SourceStatus)
}

function collectWarningCodes(
  warnings: ReadonlyArray<{ code: unknown }>,
): SourceWarning['code'][] {
  const uniqueCodes = new Set<SourceWarning['code']>()

  for (const warning of warnings) {
    if (typeof warning.code === 'string' && warningCodes.has(warning.code as SourceWarning['code'])) {
      uniqueCodes.add(warning.code as SourceWarning['code'])
    }
  }

  return [...uniqueCodes]
}

function confirmedEvidenceCount(collection: ApprovedSourceCollection): number | null {
  const { dynamic } = collection
  if (!['available', 'partial', 'empty'].includes(dynamic.status) || !Array.isArray(dynamic.data)) {
    return null
  }

  return dynamic.data.length
}

export function isAnalyzeInterestRequest(value: unknown): value is AnalyzeInterestRequest {
  return isRecord(value)
    && Object.keys(value).length === 1
    && value.type === 'analyze-interest'
}

export function summarizeCollection(collection: ApprovedSourceCollection): CollectionSummary {
  return {
    contextStatus: collection.context.status,
    dynamicStatus: collection.dynamic.status,
    evidenceCount: confirmedEvidenceCount(collection),
    warningCodes: collectWarningCodes([
      ...collection.context.warnings,
      ...collection.dynamic.warnings,
    ]),
  }
}

export function parseAnalyzeInterestResponse(value: unknown): AnalyzeInterestResponse | null {
  if (!isRecord(value)) {
    return null
  }

  if (value.kind === 'unsupported' || value.kind === 'execution-error') {
    return { kind: value.kind }
  }

  if (value.kind !== 'collection' || !isRecord(value.summary)) {
    return null
  }

  const { contextStatus, dynamicStatus, evidenceCount, warningCodes: responseWarningCodes } = value.summary
  if (
    !isSourceStatus(contextStatus)
    || !isSourceStatus(dynamicStatus)
    || !(evidenceCount === null || (
      typeof evidenceCount === 'number'
      && Number.isSafeInteger(evidenceCount)
      && evidenceCount >= 0
    ))
    || !Array.isArray(responseWarningCodes)
  ) {
    return null
  }

  const parsedWarningCodes = collectWarningCodes(
    responseWarningCodes.map((code) => ({ code })),
  )
  if (parsedWarningCodes.length !== responseWarningCodes.length) {
    return null
  }

  return {
    kind: 'collection',
    summary: {
      contextStatus,
      dynamicStatus,
      evidenceCount,
      warningCodes: parsedWarningCodes,
    },
  }
}
