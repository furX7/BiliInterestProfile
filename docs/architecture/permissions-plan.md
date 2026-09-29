# Phase 0：最小权限计划

## Phase 0 feasibility conclusion

2026-09-28 只读审计：**minimal permissions：PARTIAL → DONE，仅指 Phase 0 可行性**。当前两个限定 PASS Source 可采用 **DOM-only candidate**：静态 content script 匹配 `https://space.bilibili.com/*`，读取正常访问后已渲染的公开 DOM，再标准化。无需额外 B站 API 或空间域 host_permissions；采集本身无需命名 API 权限。这是既有字段路径与官方语义支持的推论，不是扩展运行测试或正式架构决策。

matches 本身声明站点访问，可能产生权限提示并受用户站点访问设置限制，不能称为“零权限”。本轮没有 Manifest、扩展安装、权限申请、WXT 初始化、正式代码或新增网页实验。Source Qualification 仍 **PASS 2 / FAIL 1 / NOT_VALIDATED 1**；Global 仍 **BLOCKED**，不允许进入 Phase 1。

### 证据与六种概念

本地依据：[实验报告](phase-0-risk-experiments.md)、[读取记录](../fixtures/phase0/read-log.json) 的主页读取、`regression20260928` / `dynamicNegativeSpike20260928` / `spaUidSwitch20260928`、[候选映射](../fixtures/phase0/mapping-candidates.json)与[诊断](../fixtures/phase0/diagnostic-cases.json)。本轮未修改 JSON 或新增 OBSERVED。

| 概念 | 当前审计中的含义 |
| --- | --- |
| content_scripts.matches | 静态脚本注入的页面访问范围，不等于网络 API 授权 |
| permissions | storage、scripting 等命名扩展 API 权限；需求必须对应实际调用者 |
| host_permissions | 扩展页面/后台对指定 origin 的请求及其他需主机授权能力；静态声明脚本注入是无需额外此项的官方例外 |
| optional_host_permissions | 预先声明、以后经用户操作申请的主机授权；当前两来源不需要 |
| 页面已有 DOM | 网站正常加载后呈现的公开字段；isolated world 内容脚本可读取共享 DOM |
| 扩展主动网络请求 | 扩展自己 fetch 的独立路径；网站自己加载数据不能证明扩展也必须请求 API |

