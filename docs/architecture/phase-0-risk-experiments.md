# Phase 0：真实风险实验

状态：**Phase 0 GLOBAL BLOCKED**；Source Qualification：**PASS 2 / FAIL 1 / NOT_VALIDATED 1**。
两个限定来源已证明稳定获取与概念标准化；全局风险尚未完成，不允许进入 Phase 1。
历史实验 2026-09-27；修正版回归与 Gate 决策 2026-09-28（Asia/Shanghai）。本轮仅重审已有证据，没有新 B站实验。
本轮唯一范围是 Phase 0。没有 package.json、WXT、正式 TypeScript/Zod Contract 或产品采集器。
2026-09-27 历史来源实验收尾时工作区已有 Git 目录、原始文档已暂存但暂无提交；该次实验未进行 Git 写操作。
2026-09-28 前一轮提交前整理仅修改主页、脱敏、链接与提交安全，不增加实验或改变 Gate。

## Source Qualification

按用户明确批准的 [ADR-007](../adr/ADR-007-phase0-gate-separation.md)执行。Source PASS 只回答明确范围内能否稳定取得、正确归属并成功标准化；九项必要条件见下表。
valid available-empty / permission-denied 属 Phase 0 全局风险；request-failed、403/429/timeout、schema 等正式错误处理属 Phase 3。它们未实测仍如实保留，但不再要求每个来源遇到全部异常才能 PASS。

| 来源 | 当前资格判定 | 范围 / 证据与原因 |
| --- | --- | --- |
| 公开基础信息（空间头部快照） | **PASS，限下述范围** | 三个适合账号各三次读，昵称/简介/URL 身份稳定；各一次刷新；无效 UID 0 拒绝；临时 JSON 映射成功 |
| 公开投稿（完整来源与主页区块候选） | **FAIL** | 九次区块验证可排除合集/点赞；实际上传者与合作角色未充分确认，B 十张均合作。内容归属是核心条件；完整列表历史 CAPTCHA 保留，不重试、不改名计 PASS |
| 公开动态 | **PASS，限定范围** | 已登录、正常公开动态页、当前渲染卡片、已知正文结构及安全拒绝边界；A/B/C 各三次、每账号 reload，引用分离与概念映射成立，详见逐项审核 |
| 公开收藏 | **NOT_VALIDATED** | B 四夹摘要与公开十项资源页单次观察，重复稳定性与必要字段标准化证据不足；本轮不补实验 |

**Source Qualification：PASS 2 / FAIL 1 / NOT_VALIDATED 1。Phase 0 Global Risk Gate：BLOCKED。**
基础信息只有身份与自述，不等同于足够的兴趣行为证据，不能用它加另一个同类主页字段凑两来源。
本次计入基础信息与动态两个不同范围的来源，不代表已有完整兴趣画像或最终冻结 v0.1 行为来源组合。Global Gate 完成并获用户明确批准后才允许进入 Phase 1。

### 动态九项必要条件重审（2026-09-28，无新实验）

证据引用：[read-log.json](../fixtures/phase0/read-log.json) 的 `regression20260928` / `dynamicNegativeSpike20260928`、[候选映射](../fixtures/phase0/mapping-candidates.json)、[诊断](../fixtures/phase0/diagnostic-cases.json)。

| Source Qualification 条件 | 现有证据 | 结论 |
| --- | --- | --- |
| 1 多个真实公开样本 | TEST_A/B/C 均有正常动态页记录 | 满足限定范围 |
| 2 合理重复 / reload | 各三次正常导航、离页返回、明确 reload，共九次、三次 reload | 满足；不是同一 DOM 三次复读，不证明独立服务器请求 |
| 3 目标与正文归属可信 | 各读路由/空间身份与顶层作者显示名一致；选中正文不在 reference 内；C 当前评论“翻得好！”与引用分离 | 满足当前页面上下文；卡片 UID 未暴露，同名作者强身份不在已证明范围 |
| 4 必要字段可标准化 | 已知 orig/opus/video/forward 正文结构、dateLabel、目标别名、页面 sourceUrl 有摘要；修正评论 Raw→Candidate 映射成功 | 满足概念验证；不声称 108 次卡片观察全部逐条完成独立映射 |
| 5 可选缺失不补造 | timestamp=null、文字 title=null、无 item permalink 则页面追溯并标 partial | 满足；观察时刻不替代发布时间 |
| 6 不可靠内容拒绝/降级 | “分享动态”与合作占位 `-` candidate=null；引用/归属不明标题不补作自述 | 满足已知拒绝边界；未知结构/缺作者真实负例仍 NOT_VALIDATED，范围不扩展到它们 |
| 7 unknown 不伪装正常或 empty | 历史未知空态 items=null；有 12 卡的隐藏空节点不判 empty；工具超时不判来源失败 | 满足现有边界；真实 available-empty 仍未验证 |
| 8 不绕过限制 | 正常浏览器会话与只读公开 DOM；历史投稿 CAPTCHA 停止，无接口重放或凭据导出 | 满足访问纪律；动态自身 CAPTCHA 未实测 |
| 9 脱敏可审查记录 | 三份既有 JSON 保存时间、次数、字段摘要与 Raw/Candidate/拒绝案例 | 满足；匿名模板不能重新定位账号，证据可审查但不保证不可逆匿名化 |

