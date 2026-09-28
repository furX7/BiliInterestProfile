# Phase 0 pagination / SPA UID switch 范围调整草案

状态：**已获用户批准并已同步正式文本**（2026-09-29）。本文保留为延期设计的审阅记录；正式规则以 ADR-007、来源组合 Spec、Phase 0 Gate、Implementation Plan 与 Notion 为准。延期不批准 Global Gate、Phase 1、实现或新 Spike。

## 事实与冲突边界

- [Notion《详细制作流程》](https://app.notion.com/p/3e81d223bf638178bfe9ecd4ea75190f)仍将分页和 SPA 切换后 UID 更新列为 Phase 0 验证任务；已接受的 [ADR-007](../../adr/ADR-007-phase0-gate-separation.md) 将其纳入独立 Global Risk Gate。现行 [Global Gate](../../architecture/phase-0-risk-experiments.md) 为 **BLOCKED**，不能凭本草案改变。
- 已登录 4 卡与匿名 12 卡的公开动态样本，经有限正常下滚均见明确终止提示；没有任何新批次，故未验证继续分页或跨批重复。缺少当前已打开、身份可确认且足以出现第二批的合格长列表；重复短列表不会补足缺口。此为当前证据路径的 **BLOCKED_ENV**，不是“站点无分页”或分页通过。
- 已记录的公开 @ 链接为 `target=_blank`，正常激活打开新标签，原页 UID 与卡片不变；另一次单页点击未证实链接激活。没有获得同一标签、同一 document 的 A→B UID 切换，因此旧内容隔离、路由更新及过渡竞态未验证。已测入口不适合回答原 Question；不能推断 B 站所有入口都如此。
- 现有[实验报告](../../architecture/phase-0-risk-experiments.md)与[脱敏 fixture](../../fixtures/phase0/read-log.json) 的正反观察、次数及历史结论全部保留；来源组合与其他 Gate 状态不变。

## 审批前原稿：拟议 ADR 修订

**Context：** 两项仍有真实证据缺口。继续重复已到终点的短列表或只会新开标签的已测入口，不会产生目标证据；为凑 Gate 寻找陌生账号或构造页面也不在已批准 Probe 内。

**Decision（审批前原稿）：** 在 Phase 0 记录中允许将这两项标作“验证延期候选”，供**以后另行授权的** closure audit 评估；其原始状态分别保持 `pagination = NOT_VALIDATED`、`SPA UID switch = PARTIAL`，不得写 `DONE`，不得删除历史证据或把 fixture / mock 当真实网页实测。此例外仅提议调整阶段验证时点，不降低身份归属、unknown/empty 区分、公开访问和安全拒绝边界。它不自动改变 Global Gate，也不自动授予 Phase 1。

**Alternatives：** 继续把两项作为 Phase 0 必须实测完成的硬阻断，证据要求最直接，但当前样本/入口下持续阻塞；或直接判 DONE，因无实测依据而不可接受。拟议做法是仅把延期是否可接受交由用户在后续审计中明确裁决。

**Consequences：** 现行 Notion、来源组合 Spec、Implementation Plan 与 ADR-007 均要求 Global Gate 完成后才能进入 Phase 1。要采纳延期路径，必须先由用户**另行批准**这些权威文本及 Gate 的相应修订；仅批准本草案不授权直接同步。以后即使开展 closure audit，审计也只能提出建议，不能自行覆盖已接受的硬门槛或授权 Phase 1。正式修订、审计与阶段授权之前，Global 继续 `BLOCKED`、Phase 1 继续禁止。若用户不接受延期，原 Phase 0 硬门槛继续有效。

## 拟议 Spec 增补：未验证范围与重验触发

| 项目 | 残余风险 / 不得宣称 | 重验触发与最迟节点 |
| --- | --- | --- |
| pagination | 动态新批次是否可读、跨批是否重复、长列表何时结束均未知；两个短列表的结束证据不可外推。不得称完整历史、继续分页或跨批去重已验证。 | 现行 v0.1 已限当前渲染卡片；一旦已有合格、正常可访问且可能加载第二批的长列表，在既批 Question + Probe 的样本类别、数量及尝试次数内复验；超出这些边界或实质改变 Probe 才重新审批。**在批准任何新增分页/完整历史能力验收或发布前**须取得真实新批次及跨批重复边界证据；若仍缺证，该新增能力只能标为未验证。受控测试不能替代真实网页证据。 |
| SPA UID switch | 同文档跨 UID 时是否混入旧卡、旧请求能否取消、页面与分析对象是否一致均未知。新标签观察不能证明同文档行为。 | 一旦正常站内交互中出现身份明确的同文档跨 UID 路径，在既批范围内复验，超界或新 Probe 先审批。**在批准任何 v0.1 同文档切 UID 能力验收或发布前**须取得真实路径证据及受控切换/旧结果隔离测试；若真实路径仍不可得，只能将网页实测标为未验证，并另交用户决定是否缩减该能力的产品范围，不得以测试或裁决冒称真实验证通过。 |

上述节点在审批前是**拟议的延期条件**；正式版本已同步至 ADR、Spec、Gate、Plan 与 Notion。重验不得搜索陌生账号、猜 URL、调用私有接口、绕登录/权限/CAPTCHA；若环境仍不具备，保持原状态并报告阻断。

## 审批前原稿：拟议 Gate 记录方式

正式 Gate 表若经后续批准修订，只增补两行的“延期说明 / 重验条件”，不改 `Status` 列，也不回写历史 fixture：

| Requirement | Status 保持 | 建议补充的审计注记 |
| --- | --- | --- |
| pagination | `NOT_VALIDATED` | 短列表终止边界有限证据；实际新批次/跨批重复缺证，当前无合格长列表；按上表触发重验。 |
| SPA UID switch | `PARTIAL` | 已测入口新开标签或点击未命中；同文档跨 UID 与旧内容隔离缺证；按上表触发重验。 |

审批前拟议新增与证据状态分离的字段：`deferral proposal = Pending User Approval`；正式修订获批后，已按规则改记 `deferral design = Approved`，但 `closure decision` 仍为 `Pending Separate Audit / User Approval`。这些都不是 Gate `DONE` 或 `PASS`。现行 `Global Gate = BLOCKED`、已批准的来源组合、logged-out 等其他状态均不变。

## 历史审批请求（已解决）

用户已认可上述**显式保留原状态的延期设计方向**，并明确批准正式 Notion / ADR / Spec / Gate / Plan 前置条件同步与准备 closure audit。Global Gate 改判、Phase 1、实施与新 Spike 仍须分别取得明确授权。
