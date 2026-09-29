# Phase 1 剩余工程骨架 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended when independent reviewers are available) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Approved for execution；下述限定环境阻断修订已批准（2026-09-30）。用户已批准原 Plan 的 Task 1–9 连续实施；本次修订不改变 Task 6、Task 8 或整个 Plan 的未完成状态，也不授权阶段推进。

**Goal:** 在现有 WXT 扩展上补齐 Phase 1 工程入口、测试与十项 PR CI 门禁，不增加兴趣分析或采集权限。

**Architecture:** 保留 content→Pipeline 与 popup 显式触发链路；background/options 仅作无采集副作用的入口。质量工具分离 unit/golden、构建后 integration、隔离的 Playwright smoke；双浏览器包体预算从新增入口的已提交、可重建版本冻结。

**Tech Stack:** TypeScript、WXT MV3、React、pnpm、Vitest、Prettier、Playwright bundled Chromium、GitHub Actions、Dependabot。

**Spec:** `docs/superpowers/specs/2026-09-29-phase1-engineering-foundation-design.md`（Approved Spec；执行前重读）。

## Global Constraints

- 只在当前 `codex/phase1-source-foundation` feature worktree 实施；不重做已完成 Source/Runtime Plan，不合并 main、发布、改 Phase 0 Gate 或进入 Phase 2。
- 不增加 B 站请求、权限、自动采集、持久化产品设置、兴趣算法、画像 UI 或 Source；保留静态 matches `https://space.bilibili.com/*`、`unknown/null`、当前渲染卡片边界和 Runtime 权限残余风险。
- `ErrorCode` 仅为 `RUNTIME_EXECUTION_FAILED`、`RUNTIME_RESPONSE_UNAVAILABLE` 两类当前工程错误；不得改 `SourceStatus` / `SourceWarning` / popup 脱敏 payload 或提前做 Phase 3 Adapter 异常矩阵。
- Chrome/Edge 分别从新增入口完成后的**已提交源码+锁文件**、空 `.output` 的首次干净 production build 取得 `baselineBytes`；执行用户已批准的 125% 预算规则 `maxBytes = ceil(baselineBytes × 1.25)`。检查器只读，不自动写入或抬高预算。
- Playwright bundled Chromium 的合成 extension smoke 与真实 Chrome/Edge/B 站安装态证据分列；十项 CI 均须真实运行并 fail closed，不用旧产物、空测试集、`|| true` 或 warning-only 过门槛。
- 遵守 `AGENTS.md`：适用的代码 Task 先 RED→GREEN；workflow/配置用解析、失败注入和真实命令验收。每 Task fresh verification 后才按 feature-branch 规则 logical commit；前一 Task 验收通过自动进入下一 Task。遇异常先 `superpowers:systematic-debugging`；必要独立 review；仅 scope/权限/架构冲突等真正停止条件向用户请求决策。

## Review Focus

1. 新 background/options 即使被打开或唤醒也不得采集、请求网络或存储；Task 3 的入口测试与双 Manifest 审计覆盖。
2. `unknown/null`、`unsupported`、连接失败不得被工程 ErrorCode 改写成 empty/`[]` 或带正文的 popup 响应；Task 2 现有与新增回归覆盖。
3. 干净 CI 不得在 build 前运行读取 `.output` 的 Manifest 测试，也不得空跑任一测试类别；Task 7/8 覆盖。
4. 包体预算缺失、公式错误、超限或企图自动更新时必须失败；Task 4 的负例覆盖。
5. Playwright 只用隔离 profile 与 bundled Chromium；缺少浏览器或 worker 时如实失败，不降格为真实 Chrome/Edge 验收；Task 6 覆盖。

---

## File structure 与既有接口

沿用 `src/entrypoints`、`src/core/runtime`、`tests/unit`、`tests/integration`；新增 `tests/golden`、`tests/e2e`、`scripts`、`.github/workflows`、`config/bundle-budget.json`。入口代码归 `src/entrypoints`，错误映射归 `src/core/runtime`，预算/格式检查仅在 `scripts` 读取仓库文件与构建产物；新脚本不得反向进入产品 bundle。现有 `AnalyzeInterestResponse`、`CollectionSummary`、`SourceResult` 的公共形状不变。每个新增检查由本地 `package.json` 脚本调用，CI 调用同一脚本。

