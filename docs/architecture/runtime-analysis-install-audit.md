# Runtime Analysis Trigger 安装态审计

状态：**Task 4 complete with residual risk；Runtime Plan 待最终总审阅与复验**。Chrome / Edge 最新 production build 的已允许路径已有真实安装态 UI 与单击调用计数；仅持续未允许与撤销后状态适用已批准的残余风险例外。本审计随 Plan Task 4 Step 6 的 logical checkpoint 保存；本结论不代表整个 Phase 1 已完成。

本记录只保存真实安装态观察及其缺口；合成测试和生产构建结果不替代浏览器运行证据。不得记录 UID、昵称、页面正文、Cookie、Token 或页面私有状态。

## 观察边界

- 待测包：本 worktree 生成的 Chrome / Edge MV3 production build。
- 当前构建溯源（本轮只读补录）：worktree HEAD `ad293d41b130fb4a4821157f9dd662f6643e810c`；两个生产 Manifest 的 `version` 均为 `0.1.0`，SHA-256 均为 `E6FD58A652968804D028D75A280E5B7ABAD7386BE9F938D173513274F5D6BEC5`；两份 production content bundle 的 SHA-256 均为 `645BFD7FD5ED6158A302EE6AFD175C9B0C744F8FBA312E4F0660055DDDBC839E`。这些是当前输出文件标识；用户报告手动加载的是本 worktree 的 unpacked build，未独立对浏览器已加载文件做逐字节核验。
- 当前本机运行进程的只读版本信息：Chrome `153.0.8010.53`、Edge `154.0.4258.37`。原 Logpoint 观察时未同步记录 About 页面版本，故这里只作本机浏览器环境溯源，不冒充当时的版本截图。
- 首次已允许路径的人工 Logpoint 观察发生在本轮 popup review fix 之前。之后仅修复 popup 状态文字和活动 tab 查询拒绝处理；本轮重新构建的 Chrome / Edge popup bundle 均为 `popup-CzpJ1kEi.js`（SHA-256 `443209412B8A69B97350474AC0F7DABF8B5C7C8698393DA4AF478B1FBDBC9892`），Manifest 与 content bundle 标识保持上述值。旧运行观察只证明当时已安装版本的 0→1 调用链；新版 UI 与新版单击调用计数由用户随后分别报告。未独立逐字节核对浏览器实际加载的 bundle。
- 用户已报告两种浏览器均已手动加载 unpacked build，已授予 `space.bilibili.com` 站点访问并刷新一张公开动态页。该报告是测试前提，不是下面的自动化运行证据。
- Chrome 的只读页面检查确认当前测试页具有合格正 UID 动态路由、`main.route_dynamic` 和既有登录可见标记。该检查没有读取个人资料或动态正文，也不证明 content script 已注入。
- 本审计必须区分 Chrome 的“选择扩展时允许”、真实持续未允许状态和撤销后的重新加载状态；不预设它们等价或即时生效。

## 2026-09-29 manual runtime observation

用户在已加载 production unpacked build、已授予站点访问并刷新测试页后，分别人工观察到：

| 浏览器 | 人工观察 | 能说明什么 | 不能说明什么 |
| --- | --- | --- | --- |
| Chrome | popup 可正常打开；点击“分析兴趣”后收到 `page_state_uncertain`；UI 未崩溃。 | popup 能从已注入页面收到可解析的 collection 摘要。 | 单独观察不证明已形成兴趣证据、没有自动读取，或实际 Pipeline 调用次数恰为一次；后续 Logpoint 证据另列如下。 |
| Edge | popup 可正常打开；点击“分析兴趣”后同样收到 `page_state_uncertain`；UI 未崩溃。 | Edge 的人工观察与 Chrome 的 popup 降级表现一致。 | 单独观察不能独立证明同一 reader 根因、注入状态或调用次数；后续 Logpoint 证据另列如下。 |

这两项是 **manual runtime observation**，不是 `observed PASS`。`page_state_uncertain` 表示来源状态为 `unknown/null`，而不是“已成功采集兴趣证据”。

