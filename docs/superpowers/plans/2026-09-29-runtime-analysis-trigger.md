# Runtime Analysis Trigger 与安装态链路 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Approved; Runtime Plan complete with residual risk。Spec 与本 Plan 均已获用户明确批准；Task 4 的下述两项受限安装态观察获准作为残余风险收敛，不代表观察通过。具体实测、残余风险与最终验证见 `docs/architecture/runtime-analysis-install-audit.md`；Task 4 审计已由 `54970b9` 提交并推送。此状态仅关闭本 Runtime Plan，不代表整个 Phase 1 已完成。

**Goal:** 让用户从扩展 popup 主动触发当前公开动态页的既有采集 Pipeline，并以脱敏摘要和真实 Chrome / Edge 安装态证据验收链路。

**Architecture:** popup 只向当前活动 tab 的静态 content script 发送固定消息；content script 每次验证当前动态路由后调用既有 `collectApprovedSources(document, url)` 恰一次。跨消息边界仅传来源状态、已确认证据数量和 warning code；未注入时由 popup 显示中性连接提示，不制造来源结果。

**Tech Stack:** 现有 TypeScript strict、WXT 0.21、React 19、Vitest/jsdom、pnpm、Chrome / Edge MV3；不新增依赖。

**Spec:** [已批准 Runtime Analysis Trigger Spec](../specs/2026-09-29-runtime-analysis-trigger-design.md)

## Global Constraints

- 仅在 `https://space.bilibili.com/<正整数 UID>/dynamic` 由用户点击“分析兴趣”触发；只读取当时已渲染、可见的公开卡片。零卡页面仍可触发并按既有 reader 返回 `unknown/null`；空间根页只返回 unsupported，不自动导航、滚动、分页、监听 SPA 或后台采集。
- 公开动态是唯一兴趣行为来源；基础资料只作身份与上下文。投稿、收藏、Analyzer、评分、画像、持久化与遥测均不在本计划。
- 保持既有 `SourceResult` 语义：单次空态候选为 `unknown/null`；不得构造 proof、`empty/[]` 或把异常、连接失败当来源结果。
- popup 只接收三类响应（unsupported、execution-error、collection）及 collection 的四字段摘要；不接收 UID、昵称、简介、正文或原始 warning message。
- 保持生产 `content_scripts.matches = ['https://space.bilibili.com/*']`，不新增 `permissions`、`host_permissions`、`optional_host_permissions`、`activeTab`、`tabs`、`scripting`、`cookies` 或网络请求；仅查询活动 tab 的 ID，不读取 tab URL、标题。
- 不修改 Phase 0 Gate、pagination = NOT_VALIDATED、SPA UID switch = PARTIAL，不宣称完整历史、同文档 UID 切换或兴趣画像已实现。
- 真实安装证据与 synthetic 测试分开；只使用已打开的合格公开动态页，不搜索账号、读凭据/私有 state、调用私有接口或绕过浏览器安全限制。
- 实施前重新确认已批准 Spec、Plan 执行批准和隔离分支；保留已有 Task 3–6 提交与未提交文档。每个代码 Task 遵循 RED → GREEN → fresh verification；遇异常先用 systematic-debugging。

## Review Focus

- 当前 tab 缺失、无 ID 或消息断开时：popup 给中性恢复提示，且不伪造 `SourceResult`（Task 3 测试）。
- 空间根页、非正整数 UID 或错误 origin：返回 unsupported，Pipeline 调用数为零（Task 2 测试）。
- 快速重复点击及未完成的并发消息：同一时刻最多一次 Pipeline 调用，不产生第二份采集（Task 2/3 测试）。
- `unknown/null`、`unavailable/null`、拒绝卡及原始资料：摘要计数为 null 或只计确认动态，传输字段不泄漏原文（Task 1/3 测试）。
- “选择扩展时允许”、真实未允许和权限撤销后旧页面：分别记录注入/连接观察；不把暂时断连或即时撤销推断为已证明拒绝（Task 4 安装态观察测试）。

---

## File structure 与既有接口