### Task 1: 单一版本来源与 CHANGELOG

**Files:** Modify `package.json`, `wxt.config.ts`, `tests/integration/manifest-permissions.test.ts`; create `CHANGELOG.md`。

**Interfaces:** `package.json.version: "0.1.0"` 是唯一版本输入；`wxt.config.ts` 从 `new URL('./package.json', import.meta.url)` 读取并校验非空版本，产出两份 production `manifest.version`。不改变现有 manifest name、matches 或权限。

- [ ] **Step 1: 建立 RED。** 先运行现有 Chrome/Edge build 使产物存在；新增测试 `manifest version equals package version`，逐浏览器断言 `packageJson.version` 为有效非空扩展版本且 `manifest.version === packageJson.version`。运行 `pnpm exec vitest run tests/integration/manifest-permissions.test.ts`，预期因当前 package 缺 `version` 失败，而非缺产物；测试不得硬编码第二个版本号。
- [ ] **Step 2: 最小实现。** 在 package 增加 `version: "0.1.0"`；WXT 配置用 Node 文件读取取得该值，不保留手写第二版本；建立仅含 `Unreleased` 的 CHANGELOG，注明尚未发布。
- [ ] **Step 3: GREEN 与边界检查。** 重新运行两份 production build、目标集成测试、`pnpm lint`、`pnpm typecheck`；核对生成 Manifest 权限仍为空且版本一致，`git diff --check` 通过。精确暂存本 Task 文件，review staged diff 后做 logical commit。

### Task 2: 当前 runtime 工程 ErrorCode

**Files:** Create `src/core/runtime/error-code.ts`, `tests/unit/runtime-error-code.test.ts`; modify `src/core/runtime/create-analysis-handler.ts`, `src/entrypoints/popup/request-analysis.ts`；既有 runtime/popup 单测仅在必要时补充断言。

**Interfaces:** `error-code.ts` 导出 `runtimeErrorKinds = { RUNTIME_EXECUTION_FAILED: 'execution-error', RUNTIME_RESPONSE_UNAVAILABLE: 'connection-unavailable' } as const` 与 `type ErrorCode = keyof typeof runtimeErrorKinds`。调用方只把已知错误码映射回既有 `kind`；不得将 code 塞入 `AnalyzeInterestResponse` 或 `CollectionSummary`。

- [ ] **Step 1: RED。** 写 `runtime-error-code.test.ts` 断言仅上述两个键及精确映射，另用现有 handler/popup 测试锁定执行异常、并发拒绝、无活动 tab、消息失败、无效响应仍返回原 `kind`。运行 `pnpm exec vitest run tests/unit/runtime-error-code.test.ts tests/unit/content-analysis-handler.test.ts tests/unit/popup-analysis.test.tsx`，新映射测试须因接口不存在失败。
- [ ] **Step 2: GREEN。** 加入映射并让两个现有 caller 使用；保留 `unsupported`、来源 status/warning 与 popup 文案/脱敏结构原样，不添加日志、遥测或新的错误类别。
- [ ] **Step 3: 验收。** 运行目标与完整 unit 测试、`pnpm lint`、`pnpm typecheck`、`git diff --check`；审阅 `src/core/contracts/source.ts` 与消息 Contract 未改。精确暂存本 Task 文件并 logical commit。

### Task 3: 无副作用 background/options 入口

**Files:** Create `src/entrypoints/background.ts`, `src/entrypoints/options/index.html`, `tests/unit/entrypoints-idle.test.ts`; modify `tests/integration/manifest-permissions.test.ts`。

**Interfaces:** background 使用 `defineBackground` 导出空同步 `main()`；options 为不加载产品脚本的静态 HTML，显示“当前没有可配置的设置”。Manifest 的 `background.service_worker` 指向生成 worker，`options_ui.page` 指向 `options.html`；现有 `action.default_popup`、content matches 与三个权限字段约束保持不变。

