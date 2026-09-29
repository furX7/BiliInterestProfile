import { createRoot } from 'react-dom/client'
import { browser } from 'wxt/browser'
import { AnalysisPopup } from './App'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Popup root is missing')
}

createRoot(rootElement).render(<AnalysisPopup messenger={browser.tabs} />)