结论：**公开动态 FAIL → PASS，限定范围**。变更源于批准后的判定框架澄清，不是新实验，也不意味着历史数据或旧 FAIL 被改写。
PASS 不证明完整历史分页、所有匿名场景、稳定单条 permalink/去重、所有 schema、同名作者强 UID 身份、request failure 全覆盖、动态 CAPTCHA 实测或正式 Source Adapter 已实现。无法确认的内容仍须拒绝/降级；partial 的数据质量限制继续保留。

## Phase 0 Global Risk Gate

整体状态：**BLOCKED**。任务依据为当前 [Notion 来源](source-of-truth.md)，状态仅用 DONE / PARTIAL / NOT_VALIDATED。DONE 限 Phase 0 需求/风险范围，不代表产品已经实现。

| Requirement | Status | Evidence | Remaining work |
| --- | --- | --- | --- |
| Chrome / Edge Chromium scope | DONE | [需求冻结](requirements-freeze.md)限定 Chromium/MV3 | 后续工程构建与安装验收，当前不初始化 |
| 2–3 stable public Sources | PARTIAL | 基础信息与动态两个限定 Source PASS；来源门槛已达到 | 冻结 v0.1 最终组合、范围及兴趣证据价值；基础信息仅上下文 |
| different public samples | DONE | TEST_A 大量投稿、B 近期动态、C 相对少内容且含转发 | 空/隐私样本缺口仅在对应任务计入 |
| pagination | NOT_VALIDATED | 只有当前渲染页；没有下一页/结束/跨页重复记录 | 验证适用来源的分页、终止与重复边界；不以可见页范围免除该任务 |
| logged-out | PARTIAL | A 主页两读可见；C 投稿 CAPTCHA、动态未知空态 | 明确匿名正常读取能力及不可用边界，不将空态原因猜成登录限制 |
| logged-in | DONE | 既有 A/B/C 正常回归九读、每账号 reload | 不扩张为所有账号/时段保证 |
| privacy-disabled | NOT_VALIDATED | 没有明确隐私关闭/拒绝样本；缺入口不算 | 取得明确不可公开证据，核对分类及适用来源范围 |
| empty-data | NOT_VALIDATED | UID 0 无效、隐藏模板和过滤零候选均不是真空 | 有效身份、明确成功/结束、零项共同成立的真实案例 |
| SPA UID switch | PARTIAL | 同 UID 子路由与完整跨账号/新标签导航记录 | 证明同文档跨 UID 后路由、空间身份与内容一致，旧用户内容不混入；正式取消实现后续验证 |
| minimal permissions | PARTIAL | [权限计划](permissions-plan.md)已有空间匹配/storage最小方案 | 对选定来源核对页面提取/跨域需求及更小权限可行性；生产 manifest/安装检查在后续工程 |
| no server/API key | DONE | 需求冻结、[ADR-005](../adr/ADR-005-no-server.md)、现有概念获取/映射 | 后续工程继续遵守，不代表扩展运行时已实现 |
| public-data boundary | DONE | 需求公开范围与实验正常访问纪律 | 继续限制正常可访问公开信息 |
| sensitive-attribute boundary | DONE | 需求冻结明确敏感推断禁区，无此类实验 | 后续产品与分析器继续遵守 |

全局任务按证据适用范围验收；同一隐私缺口不按四来源重复计算，也不把一次局部观察视作所有来源已验证。

## Phase 3 Adapter Engineering 边界

