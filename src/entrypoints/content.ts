import { browser } from 'wxt/browser'
import { defineContentScript } from 'wxt/utils/define-content-script'
import { collectApprovedSources } from '../core/pipeline/collect-approved-sources'
import { createAnalysisHandler } from '../core/runtime/create-analysis-handler'

export default defineContentScript({
  matches: ['https://space.bilibili.com/*'],
  main() {
    const handleAnalysisMessage = createAnalysisHandler(collectApprovedSources)

    browser.runtime.onMessage.addListener((message) => (
      handleAnalysisMessage(message, document, new URL(location.href))
    ))
  },
})