- [ ] **Step 1: RED。** 单测断言 background 定义存在、调用 `main()` 不触发 fetch/采集/存储，options 有标题和说明、无设置控件或产品脚本；扩展 Manifest 测试加入 worker/options 断言，保留全部负向权限案例。运行目标单测，预期因入口缺失失败。
- [ ] **Step 2: GREEN。** 按现有 WXT 目录惯例加两个最小入口；不导入 Pipeline、network 或 storage。
- [ ] **Step 3: 生产验证。** 运行两份 production build、目标单测及构建后 Manifest 集成测试、`pnpm lint`、`pnpm typecheck`、`git diff --check`。逐份查看 generated Manifest 的入口、MV3、exact matches 与权限字段；若 WXT 实际字段形式不同，只按真实产物与 Spec 修正测试，不放宽边界。精确暂存并 commit；下一 Task 测量前确认该 checkpoint 的源码和锁文件已提交。

### Task 4: 从可重建 checkpoint 冻结双浏览器包体预算

**Files:** Create `scripts/check-bundle-budget.mjs`, `tests/unit/bundle-budget.test.ts`, `config/bundle-budget.json`; modify `package.json` 添加 `bundle:check` 脚本。

**Interfaces:** 检查器导出 `measureJsCssBytes(outputDir): number` 与 `assertBundleBudget(budget, actualByBrowser): void`；CLI 只读两个 `.output/*-mv3` 与 JSON。预算结构为 `{ schemaVersion: 1, baselineCommit: string, meter: 'js-css-bytes', chrome: { baselineBytes, maxBytes }, edge: { baselineBytes, maxBytes } }`，字节为正整数，`maxBytes === Math.ceil(baselineBytes * 1.25)`。计量递归包含 `.js/.mjs/.cjs/.css`，排除 `.map`、测试 profile 与其他文件。

- [ ] **Step 1: 真实基线 preflight。** 在 Task 3 commit 后记下 HEAD，并核对当前检出完整对应该 commit、源码与锁文件无未提交改动；若当前 worktree 不干净，则使用该 commit 的独立干净检出。以冻结锁文件安装，核实两份构建输出目录的精确路径后仅清空这两份忽略产物，再各运行一次 production build。用只读文件枚举分别记录 JS/CSS 总字节数及 commit SHA；不得引用 Task 3 提交前的产物或填猜测数值。
- [ ] **Step 2: RED。** 合成临时输出目录与预算对象，写测试分别断言合法预算通过，以及缺文件、负/零字节、公式不符、Chrome 超限、Edge 超限均抛错；运行 `pnpm exec vitest run tests/unit/bundle-budget.test.ts`，预期缺实现失败。合成目录不是生产基线。
- [ ] **Step 3: GREEN 与人工冻结。** 实现只读检查器；把 Step 1 的真实数值及 `ceil(1.25×baselineBytes)` 手工写入预算文件，不提供 `--update`/写回入口。脚本失败必须非零退出。复核 JSON、SHA、测量口径和公式；`pnpm bundle:check` 对同一真实产物通过，故意缩小临时预算后必须失败且不改正式预算。
- [ ] **Step 4: 验收与 checkpoint。** 运行目标单测、`pnpm typecheck`、`pnpm lint`、两份 build 后的 `pnpm bundle:check`、`git diff --check`；review 预算文件仅含实测值，精确暂存并 logical commit。

### Task 5: Prettier 与 PR 变更文件检查

**Files:** Create `.prettierrc.json`, `.prettierignore`, `scripts/check-format.mjs`, `tests/unit/check-format.test.ts`; modify `package.json`, `pnpm-lock.yaml`。

**Interfaces:** `package.json` 精确固定 Prettier 版本并提供 `format:check`；脚本接收一个 PR base SHA/ref，用 `git diff --name-only --diff-filter=ACMR <base>...HEAD` 得到变更，仅把人工维护的 `src`/`tests` 源码、根目录及 `config` 中的配置、workflow YAML、CHANGELOG 交给 Prettier `--check`。排除 `.output/.wxt`、锁文件、Phase 0 原始证据和 fixture；零合格文件须明确打印原因，Prettier 非零则脚本非零。不得自动格式化历史文件。