单请求/Source 总 timeout、AbortController、可恢复网络错误 retry/exponential backoff、并发限制、节流、403/429/unauthorized、network request failure、schema validation、Source 独立状态、formal ErrorCode、controlled degradation 及 mock/fixture/controlled failure tests 在正式 Adapter 阶段完成。
分页风险在 Phase 0 先验证；分页上限、去重等正式机制仍按后续阶段实现。真实网页状态与模拟测试分开标注，历史 CAPTCHA 不冒充 HTTP 403/429，工具 timeout 不冒充 Source failure。不要求在线上撞见每种错误，也不主动制造风控。

## 历史判定说明

以下历史章节与三份 JSON 保留旧框架下的 FAIL 和 PASS 1 / FAIL 2 / NOT_VALIDATED 1。早期动态确有转发误归属与修正版回归不足；回归补齐后，旧逐 Source 异常矩阵继续阻塞。
2026-09-28 审计识别层级混用，用户随后批准 ADR-007，按现有证据重判动态。旧日志时间、次数、观察状态、限制均不改写；当前判定以本文件开头为准。

## 2026-09-28 历史实验：动态剩余负例定向 Spike

起点 main 与 fetch 后 origin/main 均为 `fda54d2efdcba457980e65dd62f4650b32e14f03`，工作区 clean。未重复 A/B/C × 3，不做投稿或收藏实验。
范围限定为既有公开标签页一个目标，落盘别名 `SPIKE_EXISTING_1`；正常打开页面已有动态链接，检查一次渲染页面的边界。未扫描新账号、遍历历史或制造异常。
UTC 18:11:45–18:13:37（北京时间 2026-09-28 02:11–02:13）的 DOM 检查属于同一次页面观察，不计新的独立重复实验。

### 新实证与未取得的状态

- 目标为正 UID，空间昵称非空、个人资料可见 UID 与当前动态路由一致，12 张卡片顶层作者显示名均与空间头部一致。
- 页面有 12 张正常卡片，但 DOM 同时包含隐藏的空态“好像没有东西诶”和隐藏加载提示。两节点均无布局矩形，AX 中没有这些提示。**存在空态节点不等于来源成功零项**；本次不是 available-empty，也不是 unknown-empty。
- 第 1 张日期 label 明确为“10小时前 · 与他人联合创作”，视频描述仅 `-`；可识别的非引用原始描述、opus 正文和转发描述均不存在，相关视频标题存在（长度 26）。只读临时概念映射拒绝这条兴趣候选：candidate/text/title=null、status=partial；不把占位符当正文，也不把未确认作者的相关合作视频标题当空间主人的自述。
- 这是已知视频结构中的正文/归属不足负例，**不是未知 schema、缺作者或完整 schema-invalid 实测**。结合既有 C“分享动态”拒绝，支持部分正文拒绝边界；未知结构、必要作者缺失仍 NOT_VALIDATED。
- 没有明确权限拒绝、请求错误或可见 CAPTCHA。没有符合“有效身份 + 明确成功/结束 + 零项”的动态样本，available-empty / permission-denied 保持 NOT_VALIDATED。
- 浏览器能力只有 visibility/viewport；标签页只有 pageAssets/webmcp，没有受控 offline/网络失败能力。未改变网络或网站脚本，request-failed 保持 NOT_VALIDATED。
- 点击动态链接时一次工具超时；恢复检查显示仍在主页，之后按已观察 href 正常导航。超时不算来源 request-failed，也不算有效动态读取。
- 历史 CAPTCHA 来自投稿路径，仅支持安全停止策略；不能冒称动态 CAPTCHA 已实测。本轮没有重试受限路径。

### 历史动态十二项 Gate 审核（ADR-007 前）

| 条件 | 当前证据 / 判定 |
| --- | --- |
| 1 正常重复 | 既有 A/B/C 各三次、108 张卡片观察成立，未重复凑次数 |
| 2 reload | 既有每账号一次明确 reload 成立 |
| 3 目标正文与引用归属 | 既有引用边界成立；空间/作者显示名上下文证据有边界，卡片作者 UID 未暴露 |
| 4 必要字段标准化 | 已知正例可概念映射；本轮合作占位正文拒绝，不猜作者或补造正文 |
| 5 可选字段缺失 | timestamp=null、page-level sourceUrl + partial 等已有实证 |
| 6 无法确认时拒绝 | OBSERVED 部分：通用转发 label、合作占位正文；未知结构/必要作者缺失真实负例仍 NOT_VALIDATED |
| 7 empty 与 unknown | 隐藏空态误判边界及历史 unknown 已有实证；有效 available-empty 仍 NOT_VALIDATED |
| 8 权限拒绝与 empty | 明确 permission-denied 动态样本 NOT_VALIDATED |
| 9 请求失败与 empty | 来源 request-failed NOT_VALIDATED；工具超时不计，受控网络测试不可用 |
| 10 restricted 安全停止 | 历史投稿 CAPTCHA 与停止记录保留；动态 restricted 本身未实测 |
| 11 无绕过 | 本轮只正常页面导航与只读 DOM；没有 API 重放或绕过 |
| 12 脱敏可审查 | 新旧 OBSERVED 摘要均落盘；尚缺状态不能写成已有证据 |

