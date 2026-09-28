import { describe, expect, it } from 'vitest'
import contentScript from '../../src/entrypoints/content'
import config from '../../wxt.config'

describe('extension foundation', () => {
  it('runs only on public Bilibili space pages', () => {
    expect(contentScript.matches).toEqual(['https://space.bilibili.com/*'])
  })

  it('does not request extra host or sensitive permissions', () => {
    const manifest = config.manifest
    if (!manifest || typeof manifest !== 'object' || manifest instanceof Promise) {
      throw new Error('Expected a static manifest configuration')
    }
    expect(manifest.host_permissions).toBeUndefined()
    expect(manifest.permissions ?? []).toEqual([])
  })
})