- [ ] **Step 1: RED。** 测试路径过滤的正反例（新 options HTML 和 workflow YAML 纳入；锁文件、fixture、产物排除），以及模拟格式检查失败会返回非零。运行 `pnpm exec vitest run tests/unit/check-format.test.ts`，预期缺模块失败。
- [ ] **Step 2: GREEN。** 安装并精确锁定 Prettier，采用与现有 TS 风格相容的单一配置，完成过滤脚本与 package 命令；只修正本 PR 已新增/修改且被格式检查选中的文件，不批量重排 PR 未触及的历史文件。
- [ ] **Step 3: 验收。** 先对本 Task 未提交的合格改动直接运行 Prettier `--check`；提交后从可追踪的 PR base ref 执行 `pnpm format:check -- <base-ref>`，确认整个 PR 真实触及的合格文件（含根目录配置）受检查。用临时 Git 测试仓库中的已提交且被 diff 选中的格式错误文件证明非零退出；未跟踪的临时文件不算负例。运行目标单测、lint、typecheck、`git diff --check`，核对锁文件只因 Prettier 变化。精确暂存并 logical commit；不得以“历史文件”名义排除本 PR 已触及的合格文件。

### Task 6: 隔离 Playwright extension smoke

**Files:** Create `playwright.config.ts`, `tests/e2e/extension-context.ts`, `tests/e2e/extension-smoke.spec.ts`; modify `vitest.config.ts`, `tsconfig.json`, `package.json`；如需单独运行入口，CI 文件归 Task 8。

**Interfaces:** `extension-context.ts` 提供 `openBuiltExtension(outputDir): Promise<{ context, extensionId, dispose }>`，用 Playwright bundled Chromium 的 persistent context 与临时 profile 加载 `.output/chrome-mv3`；从 MV3 service worker URL 取得 ID。`dispose` 在 `finally` 中先关闭 context 再删除该次创建的精确临时 profile，测试核实清理；smoke 只断言 worker、popup idle“分析兴趣”按钮和 options 静态说明，不调用 B 站或 Pipeline。Vitest 排除 `tests/e2e/**`。

- [ ] **Step 1: RED。** 写 smoke 测试并运行 `pnpm exec playwright test tests/e2e/extension-smoke.spec.ts`，预期在 helper/config 尚缺时失败；不得把普通页面测试伪装成已加载扩展。
- [ ] **Step 2: GREEN。** 加入专用配置、context helper、`test:e2e:smoke`，并让 Vitest 不收集 E2E。浏览器工具缺失时只安装 Playwright 测试所需 bundled Chromium；下载被环境阻断则记录 `BLOCKED_ENV`，继续与之独立的 Task 7/9 和 Task 8 PR CI 部分；独立 smoke 工作流保持未验证，不换品牌版浏览器伪造证明。
- [ ] **Step 3: 验收。** 先刷新 Chrome production build，再运行 `pnpm test:e2e:smoke`，确认 worker、popup/options 与临时 profile 清理；运行 `pnpm exec vitest run tests/unit`、lint、typecheck、`git diff --check`。报告这是 synthetic extension smoke，非真实 Chrome/Edge 安装态。精确暂存并 logical commit；若 smoke 未实际通过，不标本 Task complete。

### Task 7: 不依赖构建的 unit/golden 与构建后 integration 分层

**Files:** Modify `package.json`, `vitest.config.ts`; create `tests/golden/approved-source-output.test.ts`, `tests/golden/approved-source-output.json`（精确期望，非自动 snapshot）。

**Interfaces:** `test:unit` 只运行 `tests/unit`；`test:golden` 只运行 `tests/golden`；`test:integration` 只运行 `tests/integration`，其中 Manifest 测试必须在双 build 后；`test` 在有构建产物时运行全部 Vitest，均排除 Playwright。Golden 从已标明去标识/合成的 `tests/fixtures/phase0/dynamic-valid.html` 产生固定 Pipeline 投影，覆盖可确认 dynamic 证据与单快照空态 `unknown/null`；不把该 fixture 当新真实页面观察。

- [ ] **Step 1: RED。** 写 golden 测试，将 `context.status`、`dynamic.status/data/warnings`、`behaviorEvidenceSources` 与版本化期望精确比较；加入空态候选 `unknown/null` 断言。运行 `pnpm exec vitest run tests/golden/approved-source-output.test.ts`，先用缺失期望文件确认失败。
- [ ] **Step 2: GREEN。** 写入由当前获批 Contract 推导、人工核对的期望 JSON；拆分 package 测试命令与 Vitest 发现范围，不增加 Analyzer/Scoring 或自动 snapshot 更新。
- [ ] **Step 3: 验收。** 在空 `.output` 下 `pnpm test:unit`、`pnpm test:golden` 均须运行非零测试数并通过；随后双 build，再 `pnpm test:integration` 和完整 `pnpm test`，确认 Manifest 产物依赖成立。运行 lint、typecheck、`git diff --check`；精确暂存并 logical commit。

