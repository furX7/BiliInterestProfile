import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Dependabot policy', () => {
  it('checks npm and GitHub Actions weekly with bounded, ungrouped PRs', () => {
    const policy = readFileSync(resolve('.github/dependabot.yml'), 'utf8')
    expect(policy).toContain('version: 2')
    expect(policy).toMatch(/package-ecosystem: npm[\s\S]*?interval: weekly/)
    expect(policy).toMatch(/package-ecosystem: github-actions[\s\S]*?interval: weekly/)
    expect(policy.match(/open-pull-requests-limit:/g)).toHaveLength(2)
    expect(policy).not.toMatch(/groups:|auto-merge|automerge/)
  })

  it('allows patch and minor version PRs while leaving major changes for separate review', () => {
    const policy = readFileSync(resolve('.github/dependabot.yml'), 'utf8')
    expect(policy.match(/version-update:semver-patch/g)).toHaveLength(2)
    expect(policy.match(/version-update:semver-minor/g)).toHaveLength(2)
    expect(policy).not.toContain('version-update:semver-major')
  })
})
