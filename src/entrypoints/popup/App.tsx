import { useState, type ReactElement } from 'react'
import type { CollectionSummary } from '../../core/runtime/analysis-message'
import {
  requestAnalysis,
  type ActiveTabMessenger,
  type PopupAnalysisResponse,
} from './request-analysis'

type PopupState =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | PopupAnalysisResponse

export interface AnalysisPopupProps {
  messenger: ActiveTabMessenger
}

function collectionMessage(summary: CollectionSummary): string {
  if (summary.dynamicStatus === 'unknown' || summary.dynamicStatus === 'unavailable') {
    return '本次无法确认可用动态证据。'
  }

  if (summary.evidenceCount === null) {
    return '本次无法确认可用动态证据。'
  }

  return `已确认动态证据：${summary.evidenceCount}`
}

function statusContent(state: PopupState): ReactElement | null {
  if (state.kind === 'idle') {
    return null
  }

  if (state.kind === 'sending') {
    return <p role="status">正在采集当前页面的公开动态…</p>
  }

  if (state.kind === 'unsupported') {
    return <p role="status">当前页面不受支持。请打开该空间的动态视图。</p>
  }

  if (state.kind === 'connection-unavailable') {
    return (
      <p role="status">
        无法连接当前页面。请确认这是 B 站空间动态页、扩展已获该站点访问权限，并在授权后重新加载页面。
      </p>
    )
  }

  if (state.kind === 'execution-error') {
    return <p role="status">本次采集未完成。请稍后重试。</p>
  }

  return (
    <section aria-live="polite">
      <p>{collectionMessage(state.summary)}</p>
      {state.summary.warningCodes.length > 0 && (
        <p>提示代码：{state.summary.warningCodes.join('、')}</p>
      )}
      <p>已完成公开动态采集；本版本尚未生成兴趣画像。</p>
    </section>
  )
}

export function AnalysisPopup({ messenger }: AnalysisPopupProps): ReactElement {
  const [state, setState] = useState<PopupState>({ kind: 'idle' })

  const handleAnalysis = async (): Promise<void> => {
    if (state.kind === 'sending') {
      return
    }

    setState({ kind: 'sending' })
    setState(await requestAnalysis(messenger))
  }

  return (
    <main>
      <h1>B站兴趣画像</h1>
      <button type="button" disabled={state.kind === 'sending'} onClick={handleAnalysis}>
        分析兴趣
      </button>
      {statusContent(state)}
    </main>
  )
}
