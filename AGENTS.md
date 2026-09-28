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

# Architectural Plan 的 Git 与审批边界

当用户已明确批准 Architectural Spec，并授权进入 `superpowers:writing-plans` 时，Codex 可自行生成 Implementation Plan。Plan 必须标记为 **Draft / Pending Approval**。

Plan 自检与 `superpowers:verification-before-completion` 均通过，且本轮 diff 仅包含直接相关的 Spec / Plan / `AGENTS.md` 文档时，用户已授权 Codex 自动创建一个 logical commit 并 push 当前既有分支，无需再次询问 Git 权限。该 commit / push 只保存和同步文档，不代表 Plan 获批。

Plan push 后，Codex 必须等待用户明确批准，才可执行 Plan、修改产品代码、启动实现型 TDD 或 worktree、修改 Gate、启动新 Spike 或进入 Phase 1。

若 verification 失败、diff 含无关内容、存在 Git divergence 或出现未授权 requirement，立即停止，不 commit / push。
