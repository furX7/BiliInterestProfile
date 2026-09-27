# 工程执行记录

## 当前状态（2026-09-28）

**Source Qualification：PASS 2 / FAIL 1 / NOT_VALIDATED 1；Phase 0 Global Risk Gate：BLOCKED；不允许进入 Phase 1。**
此前用户批准方案 B，动态限定 PASS；最小权限可行性已 DONE。最新匿名复核首次为零卡通用空态、reload 后为 12 卡，结果互相冲突，logged-out 继续 PARTIAL；分页未得到新增批次或结束边界。其余 Global 状态不变，投稿 FAIL、收藏 NOT_VALIDATED；历史记录保留。
目标仓库：furX7/BiliInterestProfile；提交结果以 Git 历史及本次汇报为准。

## 2026-09-28：匿名动态复核与分页推进尝试

- 基线 main / fetch 后 origin/main 同为 e972c4321f154e71ac86d2cfe213b093c7d8b397，工作区 clean；重新读取当前三份 Notion、Source of Truth、ADR-007、指定实验记录与 fixture。Chrome 扩展现可读，用户指定它为匿名上下文；内置浏览器为登录态。
- 登录态既有样本初始 12 动态卡。两次正常键盘推进均被浏览器自动化焦点 deadline 阻断；当前滚动位置未到末尾，无新增批次、重复边界或 continue/end 证据。pagination 保持 NOT_VALIDATED；工具失败不记为页面结束或 Source failure。
- Chrome 匿名侧正常导航到同一样本：首次 settled DOM 头部/可见 UID/路由一致，0 卡、通用空态；reload 后身份一致并出现 12 卡。无可见 loading、权限、失败或 CAPTCHA。匿名卡头部作者与页面身份一致；既有正文/reference 拒绝规则未放宽。
- 首次与 reload 输出不稳定，零卡不判 empty、登录入口不判动态限制，reload 后一次 12 卡也不代表稳定。logged-out PARTIAL → PARTIAL。privacy-disabled 和 empty-data 没有现成明确样本，未执行并保持 NOT_VALIDATED。
- 仅更新实验记录、工程账本、Issue 与脱敏 read-log；Source Qualification 2 / 1 / 1、其他 Global Gate、README 与 Phase 1 文件均不变。

## 2026-09-28：已知动态样本未登录 Spike

- main / fetch 后 origin/main 均为 72ae6444fa5a2438590a7806d30a784a4f5fb045，工作区 clean；当前三份 Notion、所需文档与既有样本记录已复核，按用户批准的 Spike 路径执行。使用 Superpowers 与 verification-before-completion，不写正式功能。
- 工具最初只有仍登录的内置浏览器，不计匿名实验；用户提供未登录主页标签后，主页与重新导航的动态页可见“登录”。本轮不读取 cookie/token 或私有状态，不登录/退出，不声称已验证无痕隔离。
- 仅复用此前已有 12 卡的 SPIKE_EXISTING_1，正常打开同一动态页，稳定读一次、一次正常 reload 后再读。UTC 21:54:20.234 / 21:55:20.889：URL/头部/可见个人资料 UID 一致，主卡片 0 / 0，已知正文 / reference 0 / 0；显示“好像没有东西诶”。刷新后 readyState complete，无可见 loader 或明确动态登录/权限/失败/CAPTCHA 提示。
- 无卡片不能检验匿名正文与转发归属。全站登录入口不证明空态因果；无 HTTP/业务响应，不判真空、登录限制、权限拒绝或请求失败。临时候选 unavailable / unknown，items=null；两个渲染读不宣称独立服务器请求。
- logged-out PARTIAL → PARTIAL，Source 2 / 1 / 1 与十三项 Global 状态不变，整体 BLOCKED，Phase 1 NO。仅更新三份既有 Markdown 与追加 read-log 记录，不改 README、不改旧 fixture 数据；无新账号扫描、API 请求、其他 Global 实验或正式代码。
- 提交前实际验证：完整 diff 审查与 git diff --check 通过；三份 JSON 可解析，read-log 仅追加一个对象，所有历史值与其他 fixture 不变；73 个本地链接/锚点有效。十三项 Global 状态及 Source 资格表原样，当前摘要 2 / 1 / 1 与 BLOCKED 一致；新增行扫描未发现凭据值或真实账号/视频映射，无冲突标记、package/Manifest/WXT/src/正式代码，README 未变。
- 唯一剩余建议是同一样本可信匿名内容或明确动态访问限制证据，本轮不继续。正常提交/推送结果以 Git 历史与最终 SHA 核对为准。