**Before FAIL → After FAIL；PASS 1 / FAIL 2 / NOT_VALIDATED 1。**
当时逐 Source 矩阵的剩余 blocker 为有效 available-empty、明确 permission-denied、来源 request-failed、未知正文结构/必要作者缺失真实拒绝证据。这些未验证事实保留。
ADR-007 后，空/隐私归 Global，正式请求失败/schema 覆盖归 Phase 3；不再要求它们逐项真实出现才允许动态资格 PASS。无正文占位与隐藏空态不能替代这些状态；Phase 0 Global 仍 BLOCKED。
证据见 [读取日志](../fixtures/phase0/read-log.json) 的 `dynamicNegativeSpike20260928`、[候选映射](../fixtures/phase0/mapping-candidates.json) 与 [诊断](../fixtures/phase0/diagnostic-cases.json)。

## 2026-09-28 历史实验：修正版与主页区块回归

开始时工作区 clean，main HEAD 为 `285f23d2787410f18095f7bfa79dbea677285e55`；README、Issue、报告均为 PASS 1 / FAIL 2 / NOT_VALIDATED 1，无基线差异。
本轮只复验既有 TEST_A/B/C。通过限定日期及空间域名的浏览器历史恢复原公开样本；不将历史明细、真实 UID/昵称映射写入仓库。
三份当前 Notion 已重新读取；来源门槛保持至少两个来源稳定获取并成功标准化，本轮不进行正式工程初始化。

### 动态：九次有效读取

每账号顺序：正常地址导航 → 离开至主页并确认动态卡片移除/主页已渲染，再返回动态 → 明确完成的 reload 后读取。
第二次不是同一 DOM 复读；第三次均有 reload 完成证据。新页面渲染不证明三次独立服务器请求：缓存、HTTP/业务码、请求 ID 未观察。
A 初始加载中零卡片不计有效读取、不判 empty。A reload 与 C 离页批次各一次工具超时；恢复后重新确认操作，未完成批次不计次数，也不当作来源 request-failed。
一次工具端字符串代码生成被拒绝，只影响摘要格式，未计实验。后续采用直接只读 DOM 读取。

| 样本 | 有效读取 | 各次卡片数 | 各次引用卡片数 | 正文归属与 reload |
| --- | --- | --- | --- | --- |
| TEST_A | 3 | 12 / 12 / 12 | 4 / 4 / 4 | 卡片作者显示名与空间头部一致；选中正文均在引用区外；reload 成立 |
| TEST_B | 3 | 12 / 12 / 12 | 5 / 5 / 5 | 同上；含合作视频形式，不能把相关视频作者当动态作者 |
| TEST_C | 3 | 12 / 12 / 12 | 11 / 11 / 11 | “翻得好！”三次均从当前用户描述取得；“分享动态”按通用文案丢弃兴趣正文；reload 成立 |

冻结本次观察到的边界：有 `.bili-dyn-content__forw__desc` 时只取该节点；存在 `.bili-dyn-content__orig.reference` 时不从引用区补正文/标题。
非引用卡片分别读取 orig 描述、opus 段落、视频描述/标题，排除卡片附带的他人互动评论、按钮和统计。
归属证据为空间路由、非空空间头部与卡片顶层作者显示名一致；顶层卡片未暴露作者 UID。它是本次可见页面上下文证据，不是所有同名作者场景的身份保证；不一致/缺失必须拒绝。
日期保留完整 label，包括“14小时前 · 投稿了视频”“3天前”“8月6日”；不从观察时间倒算发布时间。timestamp 均为 null。
九次均无稳定单条动态 href；相关 BV、@用户、短链不是单条动态链接。sourceUrl 使用空间动态页，traceGranularity=page、status=partial，不能承诺稳定 item 去重。
C 第二、三读额外检测通用转发 label；首读已保留“分享动态”原始短片段，未伪造该读的额外检测步骤。通用文案的实际降级映射见诊断 fixture。
九次复验修补了旧转发映射回归缺口；当时仍按逐 Source 异常矩阵判定动态 FAIL。未知类型、引用无当前描述、必要作者缺失及真实空/权限/请求失败的实测不足仍保留；ADR-007 后按正确层级归类，不再将全部真实负例作为当前动态资格硬阻塞。

