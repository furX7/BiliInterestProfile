import type { EvidenceItem, ProfileContext, SourceResult, SourceWarning } from '../contracts/source'
import { approvedSourceRegistry } from '../../sources/bilibili/registry'

export interface ApprovedSourceCollection {
  context: SourceResult<ProfileContext>
  dynamic: SourceResult<EvidenceItem[]>
  behaviorEvidenceSources: readonly ['dynamic']
}

function unknownDynamic(warnings: SourceWarning[]): SourceResult<EvidenceItem[]> {
  return {
    status: 'unknown',
    data: null,
    warnings: warnings.length > 0
      ? warnings
      : [{ code: 'page_state_uncertain', message: 'Dynamic evidence cannot be confirmed' }],
  }
}

export function collectApprovedSources(document: Document, url: URL): ApprovedSourceCollection {
  const context = approvedSourceRegistry.profileContextReader(document, url)
  const dynamicCandidates = approvedSourceRegistry.dynamicCardReader(document, url)

  if (dynamicCandidates.status === 'unknown' || dynamicCandidates.status === 'unavailable') {
    return {
      context,
      dynamic: { status: dynamicCandidates.status, data: null, warnings: dynamicCandidates.warnings },
      behaviorEvidenceSources: ['dynamic'],
    }
  }

  if (dynamicCandidates.status === 'empty') {
    return {
      context,
      dynamic: { status: 'empty', data: [], warnings: dynamicCandidates.warnings },
      behaviorEvidenceSources: ['dynamic'],
    }
  }

  if (!context.data || !dynamicCandidates.data) {
    return {
      context,
      dynamic: unknownDynamic([...context.warnings, ...dynamicCandidates.warnings]),
      behaviorEvidenceSources: ['dynamic'],
    }
  }

  const profileContext = context.data
  const normalized = dynamicCandidates.data.map((candidate) => (
    approvedSourceRegistry.dynamicCandidateNormalizer(candidate, profileContext)
  ))
  const evidence = normalized.flatMap((result) => result.data ? [result.data] : [])
  const warnings = [...dynamicCandidates.warnings, ...normalized.flatMap((result) => result.warnings)]
  return {
    context,
    dynamic: evidence.length > 0
      ? { status: 'partial', data: evidence, warnings }
      : unknownDynamic(warnings),
    behaviorEvidenceSources: ['dynamic'],
  }
}
