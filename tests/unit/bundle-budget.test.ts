import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { afterEach, describe, expect, it } from 'vitest'
import { assertBundleBudget, measureJsCssBytes } from '../../scripts/check-bundle-budget.mjs'

const temporaryRoots: string[] = []
const baselineCommit = 'a'.repeat(40)

function temporaryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'bili-bundle-budget-'))
  temporaryRoots.push(root)
  return root
}

function validBudget() {
  return {
    schemaVersion: 1,
    baselineCommit,
    meter: 'js-css-bytes',
    chrome: { baselineBytes: 100, maxBytes: 125 },
    edge: { baselineBytes: 80, maxBytes: 100 },
  }
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('read-only production bundle budget', () => {
  it('counts only packaged JS and CSS bytes recursively', () => {
    const root = temporaryRoot()
    mkdirSync(join(root, 'chunks'))
    writeFileSync(join(root, 'background.js'), '1234')
    writeFileSync(join(root, 'chunks', 'popup.css'), '12345')
    writeFileSync(join(root, 'chunks', 'worker.mjs'), '12')
    writeFileSync(join(root, 'chunks', 'legacy.cjs'), '123')
    writeFileSync(join(root, 'chunks', 'popup.js.map'), 'ignored')
    writeFileSync(join(root, 'options.html'), 'ignored')

    expect(measureJsCssBytes(root)).toBe(14)
  })

  it('rejects a missing or empty production output instead of calling it zero bytes', () => {
    const root = temporaryRoot()
    expect(() => measureJsCssBytes(join(root, 'missing'))).toThrow()
    expect(() => measureJsCssBytes(root)).toThrow()
  })

  it('accepts each browser at its own approved ceiling', () => {
    expect(() => assertBundleBudget(validBudget(), { chrome: 125, edge: 100 })).not.toThrow()
  })

  it('rejects missing budgets, invalid bytes and a non-frozen formula', () => {
    expect(() => assertBundleBudget(null, { chrome: 1, edge: 1 })).toThrow()
    expect(() => assertBundleBudget({ ...validBudget(), chrome: { baselineBytes: 0, maxBytes: 0 } }, { chrome: 1, edge: 1 })).toThrow()
    expect(() => assertBundleBudget({ ...validBudget(), chrome: { baselineBytes: -1, maxBytes: 1 } }, { chrome: 1, edge: 1 })).toThrow()
    expect(() => assertBundleBudget({ ...validBudget(), chrome: { baselineBytes: 100, maxBytes: 126 } }, { chrome: 1, edge: 1 })).toThrow()
  })

  it('rejects a Chrome or Edge overrun independently', () => {
    expect(() => assertBundleBudget(validBudget(), { chrome: 126, edge: 1 })).toThrow()
    expect(() => assertBundleBudget(validBudget(), { chrome: 1, edge: 101 })).toThrow()
  })

  it('exits nonzero on an overrun without changing the budget file', () => {
    const root = temporaryRoot()
    mkdirSync(join(root, 'config'))
    mkdirSync(join(root, '.output', 'chrome-mv3'), { recursive: true })
    mkdirSync(join(root, '.output', 'edge-mv3'), { recursive: true })
    const budgetPath = join(root, 'config', 'bundle-budget.json')
    const original = JSON.stringify(validBudget())
    writeFileSync(budgetPath, original)
    writeFileSync(join(root, '.output', 'chrome-mv3', 'content.js'), 'x'.repeat(126))
    writeFileSync(join(root, '.output', 'edge-mv3', 'content.js'), 'x')

    const result = spawnSync(process.execPath, [resolve('scripts/check-bundle-budget.mjs')], {
      cwd: root,
      encoding: 'utf8',
    })

    expect(result.status).not.toBe(0)
    expect(readFileSync(budgetPath, 'utf8')).toBe(original)
  })
})
