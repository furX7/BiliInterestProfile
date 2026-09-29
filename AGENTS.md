# Long-Running Autonomous Execution

在已获用户批准的 Spec / Plan / Task scope 内，Codex 连续自主推进至当前批准范围完成；普通 Task 切换、子步骤、文档同步和当前 scope 内的修复不构成新审批点。每个 Task 仍须满足自身验收并完成 fresh verification，才能进入依赖它的下一 Task；阶段或 Plan 完成后做独立总 review。用户明确暂停、取消或收紧授权时，最新决定优先。

## 执行、排错与审阅

- test、build、lint、typecheck、review 或运行时出现异常时，先实际调用适用的 `superpowers:systematic-debugging`，按错误证据 → 复现 → 根因 → 最小修复 → 适用时 TDD → fresh verification 处理。当前批准 scope 内的普通缺陷自行修复；同一根因最多进行 3 轮有证据的调查、修复与验证，不盲目重试。三轮仍失败且证据指向新架构决策时请求用户决定；否则记录真实 blocker，继续其他独立 READY 项，不能假称通过。
- 重要 Task 自行做适用 review；阶段或 Plan 结束前做独立总 review。先核实 review 意见，成立且在批准 scope 内则自行修复并重新验证，不为普通 review fix 请求批准。
- 完成声明、Task 切换和 Git checkpoint 前调用 `superpowers:verification-before-completion`，按本轮改动运行适用 tests、lint、typecheck、build、integration / fixture、Manifest / schema / JSON、`git diff --check` 与 repo-specific acceptance。失败先排错，不作完成声明。

## 环境阻断与执行自治

`BLOCKED_ENV` 不默认终止整个长任务：记录阻断原因及未验证状态，不伪造 PASS；检查剩余依赖关系，继续独立 READY Task，所有可执行项完成后统一报告。只有 blocker 确实阻断全部剩余工作，或继续会越过批准边界，才停止。

Codex 自行完成可用工具支持的文件读取、编辑、测试、build、review、debug、READY Task 调度及批准范围内的正常浏览器点击/导航；不把用户当作执行遥控器。CAPTCHA、登录或凭据输入、只能由真人完成的浏览器授权须请求用户；不得绕过工具权限、安全策略、站点风控或读取凭据。工具通道不可达时记录限制，不换通道规避明确拒绝。

## 自动 Git checkpoint 与真正停止条件

在当前已批准的 worktree / feature branch 内，批准范围内的改动通过 fresh verification、无未解决 FAIL、Source of Truth 冲突、凭据或未授权权限扩大，且**精确暂存的 diff** 仅含该 logical checkpoint 时，可自动 commit 并 push 当前 feature branch，无需逐次申请。紧密相关的小修复可合并 checkpoint。push 前先 fetch 并检查远端无 divergence；禁止 force push 或覆盖远端。push 后再 fetch，确认 Local HEAD == Remote HEAD；检查并如实报告 working tree，保留无关未提交改动，不以全工作区必须 clean 阻断精确暂存的提交。当前任务的最新明确 Git 禁令优先；先前某一轮的“本轮不 commit/push”不自动成为后续已授权任务的永久禁令。

只有 scope 实质变化、新产品/架构决策、Source of Truth 冲突、新安全/权限边界、当前 scope 内无法解决且阻断所有剩余工作的 blocker、同一根因三轮失败并有架构风险证据，或用户明确要求暂停时，才为当前工作请求决策。merge main、Release / tag / 商店发布、force push、reset --hard、历史改写、删除远端分支或不可逆数据均另需明确授权；不得自动 push main。Superpowers 的 Design → Spec → Plan 用户审批 hard gate 与新 Spike 的 Question + Probe 审批始终保留。

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

# Architectural 阶段内自治与审批边界

ARCHITECTURAL 工作遵守 Superpowers hard gate：Design 获用户批准后，自行完成完整书面 Spec、pre-approval review、独立审阅及无需产品决策的修正，再提交用户审批；Spec 获明确批准后，调用 `superpowers:writing-plans`，一次性完成标记为 **Draft / Pending Approval** 的完整 Implementation Plan、自检与独立审阅，再提交用户审批；Plan 获明确批准后，在已批准 scope 内按上文长任务规则连续实施。普通设计细节、子步骤、Task 切换及 scope 内修复不重复申请批准。

Design approval 不等于 Spec approval；Spec approval 不等于 Plan approval；文档保存或 push 不代表审批。新 scope、产品/架构决策、安全权限及 Source of Truth 冲突仍须停下请求对应决定；单个 `BLOCKED_ENV` 只阻断依赖它的工作，不阻断其他独立 READY Task。用户后续明确限制优先。

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

# Prompt Compiler 的 Prompt Quality Gate

Prompt Compiler 在输出任何执行 Prompt 前，必须完成一次内部质量审查，只输出通过审查的最终版本。目标是生成“最小但足够”的 Prompt，不是最长的 Prompt。

