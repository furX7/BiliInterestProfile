# Phase 1 剩余工程骨架 Spec

状态：**Approved Spec；对应 Implementation Plan 已获执行批准；环境阻断修订已批准（2026-09-30）**。日期：2026-09-29。本文件记录已获批准的完整 Design 对应的正式 Contract；原有“Spec approval 不等于 Plan execution approval”的审批边界仍保留。环境阻断修订不改变原验收完成条件，也不授权阶段推进、合并 main 或发布。

## 1. 目标、依据与现状

目标是补齐 Phase 1 的工程入口和可复现质量门禁，**不生成兴趣画像**。依据为用户已批准的“Phase 1 剩余工程骨架 Design”及补充约束、Notion [项目 Idea](https://app.notion.com/p/3e81d223bf63810898c1f428ba5c8779)、[详细制作流程](https://app.notion.com/p/3e81d223bf638178bfe9ecd4ea75190f)和[工程流程优化](https://app.notion.com/p/3e81d223bf638146b5eecae159ec60a7)，以及已接受的 ADR-001、ADR-002、ADR-005、ADR-006 和当前 Runtime Spec / Plan。后续实现须先复核最新工作区状态；本文件的基线描述不冻结某一旧 commit。

当前 `codex/phase1-source-foundation` 已有 WXT/MV3、严格 TypeScript、ESLint、Vitest、content script、popup、Chrome/Edge 生产构建与显式触发的现有 Pipeline。`@playwright/test` 已列为开发依赖，但没有运行配置和 smoke 测试；尚无 background/options 入口、Prettier、GitHub Actions、Dependabot、CHANGELOG 或统一工程 ErrorCode。`package.json` 未声明版本，`wxt.config.ts` 将 Manifest 版本写为 `0.1.0`。现有 Manifest 集成测试读取 `.output`，因此依赖先构建。

Runtime Plan 的已允许站点访问链路与本 Spec 是不同验收范围；持续未允许 `BLOCKED_ENV`、撤销后 `NOT_VERIFIED` 仍为残余风险而非 PASS。pagination `NOT_VALIDATED`、SPA UID switch `PARTIAL` 的延期状态不变。公开动态仍是唯一兴趣行为来源，基础资料仅作身份与上下文；只处理当前渲染卡片，保留 `unknown/null`，不得将合成测试视为真实网页证据。

## 2. 入口与运行边界

沿用现有 `src/entrypoints` 结构，新增 WXT background 入口和最小 options 页面，不迁移已有 content/popup 或改变它们的消息 Contract。WXT 在 MV3 构建中将 background 入口生成为 service worker，options 页面写入生成 Manifest；实际输出须由 Chrome 与 Edge 生产构建分别确认。[WXT Entrypoints](https://wxt.dev/guide/essentials/entrypoints)

- **Background** 仅满足工程入口。启动与唤醒均不得读取 B 站页面、调用采集 Pipeline、发起网络请求、注册自动采集或定时任务、存储资料或发送遥测；不成为 popup/content 的新中继。不得以“先留接口”为由引入无调用者的权限或持久化层。
- **Options** 仅提供可访问的静态最小页面，说明当前没有可配置的产品设置；不提供伪造的开关、不读取或写入 `storage`、不显示个人资料或兴趣分析结果。打开页面不得触发采集。
- 生产 Manifest 保持 `https://space.bilibili.com/*` 这一既有静态 content-script 匹配，不新增 `permissions`、`host_permissions` 或 `optional_host_permissions`，也不增加新 Source、主动请求或后台行为。新增入口不得改变 popup“用户单击才采集”的既有边界。

验收：两份生产 Manifest 均含预期 background/options 入口、MV3 与现有 content/popup 入口；权限字段和匹配范围仍通过既有负向 Manifest 测试。入口级测试证明 background/options 无采集调用、存储或网络副作用。若构建工具生成额外权限，实施者须先定位原因并在获批范围内修正；不得默许扩大权限。

## 3. 格式、Playwright 与测试证据

引入固定版本的 Prettier、单一配置和格式检查命令，风格尽量遵循当前 TypeScript 文件；生成目录、锁文件、Phase 0 原始证据与 HTML/JSON fixture 不由格式器改写。PR 的 Prettier 检查覆盖本次**新增或修改**的人工维护源码、测试、配置与 CHANGELOG；无合格变更时明确报告跳过，不以空输入冒充完成检查。不为接入格式器批量重排无关历史文件。检查失败须使 CI 失败。

将现有 Playwright 依赖变为独立可运行的 extension smoke suite。使用 Playwright 自带 Chromium 的持久上下文加载当前生产 unpacked extension，使用隔离的临时 browser profile，验收 MV3 worker 可发现、popup 与 options 页面可打开并显示预期静态/idle 状态；运行结束清理临时 profile。Playwright 测试与 Vitest 分开发现和执行，不能被普通 unit 命令误收集。合成页面只验证扩展外壳，不访问 B 站账号、不要求登录、不探测真实 DOM、站点访问拒绝或权限撤销。[Playwright Chrome extensions](https://playwright.dev/docs/chrome-extensions)

Playwright smoke 提供本地及单独 CI 运行入口，但不被包装为 Notion 所列十项 PR 硬门槛中的真实 Chrome/Edge 安装态证明。运行失败如实报告，不用 synthetic 结果替代人工真实安装观察。

## 4. CI 十项硬门槛与执行依赖

对 PR 建立 GitHub Actions 工作流，以锁文件冻结安装和受限默认权限执行；不使用凭据、真实 B 站账号或自动批准权限变化。Notion《详细制作流程》的六项 Phase 1 条目与《工程流程优化》“至少”十项是包含关系，本范围采用完整十项：

1. `pnpm install --frozen-lockfile`；
2. ESLint；
3. Prettier check；
4. TypeScript typecheck；
5. unit tests；
6. integration tests；
7. fixture golden tests；
8. Chrome production MV3 build；
9. Edge/Chromium production MV3 build；
10. bundle size check。

执行 DAG 为冻结安装 → lint/format/typecheck 与不依赖产物的 unit/golden → 两份生产 build → 读取 `.output` 的 Manifest 等集成测试与包体检查。该 DAG 保留所有门槛，但不机械将构建产物测试放在 build 前。现有 `pnpm test` 同时包含 Manifest 集成测试，不能直接作为干净环境中的 pre-build unit 步骤；后续 Plan 应拆分可复现命令，并让本地与 CI 使用同一组脚本。任何脚本不得用 `|| true`、空选择器、跳过失败或预存 `.output` 制造绿灯；每类测试须至少运行其明列的真实测试。Golden 断言当前获批 Pipeline 对版本化合成输入的预期来源状态、证据/警告边界；不生成画像，不自动更新快照，不改写 Phase 0 历史证据。

验收须从干净检出、空 `.output` 开始完整运行，逐项留下 exit status 和真实输出；任一硬门槛失败则整体失败。工作流成功仅证明检查运行，不自动等于 GitHub 分支保护已配置；更改仓库设置或合并 main 另需授权。

## 5. 生产包体预算

用户已批准设计阶段提出的 **125% 规则**。为 Chrome、Edge 分别统计干净生产输出中实际打包的 JS 与 CSS 文件总字节数，排除 sourcemap、测试 profile、临时文件和文档；不可把两个浏览器的量相互抵消。

先完成新增入口并将相关源码、配置与锁文件形成可重建的 feature-branch checkpoint；从该已提交 commit 的干净检出和空 `.output`，分别完成首次 Chrome/Edge production build，测得各自 `baselineBytes`。不得将含未提交入口改动的产物归因于旧 HEAD。将实际字节数、基线 commit SHA、计量口径与 `maxBytes = ceil(baselineBytes × 1.25)` 一并写入受版本控制的预算记录，作为人工审阅的冻结 checkpoint。首次冻结须复核该 commit 的产物与公式；CI 校验预算记录存在、公式成立，并在后续每次构建后要求各自 `actualBytes <= maxBytes`，超限返回非零。检查脚本只能读取预算，不得自动重算基线、写回或提高上限。预算变更需单独说明增长原因、受影响入口和新的可复现测量，经 PR review 才能更新；不得为过 CI 默默放宽。

当前尚无“新增入口后的首次构建”，故本 Spec 不宣称已取得基线或填写虚构字节值；后续 Plan 应把测量、冻结和故意超限时检查会失败纳入验收。

## 6. 依赖更新、版本与 CHANGELOG

配置 Dependabot 对 npm/pnpm 与 GitHub Actions 依赖定期检查并提出 PR，不自动合并。patch 可自动建 PR，仍须通过完整 CI；minor 由人工审阅；major 先单独 Issue，不与常规更新或功能 PR 混合。分组与并发上限防止一次打包大量核心依赖；新增依赖须审核维护、包体、浏览器兼容、许可证和网络/权限影响。自动更新配置在 feature branch 上可做语法与意图审计；只有配置进入默认分支并实际运行后，才可声称定时更新已启用。[GitHub Dependabot 配置参考](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)

`package.json` 的 `version` 是唯一项目版本来源，初始值与当前 Manifest `0.1.0` 对齐；WXT 构建从该来源生成 Chrome/Edge Manifest 版本，不保留第二个可漂移的手写版本。版本一致性由构建后测试检查。建立 `CHANGELOG.md` 的 `Unreleased` 区，记录获批范围内影响用户行为、契约或权限的变更；纯格式操作不伪造发布条目。版本提升需与获批范围、CHANGELOG 和两份 Manifest 同步；不自动 tag、Release、商店发布或修改默认分支。

## 7. Phase 1 工程级 ErrorCode

在现有工程/runtime 边界定义单一、类型化 `ErrorCode`，本阶段只覆盖目前确有的两类失败：`RUNTIME_EXECUTION_FAILED`（content handler 执行失败或其既有并发拒绝）与 `RUNTIME_RESPONSE_UNAVAILABLE`（popup 未取得可解析响应，涵盖活动 tab 不可用、消息失败和响应无效）。错误码用于内部分类与测试，不加入 popup 的脱敏消息 payload、不显示原始异常详情，也不新增网络日志或遥测。现有 `execution-error` 与 `connection-unavailable` 对用户的中性表现保持不变；无法区分的具体根因不得凭错误码臆断。

`unsupported` 是预期页面状态，`SourceStatus` 是来源结果状态，`SourceWarning['code']` 是来源警告；三者均不得强制改写为 ErrorCode。`unknown/null` 不等于工程错误，也不得改成 `empty/[]`。测试须穷尽当前两个工程错误映射，并证明来源 Contract、响应白名单和 popup 可见语义未漂移。本 Spec 不定义 API/网络异常、重试、Source Adapter 异常矩阵或 Phase 3 的扩展码。已接受的 ADR-007 第三层将 `formal ErrorCode` 与 Phase 3 Adapter 的超时、403/429、网络失败等异常矩阵并列；该决定保留，指向未来的**来源/Adapter 错误分类**，不排除最新 Notion Phase 1 所列、仅限当前 runtime 的工程 ErrorCode。当前 Issue 001 也将“正式 ErrorCode”概括在 Phase 3。后续 Plan 只安排 Issue 001 和 ADR-007 的最小文字澄清：“Phase 1 为当前工程/runtime 错误码；Phase 3 仍实现正式来源异常分类”，不修改 ADR-007 的三层 Gate 决策，也不借摘要提前实现 Phase 3。

## 8. 依赖顺序、验证与回滚

已批准的 Implementation Plan 按依赖安排：先固定入口、版本与 ErrorCode Contract；再实现惰性入口及 Manifest/无副作用测试；接入 Prettier 与隔离的 Playwright smoke；建立包含实际构建依赖的 CI；基于新增入口后的干净构建冻结双浏览器包体预算；配置 Dependabot、CHANGELOG 与状态同步；最后做独立总 review 和 fresh full verification。各阶段可形成 logical checkpoint，但前序验收不过不得假称下游完成。

完整验收需同时证明：两份 Manifest 的入口、版本、匹配与权限；后台/options 无采集副作用；现有 popup→content 显式链路不回退；格式与 Playwright smoke 真实运行；十项 CI 在干净环境逐项可失败且通过；预算被人工冻结且超限会失败；依赖更新策略与版本/CHANGELOG 一致；ErrorCode 不污染来源语义。此前 Chrome/Edge 真实安装态证据、合成 fixture 与本轮 CI 证据必须分列，不能相互替代。

回滚以当前 feature branch 的独立 logical commit 为单位：新增入口、质量配置、CI/Dependabot/预算和版本规则均可分别回退；没有数据迁移或服务器部署需要逆向恢复。回滚不得使用 force push、`reset --hard` 或改写历史；若引入的检查阻断开发，先确定真实根因，再在已批准 scope 内修正，不能将门槛改成 warning-only。合并 main、分支保护设置、Release/tag 和商店发布仍须另行授权。

## 9. 非目标、风险与审批边界

不新增 B 站网络请求、浏览器权限、自动采集、持久化产品设置、兴趣算法、评分、画像 UI、额外 Source、分页/完整历史或同文档 UID switch；不改 Phase 0 Gate 和两项延期证据状态，不进入 Phase 2。

残余风险：新增 worker 可能改变扩展生命周期；Playwright 自带 Chromium 不能证明真实 Chrome/Edge 安装或权限受限态；CI 的浏览器安装与构建缓存可能影响可复现性；125% 预算基线必须待新入口实测；Dependabot feature-branch 配置尚非定时运行证据；分支保护尚未配置。后续实施须逐项记录实际结果，不能将未运行或受限条件写成 PASS。

审批历史：用户先批准本 Spec 与 125% 包体规则，再单独批准对应 Implementation Plan 执行，随后批准第 10 节的限定环境阻断修订。各次批准仅覆盖各自明确范围；文档保存或 Git 同步不构成阶段推进授权。

## 10. 已批准修订：Playwright 环境阻断验证债务

本节及[工程规则修订文本](2026-09-29-environment-blocked-validation-rule.md)已获批准，必要 Notion 规则已同步；但本笔债务的原始证据尚未归档，不能申请 P1 带债进入 P2。第 3、8 节的 Playwright smoke 真实运行要求保持原样：`BLOCKED_ENV / NOT_VERIFIED` 不等于 PASS，Task 6、Task 8 smoke 部分、整份 Plan 和 Definition of Done 均不得因此标为 complete。

本次只为当前 Windows 主机上在产品断言前无法启动的 Playwright bundled Chromium smoke 登记具名残余债务。Harness、配置、helper 与清理逻辑仍须完成所有可运行的 unit/static 验证；full verification 中除具名阻断项外的可执行检查须逐项 fresh PASS，对当前可验证范围须完成独立 review，产品代码不得有已知 FAIL；整个 full verification 不得标 PASS。被阻断项补跑通过后仍须完成原 Plan 的最终总 review。已通过的真实 Chrome / Edge 安装态观察和十项 PR CI 不替代该 smoke，也不扩大豁免范围。证据、风险和重验条件以工程规则修订文本登记为准。

正式规则及本节虽已获批，仍须先满足原始证据归档与其余 fresh 验收，再另行请求明确的 Phase progression 决定；这不表示 Phase 1 全面验证通过。合并 main 前必须在受支持环境以 bundled Chromium 补跑并 PASS；Release 还须满足既有发布门禁。环境恢复后的首次合格机会若更早，须立即补跑；一旦出现产品断言失败，按真实 FAIL 处理，不再适用环境债务。
