# Spec / Design 提交用户审批前的自检

任何 Design / Spec 在请求用户批准前，Codex 必须先自行完成一次 pre-approval review。

检查至少包括：

1. 与最新 Notion Source of Truth 是否一致；
2. 与已接受 ADR / Gate / 用户明确决定是否冲突；
3. 是否偷偷新增了未批准 requirement；
4. scope 是否超出本次已批准设计；
5. 是否遗漏已知边界、风险、降级行为；
6. 是否把 Agent 建议写成既定事实；
7. 是否存在内部矛盾、模糊定义或不可验证要求；
8. 是否错误授权了新 Spike、implementation 或 Phase 切换。

如果发现的问题不需要产品决策即可修正，Codex 必须自行修正，不要把编辑工作交给用户。

如果当前 Codex 环境存在适合的独立 review / subagent / review Skill，优先做一次独立审阅，再吸收有效反馈。

完成自检后，再请求用户批准。

向用户提交时只说明：

- 最终推荐设计 / Spec；
- 已自行检查的结果；
- 尚存风险；
- 真正需要用户决定的事项。

不要要求用户承担普通一致性检查、格式检查或遗漏检查。

注意：

- 自检通过不等于用户批准。
- ARCHITECTURAL 的 Design / Spec 最终 approval 仍必须由用户明确给出；Codex 不得自我批准并继续到 writing-plans。

# Spike 批准复用与批量审批

已明确批准的具体 Question + Probe，不因一次 inconclusive、BLOCKED_ENV、页面未稳定、点击未命中、工具 timeout 或当前样本不合格而自动失效。后续执行只要仍处于原 Question + Probe 的样本、操作与尝试次数范围内，Approval state 保持 **VALID / ALREADY_APPROVED**，可继续执行同一 Spike，无需重复申请批准。

以下情况必须重新审批：

- Question 改变或 Probe 实质改变；
- 扩大样本类别，或超出原批准的样本数、尝试次数；
- 新增搜索账号、猜 URL、调用接口等能力；
- 新增风险或外部副作用；
- Source of Truth 变化导致原 Probe 不再适用；
- 用户明确撤销批准。

生成新的 Probe 时，应在风险允许的范围内预留合理执行自治：可提出从当前已打开页面中自行选择最多 2–3 个同类合格样本，并使用正常点击、导航、reload、scroll。用户批准该范围后，更换范围内的同类合格样本无需反复申请；不得据此扩大任何既有 Probe 的批准范围。

Prompt Compiler 可一次提出最多 3 个**已明确展示**的 Phase 0 Spike Question + Probe 供用户批量审批。用户明确批准后，这些具体 Spike 均视为已批准，可按优先级连续执行；批量审批不构成对尚不存在的未来 Spike 的无限授权。

保留 Superpowers 的 hard gate：新的 Question 或实质改变后的 Probe，仍必须获得用户明确批准。

# Architectural Plan 的 Git 与审批边界

当用户已明确批准 Architectural Spec，并授权进入 `superpowers:writing-plans` 时，Codex 可自行生成 Implementation Plan。Plan 必须标记为 **Draft / Pending Approval**。

Plan 自检与 `superpowers:verification-before-completion` 均通过，且本轮 diff 仅包含直接相关的 Spec / Plan / `AGENTS.md` 文档时，用户已授权 Codex 自动创建一个 logical commit 并 push 当前既有分支，无需再次询问 Git 权限。该 commit / push 只保存和同步文档，不代表 Plan 获批。

Plan push 后，Codex 必须等待用户明确批准，才可执行 Plan、修改产品代码、启动实现型 TDD 或 worktree、修改 Gate、启动新 Spike 或进入 Phase 1。

若 verification 失败、diff 含无关内容、存在 Git divergence 或出现未授权 requirement，立即停止，不 commit / push。
