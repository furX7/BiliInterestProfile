import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createSmokeProfile, removeSmokeProfile } from '../e2e/extension-context'

describe('extension smoke profile lifecycle', () => {
  it('creates a uniquely named temporary profile and removes that exact directory', async () => {
    const profile = await createSmokeProfile()

    expect(dirname(profile)).toBe(tmpdir())
    expect(basename(profile)).toMatch(/^bili-interest-extension-smoke-/)
    expect(existsSync(profile)).toBe(true)

    await removeSmokeProfile(profile)
    expect(existsSync(profile)).toBe(false)
  })

  it('refuses to remove an unrelated temporary directory', async () => {
    const unrelated = await mkdtemp(join(tmpdir(), 'bili-interest-unrelated-'))
    try {
      await expect(removeSmokeProfile(unrelated)).rejects.toThrow(
        'Refusing to remove an unexpected browser profile path',
      )
      expect(existsSync(unrelated)).toBe(true)
    } finally {
      if (
        dirname(unrelated) === tmpdir() &&
        basename(unrelated).startsWith('bili-interest-unrelated-')
      ) {
        await rm(unrelated, { recursive: true })
      }
    }
  })
})