### 主页明确视频区块：九次验证

仅匹配 `.section-wrap.video-section`，要求其 `.section-wrap__title` 为“视频”；当前 URL 首段 UID、个人资料 UID 可见节点与非空昵称同时一致。
再次读取前已导航到另一个公开样本；每账号第三读明确 reload。记录的是当次已渲染卡片，不是完整投稿数，也不保证全部在屏幕视口内可见。

| 样本 | 有效验证 | 各次区块卡片 | 各次合作卡片 | 各次非合作 partial 候选 | 排除的其他标题链接 |
| --- | --- | --- | --- | --- | --- |
| TEST_A | 3，含 reload | 10 / 10 / 10 | 2 / 2 / 2 | 8 / 8 / 8 | 合集 46；代表作另属 top-section |
| TEST_B | 3，含 reload | 10 / 10 / 10 | 10 / 10 / 10 | 0 / 0 / 0 | 合集 48、最近点赞 10；收藏与代表作另区块 |
| TEST_C | 3，含 reload | 25 / 25 / 25 | 2 / 2 / 2 | 23 / 23 / 23 | 订阅追番、代表作、其他区块排除 |

每次均检查 title 非空、BV 格式、公开视频 URL、日期 label、合作标记与区块/页面身份；三轮脱敏字段与结构一致。
本轮目标区块日期均有值；缺日期行为由历史代表作案例支持 null，不把代表作纳入本轮投稿候选。
卡片无上传者 UID 链接，`.union-tag` 明确标“合作”。确认“视频区块属于当前空间”不等于确认“每条是空间主人独立上传”；没有将合作卡片归到独立投稿。
非合作卡片只记 block-bound partial 候选；合作卡片拒绝独立投稿映射，保留诊断。B 的零候选是归属过滤结果，**不是来源 available-empty**。
结论：区块与点赞/合集可以区分；逐卡实际上传者与合作角色没有充分证据，尤其 B 无可接受独立投稿候选。公开投稿保持 FAIL；不重命名成新的 PASS 来源。

### 异常补证与本轮边界

| 状态 | 实测情况 | 当前结论 |
| --- | --- | --- |
| available-empty | 没有有效目标且明确成功/结束的零项案例 | NOT_VALIDATED |
| permission-denied | 没有明确权限拒绝提示 | NOT_VALIDATED；缺入口不分类 |
| request-failed | 没有来源网络/HTTP/业务失败或明确请求失败提示 | NOT_VALIDATED；工具超时不冒充来源失败 |
| restricted | 历史 TEST_C 投稿 CAPTCHA 为真实证据，本轮未重试该路径 | 历史 OBSERVED，本轮没有新增 |
| unknown | 历史未登录动态空态原因不明；本轮没有最终 unknown-empty | 历史 OBSERVED；加载中空壳/过滤零候选不改成 empty |

主任务完成后只单次正常打开已知 B 收藏入口：四个可见摘要计数 10/13/15/15，选中收藏夹明确标“公开 视频数: 10”，正常展示资源。
没有发现明确空/拒绝/请求失败/验证码，未遍历其余收藏夹；收藏保持 NOT_VALIDATED。未寻找更多账号或扫描内部 API，也没有制造异常。
本轮九次动态与九次主页记录、字段矩阵、工具失败见 [read-log.json](../fixtures/phase0/read-log.json) 的 `regression20260928`。
脱敏 Raw → Candidate 与降级案例见 [映射](phase-0-normalization.md)。两项回归次数满足当轮页面读取要求；当时异常矩阵阻止动态 PASS，归属缺口阻止投稿 PASS。ADR-007 后投稿归属 blocker 不变；精确时间/单条链接缺失仍安全降级。

## 2026-09-27 历史实验：方法、样本和证据范围

先完成 [成熟项目研究](mature-plugin-research.md)，再低频访问真实页面。
使用普通内置浏览器与只读 DOM；登录由用户自行完成并明确告知。
没有读取凭据、本人历史/私信/私人收藏，没有 API 重放、私有签名或验证绕过。