### Task 8: 完整 PR CI 与独立 smoke 入口

**Files:** Create `.github/workflows/ci.yml`, `.github/workflows/extension-smoke.yml`; modify `package.json` 仅在本地/CI 统一脚本还缺时使用。

**Interfaces:** `ci.yml` 对 PR 执行十项硬门槛：冻结安装 → lint/format/typecheck + unit/golden → Chrome/Edge production build → integration + bundle check。用固定 Node/pnpm 工具版本（以当前可用的 Node 24、pnpm 11.19.0 验证），工作流默认 `contents: read`，不注入 B 站凭据；checkout 获取完整历史或显式 fetch 到 PR base，使格式检查的 `base...HEAD` 确实可解析。`extension-smoke.yml` 仅手动触发，安装 Playwright bundled Chromium、构建 Chrome 扩展并跑 `test:e2e:smoke`，不增加 PR 必过第十一项。

- [ ] **Step 1: 检查前置。** 确认 Tasks 1–7 的脚本及预算已存在；列出每个 CI step 对应的本地命令，明确 integration 依赖双 build。若缺脚本，先在其所属 Task 的批准范围内补齐并复验，不写空占位 job。
- [ ] **Step 2: 写工作流。** PR job 禁用宽权限与凭据持久化，按上述 DAG 用同一 package scripts 串接；每项失败即整体失败。独立 smoke job 不访问 B 站、不会被标为真实安装态证据。
- [ ] **Step 3: 本地 RED/GREEN 验收。** 对当前未提交 workflow 先做 YAML 解析、DAG 与命令审计；从源码/锁文件干净且空 `.output` 的状态严格按 CI 顺序运行十项，记录每项实际测试数/exit status。用受控临时失败证明相关门槛非零，恢复后重跑通过；核对命令无 `|| true`/空选择器，`pnpm format:check` 确实收到可解析的 base ref，`git diff --check` 通过。精确暂存并 logical commit；再从该已提交 checkpoint 的干净检出与空 `.output` 复演完整 DAG。若未有真实 GitHub PR 运行，只称本地复现和工作流配置已验证，不声称远端门禁或分支保护已生效。

### Task 9: Dependabot 策略与权威摘要同步

**Files:** Create `.github/dependabot.yml`; modify `docs/issues/001-foundation.md`, `docs/adr/ADR-007-phase0-gate-separation.md`, `README.md` 仅直接相关摘要。

**Interfaces:** Dependabot 每周检查 `npm` 与 `github-actions`，patch 可自动提 PR、minor 单独人工 review、major version update 不混入常规 PR 而先单独 Issue；限制并发并避免把大量核心依赖一次分组。无 automerge。文档只澄清 Phase 1 两类工程/runtime ErrorCode 与 Phase 3 Adapter `formal ErrorCode` 的区别，以及本 Plan 各项真实完成/未验证状态；不更改 ADR-007 三层决策、Phase 0 Gate 或 Runtime 安装态历史。

- [ ] **Step 1: 配置与负例核对。** 写 Dependabot 配置并检查 package ecosystem、directory、schedule、patch/minor/major 分流及 PR 上限；确认不存在 auto-merge workflow。语法/格式检查失败须修复，不把尚未合并默认分支的配置标为已运行。
- [ ] **Step 2: 最小摘要同步。** 更新 Issue、ADR、README 中与本 Plan 直接相关的阶段状态与 ErrorCode 边界；保留 pagination `NOT_VALIDATED`、SPA `PARTIAL`、持续未允许 `BLOCKED_ENV`、撤销后 `NOT_VERIFIED`，不删除旧证据。
- [ ] **Step 3: 验收。** 对照 Spec/Notion/现有 ADR 逐项检查无新增产品要求；检查 Markdown links、配置文本、`git diff --check`，运行适用格式检查。精确暂存本 Task 文件并 logical commit。

## Final verification、review 与执行边界

