# Phase 2 Contract First Spec

状态：**Approved Spec / Implementation Plan（2026-09-30）**。日期：2026-09-30。用户已批准分层 Contract 的 Design、正式 Spec 与单份 Plan，授权在当前 feature branch 实施 P2 Task 1–7；不授权新 Spike、进入 P3、merge main 或改变既有 Gate。

## 1. 目标、权威与当前基线

P2 只交付 TypeScript Contract、对应 Zod schema、版本化合成 fixtures、contract tests 和必要的文档一致性同步，先固定跨模块数据与依赖边界，不实现复杂算法或真实画像。依据为用户本轮明确决定、Notion [详细制作流程](https://app.notion.com/p/3e81d223bf638178bfe9ecd4ea75190f)的 Phase 2 清单、[工程流程优化](https://app.notion.com/p/3e81d223bf638146b5eecae159ec60a7)的 Contract First / Contract Test 规则、[项目 Idea](https://app.notion.com/p/3e81d223bf63810898c1f428ba5c8779)，以及 ADR-002、ADR-004、ADR-006、ADR-007 和已批准的 v0.1 来源组合 Spec。发生冲突时以用户最新决定及已接受的具体边界为准。

当前 P1 已有 `src/core/contracts/source.ts`、`source.schema.ts`、`SourceResult<T>`、`SourceWarning`、动态 `EvidenceItem`、已批准来源 Pipeline 和工程/runtime `ErrorCode`。公开动态是 v0.1 唯一兴趣行为来源，基础资料仅供身份与上下文；现有 reader 只处理当前渲染卡片，单次空态候选仍返回 `unknown/null`。P1 的 Playwright bundled Chromium smoke 债务仍为 `BLOCKED_ENV / NOT_VERIFIED`，Task 6、Task 8 与 Engineering Foundation Plan 未完成；用户只批准携债进入 P2，未批准合并 main 或发布。P2 合同不能倒填这些验证结果。

## 2. 分层边界与依赖方向

| 层 | P2 合同归属 | 允许依赖与输出 | 禁止穿透 |
| --- | --- | --- | --- |
| Source | `RawSourceResult<TRaw>`、`SourceAdapter<TRaw, TInput>`；来源私有 raw schema | 读取正常可访问的来源，先校验 raw，再交给指定 Normalizer | 不输出兴趣信号、评分或 UI；raw 不从 Core 导出 |
| Normalizer | P1 `SourceResult<EvidenceItem[]>` 及其兼容 schema；未来身份接合点 | 消费已验证 raw 与身份上下文，输出标准 Evidence，保留来源状态/警告 | 不生成稳定 EvidenceId，不将 unknown 变 empty |
| 新增 Core contracts / Analyzer | 分析侧 Evidence 身份、`AnalysisContext`、`InterestSignal`、`Analyzer`、`AnalyzerResult`、`Result`、`AppError` / `AppWarning` | 只消费标准 Evidence 与不含浏览器对象的上下文 | 不导入 Source / Normalizer / B站字段、DOM、cookie、网络或数据库；不约束现有 P1 Pipeline 装配层 |
| Profile / UI 边界 | `InterestNode`、`InterestProfile` | 未来只消费统一画像 Contract | 不读取 raw、重解释来源状态或在 UI 中评分 |
| Persistence 边界 | 未来记录的字段语义与 schema 草案 | 为后续版本化存储预留可校验边界 | P2 不创建 Evidence Store、Dexie migration 或持久化 producer |

`RawSourceResult` 只在 Source 与指定 Normalizer 的接合边界可见；跨过该边界的值必须是已校验的标准合同。P1 现有函数式 registry、reader、Normalizer 与 `collectApprovedSources` 不为符合新接口而重写。P2 新合同可以并存，不能暗示 P1 已经实现新的 Adapter、Analyzer 或持久化链路。

## 3. 现有来源合同的兼容规则

`EvidenceItem`、`SourceResult<T>`、`SourceWarning`、`SourceStatus` 和现有 Zod schema 原有字段、含义、可空性与状态校验保持兼容；P2 若确需扩展，只能添加经合同测试证明不破坏 P1 生产者/消费者的最小字段或另建分析侧包装，不能把现有 `source: 'dynamic'` 泛化为未批准的新来源。`unknown` / `unavailable` 的 `data: null`、`empty` 的已确认 `[]`、`available` / `partial` 的数据约束及原警告码均保留。当前空态缺少获批跨时 proof producer，故 reader / Pipeline 不得构造 proof 或把候选空态升级为 `empty/[]`。

P1 `EvidenceItem.sourceUrl` 是可回溯的页面或单条链接，`traceGranularity: 'page' | 'item'` 标识粒度；二者都不等同单条 Evidence 的稳定身份。P2 引入分析侧 `IdentifiedEvidenceItem = EvidenceItem & { evidenceId: EvidenceId }`，但只定义合同和合成 fixture，不生产真实实例。未经未来受控身份生成与绑定，P1 `EvidenceItem[]` 不可被直接声明为 `IdentifiedEvidenceItem[]` 并送入 Analyzer。现有 P1 SourceResult 无需立即迁移到通用 `Result`；未来边界适配必须显式保留来源状态、null 与警告，不得通过异常或默认空集合抹掉不确定性。

## 4. 新合同的规范语义

### 4.1 Evidence 身份、raw 与 Adapter

`EvidenceId` 是单条已识别 Evidence 的不透明、非空身份值，可由 `InterestSignal.evidenceIds` 引用。TypeScript 使用与普通 URL/字符串不互换的名义类型；Zod 单值 schema 校验非空、拒绝直接使用 URL 充当 ID。身份的语义是同一份可审计 Evidence 在一次分析输入中的唯一引用；单页 URL、UID、数组下标、卡片位置或只有页面粒度的 `sourceUrl` 均不能冒充单条稳定 ID。重复 ID、悬空引用及跨用户引用需要把 `IdentifiedEvidenceItem[] + AnalysisContext + AnalyzerResult` 放在同一次上下文校验/contract test 中判断，不能声称单个 ID 或信号的 Zod parse 足以证明。P2 不规定 ID 算法、跨会话稳定性实现、去重、持久化或真实 producer；这些属于后续 Evidence Store 阶段，未有 producer 前不声称已具备端到端可追溯分析。

`RawSourceResult<TRaw>` 仅是来源边界的类型化结果：非空 `sourceId`、`SourceStatus`、已由来源私有 schema 校验的 `data: TRaw | null` 与 `SourceWarning[]`；`unknown` / `unavailable` 仍须为 `null`，`empty` 仍须有经批准的确认依据，不能以“零 DOM”或工具异常推断。`SourceAdapter<TRaw, TInput>` 是具有 `sourceId`、`apiVersion: 1` 与 `read(input): Promise<Result<RawSourceResult<TRaw>, AppError>>` 的版本化读取接口；`TInput` 与 raw 类型留在 Source 侧，新增 Core contracts / Analyzer 不导入该接口。P2 只验证接口、schema 与依赖边界，不替换 P1 registry、不新增网络访问、来源或浏览器权限。未来真实 Adapter 的超时、Abort、403/429、retry 等属 P3，不能由本接口的存在宣称已实现。

**Spec 批准时的两层语义补充：**外层 `Result` 只表达调用/合同层成功或失败；仅在外层成功时，内层 `RawSourceResult.status` 才表达来源数据状态。两层不得合并，不能把内层 `unknown` 自动改成外层失败，也不能把外层失败伪装为内层 `unavailable`。P2 只通过 TypeScript、Zod 与 contract tests 固定这一区别；timeout、403、429、未授权等未来情形最终归属哪一层，留待 P3 单独决定。

### 4.2 通用 Result 与跨模块 issue

新 `Result<T, E>` 是以 `ok` 为 discriminant 的互斥联合：成功分支必须有 `ok: true`、`data: T`、`warnings: AppWarning[]`，不得有 `error`；失败分支必须有 `ok: false`、`error: E`、`recoverable: boolean`，不得有成功数据。可预期失败通过结果值表达，不以抛异常作为正常控制流。Zod factory 对两分支做严格校验，拒绝混合字段、缺失字段与假成功。`recoverable` 表示未来调用方可采取受控恢复路径，不等于自动 retry 或数据可用。

`AppError` 与 `AppWarning` 只定义跨模块最小公共形状：非空、机器可读的 `code` 和可安全展示的 `message`；新 code 须由其实际边界拥有者命名并有合同测试，不预先塞入不存在的网络异常类别。P1 `SourceWarning` 是来源局部警告，P1 runtime `ErrorCode` 是 popup/content 工程分类，二者均不自动改名或强转为完整通用体系。未来适配须明确映射、保留原语义且不得泄露原始页面内容或诊断敏感信息。P2 不定义 P3 的 timeout、403、429、retry、network failure 矩阵。

### 4.3 分析侧合同（无实现）

`AnalysisContext` 本版为目标 `userId` 与 ISO `asOf` 时间，且只能是标准、可校验的数据；不得携带 `Document`、页面原始 JSON、cookie、网络或数据库句柄。`Analyzer` 提供独立非空 `analyzerId` 与 `apiVersion: 1`，其 `analyze(input)` 只接受同一目标用户的 `IdentifiedEvidenceItem[]` 及 `AnalysisContext`，返回 `Promise<Result<AnalyzerResult, AppError>>`；P2 不提供真实 Analyzer 实现。独立失败必须可由结果表达，不能阻断其他 Analyzer 的合同表示。

`InterestSignal` 要求非空 `analyzerId`、`topicId`、`topicName`、可空 `parentTopicId`、0–1 的 `relevance` 与 `confidence`、非空 `EvidenceId[]` 的 `evidenceIds`、非空理由文本数组 `reasons` 与 ISO `timestamp`；`relevance` 不是最终兴趣强度。`AnalyzerResult` 要求非空 `analyzerId`、`apiVersion: 1` 与 `signals: InterestSignal[]`；每个信号的 analyzerId 必须与容器一致，evidenceIds 必须指向该次输入中同一目标用户的 Evidence。只定义字段、约束与合成样例，不定义主题 taxonomy、评分公式、时间衰减、语义模型或实际信号生成。没有可用、已标识 Evidence 时不得凭合同合成兴趣结论。

### 4.4 画像合同（无 producer）

`InterestNode` 至少包含 `topicId`、`topicName`、可空 `parentTopicId`、`strength`（0–100）、`confidence`（0–1）与非空 `evidenceIds`；两项数值含义分离，节点不得只有评分而无证据。`InterestProfile` 的本版合同要求同 P1 格式校验的 `userId`、ISO `generatedAt`、`topics: InterestNode[]`、`trends: null`、`confidence: number | null`（非 null 时为 0–1）、`sampleSummary: { confirmedEvidenceCount: 非负整数, coverage: 'current-rendered-cards' }`、`warnings: AppWarning[]`。`trends: null` 只表示当前没有获批的趋势 producer，未来若要提供趋势数组须版本化扩展；总体置信度未计算时同样用 `null`，不能以空数组或 0 暗示“已分析且没有兴趣”。`sampleSummary` 不把基础资料包装为第二行为来源。P2 fixtures 仅用于合同正反例，不代表真实画像已生成；真实 Profile、Scoring、趋势、Renderer 行为属于后续批准范围。

## 5. Zod、版本与持久化边界

跨 Source、Normalizer、Analyzer、Profile 或未来存储的非可信输入须经其拥有方 Zod schema 校验；TypeScript 类型不替代运行时校验。Zod 与 TypeScript 字段、可空性、枚举、数值范围及 discriminant 保持一致；未知字段在跨边界对象上拒绝或显式处理，不静默混入分析侧 Core。泛型 `Result`、`RawSourceResult` 以 schema factory 对成功数据、错误值与来源 raw 数据做实际参数化验证，不以 `unknown` 直接放行。单对象 schema 负责形状与局部数值约束；Evidence 唯一性、同用户归属及信号引用闭包需要组合上下文校验，两者不得混称。既有 `source.schema.ts` 继续为 P1 来源状态的权威校验，不因 P2 新 schema 放宽。

为未来持久化记录定义字段语义：`schemaVersion` 是记录结构版本，`collectedAt` 是采集时间，`sourceVersion` 是来源解析版本，TTL 表示数据有效边界；它们只有在真实存储 producer 出现后才有运行值。P2 可提供“未来记录 envelope”的 schema 与合成合同测试，拒绝缺字段、非法版本/时间/TTL，并显式记录版本不匹配不可直接读取；不得创建 Dexie 数据库、迁移函数或声称运行 migration tests。Notion 的“需要时 migration”与工程文档的迁移验收适用于**已有持久化数据的破坏性变更**；当前没有正式持久数据，实际 Evidence Store、稳定 ID producer 与 schemaVersion migration 留给对应后续阶段审批。

## 6. 建议文件布局与实施依赖

以下是待实施 Plan 使用的归属建议，并非本轮已创建或已批准的代码文件。现有 `src/core/contracts/source.ts`、`source.schema.ts` 保持原职责；分析侧身份与结果、分析器及画像合同及 schema 放在 `src/core/contracts/` 的独立文件；raw/Adapter 类型及来源私有 schema 只放在 `src/sources/` 的边界目录；合成 fixtures 与 contract tests 分别放在 `tests/fixtures/`、`tests/unit/` 或既有测试布局中的对应位置。新增分析侧 Core contracts / Analyzer / UI 不得导入 Source 或 Normalizer；现有 P1 `src/core/pipeline/collect-approved-sources.ts` 是已验证的装配层，不因本规则重写。

实施顺序：先以现有 P1 合同测试锁定兼容性；再定义 Result / issue 与分析侧 EvidenceId；随后定义 raw/Adapter、AnalysisContext / Analyzer / AnalyzerResult / InterestSignal、InterestNode / InterestProfile 与未来存储 envelope；每类类型与 Zod、合成正反例、contract test 同步；最后做依赖方向与文档一致性审计。此处只规定依赖关系，不授权实施；正式 Task 与命令由 Spec 获批后的 Plan 决定。

## 7. 验收矩阵与证据边界

| 验收对象 | 必须拒绝的错误输入或依赖 | 必须保留的兼容行为 |
| --- | --- | --- |
| P1 `EvidenceItem` / `SourceResult` / `SourceWarning` | schema 拒绝既有非法形状与 `unknown` 携数据；reader/Pipeline 行为测试拒绝未证实 `empty` | 已验证 reader/Pipeline、`unknown/null`、当前渲染卡片与原警告码；`empty/[]` 结构定义不变 |
| `EvidenceId` / 分析侧 Evidence | 空 ID、直接 URL、重复 ID、悬空/跨用户引用 | 页面级 `sourceUrl` 仍仅用于回溯，不被升级为单条 ID |
| `RawSourceResult` / `SourceAdapter` | schema 拒绝 raw 字段失败与 `unknown` / `unavailable` 携数据等结构矛盾；静态规则拒绝新增分析侧导入 raw | P1 registry 不迁移，Source/Normalizer 接合边界保持唯一 raw 出口；真实 `empty` 的跨时依据留未来获批 producer / 行为测试 |
| `Result` / `AppError` / `AppWarning` | 成功失败字段混用、缺失 warnings/error/recoverable、空 issue code | P1 SourceResult 与 runtime ErrorCode 继续各守其语义 |
| `AnalyzerResult` / `InterestSignal` | 无证据引用、非法数值、错配 analyzerId、未经校验的输入 | 无真实 Analyzer、无评分、无 taxonomy 或画像算法 |
| `InterestNode` / `InterestProfile` | 强度/置信度混用或越界、无证据节点、缺少必要字段 | 未计算值用 `null`，不生成真实画像 |
| 未来存储 envelope | 缺版本/时间/TTL、非法版本值、版本不兼容直接读取 | 仅合成 schema/兼容性测试；无实际 migration 声称 |

Contract tests 使用明确标注的合成 fixtures，覆盖成功、失败、部分/未知状态、版本不兼容和跨模块边界；编译或静态规则证明新增分析侧 Core contracts / Analyzer / UI 不依赖 B站 raw，且不禁止现有 P1 装配层的合法导入。正向 fixtures 只证明结构可解析，不构成真实页面、安装态或算法质量证据。按 Notion《工程流程优化》覆盖 `EvidenceItem`、`SourceResult`、`AnalyzerResult`、`InterestProfile` 与未来 storage schema；有真实持久化后才补正式 migration test。P2 完成仍须按批准 Plan 运行 fresh contract tests、现有 P1 回归、lint、typecheck、适用 build、`git diff --check` 与独立 review，不能用 P1 Playwright debt 冒充 PASS。

## 8. 必要文档同步、风险与非目标

后续 Plan 必须将 `ARCHITECTURE.md` 的“当前阶段仍为 Phase 0 Global Gate BLOCKED、不得进入 Phase 1”改为用户已批准进入 P2的真实阶段状态，同时保留 Phase 0 的历史 BLOCKED 判定、pagination `NOT_VALIDATED`、SPA UID switch `PARTIAL` 及 P1 Playwright 环境债务。只改“当前阶段”摘要，不篡改历史实验、ADR 或验收状态。当前 `requirements-freeze.md` / Issue 中过时的阶段摘要与“P2 必做 migration”措辞须在 Plan 中做最小一致性核对；若需更新，只同步最新明确决定，不创造新验收 Gate。

主要残余风险：P2 只有身份与引用结构，没有 P4 稳定 EvidenceId producer，因此真实 P1 数据暂不能直接进入 Analyzer；只有 schema 的画像不能说明兴趣质量；未验证的分页、SPA 与 Playwright smoke 继续保持原债务。任何未来 Source/Analyzer/存储 producer 引入前，须在其获批阶段验证身份、版本与可恢复失败，不能用本 Spec 推定已经安全可用。

本 Spec 不授权更改 P1 来源结果或 Pipeline、采集新 Source、网络请求或扩展权限、稳定 ID 生成/去重/持久化、Dexie migration、P3 Adapter 异常矩阵、评分/taxonomy/真实 Analyzer、兴趣画像生成或 UI、浏览器 Spike、Phase 0 Gate 修改、merge main、Release 或进入 P3。用户已明确批准本 Spec 与 Implementation Plan，授权在上述边界内连续实施 Task 1–7。