| 样本 | 样本类型与脱敏范围 | 人工确认的可见内容 |
| --- | --- | --- |
| TEST_A | 活跃、公开投稿较多；真实 UID/昵称/主页链接已移除 | 大量公开投稿；登录后主页视频计数 930，动态有 9 月 23 日文字与近期视频 |
| TEST_B | 活跃、明确有近期动态；真实 UID/昵称/主页链接已移除 | 291 个视频；动态显示“2天前”的真实文字与公开链接 |
| TEST_C | 公开投稿相对少；真实 UID/昵称/主页链接已移除 | 43 个视频，相对 A/B 少；动态最新可见 8 月 6 日，包含转发 |
| INVALID_UID：0 | 非正 UID 负例，数值用于说明拒绝条件，不代表真实用户 | 空昵称、零计数、通用未投稿空态；不是有效空账号 |
| TEST_D：明确隐私关闭 | 未找到经页面确认的样本 | 未验证；没有收藏入口不等于明确未公开 |

每个账号的三次测量为：首次读取、同一渲染 DOM 复读、刷新后再读。
提交版本仅保留 TEST_A/B/C 的观察摘要，不包含真实账号映射；匿名 URL 模板不可点击复现。
历史观察仍可追溯到读取日志与诊断案例，但这些摘要不能单独重新定位原始账号；后续复验需要重新准备公开样本，不补造身份映射。
因此只证明可见 DOM 读取与一次重新加载的结构，不声称每账号三次独立网络请求成功。
已登录九次读共享空间头部，因此基础信息的九次测量与动态测量同时发生，不是另发九次请求。
记录见 [read-log.json](../fixtures/phase0/read-log.json)。

## 历史 Source 1：公开基础信息

- 方法：URL 首段正整数 UID + `.nickname` + `.sign.header-sign .pure-text`；与空间头部绑定，排除全站导航中的登录者链接。
- 账号：A/B/C 三个；重复：每个三次，字段均非空；每账号一次刷新。
- 标准化：source=`profile`，userId=匿名别名，title=脱敏昵称，text=脱敏简介，timestamp=null，tags=[]，category=null，sourceUrl=匿名化空间地址，quality=0.25。
- 异常：UID 0 的昵称/简介为空。先拒绝非正 UID，再拒绝有效目标缺必要昵称；无效上下文不产出成功空结果。
- 失败模式：UID 不合法/不匹配、必要昵称缺失→unavailable；明确拒绝→permission-denied；验证→restricted；只有不明空壳→unknown，绝不补零值。
- PASS 边界：**空间头部当次公开快照**，不是所有账号/所有时间可用，亦不承诺匿名全面可用。简介未提供可视为缺失自述，不推断兴趣。
- 兴趣价值 1/5；仅验证来源和身份结构。未验证真实空简介、隐私关闭与慢网；这些在矩阵中明确保留，不将其写成实测成功。

## 历史 Source 2：公开投稿

历史负例：未登录 TEST_C 点击投稿，进入该账号的 upload/video 子路由后出现验证码；关闭后显示“空间主人还没投过视频”。保留 restricted，不转为 empty。
本轮登录前 A 主页两读各 49 个全页标题链接，第二读刷新；登录后 A/B/C 主页均人工确认真实视频。
这类全页卡片还包含合集、代表作、最近点赞：尤其 B 的点赞区出现其他 UP 视频，不能全部当作投稿。
真实字段样例为标题、BV 链接、日期文本；代表作日期可缺失。分区/tags 本次没有获得。

**FAIL**：完整投稿来源仍被历史限制与未完成测试阻塞。主页摘录有价值，但范围/归属尚未冻结，不改名凑一个已通过的来源。
失败降级：保留验证码状态；主页仅收集已确认投稿区块时标 partial；未知区块不归到目标账号；没有日期保留 null。

## 历史 Source 3：公开动态

- 方法：`.bili-dyn-item__main` 中读取头部、正文及公开链接，未读 Vue 内部对象。
- 账号：A/B/C 三个；每个三次；每次 12 张卡片；各一次刷新，均无可见验证提示。
- 第一版字段：`.bili-dyn-content__orig`。C 首次错误取到被转发者原文，不能作为该用户自述通过。
- 修正候选：存在 `.bili-dyn-content__forw__desc` 时取当前用户评论；`.orig.reference` 不作为当前用户原文。
- 修正验证：C 两次得到“翻得好！”与“分享动态”，第二次为刷新后；A/B 没有完成修正版的三次回归，也不能推断其余所有卡片正确。
- 日期：11小时前/2天前/8月6日等非完整时间，timestamp=null；保留 raw dateLabel 于诊断元数据。
- 追溯：文字动态没有直接公开单条 href，先使用空间动态页地址并标 partial；没有制造动态 ID，不能承诺稳定去重。
- 既往 TEST_C 未登录空态，与登录后的真实动态矛盾。没有 HTTP/业务码，不能精确归因登录限制/网络/风控。