| 路径 | 职责 |
| --- | --- |
| `src/core/runtime/analysis-message.ts`（新） | 固定请求、三类响应、四字段摘要、脱敏解析。 |
| `src/core/runtime/create-analysis-handler.ts`（新） | 显式触发、实时路由验证、并发门闩与 Pipeline 调用。 |
| `src/entrypoints/content.ts`（改） | WXT 静态脚本仅注册消息处理器，不自动采集。 |
| `src/entrypoints/popup/index.html`、`main.tsx`、`App.tsx`（新） | Action popup 入口及用户可见状态。 |
| `src/entrypoints/popup/request-analysis.ts`（新） | 仅用当前 tab ID 发消息并统一处理连接失败。 |
| `tests/unit/runtime-analysis-message.test.ts`、`tests/unit/content-analysis-handler.test.ts`、`tests/unit/popup-analysis.test.tsx`（新） | 脱敏 Contract、触发边界及交互状态；fixture 标 synthetic。 |
| `tests/integration/manifest-permissions.test.ts`（改） | 扩展生产 Manifest 的 popup 与权限断言。 |
| `docs/architecture/permissions-plan.md`（改） | 把“未注入时来源 unavailable”旧提示最小同步为 popup connection-unavailable；实际验收未做前不写 PASS。 |
| `docs/architecture/runtime-analysis-install-audit.md`（新） | Chrome / Edge 真实安装态观察矩阵、未验证项与残余风险，不存个人内容。 |

现有签名保持不变：`collectApprovedSources(document: Document, url: URL): ApprovedSourceCollection`；其中 `context: SourceResult<ProfileContext>`、`dynamic: SourceResult<EvidenceItem[]>`、`behaviorEvidenceSources: ['dynamic']`。不得改 reader、normalizer 或 source contract 来迎合 UI。

### Task 1: 固定消息与脱敏摘要 Contract

**Files:** Create `src/core/runtime/analysis-message.ts`; Test `tests/unit/runtime-analysis-message.test.ts`.

**Interfaces:** 消费既有 `ApprovedSourceCollection`、`SourceStatus`、`SourceWarning['code']`。产出 `AnalyzeInterestRequest = { type: 'analyze-interest' }`，`AnalyzeInterestResponse = { kind: 'unsupported' } | { kind: 'execution-error' } | { kind: 'collection'; summary: CollectionSummary }`，其中 `CollectionSummary = { contextStatus: SourceStatus; dynamicStatus: SourceStatus; evidenceCount: number | null; warningCodes: SourceWarning['code'][] }`。产出 `isAnalyzeInterestRequest(value: unknown): value is AnalyzeInterestRequest`、`summarizeCollection(result: ApprovedSourceCollection): CollectionSummary` 与 `parseAnalyzeInterestResponse(value: unknown): AnalyzeInterestResponse | null`。解析器只保留白名单字段，不向 popup 传额外键。

- [ ] **Step 1: 写失败的 Contract 测试。** 断言合法固定请求被识别，其他消息被忽略；对已确认动态只计 `dynamic.data.length`，`unknown/unavailable` 即使收到异常数组也返回 `null`；仅保留 warning code，原始 profile、evidence text、warning message 和额外响应键均不出现在摘要/解析结果；无效响应解析为 null。
- [ ] **Step 2: 确认 RED。** Run: `pnpm vitest run tests/unit/runtime-analysis-message.test.ts`；预期因新模块不存在或断言失败而 FAIL。
- [ ] **Step 3: 实现上述类型与三个函数。** 摘要的 warning code 来自 context 与 dynamic 的已有 warning，去重但不翻译成失败原因；没有可确认数组时计数为 null，不创建 `empty`。
- [ ] **Step 4: 确认 GREEN。** Run: `pnpm vitest run tests/unit/runtime-analysis-message.test.ts`、`pnpm typecheck`；预期全绿。
- [ ] **Step 5: 检查并提交 Task 1。** 仅暂存本 Task 两个明列路径，核对 `git diff --cached --name-only`、`git diff --cached --check` 与 staged diff；不得夹带既存 AGENTS/旧 Spec/Plan。通过后 commit `feat: define safe runtime analysis messages`。

### Task 2: 显式 content-script 触发

**Files:** Create `src/core/runtime/create-analysis-handler.ts`; Modify `src/entrypoints/content.ts`; Test `tests/unit/content-analysis-handler.test.ts`.

**Interfaces:** 消费 Task 1 的请求、响应与 `summarizeCollection`。产出 `isSupportedDynamicUrl(url: URL): boolean`（origin 必须为 `https://space.bilibili.com`，pathname 为正整数 UID 的 `/dynamic` 路径，可有正常尾斜线/查询）及 `createAnalysisHandler(collect: (document: Document, url: URL) => ApprovedSourceCollection | Promise<ApprovedSourceCollection>): (message: unknown, document: Document, url: URL) => Promise<AnalyzeInterestResponse | undefined>`。未知消息不响应；不支持路由回 unsupported；异常/并发回 execution-error。content entrypoint 的 `main()` 只注册一次 `browser.runtime.onMessage` 处理器，传入事件发生时的 `document` 与 `new URL(location.href)`。