## 2026-09-28：最小权限可行性 Spike

- 基线 main / fetch 后 origin/main 均为 21a8deff86296179b16d26c83adf82c8d1b3d593，工作区 clean。重新完整读取指定本地文档与三份 JSON；当前 Notion Idea / 流程 / 工程页 last-edited 分别为 2026-09-27T13:57:58.064Z、2026-09-27T14:00:51.642Z、2026-09-27T18:46:01.241Z，包括最新执行协议、DoD 与 Skill Routing。未修改 Notion 或历史快照。
- 按 Spike 只审既有两个限定 PASS 来源的数据路径与官方权限语义；使用 notion-research-documentation，Chrome MV3 / WXT 官方文档 accessed 2026-09-28。没有新 B站页面读取、扩展安装、实际权限申请、API 请求或其他 Global 实验。
- Profile 头部/身份与 Dynamics 当前主体/引用边界/dateLabel/sourceUrl 均可从已有 DOM / 当前 URL 得到。静态空间 matches 的 DOM-only candidate 不需额外空间/API host_permissions 或命名 API 权限；仍声明站点访问。页面自身请求不当作扩展请求。
- storage 对采集 NOT_REQUIRED，未来设置 API 使用 DEFERRED；扩展 origin IndexedDB 不等于 storage permission，内容脚本的网页 origin 存储不当作扩展 Evidence Store。WXT dev 的 tabs / scripting 不计为生产权限。
- [权限计划](permissions-plan.md)完成逐字段审计、六概念区别、权限矩阵、匹配范围、三策略比较与未来重新审计规则；minimal permissions PARTIAL → DONE，范围为 Phase 0 feasibility，不是 Phase 1 production manifest 已验证。生产 caller/build/安装与存储位置检查保留。
- Source Qualification 2 / 1 / 1 与其余十二项 Global 状态不变，整体 BLOCKED，Phase 1 NO。仅更新既有四份 Markdown，不修改 JSON、不生成 Manifest/package/src/WXT 或正式代码；下一项只建议 logged-out，不执行。
- 提交前实际检查：三份 JSON 可解析且 Git blob 与基线一致；四份改动均为已有 Markdown，71 个本地链接/锚点有效；十三项 Global 只有 minimal permissions 行变化，Source 资格表原样、六份当前摘要均为 2 / 1 / 1 与 BLOCKED。完整 diff 审查与新增行扫描未发现凭据值或真实账号/视频映射，无冲突标记、Manifest/package/src/WXT/正式代码；git diff --check 通过。权限计划十三个官方引用页面均正常打开，生产构建/安装未执行。
- 检查器曾因行尾/字符串兼容性失败，修正后完整重跑通过，不计来源实验或网站失败。提交与正常推送以 Git 历史及汇报为准；文档分析不冒充新增 OBSERVED 或生产测试。

## 2026-09-28：SPA UID switch 单一路径 Spike

- 基线 main / fetch 后 origin/main 均为 7090135224a69108070bab5b18a820d25d351c27，工作区 clean；读取全部指定本地文档/fixture 与当前三份 Notion。工程流程页新增协议，last-edited=2026-09-27T18:46:01.241Z；任务分类 Spike。
- 复用既有公开动态页 SPIKE_EXISTING_1 为 A，仅激活其一个可见公开 @ 用户链接为 B。fixture 的 TEST_A/TEST_B 是本记录局部别名，不冒称历史三账号的对应关系。
- UTC 19:06:38–19:10:13：A 有 12 卡、头部/可见 UID 与路由一致、无可见加载；链接 target=_blank。正常 Enter 后标签 3→4，原 A URL 不变；B 新主页 UID/头部一致，动态主节点 0。原 A 头部及 12 卡长度序列未变。
- 新标签不能证明同文档跨 UID；performance 不在只读 scope 中，未取得可靠 document ID，也未注入 marker。未做 reload / B→A / 其他入口搜索；实验新增页已关闭。
- 原 A 内容保留不当作 B stale；B 零动态主节点仅限制当前动态选择器，不宣称全 DOM 或 SPA 隔离。过渡未连续采样，race/收敛时长 NOT_VALIDATED。首次基线工具超时无有效输出，不计网站失败或 document 重建。
- SPA PARTIAL→PARTIAL / NOT PROVEN；其他 Global 状态不变、整体 BLOCKED；Source Qualification 2 / 1 / 1 不变，Phase 1 未获准。详情见 [实验报告](phase-0-risk-experiments.md) 与 read-log 的 spaUidSwitch20260928。
- 本轮只更新既有三份 Markdown 与一个追加 JSON 记录，未修改历史 fixture，未实现正式代码。提交前检查及推送结果以本轮实际验证和 Git 汇报为准。

