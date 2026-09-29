import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import background from '../../src/entrypoints/background'

describe('inert engineering entrypoints', () => {
  it('does not collect, request, persist, or schedule work when background starts', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem')
    const intervalSpy = vi.spyOn(globalThis, 'setInterval')

    try {
      expect(background.main()).toBeUndefined()
      expect(fetchSpy).not.toHaveBeenCalled()
      expect(storageSpy).not.toHaveBeenCalled()
      expect(intervalSpy).not.toHaveBeenCalled()
    } finally {
      fetchSpy.mockRestore()
      storageSpy.mockRestore()
      intervalSpy.mockRestore()
    }
  })

  it('offers only a static explanation on the options page', () => {
    const html = readFileSync(resolve('src/entrypoints/options/index.html'), 'utf8')
    const page = new DOMParser().parseFromString(html, 'text/html')

    expect(page.documentElement.lang).toBe('zh-CN')
    expect(page.body.textContent).toContain('当前没有可配置的设置')
    expect(page.querySelector('script, form, input, select, button')).toBeNull()
  })
})
