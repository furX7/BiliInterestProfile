import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnalysisPopup } from '../../src/entrypoints/popup/App'
import {
  requestAnalysis,
  type ActiveTabMessenger,
} from '../../src/entrypoints/popup/request-analysis'

type RenderedPopup = {
  container: HTMLDivElement
  root: Root
}

const renderedPopups: RenderedPopup[] = []

async function renderPopup(messenger: ActiveTabMessenger): Promise<RenderedPopup> {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const rendered = { container, root }
  renderedPopups.push(rendered)

  await act(async () => {
    root.render(<AnalysisPopup messenger={messenger} />)
  })

  return rendered
}

async function clickAnalysis(container: HTMLElement): Promise<void> {
  const button = container.querySelector('button')
  if (!button) {
    throw new Error('Analysis button is missing')
  }

  await act(async () => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

afterEach(async () => {
  while (renderedPopups.length > 0) {
    const rendered = renderedPopups.pop()
    if (!rendered) {
      continue
    }

    await act(async () => {
      rendered.root.unmount()
    })
    rendered.container.remove()
  }
})

describe('popup analysis boundary', () => {
  it('queries only the current active tab ID and sends the fixed request', async () => {
    const messenger: ActiveTabMessenger = {
      query: vi.fn().mockResolvedValue([{ id: 42, url: 'https://sensitive.example/' }]),
      sendMessage: vi.fn().mockResolvedValue({
        kind: 'collection',
        summary: {
          contextStatus: 'available',
          dynamicStatus: 'partial',
          evidenceCount: 2,
          warningCodes: ['content_unusable'],
          rawEvidence: 'Sensitive dynamic text',
        },
      }),
    }

    await expect(requestAnalysis(messenger)).resolves.toEqual({
      kind: 'collection',
      summary: {
        contextStatus: 'available',
        dynamicStatus: 'partial',
        evidenceCount: 2,
        warningCodes: ['content_unusable'],
      },
    })
    expect(messenger.query).toHaveBeenCalledWith({ active: true, currentWindow: true })
    expect(messenger.sendMessage).toHaveBeenCalledWith(42, { type: 'analyze-interest' })
  })

  it('does not send a message when the current tab has no ID', async () => {
    const messenger: ActiveTabMessenger = {
      query: vi.fn().mockResolvedValue([{}]),
      sendMessage: vi.fn(),
    }

    await expect(requestAnalysis(messenger)).resolves.toEqual({ kind: 'connection-unavailable' })
    expect(messenger.sendMessage).not.toHaveBeenCalled()
  })

  it('renders an unknown source result without a zero-count or raw content', async () => {
    const messenger: ActiveTabMessenger = {
      query: vi.fn().mockResolvedValue([{ id: 42 }]),
      sendMessage: vi.fn().mockResolvedValue({
        kind: 'collection',
        summary: {
          contextStatus: 'available',
          dynamicStatus: 'unknown',
          evidenceCount: null,
          warningCodes: ['page_state_uncertain'],
          profile: { displayName: 'Sensitive profile' },
          evidence: ['Sensitive dynamic text'],
        },
      }),
    }
    const { container } = await renderPopup(messenger)

    await clickAnalysis(container)

    expect(container.textContent).toContain('本次无法确认可用动态证据。')
    expect(container.textContent).not.toContain('已确认动态证据：0')
    expect(container.textContent).not.toContain('Sensitive')
  })

  it('renders a neutral recovery message when no content script responds', async () => {
    const messenger: ActiveTabMessenger = {
      query: vi.fn().mockResolvedValue([{ id: 42 }]),
      sendMessage: vi.fn().mockRejectedValue(new Error('Sensitive connection failure')),
    }
    const { container } = await renderPopup(messenger)

    await clickAnalysis(container)

    expect(container.textContent).toContain('无法连接当前页面。')
    expect(container.textContent).toContain('重新加载页面')
    expect(container.textContent).not.toContain('Sensitive')
  })

  it('shows the supported-page guidance without navigating', async () => {
    const messenger: ActiveTabMessenger = {
      query: vi.fn().mockResolvedValue([{ id: 42 }]),
      sendMessage: vi.fn().mockResolvedValue({ kind: 'unsupported' }),
    }
    const { container } = await renderPopup(messenger)

    await clickAnalysis(container)

    expect(container.textContent).toContain('请打开该空间的动态视图。')
    expect(messenger.sendMessage).toHaveBeenCalledTimes(1)
  })

  it('disables repeated clicks while the explicit request is pending', async () => {
    let resolveResponse: ((value: unknown) => void) | undefined
    const messenger: ActiveTabMessenger = {
      query: vi.fn().mockResolvedValue([{ id: 42 }]),
      sendMessage: vi.fn().mockImplementationOnce(() => new Promise((resolve) => {
        resolveResponse = resolve
      })),
    }
    const { container } = await renderPopup(messenger)
    const button = container.querySelector('button')
    if (!button) {
      throw new Error('Analysis button is missing')
    }

    await act(async () => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })
    expect(button.disabled).toBe(true)
    expect(messenger.sendMessage).toHaveBeenCalledTimes(1)

    resolveResponse?.({ kind: 'execution-error' })
    await act(async () => {
      await Promise.resolve()
    })
    expect(button.disabled).toBe(false)
  })
})
