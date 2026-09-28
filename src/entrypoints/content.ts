import { defineContentScript } from 'wxt/utils/define-content-script'

export default defineContentScript({
  matches: ['https://space.bilibili.com/*'],
  main() {
    // Source collection is added in the approved follow-up tasks.
  },
})