## 2026-09-29 已允许站点访问的 runtime Logpoint observation（popup 修复前构建）

用户在 Chrome 与 Edge 的现有 production unpacked build 中，对已授予 `space.bilibili.com` 站点访问、已重新加载的同类公开动态页进行了只读 DevTools Logpoint 观察。两边结果一致：

| 浏览器 | 点击前 | 单击一次后的真实运行时观察 | popup 观察 | 结论 |
| --- | --- | --- | --- | --- |
| Chrome | `collectApprovedSources` invocation = 0 | invocation = 1；summary count = 1；`contextStatus = unknown`、`dynamicStatus = unknown`、`evidenceCount = null`、`warningCodes = [page_state_uncertain]`。 | 与该脱敏 summary 一致；UI 未崩溃。 | VERIFIED（已允许站点访问路径） |
| Edge | `collectApprovedSources` invocation = 0 | invocation = 1；summary count = 1；`contextStatus = unknown`、`dynamicStatus = unknown`、`evidenceCount = null`、`warningCodes = [page_state_uncertain]`。 | 与该脱敏 summary 一致；UI 未崩溃。 | VERIFIED（已允许站点访问路径） |

这是 **manual real-production runtime observation**：Logpoint 只记录调用计数以及既有脱敏 summary 字段；未读取或记录 UID、昵称、正文、Cookie、Token 或页面私有状态。它证明静态 content script 已注入、点击前没有自动 Pipeline 调用，且单次用户点击恰触发一次 Pipeline 调用；它不把 `unknown/null` 升级为可用兴趣证据。

## 2026-09-29 新版 production build 人工 UI 回归

用户报告最新 production build 在 Chrome 与 Edge 均已真实安装观察：popup 正常打开，“分析兴趣”可触发；基础资料与公开动态来源状态均显示 `unknown`，warning 为 `page_state_uncertain`，中性降级文案正常，UI 未崩溃。这是新版 **manual installed UI observation**，与旧版 Logpoint 证据分列；它不证明点击前 Pipeline 调用数为 0，也不证明单击一次后恰为 1，不把 `unknown/null` 改写为可用兴趣证据。

## 2026-09-29 最新 production build 单击 runtime observation

用户随后针对最新 production build 清空 DevTools Console 并重新进行单次点击验收，报告以下真实运行时计数；此前一次误点两次的观察作废，未纳入本表或验收结论。

| 浏览器 | 点击前 Pipeline invocation | 单击一次后 Pipeline invocation | 与同构建 UI 观察合并判定 |
| --- | --- | --- | --- |
| Chrome | 0 | 1 | 已允许路径 VERIFIED；popup 返回脱敏 `unknown/null`、`page_state_uncertain`，中性降级且未崩溃。 |
| Edge | 0 | 1 | 已允许路径 VERIFIED；popup 返回脱敏 `unknown/null`、`page_state_uncertain`，中性降级且未崩溃。 |

这是用户报告的 **manual real-production runtime observation**，不是 synthetic 测试，也不把调用次数推断为可用兴趣证据数量。新版 summary 的独立计数未在本次报告中给出；可观察的 popup 脱敏字段与此前 UI 回归分别记录，不将旧构建的 summary count 转记为新版数值。

## 自动化代码路径证据

2026-09-29 对 `content-analysis-handler`、popup、runtime message 与 approved-source pipeline 的相关测试进行了 fresh run：4 个测试文件、26 项测试全部通过。

- synthetic document / mock collector 的 handler 测试证明：收到固定 `analyze-interest` 请求前不会调用采集器；在受支持动态路由上，一个请求恰调用一次；运行中的重复请求不会启动第二次采集。
- popup 测试证明：用户点击只向当前活动标签发送固定请求，并在等待响应时禁用重复点击。
- pipeline / message 测试证明：`unknown/null` 与 warning code 按既有 Contract 传播，不被改写成成功证据。