- [ ] **Step 1: 写失败测试。** synthetic Document 上断言注册/模块导入不调用 Pipeline；支持路由每次有效消息恰调用一次且使用本次 URL/Document；空间根页、错误 origin、UID=0、其他消息零调用；用可控未完成 Promise 证明并发第二次不采集，完成后可再次显式触发；异常不泄漏错误文本。
- [ ] **Step 2: 确认 RED。** Run: `pnpm vitest run tests/unit/content-analysis-handler.test.ts`；预期缺失 handler 或行为失败。
- [ ] **Step 3: 实现 handler 并接入现有 WXT content 入口。** 不增自动监听路由/DOM 的逻辑；保持原静态 matches；不改 Pipeline/reader。
- [ ] **Step 4: 确认 GREEN。** Run: `pnpm vitest run tests/unit/content-analysis-handler.test.ts tests/integration/approved-source-pipeline.test.ts`、`pnpm typecheck`；预期全绿。
- [ ] **Step 5: 检查并提交 Task 2。** 仅暂存本 Task 明列路径，核对 `git diff --cached --name-only`、`git diff --cached --check` 与 staged diff；不纳入既存未提交文档。通过后 commit `feat: trigger source pipeline from content script`。

### Task 3: Action popup 与中性降级

**Files:** Create `src/entrypoints/popup/index.html`、`main.tsx`、`App.tsx`、`request-analysis.ts`; Modify `tests/integration/manifest-permissions.test.ts`、`docs/architecture/permissions-plan.md`; Test `tests/unit/popup-analysis.test.tsx`.

**Interfaces:** `ActiveTabMessenger` 仅提供 `query({ active: true, currentWindow: true }): Promise<Array<{ id?: number }>>` 与 `sendMessage(tabId: number, request: AnalyzeInterestRequest): Promise<unknown>`；`requestAnalysis(messenger: ActiveTabMessenger): Promise<AnalyzeInterestResponse | { kind: 'connection-unavailable' }>`。生产适配器使用 `wxt/browser` 的基本 tabs API，只读 tab ID；Task 1 的响应解析器是唯一跨消息解码入口。UI 内部状态为 idle、sending、unsupported、connection-unavailable、completed/错误，不成为 `SourceStatus`。

- [ ] **Step 1: 写失败的传输/UI 测试。** 断言只查询当前活动 tab 和 ID；无 ID、消息拒绝/无效响应均显示中性恢复提示且无来源状态；动态成功显示状态、已确认数、warning code 与“尚未生成兴趣画像”；`unknown/unavailable` 与 execution-error 不显示“0 条/空”；空间根页提示打开动态视图；按钮发送期间禁用，重复点击不发第二条；DOM 中不出现 UID、昵称、简介、正文或原始 warning message。
- [ ] **Step 2: 确认 UI RED。** Run: `pnpm vitest run tests/unit/popup-analysis.test.tsx`；预期入口/函数不存在或断言失败。
- [ ] **Step 3: 写 Manifest 失败断言并确认 RED。** 扩充现有测试，要求 Chrome/Edge 的 `action.default_popup = 'popup.html'` 且继续保持所有权限负例。先生成无 popup 的旧 Chrome/Edge 生产构建，再运行 `pnpm vitest run tests/integration/manifest-permissions.test.ts`；预期只因新增 popup 断言失败，缺构建产物不算 RED。
- [ ] **Step 4: 实现 WXT popup 入口、请求封装和最小 React UI。** 仅在用户点击时调用 `requestAnalysis`；不读 tab URL/title，不请求权限或打开新页；连接失败提示检查动态页/站点访问并在授权后 reload，不断言权限为根因。
- [ ] **Step 5: 同步权限计划的一处旧表述。** 将“未注入时来源 unavailable”改为 popup 的 `connection-unavailable` UI 状态，注明真实安装尚待验证，不重写 Phase 0 审计。
- [ ] **Step 6: 确认 GREEN。** Run: `pnpm exec wxt build -b chrome --mv3`、`pnpm exec wxt build -b edge --mv3`、`pnpm vitest run tests/unit/popup-analysis.test.tsx tests/integration/manifest-permissions.test.ts`、`pnpm lint`、`pnpm typecheck`；核对两个生产 Manifest 的 popup、matches 与无权限字段。构建成功仅证明打包，不证明安装态。
- [ ] **Step 7: 检查并提交 Task 3。** 仅暂存本 Task 明列路径，核对 `git diff --cached --name-only`、`git diff --cached --check` 与 staged diff；保留其他既存改动。通过后 commit `feat: add explicit analysis popup`。

