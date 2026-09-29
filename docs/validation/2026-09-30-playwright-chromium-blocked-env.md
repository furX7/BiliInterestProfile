# Phase 1 Playwright bundled Chromium 启动阻断原始证据

状态：`BLOCKED_ENV / NOT_VERIFIED`，债务未结清。本文不是 smoke PASS、Task 6/8 完成、Phase 1 DoD 达成或进入 Phase 2 的许可。

## 环境与复现

- 受控复现：2026-09-30 00:27:17（Asia/Shanghai），仅运行一次 `pnpm test:e2e:smoke`；同期 Windows Application / SideBySide Event 33。
- 工作区：`C:\Users\MSI\.codex\worktrees\phase1-source-foundation\BiliInterestProfile`；分支 `codex/phase1-source-foundation`。
- `cmd /c ver`：`Microsoft Windows [Version 10.0.22631.6199]`。注册表：`ProductName=Windows 10 Pro`、`DisplayVersion=23H2`、`CurrentBuild=22631`、`UBR=6199`。WMI `Win32_OperatingSystem` 查询“拒绝访问”；不据兼容性产品名称推断另一版本。
- `node --version`：`v24.19.0`；`@playwright/test`：`1.63.0`。普通 shell 的 `pnpm --version` 为 `11.19.0`，但提权 shell 的 PATH 首先找到 `C:\Users\MSI\AppData\Roaming\npm\pnpm.cmd`（`12.3.4`）；首次 frozen install 退出码 0、原输出 `Done in 17ms using pnpm v12.3.4`。发现 PATH 差异后，显式调用 `C:\Users\MSI\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd`（`11.19.0`）重跑 frozen install，退出码 0、原输出 `Already up to date` / `Done in 279ms using pnpm v11.19.0`。后续可运行验收按该固定 11.19.0 路径复演；唯一 Chromium 复现发生在路径差异发现前，调用的是同一 `@playwright/test` 1.63.0，未因此再启动浏览器。
- `playwright-core/browsers.json`：Chromium revision `1243`、browserVersion `153.0.8010.12`。
- `chromium.executablePath()`：`C:\Users\MSI\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe`；文件存在，大小 4,508,160 字节。
- 最小步骤：从空 `.output` / `.wxt` 执行 Chrome production build（退出码 0）；设置 `DEBUG=pw:browser`；运行一次 `pnpm test:e2e:smoke`。测试不导航 B 站。

## 当次 Playwright 原始启动记录

实际启动命令（`DEBUG=pw:browser` 的 `<launching>` 行）：

```text
C:\Users\MSI\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,BlockOriginHeaderModificationOnRedirect,Translate,AutoDeElevate,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --disable-updater-scheduler --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --disable-extensions-except=C:\Users\MSI\.codex\worktrees\phase1-source-foundation\BiliInterestProfile\.output\chrome-mv3 --load-extension=C:\Users\MSI\.codex\worktrees\phase1-source-foundation\BiliInterestProfile\.output\chrome-mv3 --user-data-dir=C:\Users\MSI\AppData\Local\Temp\bili-interest-extension-smoke-DY4Udn --remote-debugging-pipe about:blank
```

Playwright 自身生成的命令含 `--no-sandbox`；本轮没有添加或修改该标志来规避阻断，未修改 ACL、未换品牌浏览器、未降低断言。

工具将 stdout/stderr 合并呈现，无法逐字分离独立流。原始错误与调用栈：

```text
Running 1 test using 1 worker
  x  1 tests\e2e\extension-smoke.spec.ts:13:1 › bundled Chromium loads the built MV3 extension and its idle pages (82ms)
Error: browserType.launchPersistentContext: spawn UNKNOWN
       at extension-context.ts:39
      37 |
      38 |   try {
    > 39 |     context = await chromium.launchPersistentContext(profileDir, {
         |               ^
      40 |       channel: 'chromium',
      41 |       headless: true,
      42 |       args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
        at openBuiltExtension (C:\Users\MSI\.codex\worktrees\phase1-source-foundation\BiliInterestProfile\tests\e2e\extension-context.ts:39:15)
        at C:\Users\MSI\.codex\worktrees\phase1-source-foundation\BiliInterestProfile\tests\e2e\extension-smoke.spec.ts:15:21
  1 failed
    tests\e2e\extension-smoke.spec.ts:13:1 › bundled Chromium loads the built MV3 extension and its idle pages
[ELIFECYCLE] Command failed with exit code 1.
```

