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
const dynamicListSelector = 'main.route_dynamic .bili-dyn-list'
const loggedInSelector = '.message-entry a.right-entry__item-trigger'
const authorSelector = '.bili-dyn-item__header > .bili-dyn-title > span.bili-dyn-title__text'
const dateSelector =
  '.bili-dyn-item__header > .bili-dyn-item__desc > .bili-dyn-time[data-module="time"]'
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
    if (current.hasAttribute('hidden') || current.getAttribute('aria-hidden') === 'true')
      return false
    const style = current.ownerDocument.defaultView?.getComputedStyle(current)
    const inlineStyle = (current as HTMLElement).style
    if (
      (style?.display ?? inlineStyle?.display) === 'none' ||
      (style?.visibility ?? inlineStyle?.visibility) === 'hidden'
    )
      return false
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
  if (!element) return null
  function read(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
    if (node.nodeType === Node.ELEMENT_NODE && !isVisible(node as Element)) return ''
    return Array.from(node.childNodes, read).join('')
  }
  const text = read(element).trim()
  return text || null
}

function pageUrl(url: URL): string {
  return `${url.origin}${url.pathname}`
}

function pageUnknown(
  message: string,
  warnings: SourceWarning[] = [],
): SourceResult<DynamicCardCandidate[]> {
  return {
    status: 'unknown',
    data: null,
    warnings: warnings.length > 0 ? warnings : [{ code: 'page_state_uncertain', message }],
  }
}

function isGenericOrPlaceholder(text: string): boolean {
  return text === '分享动态' || text === '-'
}

function cardText(content: Element, hasReference: boolean): string | null {
  if (hasReference) {
    const forwardingDescriptions = visibleMatches(content, forwardingSelector).filter(
      (element) => !element.closest(referenceSelector),
    )
    return visibleText(forwardingDescriptions.length === 1 ? forwardingDescriptions[0] : null)
  }

  for (const selector of originalTextSelectors) {
    const candidate = visibleMatches(content, selector).find(
      (element) => !element.closest(referenceSelector),
    )
    const text = visibleText(candidate ?? null)
    if (text) return text
  }
  return null
}

function rejectedCard(
  routeUserId: string,
  headerDisplayName: string,
  cardAuthorDisplayName: string | null,
  dateLabel: string | null,
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
    dateLabel,
    sourceUrl,
    hasReference,
    identity,
    rejectionReason,
  }
}

export function readDynamicCards(
  document: Document,
  url: URL,
): SourceResult<DynamicCardCandidate[]> {
  if (!/^\/[1-9]\d*\/dynamic\/?$/.test(url.pathname)) {
    return pageUnknown('Current URL is not a Bilibili dynamic route')
  }
  if (!visibleMatches(document, loggedInSelector).length) {
    return pageUnknown('Visible logged-in navigation cannot be confirmed')
  }

  const profile = readProfileContext(document, url)
  if (profile.status !== 'available' || !profile.data) {
    return pageUnknown('Visible page identity cannot be confirmed', profile.warnings)
  }

  const dynamicList = onlyVisible(document, dynamicListSelector)
  if (!dynamicList) return pageUnknown('Visible dynamic list cannot be confirmed')
  const items = onlyVisible(dynamicList, ':scope > .bili-dyn-list__items')
  if (!items) return pageUnknown('Visible dynamic card container cannot be confirmed')
  const cards = visibleMatches(items, cardSelector)
  if (cards.length === 0) {
    if (visibleMatches(dynamicList, ':scope > .bili-dyn-list-loading').length > 0) {
      return pageUnknown('Dynamic page is still visibly loading')
    }
    const emptyContainer = onlyVisible(dynamicList, ':scope > .bili-dyn-list-empty')
    const emptyText = emptyContainer
      ? visibleText(
          onlyVisible(
            emptyContainer,
            '.bili-dyn-list-empty__inner > .bili-dyn-list-empty__text > span',
          ),
        )
      : null
    if (emptyText === '好像没有东西诶') {
      return pageUnknown(
        'Visible empty state is only a single-snapshot candidate; stability proof is unavailable',
      )
    }
    return pageUnknown('Zero dynamic cards has no confirmed visible empty state')
  }

  const candidates: DynamicCardCandidate[] = []
  const warnings: SourceWarning[] = []
  const sourceUrl = pageUrl(url)
  for (const card of cards) {
    const cardAuthorDisplayName = visibleText(onlyVisible(card, authorSelector))
    const dateLabel = visibleText(onlyVisible(card, dateSelector))
    const content = onlyVisible(card, contentSelector)
    const hasReference = content ? visibleMatches(content, referenceSelector).length > 0 : false
    if (!cardAuthorDisplayName) {
      candidates.push(
        rejectedCard(
          profile.data.userId,
          profile.data.displayName,
          null,
          dateLabel,
          sourceUrl,
          hasReference,
          'missing',
          'identity_mismatch',
        ),
      )
      warnings.push({
        code: 'identity_mismatch',
        message: 'A dynamic card has no visible top-level author',
      })
      continue
    }
    if (cardAuthorDisplayName !== profile.data.displayName) {
      candidates.push(
        rejectedCard(
          profile.data.userId,
          profile.data.displayName,
          cardAuthorDisplayName,
          dateLabel,
          sourceUrl,
          hasReference,
          'mismatch',
          'identity_mismatch',
        ),
      )
      warnings.push({
        code: 'identity_mismatch',
        message: 'A dynamic card author differs from the visible page header',
      })
      continue
    }

    const text = content ? cardText(content, hasReference) : null
    if (!text || isGenericOrPlaceholder(text)) {
      candidates.push(
        rejectedCard(
          profile.data.userId,
          profile.data.displayName,
          cardAuthorDisplayName,
          dateLabel,
          sourceUrl,
          hasReference,
          'confirmed',
          'content_unusable',
        ),
      )
      warnings.push({
        code: 'content_unusable',
        message: 'A dynamic card has no usable current-user text',
      })
      continue
    }
    candidates.push({
      routeUserId: profile.data.userId,
      headerDisplayName: profile.data.displayName,
      cardAuthorDisplayName,
      text,
      title: null,
      dateLabel,
      sourceUrl,
      hasReference,
      identity: 'confirmed',
      rejectionReason: null,
    })
  }

  return { status: warnings.length > 0 ? 'partial' : 'available', data: candidates, warnings }
}
