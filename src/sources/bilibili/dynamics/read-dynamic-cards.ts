import type { SourceResult, SourceWarning } from '../../../core/contracts/source'
import { readProfileContext } from '../profile/read-profile-context'

export interface DynamicCardCandidate {
  routeUserId: string
  headerDisplayName: string
  cardAuthorDisplayName: string | null
  text: string | null
  title: string | null
  dateLabel: string | null
  sourceUrl: string
  hasReference: boolean
  identity: 'confirmed' | 'missing' | 'mismatch'
  rejectionReason: SourceWarning['code'] | null
}

const cardSelector = '.bili-dyn-item__main'
const loggedInSelector = '.message-entry a.right-entry__item-trigger'
const authorSelector = '.bili-dyn-item__header > .bili-dyn-title > span.bili-dyn-title__text'
const contentSelector = '.bili-dyn-content'
const referenceSelector = '.bili-dyn-content__orig.reference'
const forwardingSelector = '.bili-dyn-content__forw__desc'
const originalTextSelectors = [
  '.bili-dyn-content__orig__desc',
  '.dyn-card-opus__summary .opus-paragraph-children',
  '.bili-dyn-card-video__desc',
]

function isVisible(element: Element): boolean {
  for (let current: Element | null = element; current; current = current.parentElement) {
    if (current.hasAttribute('hidden') || current.getAttribute('aria-hidden') === 'true') return false
    const style = current.ownerDocument.defaultView?.getComputedStyle(current)
    if (style?.display === 'none' || style?.visibility === 'hidden') return false
  }
  return true
}

function visibleMatches(parent: ParentNode, selector: string): Element[] {
  return Array.from(parent.querySelectorAll(selector)).filter(isVisible)
}

function onlyVisible(parent: ParentNode, selector: string): Element | null {
  const matches = visibleMatches(parent, selector)
  return matches.length === 1 ? matches[0] : null
}

function visibleText(element: Element | null): string | null {
  const text = element?.textContent?.trim()
  return text || null
}

function pageUrl(url: URL): string {
  return `${url.origin}${url.pathname}`
}

function pageUnknown(message: string, warnings: SourceWarning[] = []): SourceResult<DynamicCardCandidate[]> {
  return {
    status: 'unknown',
    data: null,
    warnings: warnings.length > 0 ? warnings : [{ code: 'page_state_uncertain', message }],
  }
}

function hasVisibleExactText(document: Document, text: string): boolean {
  return Array.from(document.querySelectorAll('*')).some((element) => isVisible(element) && element.textContent?.trim() === text)
}

function isGenericOrPlaceholder(text: string): boolean {
  return text === '分享动态' || text === '-'
}

function cardText(content: Element, hasReference: boolean): string | null {
  if (hasReference) return visibleText(onlyVisible(content, forwardingSelector))

  for (const selector of originalTextSelectors) {
    const candidate = visibleMatches(content, selector).find((element) => !element.closest(referenceSelector))
    const text = visibleText(candidate ?? null)
    if (text) return text
  }
  return null
}

function rejectedCard(
  routeUserId: string,
  headerDisplayName: string,
  cardAuthorDisplayName: string | null,
  sourceUrl: string,
  hasReference: boolean,
  identity: DynamicCardCandidate['identity'],
  rejectionReason: SourceWarning['code'],
): DynamicCardCandidate {
  return {
    routeUserId,
    headerDisplayName,
    cardAuthorDisplayName,
    text: null,
    title: null,
    dateLabel: null,
    sourceUrl,
    hasReference,
    identity,
    rejectionReason,
  }
}

export function readDynamicCards(document: Document, url: URL): SourceResult<DynamicCardCandidate[]> {
  if (!visibleMatches(document, loggedInSelector).length) {
    return pageUnknown('Visible logged-in navigation cannot be confirmed')
  }

  const profile = readProfileContext(document, url)
  if (profile.status !== 'available' || !profile.data) {
    return pageUnknown('Visible page identity cannot be confirmed', profile.warnings)
  }

  const cards = visibleMatches(document, cardSelector)
  if (cards.length === 0) {
    if (hasVisibleExactText(document, '正在玩命加载…')) return pageUnknown('Dynamic page is still visibly loading')
    if (hasVisibleExactText(document, '好像没有东西诶')) return { status: 'empty', data: [], warnings: [] }
    return pageUnknown('Zero dynamic cards has no confirmed visible empty state')
  }

  const candidates: DynamicCardCandidate[] = []
  const warnings: SourceWarning[] = []
  const sourceUrl = pageUrl(url)
  for (const card of cards) {
    const cardAuthorDisplayName = visibleText(onlyVisible(card, authorSelector))
    const content = onlyVisible(card, contentSelector)
    const hasReference = content ? visibleMatches(content, referenceSelector).length > 0 : false
    if (!cardAuthorDisplayName) {
      candidates.push(rejectedCard(profile.data.userId, profile.data.displayName, null, sourceUrl, hasReference, 'missing', 'identity_mismatch'))
      warnings.push({ code: 'identity_mismatch', message: 'A dynamic card has no visible top-level author' })
      continue
    }
    if (cardAuthorDisplayName !== profile.data.displayName) {
      candidates.push(rejectedCard(profile.data.userId, profile.data.displayName, cardAuthorDisplayName, sourceUrl, hasReference, 'mismatch', 'identity_mismatch'))
      warnings.push({ code: 'identity_mismatch', message: 'A dynamic card author differs from the visible page header' })
      continue
    }

    const text = content ? cardText(content, hasReference) : null
    if (!text || isGenericOrPlaceholder(text)) {
      candidates.push(rejectedCard(profile.data.userId, profile.data.displayName, cardAuthorDisplayName, sourceUrl, hasReference, 'confirmed', 'content_unusable'))
      warnings.push({ code: 'content_unusable', message: 'A dynamic card has no usable current-user text' })
      continue
    }
    candidates.push({
      routeUserId: profile.data.userId,
      headerDisplayName: profile.data.displayName,
      cardAuthorDisplayName,
      text,
      title: null,
      dateLabel: null,
      sourceUrl,
      hasReference,
      identity: 'confirmed',
      rejectionReason: null,
    })
  }

  return { status: warnings.length > 0 ? 'partial' : 'available', data: candidates, warnings }
}