## 2026-09-28：用户批准 Gate 分层（无新实验）

- 起点 main 与 fetch 后 origin/main 均为 c23ab078575fb117504d2f0e366f4220cda8fbb2，工作区 clean；重新读取当前三份 Notion 与既有文档、六份 ADR、三份 JSON。
- Gate 审计发现：防止转发误归属、隐藏空态、工具超时误分类与合作归属错误的有效约束，被扩张成逐 Source 全异常真实实测；混合了 Phase 0 全局风险与 Phase 3 正式工程要求。
- 用户明确批准方案 B，新增 [ADR-007](../adr/ADR-007-phase0-gate-separation.md)，冻结 Source Qualification / Phase 0 Global Risk Gate / Phase 3 Adapter Engineering 三层。
- 只重审现有 A/B/C 各三次、三次 reload、108 卡片观察、Raw→Candidate 与拒绝案例。动态九项资格条件在明确范围内成立：FAIL → PASS；基础信息保持限定 PASS，投稿因实际上传者/合作角色不明继续 FAIL，收藏单次证据继续 NOT_VALIDATED。
- 状态改变来自判定框架澄清，不是旧数据被改写；历史 FAIL、真实异常、NOT_VALIDATED 和 JSON 元数据保持原样，不新增 OBSERVED。
- 两来源 qualification threshold 已达到；最终 v0.1 来源组合仍待冻结。pagination、logged-out、privacy-disabled、empty-data、SPA UID switch 与 minimal permissions 仍有全局缺口，Phase 0 Global 继续 BLOCKED。
- README / Issue / 实验报告分别呈现来源计数与全局状态；更新其他当前摘要，避免残留旧 Gate 被当成当前规则。以下章节是历史记录。
- 未获取新 Source 数据、扫描账号、修改 Notion、初始化 Phase 1、package.json、WXT 或正式 Adapter。未来 Agent 不得重新将所有异常塞回逐 Source Gate；真实网页观察与后续 mock/fixture 必须区分。
- 提交前实际检查：三份 JSON 可解析且 Git blob hash 与基线相同；十二份改动均为 Markdown，六十二个本地链接/锚点有效；未发现冲突标记、新增凭据值或真实账号/视频 URL；无 Phase 1 工程文件。既有动态九次/108 卡片观察/三次 reload 与新资格表、十三项 Global Checklist 一致，历史 FAIL 保留。
- git diff --check 通过；提交与远端同步结果以 Git 历史及本轮汇报为准，不把文档更新当成新来源实测。

## 初始任务与验收（历史范围）

目标：本地优先、可降级、可解释的 B站兴趣画像工程地基。
本次仅 Phase 0 / 1 / 2；禁止算法和高级版本功能。
原目录为空，无 AGENTS 指令、无 Git remote，不能创建远端 Issue/PR。
以 docs/issues/001-foundation.md 记录本地 Issue，接入仓库后迁移。

## 2026-09-27：来源阅读与基线

- 完整读取三份 Notion，记录链接及快照。
- Node 与 pnpm 可用；没有 package.json，不执行不存在的测试。
- 真实未登录主页可见，投稿验证码阻塞，动态只有空态。
- 来源成功标准化数 0，Phase 0 来源门槛未满足。
- 创建约束、架构、六份 ADR 和本地 Issue，尚不创建产品代码。
- 用户已明确要求严格按 Notion，先完成 Phase 0 文档，等待真实来源验证通过。
- 当前停留 Phase 0；Phase 1–2 未开始。来源门槛仍为 Phase 1 前置条件。

## 文档检查与收尾

