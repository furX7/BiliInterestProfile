# 产品与工程来源

唯一产品与工程 Source of Truth 为以下三份 Notion 页面。本地文档是实施记录，冲突时以 Notion 为准。

| 文档 | 链接 | 本次读取的最后编辑时间（UTC） |
| --- | --- | --- |
| B站兴趣画像｜项目 Idea | https://app.notion.com/p/3e81d223bf63810898c1f428ba5c8779 | 2026-09-27T13:57:58.064Z |
| 详细制作流程｜稳定性与扩展性优先 | https://app.notion.com/p/3e81d223bf638178bfe9ecd4ea75190f | 2026-09-28T17:21:59.491Z |
| 工程流程优化｜从 Issue 到 Release | https://app.notion.com/p/3e81d223bf638146b5eecae159ec60a7 | 2026-09-27T14:12:26.282Z |

初次读取日期：2026-09-27；本轮通过连接工具复核日期：2026-09-29（Asia/Shanghai）。三份均成功返回 content，未报告截断或未知 block；页面 verification 为 unverified。详细制作流程页已同步最终用户决定：pagination 保持 NOT_VALIDATED，SPA UID switch 保持 PARTIAL，Phase 0 closure 完成，Global Gate 不再阻塞 Phase 1，现有 Implementation Plan 执行获准。用户明确指定这些页面为权威来源，而非依据 verification 推定权威。

同目录 notion-snapshots 是 2026-09-27 读取时的历史快照，仅用于审查及断网查阅，未包含 2026-09-29 的 Notion 修订。继续开发前仍需检查当前 Notion。不得将快照当成新产品规范。

## 当前任务边界

Phase 0 closure audit 已获用户批准；Source Qualification 为 PASS 2 / FAIL 1 / NOT_VALIDATED 1，pagination 仍 NOT_VALIDATED、SPA UID switch 仍 PARTIAL。用户已接受两项延期风险，决定 Global Gate 不再阻塞 Phase 1，并明确授权 Phase 0 → Phase 1 与既有 Implementation Plan 执行。
2026-09-28 前一轮授权仅为 README、提交前审查、脱敏和 Git commit/push，禁止继续 Source 实验；这段是历史范围。
2026-09-28 历史回归授权为既有 A/B/C 的动态修正版与主页明确视频区块各三次（含 reload）、有限异常补证及文档/fixture 更新；随后完成动态边界 Spike 与只读 Gate 审计。
2026-09-28 用户明确批准方案 B 和 ADR-007：只用仓库已有证据落实分层 Gate，允许文档修改、来源资格重判、验证后 commit/正常 push。该轮“禁止修改 Notion”的限制为历史范围。2026-09-29 用户批准延期验证规则、closure audit、最终 Gate 处置、进入 Phase 1 及执行现有 Implementation Plan；不授权新 Spike 或计划外产品变更。
初始任务曾规划 Phase 0–2，但后续用户明确要求来源验证通过前不得初始化正式工程。
不提前实现 Phase 3 数据采集或 Phase 5 兴趣算法。

## Phase 0 前置门槛与批准的解释

制作流程明确要求：**至少两个数据源能够稳定获取并成功标准化，才进入 Phase 1。**
2026-09-28 用户批准 [ADR-007](../adr/ADR-007-phase0-gate-separation.md)，正式分离 Source Qualification 与 Phase 0 Global Risk Gate，并明确 Phase 3 Adapter Engineering 边界。这是落实 Notion 阶段语义的项目级解释，不修改或覆盖原始要求。
Source PASS 需证明明确范围内稳定获取、正确归属、成功标准化和安全拒绝/降级；不要求每个来源分别实测全部空数据、权限拒绝、请求失败及稀有错误。
现有基础信息与动态达到两个限定资格来源；Phase 0 closure 前 pagination 与 SPA 缺口曾使 Global Gate 为 BLOCKED。用户已接受这两项延期风险并明确批准进入 Phase 1，子项证据状态不变。正式 Adapter timeout/retry/403/429/schema/abort/错误处理与受控测试保留到 Phase 3。
详见 [实验报告](phase-0-risk-experiments.md)与[closure audit](phase-0-closure-audit-2026-09-29.md)。两来源 PASS 本身不构成阶段授权；本次实施依据用户随后作出的明确最终决定。
