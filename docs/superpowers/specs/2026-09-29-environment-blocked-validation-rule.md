# 限定的环境阻断验证债务｜工程规则修订文本

状态：**Approved Rule Text（2026-09-30）；已同步 Notion**。本文件记录 Notion《工程流程优化｜从 Issue 到 Release》Definition of Done 下的限定工程规则及本次具名债务范围。文本批准不代表本笔债务已满足证据门槛，也不授权 Phase progression、merge 或 Release。

## 工程规则：environment-blocked residual debt

“相关测试与项目全量测试均通过”仍是功能、Task 和 Plan 的正式完成标准。`BLOCKED_ENV`、`NOT_VERIFIED` 均不等于 `PASS`，不得用风险接受把失败或未运行的测试改写为通过，也不得将未完成 Task / Plan 标为 complete。

仅当某一**具名测试、主机环境和受影响范围**具备可审计的原始错误与独立诊断证据，证明测试在产品断言前被外部执行环境阻断，且已排除已知产品缺陷、普通测试失败和配置错误时，才可申请一项限定的环境阻断验证债务。申请必须记录：原始错误和根因证据、未验证能力与受影响 Task、用户风险、已完成的替代性静态/单元检查及重验条件。full verification 中除具名被阻断项以外的所有可执行检查必须逐项 fresh PASS；须对当前可验证范围完成独立 review，且产品代码不得有已知 FAIL。被阻断项补跑通过后，仍须完成原 Plan 的最终总 review 与完整验收；**此前不得将整个 full verification 标为 PASS**。替代检查只证明自身覆盖的部分，不替代被阻断的测试。每一笔债务及其阶段处置均须用户明确批准；Agent 不得自行把未来未验证项套入本规则。

门禁分别判定：

1. **阶段推进**：仅在上述证据和审批齐备、无其他未解决 FAIL 后，才可另行请求用户明确批准解除该笔债务对 Phase progression 的阻塞。该决定不替代下一阶段独立的 Spec / Plan / 执行审批；受影响测试保持 `BLOCKED_ENV / NOT_VERIFIED`，对应 Task、Plan 与 Definition of Done 仍未完成，不得宣称上一阶段全面验证通过，也不得自动进入下一阶段。
2. **合并 main**：本次具名 Playwright smoke 债务必须先在受支持环境用 Playwright bundled Chromium 真正运行并 PASS，且重新核对相关回归，才可请求合并。该要求只针对本笔债务，不新增通用的第十一项 PR CI 硬门槛；合并本身仍需单独授权。
3. **Release**：不得带着本次未结清的 smoke 债务发布；债务结清后，还须满足既有 CI、真实 Chrome / Edge 安装态及核心用户流程 E2E 等发布门禁，并另行获得发布授权。阶段推进许可不传递至合并或发布。

在环境恢复后的**首次合格机会**或请求合并 main 前，以先到者为准，必须重跑原被阻断的 bundled Chromium smoke；若运行后出现产品断言失败，即按真实 `FAIL` 调试，本例外不再适用。不得通过关闭 sandbox、放宽 ACL、换用品牌版 Chrome / Edge、削弱断言或标记 warning-only 制造通过。若证据显示并非外部环境限制，立即撤销该笔债务的适用判断并恢复正常失败门禁。

## 本次具名债务的已批准范围与待归档证据

- **范围**：当前 Windows 主机上的 Playwright bundled Chromium extension smoke；影响 Phase 1 剩余工程骨架 Plan 的 Task 6、Task 8 独立 smoke workflow 与整份 Plan 的 full verification。十项 PR CI 是另一条验收链路，不以此债务豁免其中任何一项。
- **根因证据**：`browserType.launchPersistentContext: spawn UNKNOWN` 发生于扩展断言前；原缓存 Chromium 的直接启动报 SideBySide，Windows 事件记录缺少 `153.0.8010.12` assembly；同版本干净安装核心文件哈希一致，直接启动转为 Chromium 的 `Sandbox cannot access executable / Access denied (0x5)`。这些证据指向当前主机的可执行文件访问限制；具体主机策略尚未定位，不声称已证明唯一系统根因。
- **证据完整性**：上述是本会话与忽略的 SDD ledger 中的诊断摘要，并非已归档的完整原始记录。单笔债务正式处置前，至少须可定位归档：原始错误文本/stack、实际 Chromium 启动命令及 executable 路径、Node/pnpm/Playwright/bundled Chromium 版本、SideBySide 与 Sandbox access denied 事件或日志、已执行的最小复现步骤、观测时间、当前根因判断及尚未确认部分。缺少这些材料时，不得认定本笔债务已满足证据门槛。
- **未验证能力**：bundled Chromium 持久上下文加载生产 unpacked extension、MV3 worker 可发现、popup idle 与 options 页面断言、测试结束 profile 清理，以及独立 smoke workflow 的真实通过。已实现的 harness 和可运行的 unit/static 检查不等于这些运行时断言通过。
- **现状与风险**：Task 6、Task 8 smoke 部分和整份 Plan 保持 partial / `BLOCKED_ENV`，不标 complete；合成 extension smoke 尚无 E2E PASS。此前真实 Chrome / Edge 安装态证据与十项 CI 的本地验证各自保留，互不替代；其 fresh 状态须在实际阶段处置时重新核验。
- **重验**：第一个可稳定启动 Playwright bundled Chromium 的受支持环境出现时立即补跑；若此前拟合并 main，合并前必须先补跑并 PASS。失败后按真实结果处理，不自动延续例外。

## 与既有文档的关系

本规则已获批准并同步 Notion，但不改变 Definition of Done 的测试通过标准、Spec / Plan 原验收、Task 6 / Task 8 未完成状态或任何 Phase Gate。当前具名债务尚缺原始证据归档，不具备正式处置或申请 P1 带债进入 P2 的条件；文本批准也不等于 Phase progression、merge main 或 Release 授权。不得以本文件替代环境恢复后的 smoke 运行证据。

依据：[工程流程优化｜从 Issue 到 Release](https://app.notion.com/p/3e81d223bf638146b5eecae159ec60a7)、[详细制作流程｜稳定性与扩展性优先](https://app.notion.com/p/3e81d223bf638178bfe9ecd4ea75190f)、已批准的 Phase 1 剩余工程骨架 Spec / Plan 及用户对本 Design 的明确决定。