- 共 18 个文档文件，包括 3 份完整 Notion 快照和 6 份 ADR。
- 六份 ADR 均包含 Context / Decision / Alternatives / Consequences。
- Markdown 本地链接目标全部存在。
- 需求、权限计划、样本矩阵、架构与 Issue 均保留未验证项，未把空态判定成采集成功。
- package.json 不存在：确认没有提前开始 Phase 1。
- 单元/集成/golden/Playwright 测试及 Chrome/Edge 构建未执行：按用户决定暂不创建测试与构建工程。
- 未添加依赖、权限、网络采集器、算法、后端或远端仓库操作。
- Phase 0 文档工作完成；Phase 0 实验验收仍未通过，不把整个 Phase 0 标记完成。
- 下一步仍为补齐至少两个真实来源的稳定获取与标准化证据，满足门槛后才进入 Phase 1。

## 2026-09-27 实验、2026-09-28 整理：Phase 0 继续验证

- 用户明确授权仅继续 Phase 0，三账号各三次与至少一个异常；即便通过也先报告，不自动进入 Phase 1。
- 先研究 Bilibili-Evolved、BewlyCat、bilibili-history-wxt 的固定提交、维护和许可证；未安装、执行或复制第三方代码。
- 用户自行登录正常浏览器会话并告知完成；未导出 Cookie/Token，未保存登录者身份信息。
- A/B/C 的空间头部与动态共同读取九次，每账号一次刷新；基础信息字段稳定，动态各读十二卡。
- 转发动态 V1 误取引用原文，V2 在 C 两读（含刷新）验证当前评论；未把错误读记录改成成功。
- UID 0 页面空昵称/通用空态，按无效上下文拒绝；历史验证码后空态和未登录动态空态仍保留失败/未知。
- 页面内跨用户链接实际打开新标签页；不冒称同文档跨 UID SPA 或内容脚本存活已验证。
- Gate：基础信息限定快照 PASS 1，完整投稿与动态 FAIL 2，收藏未验证 1；Phase 0 BLOCKED。
- 新增研究、验证码、映射三份架构文档，以及 fixtures/phase0/ 的 README 与三份 JSON。
- 更新风险实验、样本规范、README 和本地 Issue；旧两次复测要求已替换为三账号各三次。
- 没有初始化 package.json、WXT、TypeScript/Zod、正式测试、算法、后端或 AI 能力；未更改 Notion 产品方向。
- 收尾发现已有 Git 目录，原始十八份文档已暂存，暂无提交；本轮保留该状态，没有 Git 写操作。
- 文档验收：排除 Git 元数据后共二十五个项目文件，二十二份 Markdown、三份 JSON；二十四个本地链接目标存在。
- 三份 JSON 可解析；九次读覆盖三账号各三轮/各一次刷新，三个基础信息候选字段齐全；错误样本 items=null，无伪造时间零值。
- Fixture 检查未包含当前登录者 UID、Cookie 值或观察到的联系邮箱；去标识化不能保证公开视频字段不可重识。
- 当前没有 package.json 或 ts/tsx 生产文件；没有执行不存在的构建/正式测试。文档与 JSON 检查不替代真实来源 Gate。

## 2026-09-28：提交前主页与安全整理

- README 使用“B站兴趣画像”一级标题；未来功能、虚构示意与当前未发布状态分开标明，Roadmap 顺序遵循 Notion。
- 保留原始字段不穿透 Core、可选失败可降级、结论可追溯 Evidence 三条纪律。
- 报告与 fixture 移除真实账号映射、可识别简介、视频标题和视频标识；保留 TEST_A/B/C、日期、计数、缺失字段及最短必要转发评论片段。
- 脱敏摘要可核对历史结构，不能单独定位原账号；未伪造新的账号、读取或成功结论。
- 三个研究项目许可证按既有固定提交再次核对；现有描述准确，未复制第三方代码，未擅自确定本项目 License。
- 新建 .gitignore，覆盖依赖/构建产物、环境实际值、测试报告、日志、编辑器、临时目录、浏览器 profile、认证状态、Cookie/Session dump 与 HAR/抓包。
- 修正两份 Notion 快照中八处错误示例外链，并注明格式修正；不改来源时间、产品方向或工程约束。
- 敏感词命中属于文档中的禁止项/设计术语，不含实际凭据；本地导航保持仓库相对路径。
- Gate 与实验次数、刷新次数、缺口保持原结论；没有 Phase 1–2、Source 实现、后端、AI 或数据库工程。
- 提交前审查：二十六个项目文件、二十二份 Markdown、三份 JSON；二十八个本地链接有效，九次读取/三次刷新未改变。
- 全仓库扫描的四十六处凭据术语均为规则/研究说明，未发现实际秘密值或保留的可识别实验账号信息；忽略规则三十四个正反例检查通过。
- Git 作者取已连接 GitHub 身份 furX7，使用对应 noreply 地址，仅在本次提交命令中指定；不把私人邮箱写入提交。