**FAIL**：可见数据读取成功不等于统一正确映射与错误状态实证已完成。不能把十二张卡片/连续 DOM 复读冒称完整接口稳定。
失败降级：不明空态 unavailable/unknown；引用不明丢弃该项并标 partial；受限立即停；不把被转发者内容归为用户原创。

## 历史每来源测试矩阵

OBSERVED=实测；NOT_VALIDATED=未验证；设计分类不冒充实测。

| 场景 | 基础信息 | 投稿 | 动态 | 收藏 |
| --- | --- | --- | --- | --- |
| 未登录 | A 两读与先前 C 单次可见；非完整三账号矩阵 | C 验证码；A 主页摘录两读 | C 空态原因不明，不能 empty | NOT_VALIDATED |
| 已登录 | A/B/C 各三读，头部均存在 | A/B/C 主页真实数据单次人工确认，非投稿子页三读 | A/B/C 各三读，12 卡/读；C 第一版映射错 | B 主页四夹摘要可见，不是资源采集 |
| 有真实数据 | 三个有效账号头部 | 930/291/43 主页视频计数及可见卡片 | A/B 近期、C 较早但真实 | B 夹名及资源计数摘要 |
| 真空数据 | 真空简介 NOT_VALIDATED | NOT_VALIDATED；UID 0 不算 | NOT_VALIDATED；先前空态不算 | NOT_VALIDATED |
| 未公开 | NOT_VALIDATED | NOT_VALIDATED | NOT_VALIDATED | NOT_VALIDATED；缺入口不代表权限关闭 |
| 页面刷新 | 各一次，字段一致 | A 未登录主页一次，卡片 49，不代表全列表 | 各一次，卡片 12；C 修正评论一致 | NOT_VALIDATED |
| 同文档 SPA 换 UID | NOT_VALIDATED；完整导航后头部正确不等于 SPA | NOT_VALIDATED | 页面内 @ 链接实际新标签；原页 UID 不变 | NOT_VALIDATED |
| 连续读取三次 | 三账号均满足，仅当次结构 | 未满足 | 卡片读取满足；同一正确映射未满足 | 未满足 |
| 慢网络 | NOT_VALIDATED | NOT_VALIDATED | NOT_VALIDATED | NOT_VALIDATED |
| 请求失败 | 没捕获网络码；UID 0 是无效上下文，不冒充网络失败 | 验证受限实测，HTTP 403/412 未测 | 未登录空态 cause unknown，不冒充网络失败 | NOT_VALIDATED |
| 字段缺失/异常 | UID 0 昵称/简介空：拒绝 | A 代表作日期缺失：null；分区/tags未提供 | 相对日期、无单条链接、转发引用差异 | NOT_VALIDATED |

## 历史状态区分方案与实证差距

以下仅 Phase 0 语义提案，不是正式 Contract。

| 情况 | 临时候选状态 | 条件/本轮实证 |
| --- | --- | --- |
| 正常可见内容 | available，sampleScope=visible-page；完整度另记 | 基础头部与动态卡片已见 |
| 真空 | available-empty | 必须有有效目标、加载成功与来源明确结束/空标志；本轮没有满足的负样本 |
| 未公开 | SRC_PERMISSION_DENIED / unavailable | 必须有明确权限拒绝，不凭缺入口猜；本轮未测 |
| 请求失败 | SRC_REQUEST_FAILED / unavailable | HTTP/网络/明确错误证据；本轮未捕获此类响应 |
| 验证/限流 | SRC_RESTRICTED / unavailable | CAPTCHA 已见；限流码未见 |
| schema/身份异常 | SRC_SCHEMA_INVALID 或 SRC_INVALID_CONTEXT / unavailable | UID 0、缺昵称、引用归属错误；已有异常实证 |
| 不明空态 | SRC_STATUS_UNKNOWN / unavailable | 先前 C 未登录动态；不发布空数组 |

仅公开 DOM 可以做到“不把未知当空”，却无法给未知强行归因。旧框架曾以全面异常实测阻塞动态；ADR-007 保留不可强行归因原则，将全局风险与正式错误处理分开验收，当前动态只在已证明范围 PASS。

## 临时标准化

