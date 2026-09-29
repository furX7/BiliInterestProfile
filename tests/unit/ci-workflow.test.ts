import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const workflowPath = resolve('.github/workflows/ci.yml')

describe('PR CI hard gates', () => {
  it('runs all ten real gates in their build dependency order', () => {
    const workflow = readFileSync(workflowPath, 'utf8')
    const commands = [...workflow.matchAll(/^\s+run: (.+)$/gm)].map((match) => match[1])

    expect(commands).toEqual([
      'pnpm install --frozen-lockfile',
      'pnpm lint',
      'pnpm format:check -- "$PR_BASE_SHA"',
      'pnpm typecheck',
      'pnpm test:unit',
      'pnpm test:golden',
      'pnpm exec wxt build -b chrome',
      'pnpm exec wxt build -b edge',
      'pnpm test:integration',
      'pnpm bundle:check',
    ])
  })

  it('limits permissions and fetches a resolvable PR base without warning-only bypasses', () => {
    const workflow = readFileSync(workflowPath, 'utf8')
    expect(workflow).toMatch(/pull_request:/)
    expect(workflow).toMatch(/permissions:\s*\n\s+contents: read/)
    expect(workflow).toMatch(/fetch-depth: 0/)
    expect(workflow).toMatch(/persist-credentials: false/)
    expect(workflow).toMatch(/PR_BASE_SHA: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/)
    expect(workflow).not.toMatch(/continue-on-error|\|\| true|if: always\(\)/)
  })
})