## 真实状态与主要目标

先确认 Task type、Approval state、当前 checkpoint、blocker、已完成内容、未提交改动、当前 worktree / branch、当前 Source of Truth，以及下一项真正可执行的动作。不得让执行模型重复已经完成并验证通过的工作。

Prompt Compiler 默认生成覆盖当前**已批准长任务**的执行 Prompt：可包含多个有依赖关系的 Task，每个 Task 写明自身验收 Gate；通过后自动继续，scope 内 bug 自行 debug / TDD / review / verification，并按 feature-branch Git 规则形成 logical checkpoint。一个 Prompt 仍只服务一个已批准目标，不把未经批准的 design、spec、plan、implementation、Spike、Gate closure 或 Phase transition 串成自动授权；无依赖冲突的独立任务可 batch。

## 事实、授权与边界

Prompt 必须清楚区分：

1. 已知事实；
2. 本轮授权；
3. 禁止越界事项。

不得把推测写成事实、把 Plan 建议写成稳定 Contract，或把 synthetic evidence 写成真实网页证据。

生成前检查当前任务是否依赖未完成前序任务，能否只执行独立子步骤，以及是否会因缺失 Contract、DOM、Gate 或 approval 而产生伪实现。只能完成独立部分时，必须标明 `partial` 或 `preliminary`，不得声称整个 Task 完成。

## Prompt 内容与冲突检查

Prompt 应给 Executor 提供 Goal、Scope、Hard constraints、Acceptance 与 Stop conditions。正常的文件读取、命令选择、DOM 定位和测试顺序由 Executor 根据当前环境决定，除非这些步骤本身是验收要求。不得使用过时的固定坐标、文件状态或未经重新确认的环境假设。

输出前自行消除普通指令冲突，例如“只修改一个文件”却要求更新 ledger，“不修改任何文件”却要求记录证据，“不得 commit”却要求 Local HEAD == Remote HEAD，或“Compiler 模式”却要求实际执行修改。不得把这类 Prompt 编辑问题交给用户。

Skill Routing 必须与任务匹配，并实际使用适用的 Codex Skill：unexpected failure 用 `superpowers:systematic-debugging`；implementation 用 `superpowers:executing-plans` / `superpowers:test-driven-development`；completion claim 用 `superpowers:verification-before-completion`；design 用 `superpowers:brainstorming`；review 用适用的 review Skill。不得为形式调用无关 Skill。

Verification 必须匹配本轮动作：build 检查 exit status、output 与 Manifest；JSON 修改解析 JSON；代码改动运行相关 tests、lint、typecheck；文档检查 links、diff 与一致性；Git 收尾检查 status、HEAD 与 remote。只有 fresh verification 后才能声称完成。

Prompt 必须区分已批准 feature branch 的自动 commit/push、被用户另行限制的 Git 操作，以及始终需另行批准的 merge/main 发布或高风险操作；不得把长期 feature-branch 授权误写成每次均须请示，也不得把它扩大到 main。默认控制在约 250–700 中文字；多个已批准 Task 可按依赖关系适度延长，只保留影响执行正确性的内容，长期规则优先引用 `AGENTS.md`、Notion、Spec、Plan、ADR。

输出前内部确认：是否清楚当前进度、避免重复工作、只覆盖已批准目标、为依赖 Task 设置验收 Gate、未将 partial 当 complete、未混淆 synthetic 与 real evidence、没有冲突或不必要人工操作、未越过 approval / Gate / Phase，以及是否还能缩短而不丢失约束。任一项不通过时先自行修正。遇到 `BLOCKED_ENV` 先调度其他独立 READY Task；确无安全可执行项时，才报告剩余 blocker 与真正需要用户决定的最小事项。

# Architectural Plan 的 Git 与审批边界

当用户已明确批准 Architectural Spec，并授权进入 `superpowers:writing-plans` 时，Codex 可自行生成 Implementation Plan。Plan 必须标记为 **Draft / Pending Approval**。

Plan 自检与 `superpowers:verification-before-completion` 均通过，且**精确暂存的 diff** 仅包含直接相关的 Spec / Plan / `AGENTS.md` 文档时，可按上文规则在当前 feature branch 自动创建 logical commit 并 push，无需再次询问；其他未提交文件保持原样。主工作区若位于 main，只本地保存，不自动 push main。该 commit / push 只保存和同步文档，不代表 Plan 获批。

Plan push 后，Codex 必须等待用户明确批准，才可执行 Plan、修改产品代码、启动实现型 TDD 或 worktree、修改 Gate、启动新 Spike 或进入 Phase 1。

若 verification 失败，先按长任务排错规则处理，未恢复通过前不 commit / push；精确暂存的 diff 含无关内容时先纠正暂存范围。存在 Git divergence、未授权 requirement 或安全问题时停止相应 Git/任务动作，不覆盖远端或扩大 scope。
