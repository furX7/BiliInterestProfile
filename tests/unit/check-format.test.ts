import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { selectFormatFiles } from '../../scripts/check-format.mjs'

const temporaryRoots: string[] = []

function temporaryRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'bili-format-check-'))
  temporaryRoots.push(root)
  for (const args of [
    ['init', '-q'],
    ['config', 'user.name', 'Format Test'],
    ['config', 'user.email', 'format-test@example.invalid'],
  ]) {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' })
    expect(result.status).toBe(0)
  }
  return root
}

function commit(root: string, message: string): string {
  expect(spawnSync('git', ['add', '--all'], { cwd: root }).status).toBe(0)
  expect(spawnSync('git', ['commit', '-qm', message], { cwd: root }).status).toBe(0)
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' })
  expect(result.status).toBe(0)
  return result.stdout.trim()
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('PR-scoped format gate', () => {
  it('selects maintained source, tests, scripts, root config and workflow files', () => {
    expect(
      selectFormatFiles([
        'src/entrypoints/options/index.html',
        'tests/unit/runtime-error-code.test.ts',
        'scripts/check-bundle-budget.mjs',
        'wxt.config.ts',
        'config/bundle-budget.json',
        '.github/workflows/ci.yml',
        'CHANGELOG.md',
      ]),
    ).toEqual([
      '.github/workflows/ci.yml',
      'CHANGELOG.md',
      'config/bundle-budget.json',
      'scripts/check-bundle-budget.mjs',
      'src/entrypoints/options/index.html',
      'tests/unit/runtime-error-code.test.ts',
      'wxt.config.ts',
    ])
  })

  it('excludes generated output, lockfile, historical evidence and fixture data', () => {
    expect(
      selectFormatFiles([
        '.output/chrome-mv3/background.js',
        '.wxt/types.d.ts',
        'pnpm-lock.yaml',
        'docs/phase0/evidence.md',
        'tests/fixtures/phase0/dynamic-valid.html',
        'tests/golden/approved-source-output.json',
        'README.md',
      ]),
    ).toEqual([])
  })

  it('fails when an actually changed tracked source file is not formatted', () => {
    const root = temporaryRepo()
    mkdirSync(join(root, 'src'))
    writeFileSync(join(root, 'src', 'app.ts'), 'const value = 1\n')
    const base = commit(root, 'baseline')
    writeFileSync(join(root, 'src', 'app.ts'), 'const  value=1\n')
    commit(root, 'unformatted change')

    const result = spawnSync(process.execPath, [resolve('scripts/check-format.mjs'), base], {
      cwd: root,
      encoding: 'utf8',
    })

    expect(result.status).toBe(1)
    expect(result.stdout + result.stderr).toContain('Code style issues found')
  })

  it('reports an explicit skip when a PR changes no eligible file', () => {
    const root = temporaryRepo()
    writeFileSync(join(root, 'README.md'), 'First\n')
    const base = commit(root, 'baseline')
    writeFileSync(join(root, 'README.md'), 'Second\n')
    commit(root, 'docs only')

    const result = spawnSync(process.execPath, [resolve('scripts/check-format.mjs'), base], {
      cwd: root,
      encoding: 'utf8',
    })

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('No eligible changed files')
  })
})
