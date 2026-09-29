import { readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import { openBuiltExtension } from './extension-context'

const profilePrefix = 'bili-interest-extension-smoke-'

function temporaryProfiles(): Set<string> {
  return new Set(readdirSync(tmpdir()).filter((name) => name.startsWith(profilePrefix)))
}

test('bundled Chromium loads the built MV3 extension and its idle pages', async () => {
  const before = temporaryProfiles()
  const extension = await openBuiltExtension(resolve('.output/chrome-mv3'))
  const during = temporaryProfiles()
  const created = [...during].filter((name) => !before.has(name))

  try {
    expect(created).toHaveLength(1)
    expect(
      extension.context
        .serviceWorkers()
        .some((worker) => worker.url().includes(extension.extensionId)),
    ).toBe(true)

    const popup = await extension.context.newPage()
    await popup.goto(`chrome-extension://${extension.extensionId}/popup.html`)
    await expect(popup.getByRole('button', { name: '分析兴趣' })).toBeVisible()
    await expect(popup.getByText('正在采集当前页面的公开动态')).toHaveCount(0)

    const options = await extension.context.newPage()
    await options.goto(`chrome-extension://${extension.extensionId}/options.html`)
    await expect(options.getByRole('heading', { name: '设置' })).toBeVisible()
    await expect(options.getByText('当前没有可配置的设置。')).toBeVisible()
  } finally {
    await extension.dispose()
  }

  expect(temporaryProfiles()).toEqual(before)
})