这些是**自动化代码路径证据**，不是真实扩展运行时遥测；它们不能证明安装后的注入已发生、实际点击前没有读取，或真实浏览器中恰发生一次 Pipeline 调用。

## Chrome 的已确认原因

在当前可控 Chrome 测试页的只读 DOM 检查中，动态页路由、登录标记、单一动态列表、卡片容器和已渲染卡片均存在；12 张卡片的顶层作者均与可见页头名称一致，其中 9 张存在可用的当前用户正文。因此这不是零卡空态、loading 或顶层作者边界导致的 `unknown`。

首次产生 `page_state_uncertain` 的位置是 `readProfileContext`：它要求 `.sic-fsp-uid_line` 的**可见文本**含有可与路由核对的正整数 UID。当前真实节点仅有标签性伪元素，节点及其子节点没有可读 UID 文本；因此 reader 返回 `unknown/null` 和 `page_state_uncertain`，且不创建 `ProfileContext`。

后续传播路径为：`readDynamicCards` 将未确认的 profile identity 保持为 `unknown` → `collectApprovedSources` 原样返回 `dynamic: unknown/null` → `summarizeCollection` 保留 warning code 且 evidenceCount 为 null → popup 显示“本次无法确认可用动态证据”。popup 没有生成或放宽该状态。

该行为符合当前已批准的身份/unknown-null Contract：在没有另一个获批、真实可审计的可见身份判据前，不能将路由 UID 单独当作确认身份，也不能为了显示“成功”降低 reader 门槛。未针对这一身份根因修改 reader 或 Pipeline。

## 运行态矩阵

| 浏览器 | 场景 | 需要的实际观察 | 当前状态 | 证据 / 限制 |
| --- | --- | --- | --- | --- |
| Chrome | 允许（原已安装构建） | 页面重载后 content script 注入；一次 popup 显式点击得到脱敏摘要；可确认恰一次 Pipeline 调用且点击前没有自动读取。 | VERIFIED | production runtime Logpoint 观察到点击前调用数 0、单击后调用数 1 与一份脱敏 `unknown/null` summary；popup 一致且未崩溃。 |
| Chrome | 允许（本轮 popup 修复后新构建） | 安装态 UI 回归；点击前 0、单击后 1 的运行时调用计数。 | VERIFIED | 最新构建清空 Console 后单击观察为 0→1；同构建 popup 脱敏状态、warning 与中性降级正常。误点两次的观察作废。 |
| Chrome | 选择扩展时允许 | 单列实际注入与连接结果，不作为未允许证明。 | NOT_VERIFIED | 未单独观察这一可选模式的注入与连接；不能用它替代持续未允许测试，也不将其记为 PASS。 |
| Chrome | 持续未允许 | 重载后无 content script、零 Pipeline 调用、popup 中性连接提示且无来源结果。 | BLOCKED_ENV | 受支持通道不能稳定构造或观察 popup 打开后仍持续未允许的站点访问状态；不得以临时允许或无结果替代。 |
| Chrome | 撤销后：旧文档即时 | 若有正常用户可见撤销操作，记录即时实际注入与连接结果；不预设即时失效。 | NOT_VERIFIED | 未稳定观察撤销操作及其即时效果；不得当作已停止采集。 |
| Chrome | 撤销后：重载/重开 | 撤销后重新加载/重开同页，记录实际注入、调用与连接结果。 | NOT_VERIFIED | 当前受支持通道无法稳定观察该配置及重载后结果；不得当作权限拒绝已通过。 |
| Edge | 允许（原已安装构建） | 与 Chrome 允许态相同的 popup、注入、一次调用与脱敏摘要观察。 | VERIFIED | production runtime Logpoint 观察到点击前调用数 0、单击后调用数 1 与一份脱敏 `unknown/null` summary；popup 一致且未崩溃。 |
| Edge | 允许（本轮 popup 修复后新构建） | 安装态 UI 回归；点击前 0、单击后 1 的运行时调用计数。 | VERIFIED | 最新构建清空 Console 后单击观察为 0→1；同构建 popup 脱敏状态、warning 与中性降级正常。误点两次的观察作废。 |
| Edge | 选择扩展时允许（若提供对应模式） | 若浏览器提供此模式，单列实际注入与连接结果，不作为未允许证明。 | NOT_VERIFIED | 未确认对应模式及其运行行为；不把它推断为持续未允许。 |
| Edge | 持续未允许 | 与 Chrome 持续未允许场景相同。 | BLOCKED_ENV | 已允许路径的 Logpoint 通道可用，但无法稳定构造/观察 popup 打开后仍持续未允许的状态；不得把无结果或暂时断连写为 PASS。 |
| Edge | 撤销后：旧文档即时 | 若有正常用户可见撤销操作，单列即时效果。 | NOT_VERIFIED | 未稳定观察撤销操作与即时效果；不预设脚本立即失效。 |
| Edge | 撤销后：重载/重开 | 撤销后重载/重开同页，单列实际注入与连接结果。 | NOT_VERIFIED | 当前受支持通道无法稳定观察重载后权限状态及结果；不得写为 PASS。 |