- [ ] **统一审阅。** Task 1–9 各自验收通过后做一次独立总 review，重点审计权限/网络/自动采集回归、十项 CI 空跑风险、双浏览器版本/预算、错误码分层与 synthetic/真实证据边界。成立且在本 Spec 内的 review 问题按 systematic-debugging→TDD 修复并 fresh re-verify；需新 scope/权限/产品决策则停止。
- [ ] **Fresh full verification。** 从干净源码和空构建输出按 CI DAG 运行冻结安装、lint、Prettier check、typecheck、unit、golden、Chrome/Edge production build、integration、bundle check；另运行独立 Playwright smoke。逐项读取真实输出、测试数与退出码；审计两份 Manifest exact matches/无新增权限、package/Manifest version、预算 SHA/公式/超限负例、`git diff --check`、文档与 Gate 一致性。任一适用项未验证或 FAIL，不声称整个 Plan 完成。
- [ ] **Git 与状态。** 各 Task 只精确暂存自身实际改动；总审阅若有收尾修复，仅在 fresh verification 后形成对应 logical commit，若无新改动则不创建空 commit。按 feature-branch 既有授权 push；push 前 fetch 排除 divergence，后 fetch 确认 Local HEAD == Remote HEAD，并如实报告工作区。不得 merge main、tag/Release 或改写历史。Plan 完成只表示本工程骨架范围验收，不自动等于整个 Phase 1 完成或授权 Phase 2。

**执行审批：** 本 Plan 原稿曾为 Draft / Pending Approval；用户随后已明确批准 Task 1–9 在 `AGENTS.md` 边界内连续执行，不因普通细节或 Task 切换再次请求许可。环境阻断修订另获明确批准，但原 Plan approval 与本修订 approval 均不代表 Task / Plan 完成或 P1 → P2 获批。

## 已批准修订：Task 6 / Task 8 的具名环境阻断债务

本节、[工程规则修订文本](../specs/2026-09-29-environment-blocked-validation-rule.md)与对应 Spec 修订已获批准，必要 Notion 规则已同步；本笔债务的[受控复现与可取得原始证据](../../validation/2026-09-30-playwright-chromium-blocked-env.md)现已归档，历史 Sandbox `0x5` 原始流无法取得且已注明尝试方式。本轮其余可运行验收 fresh PASS、独立审阅无未解决代码 FAIL，故 **Eligible to request Phase progression with approved environment debt**；该资格仍须用户另行明确批准，不发生阶段转换。Task 6 Step 3、Task 8 独立 smoke workflow 和 Final verification 的原验收继续有效；Task 6、Task 8 smoke 部分及整份 Plan 仍 incomplete，债务仍 open，Phase 1 尚未全面验证通过。不得用归档提前标记 PASS 或 complete。

- **Task 6 Step 3**：harness、配置、helper、profile 清理逻辑及可运行的 unit/static 检查仍须逐项验收。当前主机因 bundled Chromium 在产品断言前启动失败而无法运行 smoke 时，记录原始错误、独立诊断、未验证断言和重验条件为 `BLOCKED_ENV`；不得将静态检查、合成 fixture 或真实品牌浏览器观察改写成 Playwright smoke PASS，也不得标 Task 6 complete。
- **Task 8 独立 smoke 入口**：工作流定义与可运行的解析/静态检查仍须验证；没有真实 bundled Chromium smoke PASS 时，独立 smoke workflow 保持 `NOT_VERIFIED / BLOCKED_ENV`，Task 8 的 smoke 部分和整体 Task 状态不得标 complete。已通过的十项 PR CI 仍须独立 fresh PASS，不因本债务增加第十一项通用 PR Gate 或豁免原十项。
- **Final verification 与阶段处置**：在其余可执行验收完成、Task 6/8 如实标 partial 后，对当前可验证范围先做独立 review，并逐项列出可执行检查的 fresh 结果；这不是上文须待 Task 1–9 各自验收通过才完成的最终总 review。阶段处置前还须补齐工程规则修订文本列明的可定位原始诊断记录；任何产品代码 FAIL 或其他未验证项均不得纳入此例外。整份 Plan 与 Phase 1 Definition of Done 保持未完成；规则与具名范围虽已批准，仍只能另行请求用户明确批准 Phase progression，不能自动转换阶段。合并 main 前，或环境恢复后首次合格机会（先到者），必须以 Playwright bundled Chromium 补跑原 smoke 并 PASS，然后完成原定最终总 review 与完整验收；产品断言失败按 FAIL 处理。Release 仍受既有门禁约束。
