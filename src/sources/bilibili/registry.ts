import { normalizeDynamicCandidate } from '../../normalize/dynamic'
import { readDynamicCards } from './dynamics/read-dynamic-cards'
import { readProfileContext } from './profile/read-profile-context'

export const approvedSourceRegistry = {
  profileContextReader: readProfileContext,
  dynamicCardReader: readDynamicCards,
  dynamicCandidateNormalizer: normalizeDynamicCandidate,
} as const
