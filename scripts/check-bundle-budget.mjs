import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import process from 'node:process'

const browsers = ['chrome', 'edge']

function positiveBytes(value) {
  return Number.isSafeInteger(value) && value > 0
}

export function measureJsCssBytes(outputDir) {
  let total = 0
  let fileCount = 0

  function visit(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) {
        visit(path)
      } else if (entry.isFile() && /\.(?:js|mjs|cjs|css)$/i.test(entry.name)) {
        total += statSync(path).size
        fileCount += 1
      }
    }
  }

  visit(outputDir)
  if (fileCount === 0 || !positiveBytes(total)) {
    throw new Error(`No nonempty JS/CSS bundle in ${outputDir}`)
  }
  return total
}

export function assertBundleBudget(budget, actualByBrowser) {
  if (
    budget === null ||
    typeof budget !== 'object' ||
    budget.schemaVersion !== 1 ||
    budget.meter !== 'js-css-bytes' ||
    typeof budget.baselineCommit !== 'string' ||
    !/^[0-9a-f]{40}$/.test(budget.baselineCommit)
  ) {
    throw new Error('Invalid frozen bundle budget metadata')
  }

  for (const browser of browsers) {
    const limit = budget[browser]
    const actual = actualByBrowser?.[browser]
    if (
      limit === null ||
      typeof limit !== 'object' ||
      !positiveBytes(limit.baselineBytes) ||
      !positiveBytes(limit.maxBytes) ||
      limit.maxBytes !== Math.ceil(limit.baselineBytes * 1.25) ||
      !positiveBytes(actual)
    ) {
      throw new Error(`Invalid ${browser} bundle budget or measured size`)
    }
    if (actual > limit.maxBytes) {
      throw new Error(`${browser} bundle exceeds frozen budget: ${actual} > ${limit.maxBytes}`)
    }
  }
}

function runCli() {
  const root = process.cwd()
  const budget = JSON.parse(readFileSync(resolve(root, 'config/bundle-budget.json'), 'utf8'))
  const actualByBrowser = Object.fromEntries(
    browsers.map((browser) => [
      browser,
      measureJsCssBytes(resolve(root, `.output/${browser}-mv3`)),
    ]),
  )
  assertBundleBudget(budget, actualByBrowser)
  for (const browser of browsers) {
    process.stdout.write(
      `${browser}: ${actualByBrowser[browser]} / ${budget[browser].maxBytes} bytes\n`,
    )
  }
}

if (basename(process.argv[1] ?? '') === 'check-bundle-budget.mjs') {
  try {
    runCli()
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : 'Bundle budget check failed'}\n`,
    )
    process.exitCode = 1
  }
}
