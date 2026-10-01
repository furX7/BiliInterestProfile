# Phase 3 Data Collection v1 Spec

状态：**Approved**。日期：2026-10-01。用户已明确批准本正式 Spec（含依赖满足后 Source admission 的 timeout 修订）；合同、预算与范围自此冻结。本次批准只授权 writing-plans，不是 Implementation Plan 审批或产品实施授权，不能由实现或脚本自行提高预算。

## 1. 权威、目标与基线

依据：用户最新 P3 Design 批准及补充约束；Notion [详细制作流程](https://app.notion.com/p/3e81d223bf638178bfe9ecd4ea75190f)的 Phase 3、[工程流程优化](https://app.notion.com/p/3e81d223bf638146b5eecae159ec60a7)、[项目 Idea](https://app.notion.com/p/3e81d223bf63810898c1f428ba5c8779)；[ADR-002](../../adr/ADR-002-evidence-isolation.md)、[ADR-006](../../adr/ADR-006-analyzer-no-network.md)、[ADR-007](../../adr/ADR-007-phase0-gate-separation.md)、[P2 Spec](2026-09-30-phase2-contract-first-design.md)、[来源组合 Spec](2026-09-28-v0.1-source-composition-design.md)及[Runtime Spec](2026-09-29-runtime-analysis-trigger-design.md)。本轮使用 Notion Connector 刷新三页，非普通网页搜索。其泛化流程由最新明确范围约束到 DOM-only；不要求为实现错误分类而新增 HTTP transport。

审计基线为 `codex/phase1-source-foundation` 的 `bf0b01dc123387c938480506f9192ee485dc2391`，工作区在编写前无未提交改动。P1 已有同步 profile/dynamic reader、作者与引用边界、Normalizer、三-key registry、`collectApprovedSources` 和 popup 消息链路；P2 已有 SourceAdapter、RawSourceResult、Result 及 Zod Contract。接口存在不等于 P3 受控执行已经实现。

目标是增量加入可验证的 DOM-first 采集执行层：逐来源受控执行、输入/输出校验、资源预算、取消和迟到结果隔离，保留 P1 数据语义。公开动态仍是唯一兴趣行为来源，profile 只供身份与上下文。只处理用户触发时的 current-rendered-cards，不承诺完整历史、跨运行身份或兴趣质量。

## 2. 不变边界

- 不新增 B 站网络请求、权限、Source、后台采集、遥测或持久化设置；不读取凭据、私有 JS state 或绕过访问限制。
- 不重写 P1 已验证的身份/作者/引用规则、Normalizer 行为或原 Pipeline；允许为有界增量执行抽出共享叶子判断，必须有 P1 compatibility regression，不能在受控路径整段调用无预算同步 reader 后宣称可取消。
- 保留原 `EvidenceItem`、`SourceResult`、`SourceStatus`、`SourceWarning`、P2 Result 两分支及两套 warning 语义。不生成稳定 EvidenceId，不新增 Analyzer、Scoring、taxonomy、画像或 P4 Store。
- 单快照零卡、可见空态、隐藏 loading 只能是候选，返回 `unknown/null` 并保留 `page_state_uncertain`。没有获批 proof Contract/producer 前，任何生产路径均不得制造 `empty/[]`；结构 schema 可以继续接受合法 empty fixture，但不能证明 empty 可被生产。
- pagination = `NOT_VALIDATED`；SPA UID switch = `PARTIAL`。受控切换测试只证明本地拒绝规则，不结清真实网页验证债务。

## 3. 模块与依赖

以下是实施时的目标布局，不表示文件已经存在；Plan 可以在保持这些归属与唯一装配边的前提下组织内部文件。

| 归属           | 目标文件/职责                                                                                                           | 可跨边界的值                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Core contracts | `src/core/contracts/collection.ts` 与 `.schema.ts`：规范化 port、outcome、quality、policy                               | 标准 DTO；无 DOM、raw 或 SourceAdapter              |
| Core execution | `src/core/collection/`：deadline、scheduler、retry、生命周期状态机                                                      | 只调 Core 定义的 port 与标准结果                    |
| Source         | `src/sources/bilibili/collection-port.ts`：唯一具名工厂；`profile/`、`dynamics/` 下的 Adapter 与私有 schema、DOM driver | Source 内部可见 DOM/raw；出口仅规范化 DTO           |
| Normalizer     | `src/normalize/`：复用既有规则，接收已校验 raw，附接合校验与质量计算                                                    | EvidenceItem 与其质量包装；不导出 raw               |
| 装配           | `src/core/pipeline/collect-controlled-sources.ts`：绑定工厂与通用执行器                                                 | 传入当前 Document/URL，返回规范化 collection report |
| Runtime        | `src/core/runtime/`、现有 content/popup entrypoint                                                                      | 版本化脱敏摘要，不回传完整 report                   |

只批准精确的新装配 import：`collect-controlled-sources.ts` → `sources/bilibili/collection-port`，唯一 binding 为非 type、无 alias 的 `createBilibiliCollectionPort`。禁止额外 named/default/namespace import、raw type、动态 import/require、re-export、局部别名/解构后导出；不允许 Core 获得 Adapter/Normalizer 句柄。工厂的公开参数为装配点已有 Document/URL，返回类型必须来自 Core 的 normalized port Contract，不能在类型推断中漏出 raw。Document 只在这个装配点传给 Source，不进入通用 Core 执行器、Analyzer 或 UI。

保留原装配边 `collect-approved-sources.ts` → registry 的唯一 `approvedSourceRegistry` binding。旧 registry 的 keys 仍恰为 `profileContextReader`、`dynamicCardReader`、`dynamicCandidateNormalizer`；不暗增 factory、policy 或版本键。AST 检查覆盖所有实际分析侧消费者，包括 `src/core/**`、`src/entrypoints/**`、若存在的 `src/ui/**`、`src/analyzers/**`；Source/Normalizer 所有者边界以外的 raw 导入、类型引用及变相导出均拒绝，不能将整个 pipeline 设为白名单。

## 4. Contract 与 schema

### 4.1 Source 内部：两层语义

生产 Adapter 实现既有 `SourceAdapter<TRaw,TInput>`，`apiVersion: 1`，sourceId 只允许 `profile-context` 与 `public-dynamic`。`TInput` 为本运行的 Source 私有输入，包括 fixed snapshot、身份上下文、AbortSignal 与执行 lease；不得导出到 Core。profile raw 为资料候选，dynamic raw 为有界批次的 DynamicCardCandidate；均为普通数据，不含 DOM node、函数或凭据。

Adapter 的输出保持 `Result<RawSourceResult<TRaw>,AppError>`：外层成功表示调用/合同有效，内层表示来源数据状态；调用失败没有 inner status。`Result.warnings = AppWarning[]` 与 `RawSourceResult.warnings = SourceWarning[]` 独立，不能相互强转、合并后失去归属或删掉其中一层。

边界依次校验：输入/版本 → Adapter 外层 Result → RawSourceResult envelope → 来源私有 raw → P1 Normalizer → 标准 Evidence/Profile schema → delivery/quality schema。envelope、Result、版本或规范化输出违反 Contract，判 outer `schema_invalid`，不得伪装成 unavailable。dynamic envelope 有效但个别候选不合法，按逐项 raw schema 拒绝，添加 Source `content_unusable` 与 App `candidate_schema_rejected`；有剩余可用项则 partial，否则 unknown/null。未知字段采用 strict schema，不能静默透传。

### 4.2 规范化 port 与结果

Core port 只有 `prepare`、`readContext`、`readDynamic`、`verifyIdentity`、`dispose` 五种方法；不暴露 Adapter 或 raw。prepare 固定初始卡片集合；readContext/readDynamic 是各自可含多个 chunk operation 的 Source job，不是整段受 1 秒包裹的同步 reader；二者返回既有 Result 包装的 SourceResult delivery。verifyIdentity 返回 `confirmed | missing | mismatch`；dispose 只释放本运行资源，不重新读取页面。

`prepare` 的正式返回值是 Core-owned strict `PrepareOutcome`：`{kind:'ready'}` 或 `{kind:'dynamic-terminal',result:Result<SourceResult<DynamicDelivery>,AppError>}`，后者只允许 unknown/null 或 outer failure；prepare 不直接产生可用 evidence。零卡固定集合属于 ready，不是 empty。固定卡引用、私有 token 与 DOM/raw 保存在 Source 内部，不出现在返回 DTO。Core 必须校验 PrepareOutcome，再调度未终止的 job；envelope 自身非法时将 dynamic 置 outer schema_invalid，不阻止独立 profile。

Core 在来源依赖满足、正式 admission 进入 Source scheduler 时创建 Source job lease（signal、单调 now、source/whole deadline、只含计数的预算接口）与纯控制策略；Source 内部为每个 Adapter/chunk/validation operation 创建更短的子 lease、执行 retry 和 late-result 拒绝。Source-owned operation executor 可以接触 raw，Core 调度器只接触 normalized job promise 与计数/终止 code，不通过泛型 callback 接收 RawSourceResult。prepare 与最终 verifyIdentity 各自有至多 1 秒 operation lease，裁剪到 whole deadline；prepare 不开启或消耗 dynamic Source 时钟，最终复核也不重新开启已结束 Source 的时钟。fixed snapshot 完成不代表 dynamic 已 admission。

prepare 的动态容器缺失/不唯一只令 dynamic 预置 unknown/null；prepare 的 Source-local execution/schema error 只令 dynamic outer failure。profile 仍可独立读取，不能因为动态区不可读就制造 profile failure。只有整 run cancellation/deadline/身份发布失败才影响全局；固定零卡集合仍是有效 snapshot，不构成 empty proof。

`ContextDelivery = { context: ProfileContext }`；`DynamicDelivery = { items: CollectedEvidence[] }`，其中 items 必须为 1..200 条，`CollectedEvidence = { evidence: EvidenceItem, quality: EvidenceQuality }`。quality 与具体 Evidence 同对象绑定，不用易错配的平行数组/下标，也不把运行内 token 冒充 EvidenceId。unknown/unavailable 的 delivery 为 null；生产 dynamic 有可用 items 时仍为 partial（当前 Normalizer 缺精确时间与单条回溯），不是 available。新 delivery 联合 schema 必须显式拒绝 partial/{items:[]}，不能只依赖 P1 泛型 SourceResult schema 的 non-null 检查。不得仅因质量数字高而升级来源状态。

每个来源 outcome 是互斥 union：`{kind:'result',result:Result<SourceResult<TDelivery>,AppError>}` 或 `{kind:'not-started',reason:'dependency_failed'|'run_stopped'}`。not-started 没有 SourceStatus/data；Result 失败没有伪造的 SourceResult。prepare 已终止的 dynamic outcome 原样保留，每个 Source outcome 至多终止一次；只有 dynamic 尚未终止且 read 未启动时，profile outer failure 才令它 dependency_failed。profile inner unknown/unavailable 时，未终止的 dynamic 依据该身份结果在 run 级依赖 preflight 返回 unknown/null，不 admission、不启动 readDynamic 或 Source 时钟，不将 profile 错误改名为动态错误。profile 的可选 description 被丢弃仍可 available，保留已确认身份，不阻断 dynamic。

`ControlledCollectionReport` 固定包含 context/dynamic outcome、`behaviorEvidenceSources: ['dynamic']`、runStatus（completed/cancelled/deadline/identity-rejected/contract-error）、按 context/dynamic 分开的诊断 warning roll-up（各自 AppWarning[] 与 SourceWarning[]）、run 级 AppWarning[] 以及执行统计。roll-up 保留已发生但因 outer failure 无法放入成功 Result 的 warning；不改变 P2 Result 的失败分支。诊断统计只含 admitted/started/attempts、scanned/rejected/duplicate/admittedItems、extractedBytes/nodeVisits、elapsedMs；不得包含身份、正文或 raw。Source 级普通失败不自动令其他独立 outcome 失效；身份安全失败是整次发布拒绝，见第 7 节。对旧 SourceResult 的兼容投影只提取已验证 delivery，不能把 not-started/outer failure 伪装为 unknown、unavailable 或 []。

runStatus 优先保留已 settlement 的全局终止原因：caller/pagehide Abort 为 cancelled，whole deadline 为 deadline，最终身份拒绝为 identity-rejected。没有全局停止时，若任一 Source 是 schema_invalid/contract_version_unsupported 则 contract-error，否则任一 Source 是 operation/source timeout 则 deadline，否则 completed。completed 只表示本次受控执行已结束并形成报告，允许 Source 有自己的 HTTP/network/execution failure，不表示 Task/Plan 完成或所有来源成功；outcome 中的实际 error code 始终保留。

## 5. 冻结预算与计量

时间用单调时钟，所有 `now >= deadline` 均视为过期（恰等边界不得接纳结果）。下表是本 Spec 已获批准的冻结值，production 不允许 popup/页面消息覆盖。

operation 的 1 秒是一次 attempt 的执行预算：同一逻辑批次如确属可重试类别，每次 attempt 重新取得至多 1 秒的子 lease，并裁剪到原 Source/whole deadline。backoff 不算下一 attempt 的执行时间，但始终计入 admission 后的 Source/whole；不得通过 retry 重置这两层时钟。无 retry 的 DOM 批次只有一个 attempt。

| 项目              | 值                                                                          | 起算与包含范围                                                                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| operation         | 1,000 ms                                                                    | 每个 prepare/read 批次、validation/normalization 批次、identity recheck 实际进入执行前；包括同步部分、yield 和该次结果校验                                                                          |
| Source            | 5,000 ms                                                                    | 各 Source 依赖已满足、正式 admission 进入 Source scheduler 时；包含 admission 后的 queue、throttle、全部 attempts/backoff、validation/normalization/dedupe/quality；依赖未满足的等待不计 Source     |
| whole collection  | 10,000 ms                                                                   | 有效支持路由请求取得 run-lock 的 t0；包含 prepare、dependency wait、queue、throttle、attempt、backoff、validation、normalization、identity recheck、summary 和 cleanup；整个 run 的不可延长绝对上限 |
| 并发/启动间隔     | 1 个 operation；不同 Source 首次 read 的实际 start 间隔至少 250 ms          | profile 先读；dynamic 等身份确认后才 admission；此前 dependency wait 只占 whole，admission 后的 queue/throttle 同占 Source/whole，不延长 deadline                                                   |
| retry             | 每 operation 最多 2 次重试，即总 attempts ≤ 3                               | 只适用于第 8 节明确可重试错误；退避 250 ms、500 ms；全部占 Source/whole 预算                                                                                                                        |
| snapshot/page cap | 1；auto-pagination = 0                                                      | 每 run 只固定一个当前 document 的 card set，不滚动、reload、加载下一页或追新卡                                                                                                                      |
| card scan cap     | 200                                                                         | 初始集合中的前 200 个可见主卡 occurrence，DOM 顺序；不因 rejected/duplicate 而补扫描更多卡                                                                                                          |
| 单文本字段        | 10,000 UTF-16 code units                                                    | 即 JS string.length；所有实际读取的身份、正文、标题、简介、日期标签字段均适用，trim 前计量；不拆 surrogate pair                                                                                     |
| 总提取文本        | 1,048,576 UTF-8 bytes（1 MiB）/run                                          | 所有 DOM 文本读取，包括再次身份复核、被拒/重复项与可选字段；计 trim 前文本，不是 JSON 大小或 UTF-16 内存                                                                                            |
| DOM visit / yield | 每 Source 至多 10,000 次 node visit；每 100 visits 或每处理完一张卡即 yield | 防止无正文的大树无限遍历；prepare 固定集合阶段不 yield，但仍受 visit/time 限制；Source 的 prepare visits 计入 dynamic                                                                               |

令 whole deadline `D_W = t0 + 10,000 ms`；每个 Source 仅在依赖满足并正式 admission 时记录一次 `t_A`，创建 `D_S = t_A + 5,000 ms`，不能在 t0 预先启动两个 Source 时钟。Source 内每次 attempt 的 deadline 为 `min(attemptStart + 1,000 ms, D_S, D_W)`；prepare/最终身份复核没有活跃 Source 时钟，使用 `min(operationStart + 1,000 ms, D_W)`。prepare 仅占 operation/whole 时间，其 visits 仍按原 cap 计入 dynamic，不把资源计数归属误作时间预算归属。

dynamic 必须等待同一次 profile 身份达到允许继续的状态，并已有 ready fixed snapshot，才能正式 admission；依赖等待期间 whole timer 始终运行。profile 耗时过长时，dynamic 即使随后取得执行资格，也可能因 whole 剩余窗口不足而无法启动或完成；这是预期行为，不补发额外时间。admission 后即便仍排队或等待 throttle，Source 时钟也持续运行。剩余窗口为正时 operation lease 可短于 1 秒；达到任一适用 deadline 后不得 admission、启动对应工作或接纳迟到结果。retry 的额外启动条件仍见第 8 节。

DOM visit 指显式算法访问一个 Element/Text/其他 node 来检查、遍历、读取或验证；隐藏 Element 本身计数，但跳过的子树不计。重复访问同一 node 再计一次；可见性检查的 ancestor 每次也计。querySelector/getComputedStyle 等原生函数内部走过的节点无法审计，不算可宣称有硬上界的算法 visits；对此限制如实记录。文本必须逐 node 有界读取与增量计量，不能先递归拼完整 textContent 或取无限 NodeList 再 slice。用于判断 cap 溢出的下一张卡只检查存在，不抽取其字段、不输出；该检查的显式 node visits 仍计预算。

UTF-8 bytes 按 TextEncoder 对有界片段的标准编码计算；跨片段 surrogate 按拼接后的 code point 计，未配对 surrogate 按 U+FFFD 的 3 bytes 计。空白也占预算。不可变输入在本运行内再次使用、Normalizer 复制字符串不算新 DOM 提取；重新访问 DOM 文本则再次计量。由已校验 URL/上下文生成的 route/sourceUrl 同样在创建 DTO 前检查字段长度，但不重复计为 DOM 提取字节。每个输出正文最多 10,000 units，输出 items ≤ 200。

**超限规则：**身份 UID/昵称等 mandatory field 超长或缺失，不截断后确认身份，返回 unknown/null + `page_state_uncertain`，超限附 App `mandatory_field_limit`（普通缺失不假称超限）；卡片顶层作者超限则拒绝该卡 + `identity_mismatch` 与 App `mandatory_field_limit`。正文超限整卡拒绝 + `content_unusable` 与 App `card_text_limit`，不得用截断正文当完整证据。可选 description/title/dateLabel 超限置 null，附 `optional_field_limit`；不损害其他已确认 mandatory field。卡片 cap 截止保留已校验项、标 partial 与 `card_cap_reached`，不表示到末尾。

总 bytes/visits 达限后不再抽取普通字段，丢弃未完成批次；此前已提交的批次可保留为 partial 与 `extraction_cap_reached`，但仍须在预算内完成身份复核。没有剩余预算确认身份时整次拒绝发布，不能为复核偷偷提高 cap 或放行旧结果。没有任何可用项时保持 unknown/null；不返回“成功空数组”。预算 cap、未知页面和无 proof 空态均不触发 retry。

## 6. 固定快照、chunk 与取消

接受请求并取得 run-lock 的 t0 只创建 run lease、controller、独立计数器与 whole deadline；各 Source deadline 到该来源依赖满足并正式 admission 时才创建。prepare 受 operation/whole 时间预算，在首个异步 yield 前，仅用既有真实 DOM selector 定位唯一动态容器、固定至多 200 个可见 card Element 引用及当前 document/route。它不预读全部正文，不纳入之后新增卡片；容器不唯一或 prepare 超预算即保守拒绝。snapshot 不因等待身份、后续 admission 或 retry 重新固定；引用集合固定不等于 DOM 不变：读取时 node 已脱离初始容器、引用/作者边界改变或身份不符则拒绝该项，不从新 DOM 补位。

在已获准的节点边界复用 P1 判据：可见 `.message-entry a.right-entry__item-trigger`；唯一资料昵称与可见 UID 必须匹配 route；主卡位于 `main.route_dynamic .bili-dyn-list > .bili-dyn-list__items`；顶层作者使用 `.bili-dyn-item__header > .bili-dyn-title > span.bili-dyn-title__text`；引用区是 `.bili-dyn-content__orig.reference`，转发描述 `.bili-dyn-content__forw__desc` 必须在引用子树之外。缺失/矛盾仍拒绝，不以引用作者、引用正文、DOM 位置或昵称相同替代更强 UID 保证。

正文抽取、raw 校验、规范化、dedupe、quality 采用 chunk；每 100 visits 或每一张卡完成后让出一次宏任务，不能用仅 Promise.resolve 的微任务链冒充 timer/Abort 有机会运行。每个 operation 开始/结束、每 node/字段片段、每 chunk、dependency/admission、queue/start、backoff 前后、schema/Normalizer 前后、写入本运行 draft 前与最终 commit 前，检查 signal、active run lease、whole 与适用的 operation deadline；Source admission 后再检查该 Source deadline，包括尚未开始 attempt 的 queue/throttle。prepare 与 admission 前的 dependency wait 不检查尚不存在的 Source deadline；已完成 Source 的时钟不重新用于最终 run 身份复核。过期/取消后结果不得写入 report 或 memo；不执行后续 chunk。

timeout 可以用 timer 与终止 promise 让不合作的异步 operation 的调用方及时结束，但必须 abort 对应 lease、拒收 late result，并处理后续 rejection；这不证明底层异步工作已被杀死。生产 DOM driver 必须合作检查、yield，不用 Promise.race 包整段同步 reader 冒充可取消。

原生同步 DOM call、单次 Zod parse 与 JavaScript 同步片段不可抢占；1/5/10 秒是结果接纳 deadline，不是浏览器线程被强制中断的保证。返回后检查时间并丢弃迟到结果，记录 `sync_overrun`；不得声称绝对响应时长上界。pagehide 或明确 caller Abort 取消当前 run；popup 关闭不触发自动重发或后台续采集，已开始的本地 run 仍受原 deadline 完成/终止，不增加路由监听或跨 UID 自动重跑。

## 7. 生命周期、身份复核与来源隔离

run 状态只单向经过 admitted → preparing → running → verifying → terminal；run 的 admitted 不等于任何 Source 已 admission，Source scheduler 必须按各自依赖单独 admission。operation settlement/terminal transition 均至多一次。所有有界结果先存运行内 draft，不交给 popup。单 Source timeout/error 只终止该 Source，其他独立且仍可在 whole deadline 内执行的项可继续；整 run caller Abort/whole timeout 则不开始任何新工作。动态必须依赖同一次已确认 profile identity，不能把资料当行为证据。

outer failure 的 Source 丢弃其全部数据 draft，不在失败结果旁偷留可供消费的数据；警告仅留诊断 roll-up。其他已完整成功的 Source 可以在最终身份确认后保留。cap/坏候选导致的有界 partial 是内层数据状态，不是把 timeout/error 改写成 partial；它仅保留已完成批次，未完成批次丢弃。此前完成的批次不能在失败 Source 中伪装为调用成功。

成功 delivery 在最终复核前仅是 draft，不是已发布/终止的 Source outcome；最终复核失败时将待发布 draft 终止为对应 error，不算改写已终止 outcome。prepare/读取阶段已经产生的 unknown 或 outer failure 则保持原样。

最终发布前在当前 document 重新确认 route UID、可见 UID、昵称仍一致；仅存在待发布 dynamic 数据时额外复核初始动态容器仍一致。只发布 profile 时，不把动态容器缺失/不唯一误作 profile 身份失败；有 dynamic draft 时容器改变仍是整次发布拒绝。必要身份缺失或变化即丢弃整次 context/dynamic 数据，返回 runStatus `identity-rejected`，只留安全的 warning/error code。尚待发布的成功 draft 变为 outer `identity_recheck_failed`（missing）或 `identity_changed`（mismatch），不能保留含旧身份的成功 delivery；原已产生的独立 outer error 原样保留。已在 Source 中确认的不一致保留 `identity_mismatch`；复核缺失保留 `page_state_uncertain`，二者不猜原因。复核本身取消/过期时，待发布 draft 以对应 cancelled/timeout outer error 终止，同样禁止发布成功数据。无成功数据 draft 时无需再读 DOM 以证明不存在的数据身份。

所有终止路径 finally 清理 timer、Abort listener、pagehide listener、queue entries、backoff wait、memo、fixed card refs、draft 与 run-lock；clear/dispose 是幂等本地释放，不执行新 DOM/网络操作。受控永不 settle fixture 也必须让调用方终止并释放 owned resources；不存在还能在新 run 中写回的旧 continuation。run-lock 是单个 content-script 实例级别，不是跨标签全局锁；新点击必须新 lease/new DOM snapshot，拒绝并发点击不建立第二个 run。

## 8. Error taxonomy、重试与两套 warning

P3 使用 P2 AppError 最小形状、机器 code 与固定脱敏 message。异常 stack/raw message 不穿越运行响应；生产 error classifier 只接受受控 typed error，不能从页面文案猜 HTTP status。

| 情形                                                  | 外层 / 内层判定                                                                              | 自动重试                                     |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 身份/登录可见判据不明、加载不明、空态候选             | outer ok；inner unknown/null + Source warning                                                | 否                                           |
| 明确来源拒绝且 Adapter 有可信 typed source-state 依据 | outer ok；inner unavailable/null                                                             | 否；DOM 不能据此推断 HTTP                    |
| 个别候选拒绝、可选字段缺失                            | 保留合格项 partial；零合格项 unknown/null                                                    | 否                                           |
| operation/source/collection timeout                   | outer error `operation_timeout` / `source_timeout` / `collection_timeout`；无伪造 inner 状态 | 否                                           |
| caller/pagehide cancel                                | outer `cancelled`，不等于 timeout                                                            | 否                                           |
| invalid envelope/output/version                       | outer `schema_invalid` / `contract_version_unsupported`                                      | 否                                           |
| 发布身份复核缺失/变化                                 | outer `identity_recheck_failed` / `identity_changed`；保留对应 Source warning 的诊断 roll-up | 否                                           |
| 未预期执行异常                                        | outer `execution_error`，不转为 Source unavailable                                           | 否                                           |
| controlled typed 403 / unauthorized                   | outer `http_forbidden` / `unauthorized`                                                      | 否                                           |
| controlled typed 429                                  | outer `http_rate_limited`；可由未来显式新调用恢复，不在本 run retry                          | 否                                           |
| controlled typed transient network failure            | outer `network_transient` 且 recoverable=true                                                | 最多 2 次；指数 backoff 与剩余预算允许才开始 |
| controlled non-transient network failure              | outer `network_permanent`                                                                    | 否                                           |

本版 timeout/cancel/schema/execution/identity/403/unauthorized/network_permanent 的 recoverable=false；429/network_transient 的 recoverable=true，只说明未来可受控恢复，不承诺当前页面访问恢复。只按显式 code + recoverable=true 的 network_transient 白名单 retry，不以“所有 recoverable”作为策略。生产 DOM Adapter 当前没有网络操作，因此每个生产 operation 的 attempts=1；一个 Source 可有多个 chunk operation，Source attempts 统计是各 operation 的实际 attempt 总数。重试与 HTTP 分类覆盖来自 controlled fixtures，不冒充真实 B 站观测。开始 retry 前若剩余 Source/whole 时间不足下一次 backoff + 1 秒 operation 完整窗口，立即保留原失败并附 `retry_budget_exhausted`，不得延长预算。

多个停止条件只定一次：检查点同时到期时优先 whole deadline、Source deadline、operation deadline，再处理非 deadline Abort；已明确发生并 settlement 的 caller cancel 不被后来 timeout 覆盖。实现保存 stop reason，不从 `AbortError` 字符串猜原因。运行级失效不将此前 error 改名；统计只保留原 code 与停止原因。

SourceWarning 仍仅原三码；AppWarning 有独立白名单：`candidate_schema_rejected`、`mandatory_field_limit`、`optional_field_limit`、`card_text_limit`、`card_cap_reached`、`extraction_cap_reached`、`retry_budget_exhausted`、`sync_overrun`。code 可去重生成摘要，但完整内部来源 warning 与 App warning 不能互相替换。

## 9. run-local 去重与 memo

去重只消除同 run 对同一个初始卡片 occurrence 的重复处理/受控 retry 输出。Source 私有 token 与固定 card Element 一一对应，token 只活在 run 内，不进入 EvidenceItem、quality、summary、EvidenceId 或持久化。两个不同卡片即使正文/链接相同仍分别保留；不做跨卡、跨 Source、跨批历史或跨运行语义 dedupe。重复与 rejected 卡均消耗初始 200 scan slots 和实际读取预算。

memo 最多 201 条（1 profile + 200 card），键含同 run 的不可变已校验输入对象身份与 Adapter/schema/Normalizer 版本，值仅为已校验且有可用数据的成功规范化结果。partial 有真实合格数据可以复用；unknown/unavailable/empty candidate、outer failure 不存不命中。DOM node 或 page URL 单独不能作为不可变 memo key。memo 命中不免除信号/deadline与最终身份复核，也不能把失败读取替换成旧成功。新点击新 memo，finally 销毁，无 TTL/跨运行缓存。这里的去重/memo 不实现 P4 稳定 ID、Evidence Store、IndexedDB 或 Profile cache。

## 10. data-quality metadata

`EvidenceQuality` 严格四字段：`completeness: {required:'complete',optionalPresent:0|1|2|3}`、`timestampAvailability:'missing'|'exact'`、`traceability:'page'|'item'`、`sourceUsability:'partial'|'available'`。optionalPresent 是当前 Evidence 的 title 非 null、timestamp 非 null、确认为 item 粒度链接三项之和；mandatory 不完整的项不成为 Evidence，所以 required 不能伪写 incomplete 来放行。quality Zod 与 evidence 在一次联合 refinement 中验证一致性。

本次沿用 P1 Normalizer 的 timestamp=null、page trace，因此不得仅凭 dateLabel 显示“exact”，也不新增时间或 item-link 推断能力。sourceUsability 跟该项被接纳时的规范化来源状态，不跟另一来源或 whole run 是否成功混用；partial 有可用数据，不等于 unknown。collection quality 只是缺失字段与可追溯性的结构化等级/计数，不计算加权总分，不影响证据接纳以外的兴趣结论；不表示 relevance/strength/Analyzer confidence/Profile confidence，不流入评分或 UI 画像。

## 11. Runtime protocol 与兼容

新正式协议版本为 `protocolVersion: 1`；既有未版本化协议称 legacy，不倒填它为 version 1。新请求严格为 `{type:'analyze-interest',protocolVersion:1}`，无 policy/URL/UID 参数。一次有效点击取得一个 run；busy 拒绝不新建 run、不调用第二次 Pipeline。新 content handler 调用 `collectControlledSources` 一次；旧同步入口保持测试与显式 legacy 兼容，不作为失败时自动 fallback 的采集路径。

新响应是 strict 互斥 union：`{protocolVersion:1,kind:'unsupported'}`、`{protocolVersion:1,kind:'busy'}`、`{protocolVersion:1,kind:'execution-error',errorCode: approved AppError code}`，或 `{protocolVersion:1,kind:'collection',summary: CollectionSummaryV1}`。非 collection 分支不得携带 summary。collection 摘要如下：

```text
context/dynamic: { outcome: success | failure | not-started,
                  sourceStatus: SourceStatus | null,
                  errorCode: approved AppError code | null }
evidenceCount: integer 0..200 | null
sourceWarningCodes: original three-code enum[]
appWarningCodes: P3 AppWarning enum[]
runStatus: completed | cancelled | deadline | identity-rejected | contract-error
```

success 指外层成功而不是证据必定可用；unknown/unavailable 仍有自己的 sourceStatus，data/null 原义不变。failure/not-started 的 sourceStatus=null；not-started 的 errorCode=null。仅最终身份确认且 dynamic outer success、inner available/partial、有实际合格数据时 evidenceCount 为实际数量；其他为 null，当前生产不生成 0 的 empty 结论。`execution-error` 仅可含固定 safe code；strict parser 拒绝未知版本、字段、重复/未知 warning code、超限计数或矛盾 status/count，不泄露诊断原文。

每个来源 summary 的互斥规则：success 要求 sourceStatus 非 null、errorCode=null；failure 要求 sourceStatus=null、errorCode 为第 8 节非空枚举值；not-started 要求两者均 null。code 数组只来自报告对应 warning 层与诊断 roll-up；每层按首次出现顺序去重，不混合层级。整体身份拒绝/取消/deadline 禁止携可用动态计数。unknown/unavailable 与 null 不能被 parser 转换为 0。

协议 version 1 的生产 output/parser 不接受未经 proof 的 dynamic empty；P1/P2 的 empty 结构 schema 与正向合成 Contract fixture 保留，并不自动进入此运行协议。未来 proof producer 获批时另行更新协议/验收，不在本版悄悄开放空态升级。

UID、昵称、简介、正文、raw message、stack、run 私有 token 不出 content script。source/app warning code 独立数组，popup 只显示中性降级与“尚未生成兴趣画像”，不推断权限原因。连接失败无 SourceResult；不制造 unknown 来源来充当响应。

旧 popup 发严格 legacy 请求时，新 content 用同一个受控 runner 与同一 run-lock 执行一次，再作四字段旧 summary 投影；能完整表达的 SourceStatus 与三种 SourceWarning 可投影，若有 outer failure/not-started、AppWarning、身份整体拒绝或新终止语义，则返回 legacy execution-error，不能丢警告伪成功。原 `collectApprovedSources` 继续作为兼容接口，但不被旧消息绕过预算调用。

新 popup 遇旧 content（旧 strict parser 拒绝含第二个版本字段的整个请求）、超时无响应、不合版本或歧义响应，只显示保守“请刷新页面后再次主动操作”；**不得自动发送 legacy fallback、重发分析或探测性采集请求**。未来用户再次点击才是新 run。popup 不提供本次范围之外的新取消 UI；内部 Abort 用于 run 生命周期与受控测试。

## 12. controlled fixtures 与验收

所有 fixture 明标 synthetic/controlled，不代表真实 HTTP/权限/DOM 稳定性。每个 TypeScript DTO 对应 strict Zod、正反 fixtures 与 contract tests；Adapter/port 的行为测试与接口结构测试分开。fake clock/Abort/yield driver 需要证明控制顺序，不以 import error、空测试集或启动失败充当 RED。

| 必须覆盖            | 行为断言                                                                                                                                                                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1/P2 兼容          | 旧 registry keys、旧 Pipeline/Normalizer/reader 回归；unknown/null、empty proof 边界、引用归属和两层 Result/warning 不回退                                                                                                                                                                     |
| schema              | 两层状态混用、成功失败混字段、私有 raw 错字段、单坏项隔离、输出/quality 错配、版本不符拒绝；PrepareOutcome 不含 raw；partial 空 delivery 拒绝；raw 不漏出 port                                                                                                                                 |
| 资源预算            | 恰等/超时边界；prepare/dependency/admission 起算区分；admission 后 queue/throttle/backoff 计时；attempt lease 裁剪且父 deadline 不重置；200/201 卡；10,000/10,001 units；UTF-8 中英文、surrogate/空白；1 MiB 总量；mandatory/optional、rejected/duplicate 同计 cap；大无文本树 visits 与 yield |
| cancellation        | 预先 Abort、queue/backoff/chunk 中 Abort；原生调用迟到、永不 settle、late resolve/reject；清理幂等、旧 continuation 不写新 run、run-lock 可重新使用                                                                                                                                            |
| snapshot/identity   | yield 后新增卡不采；脱离容器拒绝；commit 前 missing/mismatch 丢全数据；保留 Source 独立失败但不为身份不安全发布旧成功                                                                                                                                                                          |
| 调度/错误           | concurrency=1、跨 Source start gap、retry 0/1/2 与不足预算；403/429/unauthorized/timeout/cancel/network 分码；unknown/empty candidate 不重试                                                                                                                                                   |
| dedupe/memo/quality | 同 occurrence 不重复、相同正文不同卡不合并；同版本不可变输入仅 run 内命中；未知/失败不命中；finally 释放；quality 不成为兴趣分数或 ID                                                                                                                                                          |
| runtime             | 点击前无 DOM/采集、有效一次点击一个 run、busy 无第二调用；summary 脱敏；legacy/new 组合与歧义 no-resend；failure 不变 empty 或 fake SourceStatus                                                                                                                                               |
| 静态边界            | 新旧各一条 exact binding 正例；alias、额外 binding、raw 类型、局部 re-export、require/dynamic import、其他 pipeline/source 导入反例                                                                                                                                                            |

timeout fixtures / boundary tests 必须以 controlled fake clock 明确证明以下语义（不是已取得的生产证据）：

- `t0=0`、prepare 在 800 ms 完成、profile 随后 admission、身份在 4,000 ms 确认时，dynamic 在 4,000 ms admission，`D_S=9,000 ms`，不是 5,000 ms；prepare 只占 operation/whole，dynamic admission 前的依赖等待不消耗 dynamic Source 预算，profile 自己 admission 后的工作仍计其 Source 预算；fixed snapshot 不重建。
- prepare 在 900 ms 完成且 profile 随后 admission，身份在 5,800 ms 确认时，dynamic `D_S=10,800 ms`，但 `D_W=10,000 ms` 不变；9,500 ms 才开始的 attempt lease 最迟 10,000 ms 到期，不能得到完整额外 1 秒。若 whole 已到期，dynamic admission/attempt 均为零。
- 依赖未满足时 dynamic admission/Source timer 为零；profile unknown/unavailable 的依赖 preflight 仍保留 unknown/null，profile outer failure 仍按既有 dependency_failed 规则处理，不启动 dynamic job。
- admission 后 queue/throttle/backoff 均消耗 Source 预算，`D_S` 不变；`now==D_S` 或 `now==D_W` 不得启动/接纳对应结果。每次 retry 可新建 operation lease，但两个父 deadline 不变；迟到 resolve/reject 与 finally 清理规则不变。

实施验收在干净可重建状态执行 frozen install、lint、Prettier、typecheck、unit/golden/integration/full Vitest、P1 compatibility、AST/raw leakage、Chrome/Edge production build、bundle budget、Manifest/版本/权限和 diff 检查，记录 fresh exit code、实际计数/FAIL，不引用 P2 的历史 217/217 当 P3 完成证据。重要 Task review 与独立总 review 发现当前 scope 内成立问题须修复重验；不得放宽断言、预算或权限换取绿灯。

## 13. Chrome / Edge 真实安装态边界

在已加载最新 production unpacked build、允许现有站点访问并刷新当前用户已打开的公开动态页上分别验收：点击前新 runner=0，单击后 runner=1、summary=1；popup 与脱敏结果一致、UI 不崩溃；unknown/null 正常显示，不能据此声称成功采集兴趣证据。内部次数用现有可审计只读 DevTools 观测或测试 instrumentation，并区分真实 runtime 与 synthetic；不提交真实身份、正文或浏览器 profile。

真实页面用于确认既有 DOM Contract 没有被新接合破坏、production 协议/消息链路正常，不要求主动制造 timeout/403/429、分页、CAPTCHA 或跨 UID 路径。取消、上限、异常分类与 late-result 的合成受控证据不能冒充真实站点异常已发生。若新结构信息不可得，记录具体 BLOCKED_ENV，不能猜 selector 或自动给予未来未验证项债务例外。

原 Runtime 已获批准的持续未允许站点访问 `BLOCKED_ENV`、撤销后即时/重载状态 `NOT_VERIFIED` 保留，不能冒充 PASS，也不为本 Spec 重复受限尝试。新协议不会改变访问权限或静态注入机制；若后续实施产生新的安装态失败，按真实 FAIL 调查，不将它自动归入旧例外。Playwright synthetic extension smoke 与真实 Chrome/Edge 安装态互不替代。

## 14. 文档同步、残余风险与后续门禁

Spec 获批后的单份 Plan 必须包含必要一致性同步：ARCHITECTURE/README/Issue 的当前阶段为用户已批准的 P3（不是 P3 已完成）；P2 的“本轮不授权 P3”属于历史审批边界，不删除历史；runtime 新协议和受控入口描述以本 Spec 为新增规则，旧协议和生产限制保留。ADR-007 的三层职责、Phase 0 history、pagination/SPA 原状态不改。Implementation Plan 才给出可执行任务及阶段验收顺序，不能由本 Spec 自动进入 TDD。

残余风险与重验条件：

- DOM 会漂移、top-level author 目前主要是昵称匹配、原生同步操作无法硬抢占；新增 selector/更强作者身份或能力须有真实结构证据与相应审批。受控 checkpoint 降低迟到发布风险，不宣称已解决所有 DOM 漂移或同文档 UID 切换。
- pagination NOT_VALIDATED、SPA PARTIAL，按 [ADR-007](../../adr/ADR-007-phase0-gate-separation.md) 的真实长列表/同文档路径条件及能力扩展前门禁重验；本版 cap=1 不是分页通过。
- 单快照 empty candidate 持续 unknown/null；未来 proof producer、观察边界与接口另行设计/批准，不预设读取次数或等待时长。
- 403/429/unauthorized 与网络 retry 当前仅 controlled coverage；未来加入 production transport 才做真实网络验证，不能把分类表当现场证据。
- memo/dedupe 只在本 run；稳定 EvidenceId、跨运行去重/缓存与持久化、Profile cache 仍属于 P4，不能以本次实现宣称完成。
- [P1 Playwright debt](../../validation/2026-09-30-playwright-chromium-blocked-env.md)继续 **OPEN / BLOCKED_ENV / NOT_VERIFIED**；P1 Task 6、Task 8、Engineering Foundation Plan incomplete。历史 Sandbox 原始日志缺失仍是限制；已批准进入 P3不等于 P1 全面通过。在环境首次合格恢复或 merge main 前（先到者）必须补跑 bundled Chromium；断言失败转真实 FAIL，不关闭 sandbox/放宽 ACL/换品牌浏览器/降断言制造 PASS。规则见[具名债务规则](2026-09-29-environment-blocked-validation-rule.md)。merge/release 另需批准。

本 Spec 的审批只冻结上述合同与预算，并授权下一步 writing-plans；Plan 仍须用户明确审批后才能实施。不得自动进入 P4、启动新 Spike、改 Phase 0 Gate、merge main、Release/tag 或关闭债务。文档 commit/push 只保存待审批文本，不等于 Spec 或 Plan 获批。
