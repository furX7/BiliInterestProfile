import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findForbiddenRawImports } from '../support/contract-imports'

describe('raw module import boundaries', () => {
  const owner = 'src/core/contracts/consumer.ts'
  it.each([
    "import type { RawSourceResult } from '../../sources/contracts/raw-source'",
    "import { reader } from '../../sources/reader'",
    "export * from '../../normalize/dynamic'",
    "export type { RawSourceResult } from './facade'",
    "const raw = import('../../sources/contracts/raw-source')",
    "type Raw = import('../../sources/contracts/raw-source').RawSourceResult<unknown>",
    "import raw = require('../../sources/contracts/raw-source')",
    "const raw = require('../../sources/contracts/raw-source')",
  ])('rejects raw boundary crossing %s', (source) => {
    expect(findForbiddenRawImports(source, owner)).not.toHaveLength(0)
  })
  it('finds all forbidden edges in a marked synthetic source', () => {
    const input = readFileSync(resolve('tests/fixtures/contracts/raw-leak.synthetic.txt'), 'utf8')
    expect(findForbiddenRawImports(input, owner)).toHaveLength(3)
  })
  it('permits only the actual P1 registry assembly import, including in the same file', () => {
    const pipeline = 'src/core/pipeline/collect-approved-sources.ts'
    const approved = "import { approvedSourceRegistry } from '../../sources/bilibili/registry'"
    expect(findForbiddenRawImports(approved, pipeline)).toEqual([])
    expect(
      findForbiddenRawImports(
        `${approved}\nimport type { RawSourceResult } from '../../sources/contracts/raw-source'`,
        pipeline,
      ),
    ).toHaveLength(1)
    expect(
      findForbiddenRawImports(
        "import * as registry from '../../sources/bilibili/registry'",
        pipeline,
      ),
    ).toHaveLength(1)
    expect(
      findForbiddenRawImports(
        "import { approvedSourceRegistry, raw } from '../../sources/bilibili/registry'",
        pipeline,
      ),
    ).toHaveLength(1)
    expect(findForbiddenRawImports(approved, owner)).toHaveLength(1)
  })
  it('covers UI, Analyzer and entrypoints while allowing Core Pipeline imports', () => {
    for (const consumer of [
      'src/ui/view.tsx',
      'src/analyzers/analyzer.ts',
      'src/entrypoints/content.ts',
      'src/other-consumer/index.ts',
    ]) {
      expect(findForbiddenRawImports("import raw from '../sources/raw'", consumer)).toHaveLength(1)
    }
    expect(
      findForbiddenRawImports(
        "import { collectApprovedSources } from '../core/pipeline/collect-approved-sources'",
        'src/entrypoints/content.ts',
      ),
    ).toEqual([])
    expect(
      findForbiddenRawImports(
        "// import raw from '../../sources/raw'\nconst text = '../../sources/raw'",
        owner,
      ),
    ).toEqual([])
  })
  it('resolves normalized relative and source alias paths', () => {
    expect(
      findForbiddenRawImports("import raw from '../contracts/../../sources/raw'", owner),
    ).toHaveLength(1)
    expect(findForbiddenRawImports("import raw from '@/sources/raw'", owner)).toHaveLength(1)
  })
  it('scans every existing consumer directory rather than a fixed whitelist', () => {
    const files = readdirSync('src', { recursive: true })
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => `src/${entry.replaceAll('\\', '/')}`)
      .filter((file) => /\.[cm]?tsx?$/.test(file) && !/^src\/(sources|normalize)\//.test(file))
    expect(files.some((file) => file.startsWith('src/core/'))).toBe(true)
    expect(files.some((file) => file.startsWith('src/entrypoints/'))).toBe(true)
    const violations = files.flatMap((file) =>
      findForbiddenRawImports(readFileSync(file, 'utf8'), file).map((edge) => `${file}: ${edge}`),
    )
    expect(violations).toEqual([])
  })
})
