import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { chromium, type BrowserContext } from '@playwright/test'

const profilePrefix = 'bili-interest-extension-smoke-'

export interface BuiltExtensionContext {
  context: BrowserContext
  extensionId: string
  dispose: () => Promise<void>
}

export async function createSmokeProfile(): Promise<string> {
  return mkdtemp(join(tmpdir(), profilePrefix))
}

export async function removeSmokeProfile(profileDir: string): Promise<void> {
  if (dirname(profileDir) !== tmpdir() || !basename(profileDir).startsWith(profilePrefix)) {
    throw new Error('Refusing to remove an unexpected browser profile path')
  }
  await rm(profileDir, { recursive: true, force: true })
}

export async function openBuiltExtension(outputDir: string): Promise<BuiltExtensionContext> {
  const extensionPath = resolve(outputDir)
  const profileDir = await createSmokeProfile()
  let context: BrowserContext | undefined

  const dispose = async (): Promise<void> => {
    try {
      await context?.close()
    } finally {
      await removeSmokeProfile(profileDir)
    }
  }

  try {
    context = await chromium.launchPersistentContext(profileDir, {
      channel: 'chromium',
      headless: true,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    })

    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'))
    const workerUrl = new URL(worker.url())
    if (workerUrl.protocol !== 'chrome-extension:' || !workerUrl.hostname) {
      throw new Error('Built extension did not start an MV3 service worker')
    }

    return { context, extensionId: workerUrl.hostname, dispose }
  } catch (error) {
    await dispose()
    throw error
  }
}
