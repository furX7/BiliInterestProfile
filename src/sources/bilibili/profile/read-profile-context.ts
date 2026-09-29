import type { ProfileContext, SourceResult } from '../../../core/contracts/source'

function isVisible(element: Element): boolean {
  for (let current: Element | null = element; current; current = current.parentElement) {
    if (current.hasAttribute('hidden') || current.getAttribute('aria-hidden') === 'true')
      return false
    const style = current.ownerDocument.defaultView?.getComputedStyle(current)
    if (style?.display === 'none' || style?.visibility === 'hidden') return false
  }
  return true
}

function onlyVisible(document: Document, selector: string): Element | null {
  const matches = Array.from(document.querySelectorAll(selector)).filter(isVisible)
  return matches.length === 1 ? matches[0] : null
}

function visibleText(element: Element | null): string | null {
  if (!element) return null
  function read(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
    if (node.nodeType === Node.ELEMENT_NODE && !isVisible(node as Element)) return ''
    return Array.from(node.childNodes, read).join('')
  }
  return read(element).trim() || null
}

function uncertain(message: string): SourceResult<ProfileContext> {
  return { status: 'unknown', data: null, warnings: [{ code: 'page_state_uncertain', message }] }
}

export function readProfileContext(document: Document, url: URL): SourceResult<ProfileContext> {
  const route = /^\/([1-9]\d*)(?:\/|$)/.exec(url.pathname)
  if (url.protocol !== 'https:' || url.hostname !== 'space.bilibili.com' || !route) {
    return uncertain('Current URL is not a valid Bilibili space route')
  }

  const nickname = visibleText(onlyVisible(document, '.nickname'))
  const uidText = visibleText(onlyVisible(document, '.sic-fsp-uid_line'))
  const visibleUid = uidText ? /\bUID\s*[:：]?\s*([1-9]\d*)\b/i.exec(uidText)?.[1] : undefined
  if (!nickname || !visibleUid) return uncertain('Visible profile identity cannot be confirmed')
  if (visibleUid !== route[1]) {
    return {
      status: 'unknown',
      data: null,
      warnings: [
        { code: 'identity_mismatch', message: 'Visible profile UID differs from route UID' },
      ],
    }
  }

  const description = visibleText(onlyVisible(document, '.sign.header-sign .pure-text'))
  return {
    status: 'available',
    data: {
      userId: route[1],
      displayName: nickname,
      description,
      sourceUrl: `https://space.bilibili.com/${route[1]}`,
    },
    warnings: [],
  }
}
