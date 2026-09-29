import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import { basename } from 'node:path'

const sourcePattern = /^(?:src|tests|scripts)\/.*\.(?:[mc]?[jt]sx?|css|html|json|ya?ml|md)$/i
const configPattern = /^config\/.*\.(?:[mc]?[jt]s|json|ya?ml)$/i
const workflowPattern = /^\.github\/(?:workflows\/.*\.ya?ml|dependabot\.ya?ml)$/i
const rootFiles = new Set([
  '.prettierrc.json',
  'CHANGELOG.md',
  'eslint.config.mjs',
  'package.json',
  'playwright.config.ts',
  'tsconfig.json',
  'vitest.config.ts',
  'wxt.config.ts',
])

export function selectFormatFiles(paths) {
  return [
    ...new Set(
      paths
        .map((path) => path.replaceAll('\\', '/'))
        .filter((path) => {
          if (path.startsWith('tests/fixtures/') || /^tests\/golden\/.*\.json$/i.test(path)) {
            return false
          }
          return (
            sourcePattern.test(path) ||
            configPattern.test(path) ||
            workflowPattern.test(path) ||
            rootFiles.has(path)
          )
        }),
    ),
  ].sort()
}

function runGit(args) {
  const result = spawnSync('git', args, { encoding: 'utf8' })
  if (result.error || result.status !== 0) {
    throw new Error(result.stderr?.trim() || result.error?.message || 'git diff failed')
  }
  return result.stdout
}

function runCli() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')
  if (args.length !== 1 || !args[0] || args[0].startsWith('-')) {
    throw new Error('Usage: pnpm format:check -- <PR base SHA or ref>')
  }
  const changed = runGit([
    'diff',
    '--name-only',
    '-z',
    '--diff-filter=ACMR',
    `${args[0]}...HEAD`,
    '--',
  ])
    .split('\0')
    .filter(Boolean)
  const files = selectFormatFiles(changed)
  if (files.length === 0) {
    process.stdout.write('No eligible changed files; Prettier check skipped.\n')
    return
  }

  const prettierBin = fileURLToPath(import.meta.resolve('prettier/bin/prettier.cjs'))
  const result = spawnSync(process.execPath, [prettierBin, '--check', ...files], {
    encoding: 'utf8',
  })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
}

if (basename(process.argv[1] ?? '') === 'check-format.mjs') {
  try {
    runCli()
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : 'Format check failed'}\n`)
    process.exitCode = 1
  }
}