## 2026-09-28：修正版与主页区块回归

- 起点 main / 285f23d，工作区 clean；仓库 Gate 与用户基线一致，无差异。上一轮 push 已确认本地与远端一致。
- 读取用户指定的七份文档与全部 phase0 fixture；重新读取三份当前 Notion，修正工程流程页 last-edited 元数据，门槛不变。
- 根据限定时间的浏览器历史恢复 TEST_A/B/C 原公开样本，只临时用于导航；没有保存历史明细或 UID ↔ 昵称映射。
- 动态各三次新页面读取：正常导航、主页离页再返回、明确 reload；总九次、108 卡片观察。A/B/C 每读 4/5/11 张引用，所选正文均在引用区外。
- C “翻得好！”三读稳定；“分享动态”第二/三读确认通用文案，候选正文拒绝。动态精确时间为 null，无单条 href 则保留页面追溯与 partial。
- 主页 video-section 各三次，URL/个人资料 UID 与非空昵称一致；卡片 A 10/B 10/C 25，每账号 reload 一次，脱敏字段结构一致。
- 排除代表作、合集、点赞、收藏、追番。合作卡片 A 2/B 10/C 2，不推断独立上传者；B 零候选是归属过滤降级，不是真空。卡片未暴露 creator UID，公开投稿仍 FAIL。
- A 初始加载空壳排除；两次工具超时与一次工具摘要格式失败不计实验，也不当作来源 request-failed。没有重试历史 CAPTCHA 投稿路径。
- 主任务后只单次正常打开 B 收藏页：四夹摘要 10/13/15/15，当前夹明确公开十项资源；未完成收藏重复与权限矩阵，仍 NOT_VALIDATED。
- 没有新的真空/权限拒绝/来源请求失败样本；历史 restricted/unknown 保留原分类。本轮没有自动解验证、身份切换、接口重放或内部 API 扫描。
- 动态回归次数已补齐，但未知类型/必要字段缺失的真实负例与异常矩阵不足，动态仍 FAIL。Gate 保持 PASS 1 / FAIL 2 / NOT_VALIDATED 1，两来源 PASS 未满足。
- 只更新既有 Markdown 和三份 JSON；没有新文档、产品功能、依赖、WXT、package.json 或正式工程文件。
- 提交前验证：三份 JSON 可解析；动态/主页各九次、各三次明确 reload，卡片矩阵与归属降级一致；原始历史记录和候选未改写。README / Issue / 报告 Gate 同为 1 / 2 / 1，未新增 PASS。
- 三十四个本地 Markdown 链接目标存在；新增 diff 未发现凭据值、真实账号/视频 URL 或邮箱值；十一份改动均为已有文档/fixture，无新增文件或正式工程初始化。首轮检查器因沙箱限制启动子进程失败，改用不启动子进程的检查后通过；工具错误不算 Source 实验结果。

## 2026-09-28：动态剩余负例定向 Spike

- 起点 main 与 fetch 后 origin/main 同为 fda54d2，工作区 clean。远端 README 网页修改与本地回归已在上一轮正常 rebase/push 同步。
- 读取本轮指定文档与三份 JSON；正常回归九次/108 卡片保留，未重新开展 3 × 3。
- 限定一个既有公开标签页的动态边界检查，别名 SPIKE_EXISTING_1；正 UID、非空昵称、可见个人资料 UID 与路由一致，12 卡作者显示名与头部一致。
- 发现有数据时隐藏空态/加载模板仍存在；第 1 卡合作视频描述仅 `-`，无明确自述，实际概念映射拒绝候选并保留 partial。
- 浏览器/标签页清单没有受控网络失败能力；来源 request-failed 未验证。一次点击工具超时后检查仍在主页，按已有 href 正常导航；不把工具错误写成来源错误。
- 有效 available-empty / 明确 permission-denied 未找到；未知结构/缺作者未观察。没有扩大账号扫描、伪造异常、凭据读取、投稿/收藏实验或正式工程初始化。
- Source Gate 保持 1 / 2 / 1，Phase 0 BLOCKED；新增实证与十二项审核见风险报告和既有 fixture。Git 与完成前检查结果以本轮实际汇报为准。
