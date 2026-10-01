# Phase 3 Data Collection v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Draft / Pending Approval（2026-10-01）。P3 正式 Spec 已获批准；本 Plan 尚未获批准，本轮只编写文档。保存、commit 或 push 不代表执行授权。

**Goal:** 增量接入 DOM-first 的受控采集层，完成 P3 预算、取消、来源隔离、校验、版本化 runtime 与兼容验收，不重写 P1 数据语义。

**Architecture:** Core 只调 normalized collection port、纯控制调度与计数预算；Source 私有 Adapter/operation executor 持有 DOM/raw，并在边界内校验、复用 P1 Normalizer、附质量数据。唯一新装配边绑定 `createBilibiliCollectionPort`，content handler 将一次用户请求接入一次受控 run，popup 只接收脱敏 v1 summary。

**Tech Stack:** 现有 TypeScript strict、Zod、Vitest/jsdom、WXT MV3、React、pnpm；不新增依赖、生产网络请求或权限。

**Spec:** [已批准 P3 Data Collection v1 Spec](../specs/2026-10-01-phase3-data-collection-v1-design.md)，含 §5 最新 admission 起算与 §12 timeout fixtures。权威背景：[Notion 制作流程](https://app.notion.com/p/3e81d223bf638178bfe9ecd4ea75190f)、[工程流程](https://app.notion.com/p/3e81d223bf638146b5eecae159ec60a7)、[项目 Idea](https://app.notion.com/p/3e81d223bf63810898c1f428ba5c8779)，本轮已通过 Connector 刷新；ADR 与历史边界以 Spec §1/§14 为准。

## Global Constraints

- 唯一执行位置：`C:/Users/MSI/.codex/worktrees/phase1-source-foundation/BiliInterestProfile`，`codex/phase1-source-foundation`。规划基线 `4eb1b2454088c22423d701ae93fe9c798c75f9a8`；实施 Preflight 重新记录实际 HEAD、审批与 diff，不重做 P1/P2。
- DOM-first / current-rendered-cards only；snapshot/page cap = 1，auto-pagination = 0。dynamic 是唯一行为 Evidence 来源，profile 只供身份/上下文。不滚动追卡、不 reload 采集、不新增 Source、B站请求、权限、后台采集、遥测或持久化设置。
- `Whole = 10,000 ms`，有效请求取得 run-lock 的 `t0` 起算，涵盖 prepare/dependency/queue/throttle/attempt/backoff/validation/normalization/identity recheck/summary/cleanup，不延长。各 `Source = 5,000 ms`，依赖满足并正式 scheduler admission 的 `t_A` 起算；此前 dependency wait 只消耗 Whole，之后所有工作均消耗 Source + Whole。
- 每 attempt `Operation ≤ 1,000 ms`，deadline 为 `min(attemptStart + 1,000, D_S, D_W)`；prepare/最终复核使用 `min(operationStart + 1,000, D_W)`，不启动 dynamic Source 时钟。retry 仅新建 operation lease，不重置父 deadline。`now >= deadline` 拒绝启动/结果；剩余正窗口可产生短于 1 秒 lease。
- concurrency = 1 个 operation；跨 Source 首次 read 实际 start 间隔至少 250 ms；retry 最多 2 次、总 attempts ≤ 3，backoff 250/500 ms。仅 typed `network_transient` 且 recoverable=true 可重试，且必须剩余 backoff + 完整 1 秒窗口；DOM production operation 只有一个 attempt。
- card scan cap = 200 个初始可见主卡 occurrence；rejected/duplicate 同占 scan slots。每文本字段 10,000 UTF-16 units（trim 前 JS string.length），全 run 提取 1,048,576 UTF-8 bytes；每 Source 10,000 node visits，每 100 visits 或一张卡完成即宏任务 yield。prepare 不 yield，但 visits 计 dynamic；时间仍只计 operation/Whole。cap 不因复核、坏项或重复而提高。
- 保持 P1/P2 `EvidenceItem`、`SourceResult`、`SourceStatus`、`SourceWarning`、两层 Result/RawSourceResult 与独立 AppWarning/SourceWarning。单快照空态仍 unknown/null；不得生产 empty/[] proof、稳定 EvidenceId、Store、Dexie、Analyzer、Scoring 或画像。
- 不从 DOM 文本猜 HTTP。403/429/unauthorized/network retry 只有 controlled 分类与调度证据，无 production transport。run-local dedupe/memo 不等于 P4：memo ≤ 201 条，只存同 run/同版本/不可变已校验输入的成功结果，unknown/失败/空态候选不命中；新点击重新采集。
- pagination NOT_VALIDATED、SPA UID switch PARTIAL；[Playwright debt](../../validation/2026-09-30-playwright-chromium-blocked-env.md) OPEN / BLOCKED_ENV / NOT_VERIFIED，P1 Task 6/8 与 Engineering Foundation Plan incomplete。环境首次合格恢复或 merge main 前（先到者）按既有规则补跑；不得关闭 sandbox、改 ACL、换品牌浏览器或降断言，本 Plan 不自行结清债务。
- 适用实现严格 RED → GREEN → REFACTOR；导入/收集错误、空测试集、环境故障不是有效 RED。新导出必要时先建可导入但断言不成立的签名空壳，直到目标行为断言失败才记录 RED。错误先 systematic-debugging，scope 内修复和 Task 切换不重复申请批准。
- 每个代码 Task 的 checkpoint 除目标 GREEN，还运行 lint/typecheck、当前源码 Chrome/Edge production build、完整 Vitest、适用格式/预算/边界检查与 `git diff --check`；Manifest tests 必须消费本轮构建。checkpoint 精确暂存本 Task 文件，fresh verification + review 无未解决 FAIL 后按 AGENTS fetch/无 divergence/commit/push/fetch/核对 HEAD。保留无关 dirty 文件，不空 commit，不 merge main/Release/P4。

## Review Focus

1. prepare 已完成但 profile 未确认，dynamic 偷开 Source 时钟或重新 snapshot：Task 3/6 用 admission 计数、deadline 与卡集合断言锁定。
2. timeout 后的旧 continuation 在新 run 写入 report/memo，或 Abort 与 deadline 竞态改写 stop reason：Task 2/6 覆盖 late resolve/reject、never-settle、清理与再次点击。
3. UID/作者文字只存在于隐藏/引用/重复节点，或身份在最终提交前变化：Task 4/5/6 拒绝误归属且不降级成可用旧数据。
4. empty/unknown、坏候选与 outer failure 被合并，或 quality/summary 让 null 变 0：Task 1/5/8 的联合 schema、状态矩阵和 parser 负例固定层级。
5. 新 popup 遇旧 content/歧义响应自动 fallback，或 factory 经 alias/re-export 泄漏：Task 7/8 覆盖 exact binding、no-resend 及单次 run。

## Preflight 与依赖

Plan 获批后，调用 using-superpowers、适用执行/TDD Skills，复用现有隔离 worktree，不再创建 worktree。读取最新 AGENTS、Notion、获批 Spec、Plan、审批记录与 `git status/diff/HEAD`；无 SDD repo ledger 时使用本 Plan checklist/会话 checkpoint，不新增另一账本。先 `pnpm install --frozen-lockfile`，核对实际 pnpm/Node 工具路径；重新 build 两浏览器后运行既有 full Vitest、lint/typecheck 作为基线，保存实际输出，不沿用历史 217/217。

任务依赖：`1 → 2 → 3`；`1/2/3 → 4 → 5`；`1/2/3/5 → 6 → 7 → 8 → 9 → 10`。正常验收后自动继续。BLOCKED_ENV 只阻断依赖项；调度其他独立 READY 工作，不放宽预算/身份/权限，不把未完成 Task 标 complete。新增产品/架构决策、Spec/SoT 冲突或真实无法解决 blocker 才停。

### Task 1: normalized collection contracts、strict schemas 与 fixtures

**Files:** Create `src/core/contracts/collection.ts`、`src/core/contracts/collection.schema.ts`、`src/core/contracts/collection-issues.ts`、`src/core/contracts/collection-issues.schema.ts`；Create `tests/fixtures/collection/contracts-v1.controlled.ts`、`tests/unit/collection-contract.test.ts`、`tests/unit/collection-issues.test.ts`、`tests/support/controlled-collection.ts`。

**Interfaces:** 沿用 P2 Result/AppError/AppWarning 与 P1 ProfileContext/EvidenceItem。定义 `SourceKey = 'context'|'dynamic'`、`ContextDelivery`、`EvidenceQuality`、`CollectedEvidence`、`DynamicDelivery`、`SourceOutcome<T>`、`PrepareOutcome`、`ControlledCollectionReport`、`CollectionPolicy` 与只含安全计数的 `SourceStats`；字段/互斥规则严格来自 Spec §4/§10，不另建平行数据层。

生产控制接口写在 `collection.ts`（不是消息 DTO，不序列化 signal/function）：

```ts
interface CollectionPort {
  prepare(lease: OperationLease): Promise<PrepareOutcome>
  readContext(lease: SourceLease): Promise<Result<SourceResult<ContextDelivery>, AppError>>
  readDynamic(
    context: ProfileContext,
    lease: SourceLease,
  ): Promise<Result<SourceResult<DynamicDelivery>, AppError>>
  verifyIdentity(
    expected: ProfileContext,
    checkDynamicContainer: boolean,
    lease: OperationLease,
  ): Promise<'confirmed' | 'missing' | 'mismatch'>
  dispose(): void
}
```

`RunLease = {signal:AbortSignal; clock:CollectionClock; wholeDeadline:number; isActive():boolean; budget:ResourceBudget; diagnostics:CollectionDiagnostics}`；`SourceLease` 扩展它，增加 `source:SourceKey`、`sourceDeadline:number`、`gate:CollectionScheduler`；`OperationLease` 扩展 RunLease，增加 `operationDeadline:number` 与可选 source/sourceDeadline（prepare/最终复核没有 Source deadline）。gate 仅 acquire/release 控制 permit，不接收 raw callback。`CollectionClock`、`ResourceBudget`、`CollectionDiagnostics`、`CollectionScheduler`、`OperationPhase`、`OperationPermit={lease:OperationLease;release():void}` 的声明均归 `src/core/contracts/collection.ts`，Task 2/3 实现，不让 contracts 反向导入实现。`OperationPhase` 为 Task 3 的五种 phase。typed port 与 lease 函数接口做结构测试；所有数据 DTO 做 strict Zod，函数/DOM 不进入 DTO schema。`frozenCollectionPolicy` 固定全局数值，无请求覆盖入口。

`CollectionDiagnostics` 是 run-local、仅规范化 code 的诊断通道：`recordApp(source:SourceKey|null,code:CollectionAppWarningCode)`、`recordSource(source:SourceKey,code:SourceWarning['code'])`、分层 `snapshot()` 与幂等 `clear()`。只接获批的八个 AppWarning / 三个 SourceWarning code 及 source，不接 raw、DOM、异常文本或 stack；message 由固定 safe message 表构造。Source/operation 写入须同时通过 active/deadline/settlement 检查；各 SourceLease/OperationLease 获得绑定自身状态的 writer façade（或等价 owner guard），不能只检查共享 run 是否活跃，也不能借后续 operation 补写。终止控制器仅可封存已确定的停止/同步 overrun 诊断，不延长业务 deadline。外层 failure 仍不新增 warnings 字段，port 仍只含上述五方法；Task 6 用该通道保留失败前诊断，不混合两层 warning。

- [ ] **RED tests：** `collection-contract.test.ts` 定义正反 cases：outer error 带 inner status 拒绝、两层 warnings 独立、PrepareOutcome ready/terminal unknown 合法而 terminal evidence/raw 非法、partial `{items:[]}` 拒绝、items 1/200 合法而 201 非法、quality 与 evidence 的 title/timestamp/trace 不一致拒绝。断言示例：`expect(dynamicDeliverySchema.safeParse({items: []}).success).toBe(false)`；未知字段和 DOM node 不能透传。
- [ ] **观察 RED：** `pnpm exec vitest run tests/unit/collection-contract.test.ts tests/unit/collection-issues.test.ts`，必须是上述行为断言失败；测试 support 提供 `createControlledPort(overrides: Partial<CollectionPort>)` 的 port/call-spy 与有效 normalized fixtures，默认不开真实 DOM/网络。
- [ ] **最小实现：** collection schemas 组合既有 `sourceResultSchema`、`resultSchema`、`evidenceItemSchema`、`profileContextSchema`，新增 production delivery refinement，不收紧 P1/P2 泛型 empty 结构 schema。issues schema 枚举 Spec §8 的全部 AppError 与八个 AppWarning code，SourceWarning 仍原三码；固定 safe message 不携原始异常。
- [ ] **GREEN/compatibility：** 重跑目标测试及 `tests/unit/source-contract.test.ts`、`result-contract.test.ts`、`raw-source-contract.test.ts`；确认泛型 empty fixture 仍合法而 collection production empty 不可用。按全局 checkpoint checks 读取真实 exit/count。
- [ ] **Checkpoint：** 精确暂存本 Task 的 contracts、fixtures、support/tests；logical commit `feat: define controlled collection contracts`，feature branch 自治同步；依赖 Task 仅在该验收后继续。

### Task 2: deadline leases、资源计数与错误/retry policy

**Files:** Create `src/core/collection/deadline.ts`、`src/core/collection/clock.ts`、`src/core/collection/resource-budget.ts`、`src/core/collection/diagnostics.ts`、`src/core/collection/error-policy.ts`；Create `tests/unit/collection-deadline.test.ts`、`tests/unit/collection-resource-budget.test.ts`、`tests/unit/collection-diagnostics.test.ts`、`tests/unit/collection-error-policy.test.ts`、`tests/support/controlled-clock.ts`、`tests/fixtures/collection/failures.controlled.ts`。

**Interfaces:** `createRunLease(t0: number, signal: AbortSignal, clock: CollectionClock): RunLease`；`admitSource(run: RunLease, source: SourceKey, gate:CollectionScheduler): SourceLease` 仅供 scheduler 依赖满足后调用；`createOperationLease(parent: RunLease|SourceLease): OperationLease`；`checkLease(lease:RunLease|SourceLease|OperationLease): AppError|null`、`disposeLease(lease:RunLease|SourceLease|OperationLease): void`。`CollectionClock = {now():number; sleep(ms:number,signal:AbortSignal):Promise<void>; yield(signal:AbortSignal):Promise<void>}`；`clock.ts` 导出 `createCollectionClock():CollectionClock`，使用单调时钟与宏任务 yield。test-only `createControlledClock(initialMs:number)` 另提供 `advance(ms):Promise<void>` 与 pending timer/listener 计数。`ResourceBudget` 的 `chargeNodeVisits(source:SourceKey,count:number)` / `chargeExtractedBytes(count:number)` 返回 accepted/exhausted；`recordCards(source:SourceKey,delta:Partial<Pick<SourceStats,'scanned'|'rejected'|'duplicate'|'admittedItems'>>,lease:OperationLease)` 只接实际纯计数、检查 lease 后更新，`snapshot()` 返回 Spec 安全计数，不接 DOM/text/raw。Source 私有 driver 负责字符/UTF-8 换算与 card 事件计数；admittedItems 仅在完整批次校验成功后增加。`diagnostics.ts` 实现安全分层 sink，先建私有 owner state/写入 guard，再创建 sink 与 RunLease，避免递归初始化；admission/start/attempt/elapsed 由对应控制 owner 记录，不由 summary 猜测。`classifyControlledFailure(input: unknown): Result<never,AppError>`；`retryDecision(error:AppError,recoverable:boolean,completedAttempts:number,remainingSourceMs:number,remainingWholeMs:number)` 返回 `{retry:true,backoffMs:250|500}` 或 `{retry:false}`。

- [ ] **RED tests：** fake clock 在 999/1,000、4,999/5,000、9,999/10,000 的恰等边界；prepare 不创建 Source deadline；t_A=4,000 时 D_S=9,000，t_A=5,800 时 D_S=10,800，但 9,500 的 operation 只剩 500 ms。示例 `expect(operation.operationDeadline).toBe(10000)`；retry 新 lease 不变 D_S/D_W、已 settlement cancel 不被后来 timeout 覆盖，同时到期 whole → Source → operation 优先。
- [ ] **观察 RED：** `pnpm exec vitest run tests/unit/collection-deadline.test.ts tests/unit/collection-resource-budget.test.ts tests/unit/collection-diagnostics.test.ts tests/unit/collection-error-policy.test.ts`。controlled failures 逐一证明 403/429/unauthorized/permanent/execution/schema/timeout/cancel 不重试，typed transient recoverable 才最多两次；预算不足 backoff + 1 秒拒绝 retry。sink 拒绝未知 code/raw text，failure 后历史两层诊断仍可读取；late/settled write 无更新，负数/非有限 counter 拒绝，未完成批次 admittedItems=0。
- [ ] **最小实现：** 只实现单调绝对 deadline、owned controller/timer/listener 清理与计数 charge；late result 必须由 active lease 拒收，不能只 Promise.race。resource charge 保留 rejected/duplicate 与复核计量，不静默增加上限。error-policy 不查看页面字符串、HTTP transport 或 credential；retry 退避固定 250/500，recoverable 值完全采用 Spec §8。
- [ ] **GREEN/compatibility：** 重跑目标测试与 `tests/unit/collection-issues.test.ts tests/unit/runtime-error-code.test.ts tests/unit/result-contract.test.ts`；负例确认 timeout 不产生 SourceResult、429 recoverable=true 仍不在本 run retry。按全局 checkpoint checks 验证。
- [ ] **Checkpoint：** 本 Task 的 Core 控制模块/clock support/测试与 failures fixture，commit `feat: add immutable collection deadline policies`；P1 runtime ErrorCode 不迁移。

### Task 3: admission scheduler、单 operation 并发与 throttle

**Files:** Create `src/core/collection/scheduler.ts`；Create `tests/unit/collection-scheduler.test.ts`。仅按需扩充 Task 1/2 已命名的控制类型和 support，不新增其他 Source binding。

**Interfaces:** `createCollectionScheduler(run: RunLease): CollectionScheduler`；`admit(source: SourceKey): SourceLease` 由 runner 在该来源依赖满足时调用且至多一次；`acquire(source: SourceLease, phase: 'read'|'validation'|'normalization'|'dedupe'|'quality'): Promise<OperationPermit>`；permit 提供实际 start 时创建的 OperationLease 与幂等 release；`dispose(): void`。gate 不接收泛型 work/raw 返回值；Source 私有 operation executor 持 permit 执行工作。profile/dynamic 的首次 read start 间隔用实际开始时间，而非 enqueue/admission 时间计算。

- [ ] **RED tests：** `profileDependencyUnresolved_neverAdmitsDynamic`、`prepare800_profileIdentity4000_dynamicDeadline9000`、`prepare900_identity5800_clipsToWhole10000`；dependency wait 期间没有 dynamic Source timer，Whole timer 持续。admission 后排队/throttle 消耗 Source，即便还没 attempt 也能 Source timeout；Whole 到期时 admission/read 均为零。两 simultaneous acquire 的活跃 permit 最大 1，跨 Source 首读 249 ms 不启动、250 ms 可启动。
- [ ] **观察 RED：** `pnpm exec vitest run tests/unit/collection-scheduler.test.ts`；断言示例 `expect(stats.dynamic.admitted).toBe(0)`、`expect(maxActivePermits).toBe(1)`、`expect(dynamicReadStart-profileReadStart).toBeGreaterThanOrEqual(250)`，不以 wall-clock 等待代替 fake-clock 证明。
- [ ] **最小实现：** 分离 dependency eligibility 与 admitted queue；queue/backoff/Abort 可终止并清理 waiters。queue 不开 operation 时钟，取得 permit 才开；admitted Source 时钟在 queue 中不停。Whole/source 到期不得给新 permit，不能用 throttle 重新起算 5 秒或 10 秒。本 Task 的 dependency 场景由 controlled caller 驱动资格/admission；Task 6 必须另证真实 runner 在依赖满足前不 admission，不能用 mock caller 代替生产接线证明。
- [ ] **GREEN/compatibility：** scheduler + deadline/error-policy tests，全局 checkpoint checks；pre-abort/排队取消/重复 release/清理后新 run 可再取 permit。不声称可强制杀死不合作异步工作或同步 DOM。
- [ ] **Checkpoint：** scheduler 及其精确依赖改动/测试，commit `feat: schedule sources after dependency admission`。

### Task 4: 有界 DOM driver、fixed snapshot 与 profile Adapter

**Files:** Create `src/sources/bilibili/dom/bounded-dom.ts`、`src/sources/bilibili/dom/fixed-snapshot.ts`、`src/sources/bilibili/dom/operation-executor.ts`、`src/sources/bilibili/profile/profile-adapter.ts`、`src/sources/bilibili/profile/profile-raw.schema.ts`；Create `tests/fixtures/collection/page.controlled.ts`、`tests/unit/bounded-dom.test.ts`、`tests/unit/fixed-snapshot.test.ts`、`tests/unit/profile-source-adapter.test.ts`、`tests/unit/source-operation-executor.test.ts`。仅确有共享需要时 Modify `src/sources/bilibili/profile/read-profile-context.ts`/`src/sources/bilibili/dynamics/read-dynamic-cards.ts` 抽出原有叶子判据，行为不得改变。

**Interfaces:** Source 私有 `prepareSnapshot(document:Document,url:URL,lease:OperationLease)` 固定初始容器/至多 200 个 card refs + occurrence tokens，不把它们导出 Core；`readBoundedVisibleText(element:Element,fieldPolicy:FieldPolicy,lease:OperationLease)` 返回已计量字段或明确 limit outcome。在上述 Source 文件定义私有 `FixedSnapshot`（document/route/container/card refs/tokens）、`FieldPolicy`（mandatory/optional/card-text 分类）、`ProfileReadInput={lease:SourceLease}`、`ProfileRawCandidate`（有界已读身份/简介字段、无 node/function）；`createProfileAdapter(document:Document,url:URL): SourceAdapter<ProfileRawCandidate,ProfileReadInput>`。`executeSourceOperation<T>(work:(lease:OperationLease)=>Promise<Result<T,AppError>>,source:SourceLease,phase:OperationPhase)` 的泛型 work 与 raw 仅在 Source 内，不属于 Core gate；`OperationPhase` 为 Task 3 acquire 的五种 phase，同 attempt 内产生的私有校验不另取嵌套 permit；每次实际 attempt 新 operation lease，finally release。

- [ ] **RED tests：** constructor/factory 不读 DOM；prepare 首 yield 前固定卡集合且不启动 dynamic Source timer；之后新增卡/重复处理不补位。0 卡 ready 不等于 empty；容器不唯一终止 dynamic 而 profile 独立。profile 缺/hidden/重复 UID/nickname、route mismatch 不可用；description 超限仅置 null，mandatory 10,001 units 不截断确认。driver 遇 hidden 子树跳过其 descendants，但可见性 ancestor/repeated node 计 visits；100 visits 或一张卡即宏任务 yield。
- [ ] **观察 RED：** `pnpm exec vitest run tests/unit/bounded-dom.test.ts tests/unit/fixed-snapshot.test.ts tests/unit/profile-source-adapter.test.ts tests/unit/source-operation-executor.test.ts`。fake Source operation 的 transient 控制重试、never-settle、late resolve/reject、timer/listener 清理、Abort 在 chunk/backoff 中生效；production DOM attempt=1。
- [ ] **最小实现：** 使用已获真实 DOM Contract 的 selector/层级和原 P1 身份规则，不整段调用同步 reader 冒充 chunked。不无界 querySelectorAll/textContent 再 slice；有界遍历/片段读取并逐步计量，原生 DOM/getComputedStyle 内部不可审计/不可抢占局限保留。prepare 计 dynamic visits、operation/Whole 时间；field trim 前 units、UTF-8 中文/跨片段 surrogate/未配对 surrogate/空白均计提取 bytes；Normalizer 复用字符串不重复计量。复核按对应 Source charge visits，不能免除 cap。字段/节点事件发生时只向 lease diagnostics 写获批安全 code，过期工作不得补写。controlled page 的 document.URL 与模拟 route 一致，支持最终读取当前 URL 的身份复核。
- [ ] **GREEN/compatibility：** 重跑目标及 `tests/unit/bilibili-page-readers.test.ts tests/unit/source-contract.test.ts`；页 fixture 明标 controlled，无真实身份/正文。200/201 卡、10,000/10,001 units、1 MiB、10,000 visits、有大量无文本节点与 Abort checkpoint 都有行为断言，不只结构检查。全局 checkpoint checks。
- [ ] **Checkpoint：** 本 Task Source 私有文件/tests/fixture 与有充分回归支持的叶子提取，commit `feat: add bounded DOM snapshot and profile adapter`；不改三-key registry。

### Task 5: dynamic Adapter、规范化 port、dedupe/memo/quality

**Files:** Create `src/sources/bilibili/dynamics/dynamic-adapter.ts`、`src/sources/bilibili/dynamics/dynamic-raw.schema.ts`、`src/sources/bilibili/collection-port.ts`、`src/sources/bilibili/run-memo.ts`、`src/sources/bilibili/occurrence-dedupe.ts`、`src/normalize/dynamic-delivery.ts`、`src/normalize/evidence-quality.ts`；Create `tests/unit/dynamic-source-adapter.test.ts`、`tests/unit/bilibili-collection-port.test.ts`、`tests/unit/collection-memo-dedupe.test.ts`、`tests/unit/evidence-quality.test.ts`。复用 `src/normalize/dynamic.ts`，不重写其算法。

**Interfaces:** 在 Source 文件定义私有 `DynamicReadInput={snapshot:FixedSnapshot;context:ProfileContext;lease:SourceLease}`，`createDynamicAdapter(): SourceAdapter<DynamicCardCandidate[],DynamicReadInput>`；唯一公开工厂 `createBilibiliCollectionPort(document:Document,url:URL):CollectionPort` 返回 Core 定义类型、构造时无 DOM/网络读取；五方法完全采用 Task 1 签名。Source 私有 schema 校验批次 candidate 后调用 `normalizeDynamicCandidate`；`normalizeDynamicDelivery(candidates:DynamicCardCandidate[],context:ProfileContext)` 产标准 delivery+独立 App/Source warnings，`describeEvidenceQuality(evidence:EvidenceItem,status:'partial'|'available'):EvidenceQuality` 产四字段 quality。run-memo/occurrence-dedupe 不导出到 Core。

- [ ] **RED tests：** 顶层作者必须匹配，引用作者不能代替；转发描述嵌入 reference 子树时拒绝，隐藏/placeholder/仅引用正文均不能接纳。单坏 candidate 添加 `candidate_schema_rejected` 与 `content_unusable`、其他项存活；invalid envelope/output/version 是 outer failure，不伪装 unavailable。0 合格项 unknown/null，partial items=[] 非法；单快照空态从不 empty。相同 occurrence 重复只输出一次，不同卡相同正文保留两条且都占 scan/text budgets。
- [ ] **观察 RED：** `pnpm exec vitest run tests/unit/dynamic-source-adapter.test.ts tests/unit/bilibili-collection-port.test.ts tests/unit/collection-memo-dedupe.test.ts tests/unit/evidence-quality.test.ts`。memo tests：同 run/版本/不可变已校验输入命中；变版本/new run/失败/unknown/empty candidate 不命中；DOM node/page URL 单独不是 key；201 条上限与 dispose 清空可观察。
- [ ] **最小实现：** 按固定 card set chunk 读取，每个字段/节点/批次前后检查 lease；完整 schema 阶梯及 cap 降级严格来自 Spec §4–§10。card mandatory/正文超限拒绝整卡，可选超限 null；cap 丢未完成批次、保留合格 partial，预算不足 identity recheck 时拒绝发布。Source 在 scan/reject/duplicate/完整合格批次事件上调用 recordCards，并即时记录安全 warning；不完整批次/late result 不增加 admittedItems，reject/duplicate 仍消耗 scan/text 预算且不补位。quality 与 evidence 联合 refinement，当前 timestamp=null/page trace 不因 dateLabel 或高 quality 升级；不生成 EvidenceId/加权分数。prepare terminal 与 final verify 所需 Source 私有 snapshot 保留；profile unknown 的 run 级 dependency preflight 属于 Task 6，不启动 dynamic job。
- [ ] **GREEN/compatibility：** 上述 tests + `tests/unit/normalize-dynamic.test.ts tests/unit/bilibili-page-readers.test.ts tests/integration/approved-source-pipeline.test.ts tests/golden/approved-source-output.test.ts`；保持原 P1 output，SourceWarning 三码、AppWarning 独立，factory/port 出口无 raw。核对 rejected/duplicate 计数、不补位、未完成批次 admittedItems=0 和 late 写入=0；全局 checkpoint checks。
- [ ] **Checkpoint：** 私有 Source/Normalizer 接合与测试，commit `feat: normalize bounded dynamic collection through private port`；原 Pipeline、registry keys 和 P1 public reader 签名不改变。

### Task 6: controlled runner、来源隔离与 final identity commit

**Files:** Create `src/core/collection/run-controlled-collection.ts`、`src/core/collection/report.ts`；Create `tests/unit/controlled-collection-runner.test.ts`、`tests/integration/controlled-collection-lifecycle.test.ts`。按需扩充既有 controlled port/clock support，不引入 DOM/raw 到 Core。

**Interfaces:** `runControlledCollection(port:CollectionPort,run:RunLease):Promise<ControlledCollectionReport>`；`finalizeCollectionReport(draft,stopReason,stats)` 在 `report.ts` 实现 Spec §4/§7 的互斥 outcomes、warning roll-up 与 runStatus 优先级。runner 不获取 run-lock、不另起 t0；它消费 Task 8 handler 创建的有效 RunLease。所有 Source timers、scheduler、port refs/memo/drafts 在 runner finally 释放；全局 RunLease/handler lock 在 Task 8 的 summary 完成或失败后 finally 释放，summary 同样受原 Whole deadline。

- [ ] **RED tests：** prepare-terminal unknown/failure 原样保留，不被 profile failure 重写；profile outer failure 时仅尚未终止的 dynamic 为 dependency_failed；profile inner unknown/unavailable → dynamic unknown/null 且 admission=0/read=0；profile description=null 仍可继续。独立 dynamic failure 不删除已确认 profile；Source outer failure 丢全部本来源数据，不能把此前 chunk 偷留为 partial。先产生 candidate_schema_rejected/content_unusable 再 Source timeout 时，数据全丢而诊断两层均保留。prepare/global Abort/Whole deadline/schema-invalid/report version 均保留正确层。
- [ ] **观察 RED：** `pnpm exec vitest run tests/unit/controlled-collection-runner.test.ts tests/integration/controlled-collection-lifecycle.test.ts`。additional assertions：late old run write=0、never-settle 返回且 owned timers/listeners/queue/memo/ref=0、新 run 可执行；两项 pending source draft 在 identity mismatch 时无可用数据，原已终止 error code 不改名。
- [ ] **最小实现：** run 的 admitted → preparing → running → verifying → terminal；prepare 用无 Source clock operation，profile admitted/read 后确认身份才 dynamic admission。Source job 返回先作为 draft，不 prematurely settle 成功；最终由 Source-owned port.verifyIdentity 读取当时 document.URL，再核对 expected route/可见 UID/nickname，不复用 factory 初始 URL 假装复核，Core runner 只调用规范化 port、不直接读 DOM。只有存在 dynamic data 才查初始动态容器；profile-only 成功不因动态容器缺失而拒绝。missing/mismatch 或复核超时/取消丢待发布数据，保留对应诊断 warnings；无成功 draft 不额外读 DOM。分层合并 Result warnings 与 diagnostics snapshot，在 finally clear 前复制安全 roll-up，不丢外层 failure 前的诊断。旧 continuation 无 active lease 不得写 report/memo/card counters/diagnostics。
- [ ] **GREEN/compatibility：** runner/lifecycle + Task 1–3 的 contracts/deadline/scheduler tests，`tests/integration/approved-source-pipeline.test.ts` 不变。复核使用新 operation/原 Whole，不被已结束 Source deadline 再阻断；deadline 恰等、同步 overrun、finally/settlement 幂等和 source/run error precedence 有断言。全局 checkpoint checks。
- [ ] **Checkpoint：** runner/report/测试/support，commit `feat: isolate controlled source lifecycle and identity publication`。run completed 不是来源全成功或 Plan 完成。

### Task 7: exact assembly binding 与 raw leakage guard

**Files:** Create `src/core/pipeline/collect-controlled-sources.ts`、`tests/integration/controlled-source-pipeline.test.ts`；Modify `tests/support/contract-imports.ts`、`tests/unit/contract-import-boundaries.test.ts`；Create `tests/fixtures/collection/assembly-leaks.controlled.txt`。

**Interfaces:** `collectControlledSources(document:Document,url:URL,run:RunLease):Promise<ControlledCollectionReport>` 只在装配文件以无 alias named import 引用 `createBilibiliCollectionPort`，交给 Task 6 runner。返回显式 Core report 类型，Source factory 不 re-export。原 `collectApprovedSources` 与三-key registry 原样保留；新协议与 production legacy 都不能自动绕回旧同步函数。AST guard 原接口 `findForbiddenRawImports(sourceText,ownerPath):string[]` 保留，仅增加这一条精确 binding。

- [ ] **RED tests：** exact `collect-controlled-sources.ts → collection-port/createBilibiliCollectionPort` 是唯一新正例；同文件增加 raw type、别的 binding、default/namespace/type-only import、alias、require/dynamic import、re-export、局部 alias/property/destructuring 后 export 均违规。旧 registry binding 正例仍合法；相同 factory 从别的 core/pipeline 或 entrypoint 导入非法，不扩大整个 pipeline 白名单。
- [ ] **观察 RED：** `pnpm exec vitest run tests/unit/contract-import-boundaries.test.ts tests/integration/controlled-source-pipeline.test.ts`。实际扫描所有 Source/Normalizer 所有者层外 TS 消费者，至少 core/entrypoints，存在 ui/analyzers/其他消费者也覆盖；不能仅字符串匹配 comment。
- [ ] **最小实现：** 装配 factory 传 Document/URL，但通用 runner 不接受 DOM/raw；保持两条 exact imports 和 local export taint guard。source API 类型推断不能漏 Adapter/raw/DOM 私有 token；controlled-source integration 跑实际 port+runner+normalized schema，不 mock 掉整个接合。新增程序集成 fixture 可复用 Task 4 的 controlled DOM。
- [ ] **GREEN/compatibility：** 目标 tests + `tests/integration/approved-source-pipeline.test.ts tests/unit/raw-source-contract.test.ts tests/unit/source-contract.test.ts`；扫描实际消费者违规数量必须 0，registry Object.keys 仍恰三项，P1 output 不变。全局 checkpoint checks。
- [ ] **Checkpoint：** 新装配文件/AST guard/精确测试，commit `feat: bind controlled collection through exact source boundary`。

### Task 8: runtime protocol v1、legacy compatibility 与 popup 接线

**Files:** Create `src/core/runtime/collection-message-v1.ts`、`src/core/runtime/collection-message-v1.schema.ts`、`src/core/runtime/create-controlled-analysis-handler.ts`；Modify `src/entrypoints/content.ts`、`src/entrypoints/popup/request-analysis.ts`、`src/entrypoints/popup/App.tsx`；Create `tests/unit/runtime-collection-v1.test.ts`、`tests/unit/controlled-analysis-handler.test.ts`、`tests/integration/runtime-controlled-collection.test.ts`；Modify `tests/unit/popup-analysis.test.tsx`；按需更新 `tests/unit/content-analysis-handler.test.ts` 的 production 接线断言，保留原 legacy handler/message 单元回归。

**Interfaces:** `AnalyzeInterestRequestV1={type:'analyze-interest';protocolVersion:1}`；`CollectionSummaryV1`/`AnalyzeInterestResponseV1` 逐字段采用 Spec §11；`summarizeControlledCollection(report):CollectionSummaryV1`、`parseCollectionResponseV1(input:unknown):AnalyzeInterestResponseV1|null`、`projectLegacyCollection(report):AnalyzeInterestResponse`。`ControlledSourceCollector=(document:Document,url:URL,run:RunLease)=>Promise<ControlledCollectionReport>`；`RuntimeLifecycle={subscribePagehide(cancel:()=>void):()=>void}` 是纯控制回调，返回幂等 unsubscribe。`createControlledAnalysisHandler(collect:ControlledSourceCollector,clock:CollectionClock,lifecycle:RuntimeLifecycle): (message:unknown,document:Document,url:URL,callerSignal?:AbortSignal)=>Promise<AnalyzeInterestResponseV1|AnalyzeInterestResponse|undefined>`。content 使用 Task 2 的 createCollectionClock，并注入 window pagehide 的 add/remove 回调；不把 window/DOM 传给通用 runner。popup ActiveTabMessenger 改为发送 v1 request，connection-unavailable 是 popup 本地状态，不伪造 collection。

- [ ] **RED tests：** unsupported/非法消息/未点击时 collect=0 且不查询 DOM；首次有效请求锁定 t0，busy 不建第二 run，legacy/new 请求共用同一 lock 与 controlled collector。请求无 policy/UID/URL；响应互斥、拒绝未知版本/字段/警告/重复 code、超200、status/count 矛盾、empty proof、raw message/stack。示例 `expect(collect).toHaveBeenCalledTimes(1)`；完成后才第二次主动请求，新 snapshot/memo/lease。
- [ ] **观察 RED：** `pnpm exec vitest run tests/unit/runtime-collection-v1.test.ts tests/unit/controlled-analysis-handler.test.ts tests/unit/popup-analysis.test.tsx tests/integration/runtime-controlled-collection.test.ts`。新 popup → 旧 strict content 无响应/歧义/timeout 测试须断言 sendMessage 恰 1 次，无 legacy fallback/自动重发；content→handler controlled pagehide 事件和 callerSignal 必须使 run.signal aborted、finally listener 数归零，下一有效请求取得全新非 aborted controller。
- [ ] **最小实现：** content 静态注入只注册 listener；有效路由请求取得 run-lock 立即创建 RunLease，assembly/prepare 无更晚 t0。handler 为每个有效 run 创建独立 AbortController，pagehide 与 callerSignal 驱动它；finally unsubscribe pagehide、移除 caller listener，不复用已取消 controller。runner 返回后 summary strict 校验仍检查原 Whole；超时不得发送可用计数，finally 才清 run-lock/RunLease。summary 不传 UID/nickname/text/raw/token/stack；Source/App code 两数组独立、首次顺序去重。popup 对 unknown/null/失败/not-started 中性降级，明确“尚未生成兴趣画像”，不猜拒绝原因，不新增 cancel UI/权限。popup 关闭不重发/续跑新 run。
- [ ] **Legacy/GREEN：** 新 content 对一字段 legacy 请求调用同一受控 runner 一次，完整可表达时只返回原四字段 summary；outer failure/not-started/AppWarning/global身份拒绝或新终止语义返回 legacy execution-error。原 legacy request parser、summary/结构 fixtures 与 `createAnalysisHandler` 的显式兼容测试保留，但生产 content 不再接旧无预算 collector。跑目标及 `tests/unit/runtime-analysis-message.test.ts tests/unit/content-analysis-handler.test.ts tests/unit/runtime-error-code.test.ts tests/unit/entrypoints-idle.test.ts`；全局 checkpoint checks。
- [ ] **Checkpoint：** v1 protocol、handler、content/popup 与适用 tests，commit `feat: connect versioned runtime to controlled collection`。summary 不等于 InterestProfile，无后台自动采集。

### Task 9: 端到端兼容矩阵、文档同步与确定性 full verification

**Files:** Create `tests/integration/p3-compatibility.test.ts`、`tests/golden/controlled-source-output.test.ts`、`tests/golden/controlled-source-output.json`；Modify `ARCHITECTURE.md`、`README.md`、`docs/issues/001-foundation.md`、`docs/architecture/runtime-analysis-install-audit.md` 的当前能力/新协议摘要；本 Plan 仅记录真实执行 checkpoint，不改历史 Phase 0 Gate/fixture。

**Interfaces:** 使用实际生产 port/assembly/runner/v1 summary，不另造 runner；新增 golden 是明确 controlled、人工审阅的小型安全投影，不覆盖旧 `approved-source-output.json`，不自动用现有实现输出刷新 expected。文档分别标明 P2 已完成、P3 当前获批 scope/实际进度与 P1 未结清债务；只有 Task 10 验收通过后才能写 P3 Plan complete。

- [ ] **RED tests：** complete valid current-card case、empty candidate、missing UID、reference-only、坏项+好项、cap partial、final身份变化、Source outer failure 独立保留、App/Source warnings 两层、v1/legacy 的可表达/不可表达矩阵。测试 expected 手工按 Spec 写；unavailable/unknown 不映成 empty，quality 不生成 interest 分数；关闭普通 fetch/storage spies 确认 DOM 路径不新增网络/持久化。
- [ ] **观察 RED：** `pnpm exec vitest run tests/integration/p3-compatibility.test.ts tests/golden/controlled-source-output.test.ts`，先看到目标断言失败，不把新增 golden 缺文件或 schema import error 记 RED。现有 output 合法则用新的缺失关键边界断言形成 RED，不为制造 RED 故意破坏 P1。
- [ ] **最小实现/同步：** 只修本 scope 的组合缺陷与测试接合；以文档当前态补充用户已批准 P3 的事实，不删除 P2 曾未授权 P3 的历史、ADR-007、pagination/SPA、unknown proof 与 P1 Playwright 未通过记录。安装态审计把 P3 新 build 验收另列待观察，不复用旧 runtime observation 冒充新 runner 验证。不自动提高 bundle-budget.json。
- [ ] **GREEN/full verification：** 按下方 Fresh Final Verification 从空生成目录跑所有可执行检查，读取本轮实际 count/exit/output；P1 old reader/Normalizer/registry/Pipeline golden，P2 Result/raw/schema contracts，raw guard 与 Manifest 都必须 PASS。普通 code FAIL 不能转环境债务。
- [ ] **Checkpoint：** compatibility/golden 和上述必要文档，commit `test: verify P3 compatibility and document controlled runtime`。此 checkpoint 只完成确定性验收，不宣称真实安装态或 P1 smoke 已通过。

### Task 10: Chrome/Edge 真实安装态、独立总 review 与最终验收

**Files:** Create `docs/validation/2026-10-01-p3-controlled-collection-install-audit.md`；Modify `docs/architecture/runtime-analysis-install-audit.md`、本 Plan 执行记录；若总 review 揭示已批准范围内缺陷，只修改对应 Task 的精确 owner/test 文件，不擅改 Spec。

**Interfaces/证据边界：** 当前 production build fingerprint/commit 对应 Chrome 和 Edge 各一份真实安装态记录。只记录浏览器/build 标识、观测时间、是否已允许访问、run/summary 调用计数和脱敏 summary codes/status/count；不记录实际 UID/昵称/正文、私有状态、credential 或 profile。真实 DOM 观察仅验证既有 Contract 与新接合，不新增分页/SPA/HTTP Spike。

- [ ] **Step 1：** 在已加载本轮 production unpacked 包、现有站点访问已允许、刷新用户已打开的正常公开动态页上逐浏览器观察。优先用受支持工具/只读 DevTools 的真实 bundle 调用位置，不让用户猜压缩变量；工具无法完成真人授权时才请求最小人工操作。源码/bundle对应关系需要可定位，不能用 synthetic 计数代替。
- [ ] **Step 2：** 明确记录点击前新 runner=0；清 Console 后一次点击 runner=1、summary=1；popup 与 strict 脱敏 summary 一致、UI 不崩溃。unknown/null 是合法降级，不算兴趣证据采集成功；不得用第二次误点击的结果替代单次验收。保留实际来源失败/警告，不为了“成功”放宽身份规则。
- [ ] **Step 3：** 既有持续未允许 BLOCKED_ENV、撤销后即时/重载 NOT_VERIFIED 保留，不重复强行制造；新的安装态 FAIL/新 DOM 不可得单独记录，不套旧债务例外。未取得 Spec 要求的双浏览器已允许路径证据时，本 Task/本 Plan 不完整，继续独立 READY review/验证再报告唯一真正 blocker。
- [ ] **Step 4：** 调用 requesting-code-review 做一次独立总 review，范围从实施 Preflight HEAD 至当前 HEAD + 未提交差异，对照获批 Spec/Plan。验证每项 Critical/Important 与 ordinary scope 内意见，成立则 systematic-debugging → TDD → 修复 → fresh 相关/完整验证；如 runtime/build 变化影响安装态证据，补受影响验收，不用旧 build 计数冒充。Source/权限/预算或产品决策实质变化须停下，不变更审批门槛。
- [ ] **Step 5：** 独立 review 无剩余成立的 Critical/Important、Task 1–9 与真实安装态必须项满足后，再跑 Fresh Final Verification；逐项记录新 count/exit、债务状态、实际 Task 完成范围。精确暂存 audit/执行记录及已验证 fixes，logical commit `docs: record P3 controlled collection acceptance`，按 Git 规则同步 feature HEAD；不自动申请/进入 P4，不 merge main/Release。只有旧具名 P1 debt 继续未验证不能被写成整个项目 full verification PASS。

## Fresh Final Verification

以下是 Plan 获批后必须执行的验收，不是本轮已执行结果。确认 `.output`、`.wxt` 的解析绝对路径恰在当前 worktree 中、仅为可重建产物，再以同一 PowerShell 安全清理；不删 node_modules/源码/用户文件。不拿旧 Manifest/产物制造 PASS。

1. `pnpm install --frozen-lockfile`；记录退出码与实际工具版本，不修改 lockfile 获取绿灯。
2. `pnpm lint`；`pnpm format:check -- <implementation-preflight-HEAD>`（以记录的实际 SHA 替换）；另对本轮未提交源码/测试及文档直接运行现有 Prettier check，避免 PR-base check 漏掉未提交文件。
3. `pnpm typecheck`；`pnpm test:unit`；`pnpm test:golden`。
4. 清空生成目录后 `pnpm exec wxt build -b chrome --mv3`；`pnpm exec wxt build -b edge --mv3`。两份 production build 必须 exit 0，再运行依赖其产物的检查。
5. `pnpm test:integration`；`pnpm bundle:check`（保留既有冻结预算，超限按真实失败处理，不自动重算）。
6. `pnpm test`；再定向 `pnpm exec vitest run tests/unit/contract-import-boundaries.test.ts tests/unit/source-contract.test.ts tests/unit/result-contract.test.ts tests/unit/raw-source-contract.test.ts tests/unit/bilibili-page-readers.test.ts tests/unit/normalize-dynamic.test.ts tests/integration/approved-source-pipeline.test.ts tests/integration/manifest-permissions.test.ts tests/integration/p3-compatibility.test.ts`。P3 controlled 目标 tests 由 full Vitest 发现，不使用空测试过滤。
7. 对本轮 Chrome/Edge Manifest 审计 MV3、无新增 permissions/host_permissions、匹配 `https://space.bilibili.com/*`、version 与 package.json 一致、background/options 无副作用；检查协议 DTO 脱敏/AST raw guard、安全数据、无 conflict marker 和文档链接/状态一致。
8. `git diff --check <implementation-preflight-HEAD>..HEAD`、`git diff --check`、`git diff --cached --check`；阅读精确 staged diff，独立 review 结果及 Task 10 实际 build/install 证据。
9. 对 [P1 具名 debt](../specs/2026-09-29-environment-blocked-validation-rule.md) 明示 OPEN / BLOCKED_ENV / NOT_VERIFIED，P1 Task 6/8/Engineering Plan incomplete；已知主机未恢复不反复启动 Chromium。若首次合格机会出现，按原规则补跑 bundled smoke，断言失败是真实 FAIL，不泛化例外。
10. 每项保存真实 exit code、test count/failure count、build/预算结果，不沿用历史 217/217。P3 必需可执行验证和真实安装态未满足则不标 P3 Plan complete；P3 完成也不宣称 P1 smoke/DoD 或整个项目已全量验证通过。

## Spec coverage、自检与停止边界

| Spec                                         | owning Task / acceptance                        |
| -------------------------------------------- | ----------------------------------------------- |
| §1–3 权威、范围、模块/精确边                 | Global Constraints、Preflight、7、9             |
| §4 两层合同/schema/normalized port/outcomes  | 1、4、5、6                                      |
| §5 admission/三层预算与计量/caps             | 2、3、4、5、6                                   |
| §6 snapshot/chunk/Abort/late result/同步限制 | 2、4、5、6                                      |
| §7 生命周期/final identity/隔离/清理         | 3、6、8                                         |
| §8 error/retry/warnings                      | 1、2、4、6、8                                   |
| §9 dedupe/memo                               | 5；6 的 finally/new run tests                   |
| §10 quality                                  | 1、5；9 的无兴趣评分断言                        |
| §11 v1/legacy/no-resend                      | 8、9、10                                        |
| §12 controlled fixtures/全量验收             | 各 Task tests + 9/10 + Fresh Final Verification |
| §13 双浏览器真实安装态                       | 10；synthetic/controlled 不代替                 |
| §14 文档/历史/债务与后续 Gate                | 9、10；不改 Phase 0 状态/P1 debt，不自动 P4     |

本 Plan 的文件/签名是拟审批的实施拆分，不声称新增模块已存在。所有 Source 私有 raw/DOM 类型留 owner 层；Core 只接规范化 DTO/纯控制计数。新 fixture/golden 明标 controlled，真实观测单独归档。无 proof、未知身份、资源不足或环境不可用时如实保留失败/未验证；禁止靠提高预算、权限或放宽身份解决测试。新 scope/产品/架构/安全决策或 SoT 冲突停下；普通 debug/review fixes 依 AGENTS 自治，不新增 Agent Gate。

回滚仅在另行授权时执行普通非历史改写的 revert：runtime 接线与 exact binding/对应 tests 一起回退到已有 P1 路径，不关闭 identity/unknown-null 规则；不删除历史 audit/债务，不 force push/reset hard。正式执行须先获用户对本单份 Plan 的明确批准。
