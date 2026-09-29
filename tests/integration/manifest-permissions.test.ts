import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type ProductionManifest = {
  action?: {
    default_popup?: string
  }
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

function approvedManifestFixture(overrides: Partial<ProductionManifest> = {}): ProductionManifest {
  return {
    manifest_version: 3,
    action: { default_popup: 'popup.html' },
    content_scripts: [{ matches: approvedMatches }],
    ...overrides,
  }
}

function assertApprovedManifest(manifest: ProductionManifest): void {
  expect(manifest.manifest_version).toBe(3)
  expect(manifest.action?.default_popup).toBe('popup.html')
  const matches = manifest.content_scripts?.flatMap((script) => script.matches ?? []) ?? []
  expect(matches).toEqual(approvedMatches)
  expect(manifest.permissions).toBeUndefined()
  expect(manifest.host_permissions).toBeUndefined()
  expect(manifest.optional_host_permissions).toBeUndefined()
}

describe('production manifest permissions', () => {
  it('accepts the baseline fixture used by negative cases', () => {
    expect(() => assertApprovedManifest(approvedManifestFixture())).not.toThrow()
  })

  for (const browser of ['chrome', 'edge'] as const) {
    it(`accepts the approved ${browser} production manifest`, () => {
      assertApprovedManifest(readManifest(browser))
    })
  }

  it('rejects a manifest with a forbidden permission', () => {
    const manifest = approvedManifestFixture({
      permissions: ['tabs'],
    })
    expect(() => assertApprovedManifest(manifest)).toThrow()
  })

  it('rejects a manifest with host permissions', () => {
    expect(() => assertApprovedManifest(approvedManifestFixture({
      host_permissions: ['https://other.example/*'],
    }))).toThrow()
  })

  it('rejects a manifest with optional host permissions', () => {
    expect(() => assertApprovedManifest(approvedManifestFixture({
      optional_host_permissions: ['https://other.example/*'],
    }))).toThrow()
  })

  it('rejects a manifest with an expanded content-script match scope', () => {
    expect(() => assertApprovedManifest(approvedManifestFixture({
      content_scripts: [{ matches: ['https://space.bilibili.com/*', 'https://other.example/*'] }],
    }))).toThrow()
  })

  it('rejects a manifest with a declared non-forbidden permission', () => {
    expect(() => assertApprovedManifest(approvedManifestFixture({
      permissions: ['storage'],
    }))).toThrow()
  })

  it('rejects a manifest that declares empty permission fields', () => {
    expect(() => assertApprovedManifest(approvedManifestFixture({
      permissions: [],
      host_permissions: [],
      optional_host_permissions: [],
    }))).toThrow()
  })
})