Chromium 进程未正常创建，无可归属它的 stdout/stderr；没有进入 worker、popup、options 或产品断言。失败后该次精确临时 profile 已不存在。生成的 `test-results/.../error-context.md` 不作为产品证据或提交附件。

## Windows 原始事件、历史日志边界

本轮通过 `Get-WinEvent` 读取 Windows Application / SideBySide：

```text
TimeCreated: 2026-09-30T00:27:17.8519936+08:00
Id: 33
ProviderName: SideBySide
Message: “C:\Users\MSI\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe”的激活上下文生成失败。 找不到从属程序集 153.0.8010.12,language="&#x2a;",type="win32",version="153.0.8010.12"。 请使用 sxstrace.exe 进行详细诊断。
```

同一事件源还有 2026-09-29 22:27:45 的 Event 33、相同缺失程序集文本。此前诊断摘要记载同版本干净安装直接运行曾出现 `Sandbox cannot access executable / Access denied (0x5)`，但那次原始 stdout/stderr、stack 与临时安装目录未留存。本轮查过仓库 `docs/`、忽略的 SDD ledger、当前缓存目录 `debug.log`（不存在）及可获得的 SideBySide 事件；均未提供那次 Sandbox 原始流。因此 **Sandbox `0x5` 历史原始日志无法取得**，该短句只是既有摘要，不能冒充完整原文。本轮未为补它再次启动浏览器、改 ACL 或运行 sxstrace。

## 已证事实、候选原因与重验门槛

已证：exe 存在、Chrome build 成功、Playwright 发现 1 项测试；该项在创建浏览器进程时 `spawn UNKNOWN`，同期 Event 33 指向缺失 `153.0.8010.12` assembly；未执行产品断言。既有“同版本文件哈希一致”仅见于已批准工程规则的摘要，本轮未重新证明。

根因候选是本机对 bundled Chromium 的激活/可执行访问限制，SideBySide 依赖解析失败有本轮独立事件支持。尚未确认唯一系统原因、历史 Sandbox 原始流、其他受支持环境能否启动及 smoke 的 worker/popup/options/profile 清理断言是否通过。若环境恢复后进入断言并失败，立即按真实 FAIL 处理，不适用本债务例外。

Task 6、Task 8 独立 smoke 部分及 Engineering Foundation Plan、Phase 1 DoD 继续 incomplete。真实 Chrome/Edge 安装态或静态检查不能替代 bundled Chromium smoke。环境恢复后的首次合格机会、或请求合并 main 前（先到者）必须补跑；合并 main 前须真正 PASS，Release 另受既有门禁。阶段推进只能单独请求用户明确批准。

## 本轮可运行验收与独立审阅

显式 pnpm 11.19.0 路径、从空 `.output` / `.wxt` 重新 build 的本轮结果：frozen install 0；lint 0；Prettier PR-base check 0，新增 smoke 文件的直接 Prettier check 0（含 workflow YAML 解析）；typecheck 0；unit 91/91、失败 0；golden 1/1、失败 0；Chrome build 0；Edge build 0；integration 17/17、失败 0；bundle budget Chrome 与 Edge 均 `234491 / 293114` 字节、退出码 0；full Vitest 109/109、失败 0；Manifest 两份版本 `0.1.0`、MV3、背景/options 入口、精确 `https://space.bilibili.com/*` 匹配、无新增权限字段，审计退出码 0；Playwright discovery 1 项、退出码 0。独立 reviewer 未发现代码/安全范围/证据混淆问题；原始 pnpm 路径差异经复核及显式版本重验处理。唯一 smoke 运行是上文启动失败，退出码 1、断言未运行，保持 `BLOCKED_ENV / NOT_VERIFIED`。

依已批准的限定债务规则，当前材料可用于**单独申请** P1 带债 Phase progression；这不是 Phase 1 全面通过，也不是申请已获批准。历史 Sandbox 原始流缺失继续作为证据限制对外明示，不伪造补齐。
