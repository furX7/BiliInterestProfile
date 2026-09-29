# v0.1 Runtime Analysis Trigger 与安装态链路 Spec

状态：**Approved Spec / Runtime Plan Approved for execution**。本 Spec 先获用户批准用于编写待审批 Plan；用户随后明确批准该 Plan 并授权实施。最新批准的两项安装态残余风险仅调整 Plan 的收尾判定，不把未验证行为改写为 PASS，也不修改 Gate 或进入新 Phase。

## 1. 目标与权威边界

定义用户主动触发 v0.1 公开动态采集的运行时链路，并规定站点访问可用与不可用时的行为及 Chrome / Edge 安装态验收。目标是把已批准的来源 reader 与 Pipeline 接入真实扩展运行环境，不实现兴趣分析算法或完整画像界面。

本 Spec 依据用户已批准的 v0.1 来源组合 Spec、Phase 0 closure 决定、当前 Implementation Plan、Notion《项目 Idea》《详细制作流程》《工程流程优化》，以及 `codex/phase1-source-foundation` worktree 的 Task 3–6 实现（本次审阅基线 commit `f4a54e4`）。实施计划须再次确认该分支的最新接口；主工作区的 Phase 0 快照不代表 Task 3–6 的实现状态。冲突时以用户最新决定、Notion、已批准 Spec / ADR 的权威顺序处理；本 Spec 不更改这些来源。

既有边界继续有效：公开动态是唯一兴趣行为证据；公开基础资料只作身份与上下文；投稿排除、收藏不纳入；只读当前已渲染卡片；不宣称多源印证。pagination = NOT_VALIDATED、SPA UID switch = PARTIAL，均为接受并记录的 deferred validation / residual risk，不是 PASS / DONE，也不授权扩展为分页或同文档跨 UID 采集。

## 2. 决策

