import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type ProductionManifest = {
  manifest_version?: number
  content_scripts?: Array<{ matches?: string[] }>
  host_permissions?: string[]
  optional_host_permissions?: string[]
  permissions?: string[]
}

const approvedMatches = ['https://space.bilibili.com/*']

function readManifest(browser: 'chrome' | 'edge'): ProductionManifest {
  const path = resolve('.output', `${browser}-mv3`, 'manifest.json')
  return JSON.parse(readFileSync(path, 'utf8')) as ProductionManifest
}

function assertApprovedManifest(manifest: ProductionManifest): void {
  expect(manifest.manifest_version).toBe(3)
  const matches = manifest.content_scripts?.flatMap((script) => script.matches ?? []) ?? []
  expect(matches).toEqual(approvedMatches)
  expect(manifest.permissions).toBeUndefined()
  expect(manifest.host_permissions).toBeUndefined()
  expect(manifest.optional_host_permissions).toBeUndefined()
}

describe('production manifest permissions', () => {
  for (const browser of ['chrome', 'edge'] as const) {
    it(`accepts the approved ${browser} production manifest`, () => {
      assertApprovedManifest(readManifest(browser))
    })
  }

  it('rejects a manifest with a forbidden permission', () => {
    expect(() => assertApprovedManifest({
      manifest_version: 3,
      content_scripts: [{ matches: ['https://space.bilibili.com/*'] }],
      permissions: ['tabs'],
    })).toThrow()
  })

  it('rejects a manifest with host permissions', () => {
    expect(() => assertApprovedManifest({
      manifest_version: 3,
      content_scripts: [{ matches: ['https://space.bilibili.com/*'] }],
      host_permissions: ['https://other.example/*'],
    })).toThrow()
  })

  it('rejects a manifest with optional host permissions', () => {
    expect(() => assertApprovedManifest({
      manifest_version: 3,
      content_scripts: [{ matches: ['https://space.bilibili.com/*'] }],
      optional_host_permissions: ['https://other.example/*'],
    } as ProductionManifest)).toThrow()
  })

  it('rejects a manifest with an expanded content-script match scope', () => {
    expect(() => assertApprovedManifest({
      manifest_version: 3,
      content_scripts: [{ matches: ['https://space.bilibili.com/*', 'https://other.example/*'] }],
    })).toThrow()
  })

  it('rejects a manifest with a declared non-forbidden permission', () => {
    expect(() => assertApprovedManifest({
      manifest_version: 3,
      content_scripts: [{ matches: ['https://space.bilibili.com/*'] }],
      permissions: ['storage'],
    })).toThrow()
  })

  it('rejects a manifest that declares empty permission fields', () => {
    expect(() => assertApprovedManifest({
      manifest_version: 3,
      content_scripts: [{ matches: ['https://space.bilibili.com/*'] }],
      permissions: [],
      host_permissions: [],
      optional_host_permissions: [],
    })).toThrow()
  })
})
