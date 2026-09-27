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

当前仅处于 Phase 0，来源 Gate 未通过，不允许进入 Phase 1–2。
2026-09-28 前一轮授权仅为 README、提交前审查、脱敏和 Git commit/push，禁止继续 Source 实验；这段是历史范围。
2026-09-28 当前授权为既有 A/B/C 的动态修正版与主页明确视频区块各三次（含 reload）、有限真实异常补证、已有文档/fixture 更新、验证后 commit/push。禁止降低 Gate、初始化 WXT/package.json 或进入 Phase 1；通过也仅报告候选门槛，等待用户确认。
初始任务曾规划 Phase 0–2，但后续用户明确要求来源验证通过前不得初始化正式工程。
不提前实现 Phase 3 数据采集或 Phase 5 兴趣算法。

## 本次发现的前置门槛

制作流程明确要求：**至少两个数据源能够稳定获取并成功标准化，才进入 Phase 1。**
本次真实访问未达到该门槛，详见 phase-0-risk-experiments.md。
未获用户明确调整前，不把“先建立骨架”解释为已允许忽略此条件。