采用**扩展 Action popup 的显式操作**：用户点击浏览器工具栏扩展图标，在 popup 中点击“分析兴趣”；popup 只查询当前活动标签的 tab ID，并向该标签已注入的 content script 发送固定的分析触发消息。content script 收到后才调用现有 `collectApprovedSources(document, currentUrl)`。Chrome 文档说明，基本 `tabs.query` 与 `tabs.sendMessage` 可在不声明 `tabs` permission 时使用；Edge 官方示例也采用 popup → 当前 tab → content script 的消息模式。本设计不读取 tab URL、标题或图标，不查询其他标签，不新增权限。参考：[Chrome tabs API](https://developer.chrome.com/docs/extensions/reference/api/tabs)（accessed 2026-09-29）、[Chrome API 权限说明](https://developer.chrome.com/docs/webstore/troubleshooting#tabs)（accessed 2026-09-29）、[Microsoft Edge popup/content-script 示例](https://learn.microsoft.com/en-us/microsoft-edge/extensions/samples/picture-inserter-content-script)（accessed 2026-09-29）。

v0.1 的采集面限定为 `/[正整数 UID]/dynamic`。空间根页 popup 请求由 content script 回答为“不支持当前页面，请打开该空间的动态视图”；不得自动导航。content script 对每次触发都读取当时的 URL 与 Document，不缓存 UID 或旧来源结果；路径不匹配时不调用 Pipeline。这样支持用户正常站内导航后再次显式点击，但不增加路由监听、自动续跑或自动采集，也不宣称 SPA UID switch 已验证。

选择此方案，是因为扩展 popup 在 content script 无法注入时仍可说明通用恢复步骤；正常采集仍复用已注册的静态 content script 与 DOM-only 权限边界。仅使用 popup 与 content script 的一次消息，不引入 service worker、扩展主动网络请求、动态注入或新增权限。扩展不读取 Cookie、Token、页面私有 JS state，不绕过登录、站点访问设置、CAPTCHA 或风控。

曾考虑在页面内放置按钮：站点访问被拒绝时该按钮及提示均无法注入。也不采用动态注入方案，因为它会改变当前权限边界。popup 是本范围内既能保持用户主动操作、又能在无页面脚本时给出说明的最小方案。

## 3. 运行链路与职责

1. Chrome / Edge popup 查询当前窗口活动 tab 的 ID。除发送用户明确触发的消息外，不读取 tab 敏感属性。
2. 若该页有静态 content script，content script 验证消息类型并检查当前 URL 是否仍为受支持的动态路由。路径不匹配时只返回 unsupported 状态，不调用 Pipeline。
3. 在支持的路由上，每次触发读取当前 `Document` / URL 并调用既有 Pipeline 恰一次。运行期间拒绝并发重复触发；结束后将本次状态回传 popup。全链路无自动运行。
4. Pipeline 仍独立读取 `ProfileContext` 与动态候选，校验 route UID、可见资料 UID、头部身份及卡片顶层作者；仅将可确认的动态正文规范化为 `EvidenceItem`。基础资料不得进入兴趣证据数组。
5. content script 保留 Pipeline 的完整结果，仅将 `context.status`、`dynamic.status`、已确认的证据数量及 warning code 组成脱敏摘要回传 popup；`unknown/unavailable` 或执行异常时证据数量为 `null`。popup 不接收 UID、昵称、简介或证据正文。结果须说明“已完成公开动态采集；本版本尚未生成兴趣画像”，不得显示或计算兴趣分数、画像、置信度、趋势或多源一致性；这些不在本 Spec 范围。
6. UI 状态是本次运行的临时状态，不持久化页面内容、证据或画像，不发送遥测，不向 Analyzer 或远端传输数据。

content script → popup 响应仅允许三类：`unsupported`、`execution-error`，或 `collection` 摘要。`collection` 摘要只含 `contextStatus: SourceStatus`、`dynamicStatus: SourceStatus`、`evidenceCount: number | null`、`warningCodes: SourceWarning['code'][]`。数量仅从已确认 `dynamic.data` 计算；`unknown/unavailable` 时必须为 `null`。不得回传 `ProfileContext`、`EvidenceItem`、原始 warning message 或任何 DOM 文本。popup 消息连接失败由 popup 自行表示为 `connection-unavailable`，不制造来源响应。

调用方不得复制 reader 逻辑或绕过 Pipeline。当前 `SourceResult` 语义保持不变：`unknown` / `unavailable` 的 `data` 保持 `null`；`partial` 只携带实际通过验证的证据并保留 warning。调用方不得把 `null` 转为空数组，也不得根据卡片数量、文案或失败原因自行制造 `empty`。现有单快照空态仍为 `unknown/null`，直到另有获批并实现的 proof Contract 与 producer。

## 4. 用户可见状态与降级

popup 提供 idle、sending、unsupported、connection-unavailable、completed 等交互状态；收到 Pipeline 响应后原样显示其既有 `SourceStatus`，不新增或重定义来源状态。

- `available` / `partial`：显示已确认动态证据数量；`partial` 只依据回传的 warning code 与不完整状态作中性说明，不暗示身份或内容归属必然不确定；不展示被拒绝内容。不得暗示已生成兴趣画像。
- `unknown` / `unavailable`：明确说明本次无法确认可用动态证据；不展示为零条、空数据或分析结论。若有 warning，只按 code 显示中性说明；原始 message 留在 content script，不根据文案推断失败原因。
- 执行异常：显示本次采集未完成；不得伪装成正常空结果。用户再次点击是一次新的显式运行。
- `empty`：当前 reader 不具备生成此状态的稳定性 proof。若未来合法 producer 引入，须按届时获批 Contract 处理；本 Spec 不新增、推断或升级 empty。

身份缺失/不一致、未登录可见判据缺失、动态容器未知或页面仍加载时，不生成可用兴趣候选。不得推断具体失败因果，不得用 profile context 替代行为证据。

## 5. 站点访问与安装态行为

当前生产 Manifest 的静态 `content_scripts.matches` 为 `https://space.bilibili.com/*`，不添加 `permissions`、`host_permissions`、`optional_host_permissions`、`activeTab`、`tabs`、`scripting`、`cookies` 或其他能力。`tabs` API 的基本查询/发消息方法不要求声明 `tabs` permission；仅取当前 tab ID，不读取其 URL、标题等受限字段。matches 表示注入范围，不表示所有用户已授予站点访问；用户可在浏览器管理扩展站点访问。

- 站点访问允许：静态脚本可注入；仅在 popup 的显式点击消息后发生本地 DOM 读取和 Pipeline 调用。
- 站点访问未允许 / 脚本未注入：popup 的消息失败处理显示中性说明：“无法连接当前页面。请确认这是 B 站空间动态页、扩展已获该站点访问权限，并在授权后重新加载页面。”不得断言原因必为权限拒绝。没有 content script 时没有 DOM 读取、Pipeline 调用或 `SourceResult`；popup 消息错误不是来源状态，不得显示为 empty/unknown 或隐私拒绝。此处理满足权限计划中“访问受限时给出可理解提示”的调用方要求。
- Chrome 的“选择扩展时允许访问”会在用户打开扩展时临时允许当前站点，因此不能用它充当“未允许”的测试条件；若 popup 此时暂时连不上脚本，也不得推断用户拒绝了站点访问。该模式单独记录实际注入与连接结果；本 Spec 不承诺首次选择后脚本立即可用。[Chrome 官方站点访问说明](https://support.google.com/chrome/answer/2664769?hl=en)（accessed 2026-09-29）。Edge 的对应行为以安装态实测为准。
- 更改站点访问设置后，按 Chrome / Edge 的实际注入生命周期重新打开或刷新同一测试页再验；不得假定已打开页面会立即补注入。已注入页面上的权限即时撤销效果不作保证，验收限于重新加载后的状态；不得宣称撤销设置后旧文档已即时停止采集。

安装态验证必须分别针对 Chrome 与 Edge 的生产 MV3 构建执行。允许状态：在受控测试配置中授予站点访问，重新加载当前已打开的合格公开动态页，从 popup 点击一次；观察 popup 响应、唯一 Pipeline 调用与脱敏状态摘要。未允许状态：使用经浏览器界面确认、即使打开 popup 也持续排除 `space.bilibili.com` 的受控站点访问配置，再重新加载同一测试页，从 popup 点击；观察浏览器未注入 content script、消息连接失败处理、零 Pipeline 调用及无来源结果。若浏览器无法提供这样的受控配置，该项安装态验收记为 `BLOCKED_ENV`，不得用“选择扩展时允许”或其他非拒绝状态代替。通过运行期调用探针 / DevTools 扩展上下文记录注入与调用次数，但不读取或导出页面私有 state、凭据或原始正文；不能以“没有显示结果”单独证明“没有读取”。不得搜索其他账号、调用私有接口或将开发热更新结果冒充生产安装证据。测试记录须脱敏，不保存真实 UID、昵称、正文、Cookie 或 Token。

## 6. 安全、隐私与延期风险

- 页面文本只在内存中用于当前 Pipeline 调用；不持久化、不上传、不做后台采集。popup 不接收或展示原始证据文本。
- `ProfileContext.description` 只作上下文，不送入兴趣证据或评分。
- 控件与结果不得暴露原始卡片正文、个人资料简介或未确认内容。
- 静态 content script 匹配范围保持现状；不借本 Spec 增加 host/API 能力。
- SPA UID switch 的既有 `PARTIAL` 意味着不得承诺同 document 切 UID 后旧运行与新身份隔离已验证。本 Spec 不新增路由监听或跨 UID 自动续跑；每次用户新触发时读取当时页面快照，页面身份变化或不一致时 reader 必须拒绝证据。安装测试不宣称 SPA switch Gate 已验证，也不验收更强切换保证。
- pagination 仍不支持。本次运行只读取触发时 DOM 中已渲染且可见的卡片（不要求卡片位于屏幕视口内），不主动滚动、不翻页、不声称完整历史。

## 7. 验收条件

1. Chrome 与 Edge 生产构建均安装成功，Manifest 权限与第 5 节一致；popup → active tab → content script 消息往返成功，不需要声明 `tabs` 或新增权限。
2. 用户未点击前没有来源读取或 Pipeline 调用；动态视图上的一次 popup 显式点击恰触发一次本地 Pipeline 调用。popup 查询仅限当前活动 tab 且仅读其 ID。
3. content script 不改写 Pipeline 的来源状态与 warning；popup 消息严格符合第 3 节的三类响应和四字段脱敏摘要，不含原始 `context` 或 `dynamic.data`；基础资料不成为兴趣证据。
4. `unknown/null`、`unavailable/null`、`partial` 和当前空态候选的语义在 UI 边界保持一致；无路径把 unknown/unavailable/异常/零卡改写为 empty/`[]`。
5. 用户站点访问允许时验证完整运行链；未允许时通过受控权限设置、页面重载与运行期调用探针证明 content script 未注入、Pipeline 调用数为零，popup 显示中性恢复说明且不伪造来源状态。
6. 不新增权限、B 站网络请求、持久化或遥测；不采集投稿/收藏；不进入分页、SPA UID switch 扩展、评分或画像展示。
7. 真实安装态证据与合成测试分别记录；合成数据不得作为真实网页或安装态证据。

## 8. 非目标与审批边界

本 Spec 不实现 Analyzer / Scoring、画像 UI、后台任务、缓存或存储、导出分享、SPA UID switch 监听/隔离、分页、投稿/收藏、API 请求、权限变更或站点访问权限申请 UI；不修改 Phase 0 Gate、已接受 ADR 或现有来源证据状态。

权限计划 Task 6 曾建议在站点访问受限时“保持来源不可用状态”。本 Spec 将未注入场景明确为 popup 的 `connection-unavailable` 交互状态：此时根本没有来源读取，不能构造 `SourceResult.unavailable` 来冒充来源反馈。popup 仍向用户提示检查站点访问。用户批准本 Spec 后，Implementation Plan 应列出对权限计划该句的最小一致性同步；本阶段不改动已批准 Plan。

本 Spec 获批后已据此编写、另行审批 Runtime Implementation Plan；Spec 批准本身不曾授权 Plan 执行或 Git 外部动作。Chrome / Edge 安装态验证按计划在用户自有浏览器与明确测试条件下实施；若受浏览器审批/自动化限制阻断，记录 external BLOCKED，不得换通道绕过。

## 9. 审批记录

2026-09-29：用户明确批准本 Spec，授权调用 `superpowers:writing-plans` 并一次性形成待审批 Implementation Plan；Plan 未获批准前不实施。安装态验收须区分允许、未允许、撤销后状态；Chrome“选择扩展时允许”不可预设为拒绝访问；即时撤销效果以真实可复现行为为准，无法复现则记为未验证或 blocked。

2026-09-29：用户随后明确批准 Runtime Implementation Plan 实施，并仅批准持续未允许 `BLOCKED_ENV`、撤销后（即时及重载后分列）`NOT_VERIFIED` 作为收尾残余风险；其余原有必需验收仍须满足且无未解决 FAIL。本记录仅同步审批状态，不改变本 Spec 的来源、权限或产品行为 Contract。