语义依据：[Chrome Content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)、[Declare permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)、[Permissions API](https://developer.chrome.com/docs/extensions/reference/api/permissions)，均 accessed 2026-09-28。

### Source A：公开基础信息

限定空间头部快照，不是完整兴趣行为来源。下列字段在既有有效读取中已存在于当前 URL / DOM，未来静态内容脚本可直接读取。**每行均无需扩展额外请求，请求目标和跨域均不适用。**

| Field | Acquisition path / 已有位置 | Required capability | Permission consequence / 证据 |
| --- | --- | --- | --- |
| 目标 UID、sourceUrl | 当前 location 中正 UID / 空间页 URL | 读所在页面 URL，不查询其他标签 | matches；既有三账号头部映射与 reload |
| 昵称 → title | 空间头部 `.nickname` | 读取 DOM；排除全局登录者导航身份 | matches；三账号各三次头部记录 |
| 简介 → text | `.sign.header-sign .pure-text` | 读取当前空间头部 DOM | matches；头部摘要与候选映射 |
| 页面身份交叉核对 | 空间个人资料区可见 UID，与路由核对 | 限定节点区块，不泛取全页相似节点 | matches；主页回归 / SPA 基线身份记录 |
| 可选标准化字段 | timestamp=null、tags=[]、category=null；quality 来自读取结果 | 本地归一化，无依据字段保留缺失 | 无新增权限；候选 / 无效 UID 诊断 |

UID 无效、昵称空或身份无法确认时拒绝/降级，不补请求。不能为“以后 API 也许方便”增加当前权限。

### Source B：公开动态

仅涵盖已登录、正常公开动态页、当前已渲染卡片、已知正文结构与已证明拒绝边界。下列字段在有效记录中已存在，可直接读取；**每行均无需扩展额外请求，请求目标和跨域均不适用。**不改变登录依赖，也不证明匿名可用。

| Field | Acquisition path / 已有位置 | Required capability | Permission consequence / 证据 |
| --- | --- | --- | --- |
| 页面 UID / identity | 动态路由、空间头部、个人资料可见 UID | 读 URL / DOM，身份不一致拒绝 | matches；回归 / 定向 Spike |
| 顶层作者上下文 | `.bili-dyn-item__main` 顶层作者显示，与空间头部核对 | 读取顶层 DOM；未暴露卡片作者 UID，不宣称同名强身份已证明 | matches；九次回归 |
| 当前用户正文 | `.bili-dyn-content__orig__desc`、`.dyn-card-opus__summary .opus-paragraph-children`、`.bili-dyn-card-video__desc` | 已知有效非引用正文，归属不明拒绝 | matches；regression20260928 / 候选映射 |
| 转发描述 / 引用边界 | `.bili-dyn-content__forw__desc`；排除 `.bili-dyn-content__orig.reference` 子树 | 用自己的评论；引用原文、通用分享 label、合作占位不补作自述 | matches；C 评论回归与拒绝案例 |
| date label | 卡片头部可见文本，含相对日期 | 保留 label；无精确日期则 timestamp=null | matches；既有回归 / 映射 |
| sourceUrl / 单条链接缺失 | 当前空间动态页 URL；既有记录未取得稳定单条链接 | 页面粒度追溯并标 partial，不造 permalink / ID | matches；候选及资格范围 |
| 卡片结构、数量、缺字段 | 已渲染主卡片、可见性、引用边界、正文存在性 | 已知结构归一化；缺归属或占位拒绝；隐藏空态不当作成功零项 | matches；九读 / 108 卡片观察与诊断 |

不依赖页面私有 JS state、凭据或接口响应。官方能力与既有只读 DOM 记录支持字段可达性，尚未实施扩展调用、等待或正式错误处理；document_idle 不保证网站异步卡片已完成渲染。

### 权限矩阵

Profile / Dynamics 指当前 Source acquisition；Required now? 区分未来存储。新增 Source / API 请求必须重新审计，NOT_REQUIRED 不代表未来永久无需。

| Capability | Profile | Dynamics | Required now? | Reason |
| --- | --- | --- | --- | --- |
| content_scripts: https://space.bilibili.com/* | REQUIRED | REQUIRED | REQUIRED | 当前静态 DOM 候选的页面访问与注入声明 |
| host_permissions: space.bilibili.com | NOT_REQUIRED | NOT_REQUIRED | NOT_REQUIRED | 静态 matches 不必重复主机授权；无扩展主动请求 |
| host_permissions: api.bilibili.com | NOT_REQUIRED | NOT_REQUIRED | NOT_REQUIRED | 现有必要字段在 DOM / URL，无必要 API caller |
| optional_host_permissions | NOT_REQUIRED | NOT_REQUIRED | NOT_REQUIRED | 当前没有运行时主机授权需求 |
| storage | NOT_REQUIRED | NOT_REQUIRED | DEFERRED | 采集无需持久化；实际调用 storage API 保存设置时再需要 |
| scripting | NOT_REQUIRED | NOT_REQUIRED | NOT_REQUIRED | 静态 manifest 注册，不调用动态注入 API |
| activeTab | NOT_REQUIRED | NOT_REQUIRED | NOT_REQUIRED | 用户操作后的临时主机授权是其他注入策略，当前无需叠加 |
| tabs | NOT_REQUIRED | NOT_REQUIRED | NOT_REQUIRED | 读自身 location，不查询其他标签敏感属性 |
| cookies | NOT_REQUIRED | NOT_REQUIRED | NOT_REQUIRED | 网站正常使用会话，不读取或修改 cookie |
| history | NOT_REQUIRED | NOT_REQUIRED | NOT_REQUIRED | 当前页面采集不需要历史；历史实验的样本导航不决定未来 Source 权限 |
| webRequest | NOT_REQUIRED | NOT_REQUIRED | NOT_REQUIRED | 不监听、拦截或导出网络请求 |
| unlimitedStorage | NOT_REQUIRED | NOT_REQUIRED | NOT_REQUIRED | 基础采集及普通 IndexedDB 使用不需要放宽配额 |
| `<all_urls>` | NOT_REQUIRED | NOT_REQUIRED | NOT_REQUIRED | 必要页面只在明确 HTTPS 空间域 |
| 扩展 origin IndexedDB（非命名权限） | NOT_REQUIRED | NOT_REQUIRED | DEFERRED | 将来 Evidence / Profile 持久化，与 storage permission 分开 |

不为便利性或未实现功能增加上述 NOT_REQUIRED 能力；没有后台采集、遥测或云端目标。

### matches 范围与网络边界

`https://space.bilibili.com/*` 精确限定 HTTPS 空间域，覆盖 `/<uid>` 与 `/<uid>/dynamic`，不匹配 API 域、其他子域或网站。`/*` 覆盖从主页进入动态的入口；本轮没有证明更窄路径满足所有入口，不宣称所有未来路由的最小路径。未来仍须正 UID / 当前页面身份与 Source 白名单检查；匹配范围不授权新增收藏或投稿采集，也不解决未证明的 SPA 隔离。

[Chrome Match patterns](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns)（accessed 2026-09-28）支持 scheme / host / path 区别；host_permissions 路径不提供 endpoint 级限制，未来网络需求按必要 origin 最小化。

[Chrome Cross-origin network requests](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests)（accessed 2026-09-28）区分两种请求：内容脚本仍受页面同源/CORS 规则约束，扩展 host_permissions 不直接解除该限制；扩展页面/后台跨 origin 请求需要主机授权。网站自己请求数据不是扩展请求证据；本轮不制造请求。

### 三种策略（可行性比较，不作正式架构决定）

| 维度 | A：DOM-only candidate | B：page-state assisted | C：extension fetch API |
| --- | --- | --- | --- |
| 当前必要性 / 权限 | 两来源字段已可达，只需静态 matches | 既有证据未依赖 state；isolated world 不直接共享页面 JS 变量 | 未见当前字段必须额外 fetch；后台跨 origin 请求需对应 host 授权 |
| 稳定性 / schema | 有重复 / reload，仍依赖已知 DOM | state schema、公开程度、读取方式未验证 | endpoint / schema 可用性未验证，不扫描 API |
| 风控 | 正常访问，无新增请求；不保证永不受限 | 不能假设无风险，只可考虑公开、安全可读状态 | 独立请求路径的风控表现未知，不绕过 |
| 登录 | 保留动态已登录范围，匿名缺口不变 | 不消除登录限制，未验证 | 登录需求未验证，不读取凭据 |
| 隐私 | 只选公开可见字段，排除隐藏模板与引用误归属 | 可能混入非可见/私人状态，须独立审核 | 响应可能超出必要公开字段，须独立审核 |
| 复杂度 | 现有依据充分；等待/隔离/拒绝以后实现 | 增加 state 身份、公开边界审核 | 增加请求、权限、错误与响应归属处理 |

A 以最少权限满足现有已证明范围。B/C 未验证不阻塞 A 可行性，也不算新增 Source 能力。完整历史、分页、精确 timestamp、永久单条链接、收藏及投稿不纳入当前权限需求。

### storage 与采集分开

Source 采集及本轮只读 Spike 无需 storage。未来设置实际调用 `chrome.storage.local` / `browser.storage.local` 时才需要命名 `storage` 权限，依据 [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)（accessed 2026-09-28）。

IndexedDB 是 Web 平台存储，不要求同一扩展 storage 权限；扩展页面/worker 使用扩展 origin，内容脚本直接使用则属于宿主网页 origin，不能当作扩展 Evidence Store。未来 Evidence / Profile 须留在扩展 origin，由可信消息边界传递已筛选数据，本轮不实现。[Chrome Storage and cookies](https://developer.chrome.com/docs/extensions/develop/concepts/storage-and-cookies)（accessed 2026-09-28）支持 origin / 配额区别；unlimitedStorage 可放宽限制，不是 IndexedDB 基础使用前提。

### WXT 与 DONE 边界

[WXT Entrypoints](https://wxt.dev/guide/essentials/entrypoints) 的 content script options 支持 matches 及 manifest/runtime 注册；候选采用静态 manifest 注册。[WXT Manifest](https://wxt.dev/guide/essentials/config/manifest) 说明生成结果来自配置、入口、模块/hooks，开发模式为热更新添加 tabs / scripting，不能计为生产采集需求。[WXT Build Modes](https://wxt.dev/guide/essentials/config/build-mode) 区分 development / production；实际命令及配置以后复核。三页均 accessed 2026-09-28。

本轮十二项 DONE 条件已覆盖：逐字段路径、无额外请求、Chrome/WXT 官方语义、矩阵/匹配范围、独立存储分析、不必要权限禁用、未来重新审计、无 Manifest 仍可判断可行性、dev/prod 分离与可审查来源。当前必要能力没有 UNKNOWN 阻塞；B/C 未验证及未来实施验收不冒充已完成。

## Phase 1 production verification

### 2026-09-29 Task 6 production Manifest audit

Task 6 当时分别执行 `pnpm exec wxt build -b chrome --mv3` 与 `pnpm exec wxt build -b edge --mv3`。两份生成的生产 Manifest 均为 Manifest V3；`content_scripts` 只注册 `content-scripts/content.js`，其 `matches` 仅为 `https://space.bilibili.com/*`；未生成 `permissions`、`host_permissions` 或 `optional_host_permissions` 字段。`tests/integration/manifest-permissions.test.ts` 同时审计两份产物，并以禁用 permission、host permission 和 optional host permission 的合成 Manifest 验证拒绝路径。随后 Runtime Plan Task 3 增加 `action.default_popup = popup.html`；本轮重新构建后的两份生产 Manifest 仍保持同一 matches 与无新增权限字段。

实际注册 caller 是 `src/entrypoints/content.ts` 的静态 content script。上述 Task 6 审计时，该入口尚未调用 reader 或 Pipeline；此后获批的 Runtime Plan Task 2 已将显式 popup 消息接入 `collectApprovedSources`，未点击前不自动调用。当前已允许站点访问的 Chrome / Edge 生产运行观察见 [安装态审计](runtime-analysis-install-audit.md)，不得把该观察倒写为 Task 6 当时已验证。

浏览器在新页面加载时未授予扩展此站点访问权时，静态 content script 不应注入，因此不应产生 SourceResult，也不得把未读取页面改写为空数据；这一拒绝态运行行为尚未得到稳定的真实安装验证。popup 对消息连接失败显示中性的 `connection-unavailable` 交互状态，提示用户确认当前为动态页、扩展已获站点访问并在授权后重新加载；该状态不宣称失败必为权限原因，也不伪造来源 unavailable、empty 或 unknown。Chrome / Edge 已允许站点访问的生产运行路径已取得真实 Logpoint 观察；持续未允许为 `BLOCKED_ENV`，撤销后即时与重载后均为 `NOT_VERIFIED`，均不等于 PASS，详见安装态审计。

以下为仍未验证或未来新增能力的独立事项；本轮 Chrome / Edge 生产 Manifest 已验证，**Phase 0 DONE 本身不代表这些未来事项已通过**：

- 安装核对权限提示及用户限制站点访问时的实际用户界面降级，不把 matches 称为无站点授权。
- 验证设置 storage API 权限与 Evidence / Profile 的扩展 origin IndexedDB，审可信消息边界。
- 新增 Source / 主动请求先记录功能、精确 origin、DOM 不足证据、caller、optional 及更小方案，更新 Issue / 权限计划再决定；不为假设性 API、全站或全部网站预授权限。

命名 API 补充依据：[Chrome Scripting](https://developer.chrome.com/docs/extensions/reference/api/scripting)、[activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)、[Tabs](https://developer.chrome.com/docs/extensions/reference/api/tabs)，均 accessed 2026-09-28，区分动态注入、临时主机授权、其他标签敏感属性查询，不使当前静态 DOM 路径增加权限。
