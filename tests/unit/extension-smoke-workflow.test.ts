import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const workflowPath = resolve('.github/workflows/extension-smoke.yml')

describe('independent extension smoke workflow', () => {
  it('builds Chrome before running the bundled Chromium smoke from a frozen install', () => {
    const workflow = readFileSync(workflowPath, 'utf8')
    const commands = [...workflow.matchAll(/^\s+run: (.+)$/gm)].map((match) => match[1])

    expect(commands).toEqual([
      'pnpm install --frozen-lockfile',
      'pnpm exec playwright install --with-deps chromium',
      'pnpm exec wxt build -b chrome',
      'pnpm test:e2e:smoke',
    ])
  })

  it('is manual-only, read-only, and does not use a warning-only bypass', () => {
    const workflow = readFileSync(workflowPath, 'utf8')

    expect(workflow).toMatch(/workflow_dispatch:/)
    expect(workflow).not.toMatch(/pull_request:|push:/)
    expect(workflow).toMatch(/permissions:\s*\n\s+contents: read/)
    expect(workflow).not.toMatch(/continue-on-error|\|\| true|if: always\(\)/)
  })
})
