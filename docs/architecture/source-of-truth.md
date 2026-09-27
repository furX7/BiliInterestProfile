# 产品与工程来源

唯一产品与工程 Source of Truth 为以下三份 Notion 页面。本地文档是实施记录，冲突时以 Notion 为准。

| 文档 | 链接 | 本次读取的最后编辑时间（UTC） |
| --- | --- | --- |
| B站兴趣画像｜项目 Idea | https://app.notion.com/p/3e81d223bf63810898c1f428ba5c8779 | 2026-09-27T13:57:58.064Z |
| 详细制作流程｜稳定性与扩展性优先 | https://app.notion.com/p/3e81d223bf638178bfe9ecd4ea75190f | 2026-09-27T14:00:51.642Z |
| 工程流程优化｜从 Issue 到 Release | https://app.notion.com/p/3e81d223bf638146b5eecae159ec60a7 | 2026-09-27T14:12:26.282Z |

初次读取日期：2026-09-27；本轮通过连接工具复核日期：2026-09-28（Asia/Shanghai）。三份均成功返回 content，未报告截断或未知 block；页面 verification 为 unverified。工程流程页当前 last-edited 为 14:12:26.282Z，修正本地先前记录的 14:00:43.044Z；产品范围和“两来源”门槛保持不变。用户明确指定它们为权威来源，而非依据 verification 推定权威。

同目录 notion-snapshots 为本次读取的完整内容快照，仅用于审查及断网查阅；两份快照已注明示例链接的格式修正，工程约束保持不变。继续开发前仍需检查当前 Notion。不得将快照当成新产品规范。

## 当前任务边界

当前仅处于 Phase 0：Source Qualification 为 PASS 2 / FAIL 1 / NOT_VALIDATED 1，Phase 0 Global Risk Gate 仍 BLOCKED，不允许进入 Phase 1–2。
2026-09-28 前一轮授权仅为 README、提交前审查、脱敏和 Git commit/push，禁止继续 Source 实验；这段是历史范围。
2026-09-28 历史回归授权为既有 A/B/C 的动态修正版与主页明确视频区块各三次（含 reload）、有限异常补证及文档/fixture 更新；随后完成动态边界 Spike 与只读 Gate 审计。
2026-09-28 当前用户明确批准方案 B 和 ADR-007：只用仓库已有证据落实分层 Gate，允许文档修改、来源资格重判、验证后 commit/正常 push。禁止新 B站实验、获取新来源数据、修改 Notion、初始化 WXT/package.json 或进入 Phase 1。
初始任务曾规划 Phase 0–2，但后续用户明确要求来源验证通过前不得初始化正式工程。
不提前实现 Phase 3 数据采集或 Phase 5 兴趣算法。

## Phase 0 前置门槛与批准的解释

制作流程明确要求：**至少两个数据源能够稳定获取并成功标准化，才进入 Phase 1。**
2026-09-28 用户批准 [ADR-007](../adr/ADR-007-phase0-gate-separation.md)，正式分离 Source Qualification 与 Phase 0 Global Risk Gate，并明确 Phase 3 Adapter Engineering 边界。这是落实 Notion 阶段语义的项目级解释，不修改或覆盖原始要求。
Source PASS 需证明明确范围内稳定获取、正确归属、成功标准化和安全拒绝/降级；不要求每个来源分别实测全部空数据、权限拒绝、请求失败及稀有错误。
现有基础信息与动态达到两个限定资格来源；分页、登录覆盖、隐私关闭、空数据、SPA、最小权限等整体任务单独验收，未完成时 Global Gate 仍 BLOCKED。正式 Adapter timeout/retry/403/429/schema/abort/错误处理与受控测试保留到 Phase 3。
详见 [实验报告](phase-0-risk-experiments.md)。Global Gate 完成并获用户明确批准前，不允许开始 Phase 1；“两来源 PASS”不等于已获准建立骨架。
