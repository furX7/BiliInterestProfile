import type { EvidenceItem, ProfileContext, SourceResult, SourceWarning } from '../core/contracts/source'
import type { DynamicCardCandidate } from '../sources/bilibili/dynamics/read-dynamic-cards'

function rejected(code: SourceWarning['code'], message: string): SourceResult<EvidenceItem> {
  return { status: 'unknown', data: null, warnings: [{ code, message }] }
}

function rejectionMessage(code: SourceWarning['code']): string {
  switch (code) {
    case 'identity_mismatch':
      return 'Dynamic candidate identity does not match the current profile context'
    case 'content_unusable':
      return 'Dynamic candidate is not usable as current-user evidence'
    case 'page_state_uncertain':
      return 'Dynamic candidate comes from an uncertain page state'
  }
}

export function normalizeDynamicCandidate(
  candidate: DynamicCardCandidate,
  context: ProfileContext,
): SourceResult<EvidenceItem> {
  if (candidate.rejectionReason) {
    return rejected(candidate.rejectionReason, rejectionMessage(candidate.rejectionReason))
  }

  const identityMatches = candidate.identity === 'confirmed'
    && candidate.routeUserId === context.userId
    && candidate.headerDisplayName === context.displayName
    && candidate.cardAuthorDisplayName === context.displayName
  if (!identityMatches) {
    return rejected('identity_mismatch', rejectionMessage('identity_mismatch'))
  }

  const text = candidate.text?.trim()
  if (!text || text === '分享动态' || text === '-') {
    return rejected('content_unusable', rejectionMessage('content_unusable'))
  }

  return {
    status: 'partial',
    data: {
      source: 'dynamic',
      userId: context.userId,
      title: candidate.title,
      text,
      timestamp: null,
      sourceUrl: candidate.sourceUrl,
      traceGranularity: 'page',
    },
    warnings: [],
  }
}
