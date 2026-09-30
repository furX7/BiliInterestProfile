# Phase 2 Contract First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Approved / Complete（2026-09-30，限 P2 Contract First Task 1–7）。用户已批准在当前 feature branch 连续实施 Task 1–7；文档保存或推送本身不代表审批，也不授权进入 P3、merge main 或 Release。

**Goal:** 在不改写 P1 采集链路的前提下，为 P2 定义完整的分层 TypeScript / Zod 合同、版本化合成 fixtures、正反 contract tests、raw 隔离检查及必要阶段文档同步。

**Architecture:** 保留 `SourceResult` 等 P1 合同和现有 Pipeline；新分析侧合同放在 Core，`RawSourceResult` / `SourceAdapter` 只放在 Source → Normalizer 边界。外层 `Result` 表示调用/合同成败，内层 `RawSourceResult.status` 表示来源数据状态；P2 只固定和验证这两层，不决定 P3 异常归属。

**Tech Stack:** 现有 TypeScript strict、Zod 4、Vitest、pnpm、WXT/MV3；无新增依赖、网络请求或浏览器权限。

**Spec:** [已批准 Phase 2 Contract First Spec](../specs/2026-09-30-phase2-contract-first-design.md)。权威背景：[Notion 详细制作流程](https://app.notion.com/p/3e81d223bf638178bfe9ecd4ea75190f)、[工程流程优化](https://app.notion.com/p/3e81d223bf638146b5eecae159ec60a7)。

## Global Constraints

- v0.1 行为来源仍只有公开动态当前渲染卡片；基础资料仅为身份/上下文。P1 `EvidenceItem`、`SourceResult`、`SourceWarning`、`SourceStatus`、reader、Normalizer、registry 与 Pipeline 的字段和 `unknown/null` 行为保持兼容；`empty/[]` 结构定义保留，但不得从单次空态候选制造 proof。
- `EvidenceId` 只定义不透明引用合同；不实现稳定 ID producer、去重、持久化、跨会话稳定性，`sourceUrl`/UID/数组下标/DOM 位置不得冒充 ID。未有受控 producer 时，不把 P1 Evidence 送入真实 Analyzer。
- Raw 只在 Source → Normalizer 接合边界；新增分析侧 Core contracts、Analyzer、UI 不得导入 raw/B站结构。现有 `src/core/pipeline/collect-approved-sources.ts` 是合法 P1 装配层，不因本计划重写或被静态规则误禁。
- 新 `Result<T,E>` 与 P1 `SourceResult<T>` / runtime `ErrorCode` 并存；不替 P3 决定 timeout、403、429、unauthorized、retry、network failure 归哪一层，也不实现该异常矩阵。
- 只定义合同、schema、合成 fixtures、contract tests 与必要文档；不实现真实 SourceAdapter、Analyzer、scoring、taxonomy、trend、画像 producer、Evidence Store、Dexie migration、Feature Flag、额外 Source 或权限。
- P1 Playwright bundled Chromium smoke 仍 `BLOCKED_ENV / NOT_VERIFIED`、Task 6/8 和 Engineering Foundation Plan 仍 incomplete；P1→P2 的获批阶段推进不等于 P1 全面通过。本 Plan 不结清该债务，不 merge main、不 Release、不改 Phase 0 Gate。
- 每个代码 Task 先写失败测试、观察 RED、最小实现、观察 GREEN，再按影响面 fresh verification；异常先 systematic-debugging。Task 验收过后可按 `AGENTS.md` 在当前 feature branch 精确暂存、logical commit/push，但不得把 Plan 文本当成执行批准。
- **有效 RED 必须是目标行为断言失败，不是测试收集/模块导入错误。** 新文件先写测试；若首次运行因导出缺失而无法收集，只建立可导入、尚不满足断言的最小签名空壳并重跑，直到观察到预期断言失败，才记录 RED。不得把环境故障、拼写错误或空测试集充作 TDD 证据。
- 各 Task 的 Step 4 目标测试只证明局部 GREEN；进入 Step 5 checkpoint 前，还须以当前源码重新构建 Chrome/Edge production 包，并运行完整 `pnpm test`，读取实际 exit code、测试数和失败数。既有 Manifest 集成测试依赖构建产物，故必须先 build 再跑完整 Vitest；任一失败不标 Task complete。最终再做一次全计划 fresh verification。

## Review Focus

1. 直接把页面 URL、UID、数组下标或 DOM 选择器当 `EvidenceId`：Task 2 的负例必须拒绝直接值；测试注明语法校验不能证明真实来源稳定性。
2. 外层成功但内层 `unknown/null` 与外层失败被合并：Task 3 分别固定两种可解析结构，并拒绝混合字段；不为未来网络错误选层。
3. 重复、悬空或跨用户 Evidence 引用：Task 2 验证集合唯一性，Task 4 的组合校验同时看输入、上下文和 `AnalyzerResult`。
4. raw 经 Core 或 UI 导入泄漏：Task 7 的静态检查覆盖 Core 与 UI，并精确允许 P1 Pipeline 现有装配导入。
5. P1 单次空态候选误成 `empty/[]`：实施前及最终运行既有 source、Pipeline、golden 回归；Task 3 只验证 `empty` 结构，不声称 Zod 可验证跨时 proof。

---

## Preflight 与文件结构

实施前重新读取获批 Spec、用户最新两层语义决定、`AGENTS.md`、分支状态与未提交 diff；确认当前 `codex/phase1-source-foundation` 的批准范围，记录实施基线 HEAD。先执行 `pnpm install --frozen-lockfile`，再运行 `pnpm exec vitest run tests/unit/source-contract.test.ts tests/integration/approved-source-pipeline.test.ts tests/golden/approved-source-output.test.ts` 并保存本轮结果；若既有 P1 回归已失败，先按 systematic-debugging 查根因，不把其失败归咎于新合同。此 Preflight 不修改产品代码，也不将历史 Playwright BLOCKED_ENV 记 PASS。

| 文件 | 职责 |
| --- | --- |
| `src/core/contracts/app-issue.ts`、`app-issue.schema.ts`（新） | `AppError` / `AppWarning` 的最小公共字段及严格 schema。 |
| `src/core/contracts/result.ts`、`result.schema.ts`（新） | 互斥 `Result<T,E>` 与泛型 schema factory。 |
| `src/core/contracts/analysis-evidence.ts`、`analysis-evidence.schema.ts`（新） | 名义 `EvidenceId`、`IdentifiedEvidenceItem` 与集合唯一性；不生产真实 ID。 |
| `src/sources/contracts/raw-source.ts`、`raw-source.schema.ts`（新） | `RawSourceResult`、`SourceAdapter` 类型；来源边界 metadata / raw / read 结果的校验。 |
| `src/core/contracts/analyzer.ts`、`analyzer.schema.ts`（新） | `AnalysisContext`、`InterestSignal`、`Analyzer`、`AnalyzerResult`、组合上下文校验。 |
| `src/core/contracts/profile.ts`、`profile.schema.ts`（新） | `InterestNode` / `InterestProfile`；无画像 producer。 |
| `src/core/contracts/persistence-envelope.ts`、`persistence-envelope.schema.ts`（新） | 未来记录 envelope 的字段语义与 schema；无数据库。 |
| `tests/fixtures/contracts/*-v1.synthetic.ts`（新） | 各新合同的显式合成正例；负例从正例局部变异，不冒充网页或实际分析。 |
| `tests/unit/{result,evidence-identity,raw-source,analyzer,profile,persistence-envelope}-contract.test.ts`（新） | 每组合同的 Zod 正反例、接口编译和上下文不变量。 |
| `tests/support/contract-imports.ts`、`tests/unit/contract-import-boundaries.test.ts`、`tests/fixtures/contracts/raw-leak.synthetic.txt`（新） | TS import/re-export 静态边界检查及正反样本。 |
| `ARCHITECTURE.md`、`README.md`、`docs/issues/001-foundation.md`、`docs/architecture/requirements-freeze.md`（最小同步） | 更新当前 P2 阶段与 P2 不含 Dexie/migration 的摘要；历史 P0 风险/P1 债务保留。 |

既有 `src/core/contracts/source.ts`、`source.schema.ts`、`src/core/pipeline/collect-approved-sources.ts`、`src/sources/bilibili/registry.ts` 和 Phase 0 fixtures 不在改动清单。只有确证获批 Spec 无法在并存方案下实现时才暂停请求范围决策，不能为方便重构 P1。

### Task 1: 通用 Result 与最小 App issue 合同

**Files:** Create `src/core/contracts/app-issue.ts`、`app-issue.schema.ts`、`result.ts`、`result.schema.ts`、`tests/fixtures/contracts/result-v1.synthetic.ts`、`tests/unit/result-contract.test.ts`。

**Interfaces:** `AppError` / `AppWarning = { code: string; message: string }`；`Result<T,E> = { ok: true; data: T; warnings: AppWarning[] } | { ok: false; error: E; recoverable: boolean }`。导出 `appErrorSchema`、`appWarningSchema` 与 `resultSchema<T extends z.ZodType, E extends z.ZodType>(dataSchema: T, errorSchema: E)`；严格拒绝多余字段。`code` 采用非空小写机器码（字母开头，后续字母/数字/下划线），`message` 非空；不定义 P3 码表。

- [x] **Step 1: 写 RED 合同测试与合成 fixture。** `result-v1.synthetic.ts` 只含假数据和两个分支。测试至少断言：

  ```ts
  expect(resultSchema(z.number(), appErrorSchema).safeParse(success).success).toBe(true)
  expect(resultSchema(z.number(), appErrorSchema).safeParse(failure).success).toBe(true)
  expect(resultSchema(z.number(), appErrorSchema).safeParse({ ...success, error: failure.error }).success).toBe(false)
  expect(resultSchema(z.number(), appErrorSchema).safeParse({ ok: false, error: failure.error }).success).toBe(false)
  ```

  另测成功缺 `warnings`、失败带 `data` 或成功专属 `warnings`、空/非法 issue code 或 message 均失败；P1 `SourceResult` 与 runtime `ErrorCode` 不被改名或映射。
- [x] **Step 2: 观察 RED。** Run: `pnpm exec vitest run tests/unit/result-contract.test.ts`；按全局有效 RED 规则处理导入错误，最终须看到合法成功/失败分支的行为断言失败。
- [x] **Step 3: 实现最小类型与 schema。** 用 `ok` discriminant 和两个 strict 分支，schema factory 分别解析泛型数据与错误；不实现来源适配或运行时错误转换。
- [x] **Step 4: 观察 GREEN 并验证。** Run: `pnpm exec vitest run tests/unit/result-contract.test.ts tests/unit/source-contract.test.ts`、`pnpm typecheck`、`pnpm lint`、`git diff --check`；逐项检查 exit code 与测试数。
- [x] **Step 5: Task checkpoint。** 仅本 Task 路径精确暂存，核对 staged name/diff/check，无无关文件或未验证改动后 logical commit；feature-branch push/fetch 仅按当前 `AGENTS.md` 与远端无 divergence 条件执行。

### Task 2: EvidenceId 与分析侧 Evidence 形状

**Files:** Create `src/core/contracts/analysis-evidence.ts`、`analysis-evidence.schema.ts`、`tests/fixtures/contracts/evidence-v1.synthetic.ts`、`tests/unit/evidence-identity-contract.test.ts`。

**Interfaces:** `EvidenceId` 是由 `evidenceIdSchema` 推导的名义字符串；`IdentifiedEvidenceItem = EvidenceItem & { evidenceId: EvidenceId }`，schema 扩展而不修改 P1 `evidenceItemSchema`。采用 `ev_` 命名空间加非空字母/数字/下划线/连字符作为语法防线，拒绝直接 URL、纯 UID/索引和明显 DOM 位置；这不是 ID 生成算法或稳定性证明。导出 `identifiedEvidenceListSchema`，只检查同一输入集合的 ID 唯一性；同用户与引用闭包交给 Task 4 组合校验。

- [x] **Step 1: 写 RED 正反测试与合成 fixture。** fixture 中用 `ev_synthetic_1` 加现有动态 Evidence 字段，注明不来自真实网页、无真实 producer。测试至少断言：

  ```ts
  expect(evidenceIdSchema.safeParse('ev_synthetic_1').success).toBe(true)
  expect(evidenceIdSchema.safeParse('https://space.bilibili.com/123/dynamic').success).toBe(false)
  expect(evidenceIdSchema.safeParse('123').success).toBe(false)
  expect(identifiedEvidenceListSchema.safeParse([item, item]).success).toBe(false)
  ```

  另测空 ID、`0`、CSS/DOM 位置、额外 raw 字段失败；现有 P1 `evidenceItemSchema` 仍接受无 evidenceId 的原结构，不能自动补 ID。类型检查须拒绝把普通 URL 字符串直接赋给 `EvidenceId`。
- [x] **Step 2: 观察 RED。** Run: `pnpm exec vitest run tests/unit/evidence-identity-contract.test.ts`；修复收集错误后须看到 ID 合法性或重复集合断言失败。
- [x] **Step 3: 最小实现。** Zod 字符串品牌与严格扩展；集合 schema 只拒绝重复 ID，不生成、去重或存储 ID。
- [x] **Step 4: 观察 GREEN 并验证。** Run: `pnpm exec vitest run tests/unit/evidence-identity-contract.test.ts tests/unit/source-contract.test.ts`、`pnpm typecheck`、`pnpm lint`、`git diff --check`。明确报告语法/集合校验已测、真实稳定身份未验证。
- [x] **Step 5: Task checkpoint。** 精确暂存本 Task 路径并核对 staged diff；满足 fresh verification 与 Git 条件才 logical commit / feature-branch push。

### Task 3: Source 边界 RawSourceResult / SourceAdapter 与两层语义

**Files:** Create `src/sources/contracts/raw-source.ts`、`raw-source.schema.ts`、`tests/fixtures/contracts/raw-source-v1.synthetic.ts`、`tests/unit/raw-source-contract.test.ts`。

**Interfaces:** `RawSourceResult<TRaw> = { sourceId: string; status: SourceStatus; data: TRaw | null; warnings: SourceWarning[] }`；`SourceAdapter<TRaw,TInput> = { sourceId: string; apiVersion: 1; read(input: TInput): Promise<Result<RawSourceResult<TRaw>, AppError>> }`。`rawSourceResultSchema(rawSchema)` 校验状态/数据结构、来源私有 raw schema 与 P1 warning schema；`sourceAdapterDescriptorSchema` 只验证 metadata/`read` 为函数，签名由 TypeScript 和合成 stub 保证，返回值由 `resultSchema(rawSourceResultSchema(...), appErrorSchema)` 校验。不创建真实 B站 raw schema 或 Adapter。

- [x] **Step 1: 写 RED 正反测试与合成 fixture。** fixture 用虚构 `{ token: 'synthetic' }` raw payload，不包含真实 B站字段。测试至少断言：

  ```ts
  expect(outerSchema.safeParse({ ok: true, data: { sourceId: 'dynamic', status: 'unknown', data: null, warnings: [] }, warnings: [] }).success).toBe(true)
  expect(outerSchema.safeParse({ ok: true, data: { sourceId: 'dynamic', status: 'partial', data: [raw], warnings: [] }, warnings: [] }).success).toBe(true)
  expect(outerSchema.safeParse({ ok: false, error: appError, recoverable: true }).success).toBe(true)
  expect(outerSchema.safeParse({ ok: true, data: { sourceId: 'dynamic', status: 'unknown', data: [raw], warnings: [] }, warnings: [] }).success).toBe(false)
  ```

  另测外层失败携内层 data、外层成功缺 warnings、内层 `partial` raw schema 失败、`available` 携合法 raw 可通过而 `available/partial` 携 null 被拒、`empty` 只接受匹配空集合、metadata 缺 `apiVersion` / read 非函数；`SourceAdapter` 合成 stub 的 `read` 类型和返回 schema 可通过。不得将内层 unknown 改外层 error，或外层 error 改内层 unavailable；不测试 403/429 等未来归属。
- [x] **Step 2: 观察 RED。** Run: `pnpm exec vitest run tests/unit/raw-source-contract.test.ts`；修复收集错误后须看到两层结果或 raw 状态断言失败。
- [x] **Step 3: 实现边界类型与 schema factory。** 只复用 P1 `SourceStatus` / `SourceWarning` 类型与 warning schema；Source/Normalizer 之外不导出 raw。`empty/[]` 仅为结构合法，跨时 proof 须由未来受控 producer 证明。
- [x] **Step 4: 观察 GREEN 并验证。** Run: `pnpm exec vitest run tests/unit/raw-source-contract.test.ts tests/unit/source-contract.test.ts tests/integration/approved-source-pipeline.test.ts`、`pnpm typecheck`、`pnpm lint`、`git diff --check`。
- [x] **Step 5: Task checkpoint。** 精确暂存本 Task 路径，核对 staged diff 与远端；通过后 logical commit / feature-branch push，不改 P1 registry/Pipeline。

### Task 4: AnalysisContext、Analyzer、AnalyzerResult、InterestSignal

**Files:** Create `src/core/contracts/analyzer.ts`、`analyzer.schema.ts`、`tests/fixtures/contracts/analyzer-v1.synthetic.ts`、`tests/unit/analyzer-contract.test.ts`。

**Interfaces:** `AnalysisContext = { userId: string; asOf: string }`；`InterestSignal = { analyzerId: string; topicId: string; topicName: string; parentTopicId: string | null; relevance: number; confidence: number; evidenceIds: EvidenceId[]; reasons: string[]; timestamp: string }`；`AnalyzerResult = { analyzerId: string; apiVersion: 1; signals: InterestSignal[] }`；`Analyzer = { analyzerId: string; apiVersion: 1; analyze(input: { evidence: readonly IdentifiedEvidenceItem[]; context: AnalysisContext }): Promise<Result<AnalyzerResult, AppError>> }`。导出各对象严格 schema、`analyzerDescriptorSchema`（metadata/函数形状）与 `analysisExchangeSchema`（同一 `{ context, evidence, result }` 的组合约束）；返回值仍用 Task 1 `resultSchema` 校验。

- [x] **Step 1: 写 RED 正反测试与合成 fixture。** fixture 只标注合成用户、合成 Evidence 和合成信号；空 `signals` 可表无信号，不等于真实画像。测试至少断言：

  ```ts
  expect(analysisExchangeSchema.safeParse(validExchange).success).toBe(true)
  expect(analysisExchangeSchema.safeParse({ ...validExchange, result: danglingRefResult }).success).toBe(false)
  expect(analysisExchangeSchema.safeParse({ ...validExchange, context: otherUserContext }).success).toBe(false)
  expect(analysisExchangeSchema.safeParse({ ...validExchange, evidence: [validItem, otherUserItem], result: referencesOtherUserResult }).success).toBe(false)
  ```

  另测 `relevance/confidence` 越界、空 reasons/evidenceIds、错配 `analyzerId`、非 ISO `AnalysisContext.asOf` 或信号时间、错误 `apiVersion`、context 含 raw 字段、重复 ID；合成 Analyzer stub 满足 TS 接口，其 Result 通过 schema 校验。单个信号 schema 只检局部结构，引用闭包须经 `analysisExchangeSchema`，不能伪称单对象 Zod 已证明。
- [x] **Step 2: 观察 RED。** Run: `pnpm exec vitest run tests/unit/analyzer-contract.test.ts`；修复收集错误后须看到组合上下文或字段约束断言失败。
- [x] **Step 3: 实现类型与组合校验。** 同一输入内 Evidence ID 唯一、所有 Evidence.userId 匹配 context、信号 analyzerId 匹配 result、每个 evidenceId 指向该输入 Evidence；无真实 Analyzer、taxonomy 或评分。
- [x] **Step 4: 观察 GREEN 并验证。** Run: `pnpm exec vitest run tests/unit/analyzer-contract.test.ts tests/unit/evidence-identity-contract.test.ts`、`pnpm typecheck`、`pnpm lint`、`git diff --check`。
- [x] **Step 5: Task checkpoint。** 精确暂存本 Task 路径并核对 staged diff；通过后 logical commit / feature-branch push。

### Task 5: InterestNode 与 InterestProfile 数据合同

**Files:** Create `src/core/contracts/profile.ts`、`profile.schema.ts`、`tests/fixtures/contracts/profile-v1.synthetic.ts`、`tests/unit/profile-contract.test.ts`。

**Interfaces:** `InterestNode = { topicId: string; topicName: string; parentTopicId: string | null; strength: number; confidence: number; evidenceIds: EvidenceId[] }`；`InterestProfile = { userId: string; generatedAt: string; topics: InterestNode[]; trends: null; confidence: number | null; sampleSummary: { confirmedEvidenceCount: number; coverage: 'current-rendered-cards' }; warnings: AppWarning[] }`。导出 `interestNodeSchema`、`interestProfileSchema`；strength 0–100，confidence 0–1，计数非负整数，Evidence 引用非空。`trends: null` 是尚无趋势 producer 的合同值，不生成趋势数组。

- [x] **Step 1: 写 RED 正反测试与合成 fixture。** 正例只说明 schema 可解析，不代表真实画像。测试至少断言：

  ```ts
  expect(interestProfileSchema.safeParse(syntheticProfile).success).toBe(true)
  expect(interestNodeSchema.safeParse({ ...node, strength: 101 }).success).toBe(false)
  expect(interestProfileSchema.safeParse({ ...syntheticProfile, trends: [] }).success).toBe(false)
  ```

  另测 node confidence 越界、顶层 confidence 超出 0–1、空 evidenceIds、缺少 `sampleSummary`、负/小数计数、非法 `userId`（非正整数 UID）、非 ISO `generatedAt`、非法 warnings、原始 B站字段混入失败；总体 confidence=null 有效，0 不冒充“未计算”。
- [x] **Step 2: 观察 RED。** Run: `pnpm exec vitest run tests/unit/profile-contract.test.ts`；修复收集错误后须看到画像形状或数值边界断言失败。
- [x] **Step 3: 实现数据类型与严格 schema。** 不添加评分、taxonomy、真实画像或 UI producer；引用是否对应真实存储 Evidence 留待未来 producer 阶段，不从单个 profile parse 臆断。
- [x] **Step 4: 观察 GREEN 并验证。** Run: `pnpm exec vitest run tests/unit/profile-contract.test.ts tests/unit/analyzer-contract.test.ts`、`pnpm typecheck`、`pnpm lint`、`git diff --check`。
- [x] **Step 5: Task checkpoint。** 仅本 Task 路径精确暂存并检查 staged diff；通过后 logical commit / feature-branch push。

### Task 6: 未来持久化记录 envelope（无 Store / migration）

**Files:** Create `src/core/contracts/persistence-envelope.ts`、`persistence-envelope.schema.ts`、`tests/fixtures/contracts/persistence-v1.synthetic.ts`、`tests/unit/persistence-envelope-contract.test.ts`。

**Interfaces:** `PersistenceEnvelope<T> = { schemaVersion: 1; collectedAt: string; sourceVersion: string; ttlMs: number; data: T }`；`persistenceEnvelopeSchema<T extends z.ZodType>(dataSchema: T)` 校验版本字面值 1、ISO 时间、非空来源版本、正整数毫秒 TTL 与参数化 data。`ttlMs` 是有效时长字段语义，不产生过期清理行为或数据库记录。

- [x] **Step 1: 写 RED 正反测试与合成 fixture。** 用无业务含义的 `{ value: 'synthetic' }` 作 data，避免伪造真实 Evidence Store。测试至少断言：

  ```ts
  expect(persistenceEnvelopeSchema(payloadSchema).safeParse(v1Record).success).toBe(true)
  expect(persistenceEnvelopeSchema(payloadSchema).safeParse({ ...v1Record, schemaVersion: 2 }).success).toBe(false)
  expect(persistenceEnvelopeSchema(payloadSchema).safeParse({ ...v1Record, ttlMs: 0 }).success).toBe(false)
  ```

  另测缺 `sourceVersion`、非法时间、错误 payload、额外 raw 字段失败；版本 2 不被自动迁移或降级接受。
- [x] **Step 2: 观察 RED。** Run: `pnpm exec vitest run tests/unit/persistence-envelope-contract.test.ts`；修复收集错误后须看到版本或 TTL 等结构断言失败。
- [x] **Step 3: 实现最小 envelope 类型与 schema factory。** 不引入 Dexie、IndexedDB、读写 API、真实 producer、migration 函数或 migration test。
- [x] **Step 4: 观察 GREEN 并验证。** Run: `pnpm exec vitest run tests/unit/persistence-envelope-contract.test.ts`、`pnpm typecheck`、`pnpm lint`、`git diff --check`。报告只通过 schema 兼容性测试，非存储迁移测试。
- [x] **Step 5: Task checkpoint。** 精确暂存本 Task 路径，检查 staged diff；通过后 logical commit / feature-branch push。

### Task 7: Raw 隔离静态检查与阶段摘要同步

**Files:** Create `tests/support/contract-imports.ts`、`tests/unit/contract-import-boundaries.test.ts`、`tests/fixtures/contracts/raw-leak.synthetic.txt`; Modify `ARCHITECTURE.md`、`README.md`、`docs/issues/001-foundation.md`、`docs/architecture/requirements-freeze.md`。

**Interfaces:** `findForbiddenRawImports(sourceText: string, ownerPath: string): string[]` 用 TypeScript AST 检查 import / re-export / 字符串字面量动态 import；扫描 `src/core/**` 与 `src/entrypoints/**`，禁止直接指向 `src/sources` / `src/normalize` 或导出 raw 类型。唯一例外是 `src/core/pipeline/collect-approved-sources.ts` **现有**导入 `../../sources/bilibili/registry` 的那条装配边；同文件新增任何其他 Source/raw 导入仍须报错。content 入口导入 Core Pipeline 合法，直接导入 raw 非法。测试扫描当前目标文件并用 `.synthetic.txt` 注入反例；不改产品模块依赖。

- [x] **Step 1: 写 RED 静态边界测试。** 测试 `findForbiddenRawImports` 对 synthetic `import type`、普通 import、re-export、动态 import raw 返回违规；对 P1 Pipeline 的唯一既有 registry 导入返回空，但在**同一文件**追加第二条 raw 导入必须报错；content 入口导入 Core Pipeline 合法、直接导入 Source 非法。再扫描真实目标目录。先运行 `pnpm exec vitest run tests/unit/contract-import-boundaries.test.ts`；若 helper 缺失仅视作收集错误，建立返回空数组的最小空壳后重跑，直到负例断言失败才是 RED。
- [x] **Step 2: 实现最小静态检查并观察 GREEN。** 只解析 TS 模块导入/导出并按解析后的仓库路径判断，不用单纯字符串包含；Run: `pnpm exec vitest run tests/unit/contract-import-boundaries.test.ts`，预期 synthetic 负例被检出、现有 P1 装配层不误报。
- [x] **Step 3: 最小同步阶段文档。** `ARCHITECTURE.md` 与 `README.md` 当前阶段改为“获批带债进入 P2，P1 未全面完成”；`docs/issues/001-foundation.md` 的 P2 勾选项改为 Contract First，不再把 Dexie v1/migration/Feature Flags 当本阶段必做；`requirements-freeze.md` 保留 Phase 0 冻结历史，但把“当前组合未冻结/Global Gate BLOCKED”标成历史，并澄清 P2 storage schema 测试与未来真实 migration test 的条件区别。保留 pagination NOT_VALIDATED、SPA PARTIAL、Playwright BLOCKED_ENV/NOT_VERIFIED 和 Task 6/8/Plan incomplete，不改 Gate/ADR/Notion。文档同步不伪造 TDD RED。
- [x] **Step 4: 文档与代码 fresh verification。** Run: `pnpm exec vitest run tests/unit/contract-import-boundaries.test.ts tests/unit/source-contract.test.ts tests/integration/approved-source-pipeline.test.ts`、`pnpm typecheck`、`pnpm lint`、`git diff --check`；逐条核对四份文档与已批准 Spec/用户决定一致，Markdown 相对链接可解析，无新的“P1 全面完成”或“迁移已通过”措辞。
- [x] **Step 5: Task checkpoint。** 仅本 Task 明列文件精确暂存、审阅 staged diff，验证通过后 logical commit / feature-branch push。

## 完整覆盖与最终门禁

| Notion P2 / Spec 必须项 | Task 与证据 |
| --- | --- |
| 既有 EvidenceItem / SourceResult / SourceWarning / SourceStatus | Preflight、Tasks 1–4 兼容断言、最终 P1 unit/integration/golden 回归；不改 P1 类型。 |
| Result、AppError、AppWarning | Task 1 TS/Zod/合成 fixture/正反 tests。 |
| Evidence 身份及可引用性 | Task 2 名义类型/严格 schema/集合唯一性；Task 4 上下文归属与引用闭包。 |
| RawSourceResult、SourceAdapter | Task 3 TS/Zod/合成 stub/正反 tests；外层 Result / 内层 SourceStatus 两层独立。 |
| AnalysisContext、Analyzer、AnalyzerResult、InterestSignal | Task 4 TS/Zod/合成 stub/正反 tests；无真实算法。 |
| InterestNode、InterestProfile | Task 5 TS/Zod/合成 fixture/正反 tests；无画像 producer。 |
| 未来 storage schema | Task 6 TS/Zod/合成 fixture/版本负例；无 migration 假测试。 |
| raw 泄漏与阶段文档 | Task 7 静态正反测试和四份最小摘要同步。 |

Task 1–7 完成后，先对整个 feature branch 做独立 code review：重点核实 P1 兼容、两层语义、Evidence 引用与 raw 边界、Zod/TS 一致性、合成证据标签、无真实 producer/网络/权限扩大，以及文档未粉饰 P1 环境债务。先验证 review 意见；批准 scope 内的问题按 systematic-debugging/TDD 修复，再 fresh re-verify。不得将无关 P1 Playwright BLOCKED_ENV 写成 P2 PASS；若环境首次可稳定启动 bundled Chromium，按既有强制重验规则处理，但不为本 Plan 反复触发已知阻断。

调用 `superpowers:verification-before-completion` 后，从干净可重建状态运行并记录 exit code、测试数、失败数：`pnpm install --frozen-lockfile`；`pnpm lint`；对实施基线以来的合格源码/测试运行 `pnpm format:check -- <Preflight 记录的 HEAD>`；`pnpm typecheck`；`pnpm test:unit`、`pnpm test:golden`；确认 `.output` 是当前 worktree 下可重建的生成目录后清空，再分别执行 Chrome/Edge production build（`pnpm exec wxt build -b chrome --mv3` 与 `-b edge --mv3`）；`pnpm test:integration`；`pnpm bundle:check`；完整 `pnpm test`。用 Preflight 记录的实际 SHA 替换占位，运行 `git diff --check <SHA>..HEAD` 和 `git diff --check`，再核对精确 staged diff。核对 Manifest 权限/匹配/入口与 `package.json` 版本未变化，P1 来源结果与 `unknown/null` 未回退。任何可执行检查失败均不能宣称 P2 Plan 完成；先排错并重验。Playwright smoke 债务仍按独立批准的环境规则 OPEN，merge main 前必须结清，不借 P2 验收关闭。

最终仅在各 Task 与总 review、适用 fresh verification 都满足且无未解决 FAIL 时，报告 P2 Contract First Plan 的实际完成状态；logical checkpoint 只在已批准 feature branch 且精确 staged diff 正确、远端无 divergence 时 commit/push/fetch 核对。Plan 获批前不运行上述实施步骤；Plan 文档提交/推送不代表用户批准。不得自动进入 P3、merge main、tag 或 Release。

## 执行与最终验收记录（2026-09-30）

实施基线：`7ebfa6256e8899eb69a83766f56ca4888e2f472a`；工作区与分支：现有 `phase1-source-foundation/BiliInterestProfile`、`codex/phase1-source-foundation`。Task 1–7 均按目标行为断言 RED → GREEN 实施，逐 Task fresh verification 后形成 feature-branch checkpoint；不把收集失败当 RED。

| Task | 已完成能力 | checkpoint | 当时完整 Vitest |
| --- | --- | --- | --- |
| 1 | Result / AppError / AppWarning TS、Zod、合成 fixtures 与合同测试 | `f6aaf2c` | 123/123 |
| 2 | EvidenceId / IdentifiedEvidenceItem 与集合身份合同 | `6e6aaf9` | 133/133 |
| 3 | Source 边界 raw / Adapter、两层结果与两套 warning | `4906784` | 142/142 |
| 4 | Context / Analyzer / Result / Signal 与引用闭包 | `8057534` | 164/164 |
| 5 | InterestNode / InterestProfile 严格数据合同 | `6ed423f` | 188/188 |
| 6 | 未来 PersistenceEnvelope 与 schema compatibility（非 migration） | `cb20ca3` | 200/200 |
| 7 | AST raw 边界与四份阶段文档同步 | `a4e0f71` | 213/213 |

独立总 review 发现两项 Important：泛型 optional/default payload schema 可接受或补出缺失必需字段；唯一 P1 装配 binding 可经局部 export 绕过边界。均先以行为回归复现，再修复：解析前校验自身 payload key；AST 跟踪直接 alias/property/destructuring 并拒绝局部再导出。修复目标测试 52/52、类型检查通过，无剩余已确认 Critical / Important 或已知产品 FAIL。EvidenceId 真实 producer/稳定性、画像算法/真实存储引用、未来 empty proof、P3 网络映射和 Playwright 债务不属于本次实现或 review 的验证结论。

最终从空 `.output` 重建后的 fresh verification：所有下列可执行检查 exit code 0、failure count 0。

- frozen install、lint、基线差异 Prettier check、typecheck：PASS。
- unit：199/199；golden：1/1；integration：17/17；完整 Vitest：26 files、217/217。
- raw 边界 / P1 source、Pipeline、golden / Manifest 定向套件：36/36；扫描所有实际 Source / Normalizer 以外的 `src/**` 消费者，包括 `src/core/**` 与 `src/entrypoints/**`。未来 UI / analyzers 目录会自动纳入。唯一例外仍是 P1 既有 registry 装配 import，不是整个 Pipeline 白名单。
- Chrome / Edge MV3 production build：PASS；两边受预算统计的 bundle 均为 234491 / 293114 bytes；预算未提高。
- Manifest permissions / matches / entrypoints / version 审计：PASS；版本 0.1.0 与 package.json 一致，未新增权限。P1 源码、Pipeline、runtime、reader、Normalizer、registry 与包/锁文件/构建配置对实施基线无 diff。
- 代码/文档 diff 与 `git diff --check`：PASS；阶段摘要保留历史 Phase 0 residual risk，无新增产品 requirement。

本记录仅表示 P2 Contract First Plan 完成。P1 Playwright smoke 债务仍 OPEN / BLOCKED_ENV / NOT_VERIFIED，P1 Engineering Foundation Task 6、Task 8 与 Plan 仍 incomplete；未反复重试，也未把 synthetic tests 或本次构建写成 smoke PASS。环境首次恢复或 merge main 前（先到者）仍必须补测。没有实现 ID producer、真实 Analyzer、画像、Store/migration、网络或新 Source。具备单独申请 P2 → P3 的条件，但未获该转换批准，未进入 P3、merge main、tag 或 Release。