### Task 4: Chrome / Edge 真实安装态验收

**Files:** Create `docs/architecture/runtime-analysis-install-audit.md`; product code only if a real defect is reproduced and can be fixed within this approved Spec, then TDD/review it in owning Task.

**Interfaces:** 消费 Task 1–3 的生产扩展与 UI；产出脱敏、可审计的逐浏览器观察，不改来源 Contract/Gate。此 Task 是真实浏览器验收，不以 synthetic fixture 代替，也不把不可复现条件写成 PASS。

- [ ] **Step 1: 建立观察矩阵。** Chrome、Edge 各记安装包/构建标识与真实浏览器版本，分别列“允许”“未允许”“撤销后重新加载”；另列“选择扩展时允许”和“撤销后旧文档即时效果”为独立观察，不预设拒绝或即时失效。只用现有合格公开动态页，不记录身份/正文。
- [ ] **Step 2: 检查允许态。** 从各自生产 MV3 构建安装，在浏览器正常授予站点访问且页面重新加载后，点击 popup 一次。通过浏览器扩展上下文的只读运行期观察确认脚本注入、一次 Pipeline 调用、脱敏摘要、无点击前自动读取；记录可复现步骤与实际结果。
- [ ] **Step 3: 检查未允许态。** 仅在浏览器真实提供可核对、打开 popup 后仍持续未允许的站点访问状态时，重新加载同页，观察脚本未注入、零 Pipeline 调用、连接中性提示且无来源结果。不能只凭无结果推断零调用，不能把 Chrome“选择扩展时允许”当拒绝；无法稳定获得此状态则标 `BLOCKED_ENV / NOT_VERIFIED`，不改变设置或写脚本强行制造证明。
- [ ] **Step 4: 检查撤销后。** 若浏览器提供正常的用户可见撤销操作，分别记录旧文档即时观察，以及重新加载/重新打开同页后的实际注入与连接结果；不预设即时失效。无法稳定观察的即时撤销与重载后状态分别保留 `NOT_VERIFIED`，待浏览器提供可复现的撤销与观察路径时重验，不补造行为。
- [ ] **Step 5: 写审计结论。** 审计文档逐项区分 observed PASS、FAIL、BLOCKED_ENV、NOT_VERIFIED，真实与 synthetic 证据分栏。仅对持续未允许状态无法稳定复现的 `BLOCKED_ENV`、撤销后状态无法稳定观察的 `NOT_VERIFIED`（即时与重载后分列）接受残余风险；两者均不记 PASS。只有其余原有必需验收项均满足、没有未解决的 FAIL，Task 4 才可记为 `complete with residual risk`；其他未验证项不得自动纳入例外。保留历史证据，并在可受控复现相应权限状态或浏览器行为变化时重验。
- [ ] **Step 6: 验证并提交 Task 4。** 仅在证据充分、文档一致时暂存审计文档，核对 `git diff --cached --name-only`、`git diff --cached --check` 与 staged diff；通过后 commit `docs: record runtime installation evidence`。外部阻断则保留进度，不假称完成。

## Final verification、review 与执行边界

Task 1–3 的代码验收和 Task 4 的已允许安装态验收均满足、其余必需项无未解决 FAIL 后，调用 `superpowers:verification-before-completion`、`superpowers:requesting-code-review`；运行 `pnpm vitest run`、`pnpm lint`、`pnpm typecheck`、两个生产 MV3 build、Manifest 审计、`git diff --check`，核对真实安装审计、Spec/权限计划一致性和无额外权限/网络/敏感数据。仅 Task 4 Step 5 明列的两项可带残余风险收敛，不得记为 PASS 或涵盖其他未验证项。每 Task 的提交必须先有 fresh 验证、精确暂存路径及 staged diff 检查；既存未提交 AGENTS/旧 Spec/Plan 不属于本计划 Task，不能要求全工作区 clean。Fresh output 全绿且独立 review 的有效问题已处理后才可宣称本 Plan 完成；随后可进入 Phase 1 final review，但不得自行 merge main 或 release。push 依当前明确授权与远端状态判断，不从 Plan 文本自授。

**Execution handoff:** 用户已明确批准本 Plan 在现有 `codex/phase1-source-foundation` 隔离分支执行，正常 Task 切换不重复请求批准。Scope/权限/Source of Truth 变化、Step 5 例外以外的必要真实浏览器证据不可得、Git divergence 或无法在已批准范围内解决的失败时停止。Plan 文档保存或 push 本身不代表执行授权。