## 结论与残余风险

截至本次记录，Chrome 与 Edge 的已允许站点访问路径均已取得真实 production runtime 调用计数与脱敏 summary 证据；Chrome 的 `page_state_uncertain` 根因仍是已记录的可见 UID 不可确认，符合保守 `unknown/null` Contract。持续未允许与撤销后场景仍无稳定真实观察。

上述为 Plan 修订前的收尾判断。用户随后仅批准两项例外：持续未允许无法稳定复现保留 `BLOCKED_ENV`；撤销后无法稳定观察保留 `NOT_VERIFIED`，并区分即时与重载后。它们都不是 PASS。按修订后 Plan Step 5，其余原有必需项仍须满足、不得有未解决 FAIL；其他未验证项不得被这两项例外自动覆盖。Chrome / Edge 的“选择扩展时允许”仍单列 `NOT_VERIFIED`，不作为持续未允许证明；该独立观察类别不是 Spec §7 明列的必过安装态场景，也未作为新例外计入完成判定。

本轮独立总审阅发现并按 TDD 修复 popup 对活动 tab 查询拒绝时的恢复处理，以及未原样显示来源状态的问题。修复后的生产 popup bundle 与旧版 Logpoint 观察时的 bundle 不同；旧版证据没有转记为新版证据。用户已分别提供 Chrome / Edge 最新构建的安装态 UI 回归和清空 Console 后单击 0→1 的真实运行时计数，故 Task 4 Step 2 的新版调用计数缺口已补齐；此前误点两次的观察不计入。Task 4 其他既有必需项由真实安装观察、脱敏 UI 与自动化代码/Manifest 检查分别覆盖，未发现未解决 FAIL；仅 Plan Step 5 明列的两类权限观察保留残余风险，不新增 Agent Gate。

独立审阅未发现 Critical / Important 问题。2026-09-29 提交前 fresh verification：Vitest 67/67、ESLint、TypeScript noEmit、Chrome / Edge 生产 MV3 build、构建后 Manifest 测试 8/8、直接 Manifest JSON 审计及 `git diff --check` 均通过；两个 Manifest 均只匹配 `https://space.bilibili.com/*`，有 popup 入口且无新增权限字段，当前生成 bundle 哈希与上文标识一致。真实安装态与 synthetic 测试分列；Runtime Plan 的最终总审阅与再次 full verification 仍须独立完成。

两项残余风险的重验条件：当受支持的 Chrome / Edge 操作能稳定提供 popup 打开后仍持续未允许的站点访问配置时，分别在重载后的真实安装态重验未注入、零 Pipeline 调用与中性提示；当正常用户可见撤销操作及其状态可稳定观察时，分别重验旧文档即时效果和重载/重开后的实际注入、调用与连接结果。不得以 synthetic fixture 或临时允许状态替代。