见 [映射与诊断](phase-0-normalization.md) 及 [JSON 样本说明](../fixtures/phase0/README.md)。
真实网页字段经脱敏后落盘；没有合成正常数据充当线上成功。
timestamp=null 表示来源缺精确时间；观察时间单独保存，不冒充发布时间。
quality 为本阶段手工完整度标记，不是评分、兴趣强度或概率；缺分区不猜分区。

## SPA 观察

| 路径 | 实际结果 | 边界 |
| --- | --- | --- |
| 先前 C 投稿→动态 | 路由、标题更新，页面区域变化 | 仅同 UID 子路由，无安装内容脚本 |
| 本轮 A/B 主页内点击动态 | 工具当次状态未变化；后来用已观察 href 正常导航到动态 | 未确认点击/页面过渡，不能宣称 SPA 成功 |
| A→B→C 正常地址导航 | URL/标题/昵称与目标一致；C 的卡片不是前两者 | 完整导航，不能证明旧 DOM/请求取消机制 |
| TEST_B 动态内 @用户链接→TEST_NAV_TARGET | Enter 激活公开链接后新增标签页；target=_blank；原页保留 B UID | 验证跨 UID 新标签导航，未验证同文档跨 UID SPA |
| Content Script 存活/取消旧请求 | 没有安装扩展 | NOT_VALIDATED，不能用网页存活代替内容脚本证据 |

未来建议：解析 `space.bilibili.com/<正整数>` 的目标 UID；每次路由变化增导航代数，丢弃旧代返回值；清理来源缓存/DOM 引用及观察器；检查头部与 URL 一致后收集。
需按真实路径另验 pushState/replaceState、popstate、BFCache/new-document，并独立安装测试内容脚本后证明存活。
此为方案，没有正式实现或测试旧请求取消。

## Source Ranking

前三项 1–5 越高越好；后三项 1–5 越低越好。根据当前证据的工程判断，未做统计估计。

| 来源/范围 | Stability | Interest Value | Availability | Privacy Risk | Anti-bot Risk | Complexity |
| --- | --- | --- | --- | --- | --- | --- |
| 公开基础信息快照 | 4 | 1 | 4 | 2 | 1 | 1 |
| 已确认投稿区块的可见视频（候选，未 PASS） | 3 | 4 | 3 | 1 | 2 | 3 |
| 完整投稿列表（未 PASS） | 1 | 4 | 2 | 1 | 5 | 4 |
| 公开动态（限定范围 PASS） | 3 | 4 | 3 | 3 | 3 | 4 |
| 公开收藏资源（未验证） | 2 | 5 | 2 | 4 | 3 | 4 |

收藏评分主要来自方法研究，可信度低；可见视频与完整投稿是同一候选的两种采样方案，不计为两个独立 Source。
基础信息只用作身份/上下文；动态资格已按现有证据通过，投稿归属仍不足。当前优先完成 Global Gate，不重复正常回归凑次数。

## 历史 Blocker 与不超过三个调整选项（ADR-007 前）

1. **可见页面驱动**：只对用户已访问、明确归属的公开视频/动态区块做 partial 采样，保留 unknown；仍须三账号三次与异常 Gate，不能本轮自行把范围改为已通过。
2. **主动访问后渐进积累**：用户正常切页/刷新时积累有限公开 Evidence，按 UID 清理与去重；需先解决单条引用和转发边界，不后台遍历。
3. **完整投稿/收藏后置**：待公开来源错误实证与权限确认足够后再纳入；若要调整版本范围，提交给用户与 Notion 审查，不自行修改产品方向。

剩余最小补证：有效真空/明确权限拒绝/真实请求失败的正常页面样本、动态必要字段缺失/未知正文的真实拒绝案例、逐卡上传者与合作角色确认。修正版动态和主页区块各三账号三次（含 reload）已在本轮补齐，不能再写成未做。
历史同文档跨 UID、慢网/旧结果验证仍 NOT_VALIDATED，本轮未扩大到这些路径。
浏览器工具本次只允许只读 DOM，没有网页响应观察能力，不能伪造 HTTP/业务码或主动调用 API 弥补缺口。
详见 [验证码专项](bilibili-antibot-observations.md)。上述“来源不足两项”和逐 Source 异常 Gate 是当时结论，不能当作当前待办。当前来源资格为 2 / 1 / 1，Global Gate 未完成，仍停止在 Phase 0。

## 当前最小下一步（仅建议，未执行）

优先验证一次正常同文档跨 UID SPA 导航：确认 URL、空间头部、当前内容一起切换且不混入旧用户内容。新标签或完整导航不能计作同文档 SPA；不初始化扩展，也不声称旧请求取消实现已验证。本轮不执行网页实验。
