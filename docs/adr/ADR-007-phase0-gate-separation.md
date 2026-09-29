# ADR-007：Phase 0 分离 Source Qualification 与 Global Risk Gate

日期：2026-09-28。状态：架构决定已接受，用户明确批准。

## Context

此前实验为防止转发正文误归属、hidden empty state 误判、工具 timeout 冒充 Source failure、合作投稿归属错误，逐渐加入更严格的异常矩阵。这些防错原则有效。
后续将 Phase 0 整体风险和 Phase 3 正式 Adapter 错误处理解释为“每个 Source 必须真实遇到所有异常才能 PASS”，混用了 Gate 层级。历史 FAIL 是当时验收框架下的判定，不是待删除的实验事实。

## Decision

采用 B，分为三层；这是对 [Notion 阶段语义](../architecture/source-of-truth.md)的落实和项目级解释，不修改 Notion。

1. **Source Qualification**：明确范围的来源须有多个真实公开样本、合理重复/reload、可信目标与内容归属、必要字段成功标准化、可选字段缺失不补造、不可确认内容拒绝或降级、unknown 不伪装正常或 empty、访问不绕过限制、脱敏可审查记录。现有 3×3 是稳定性证据，不追加无限重复条件。
2. **Phase 0 Global Risk Gate**：单独完成 Chrome/Edge 范围、2–3 稳定公开来源及组合范围、不同样本、分页、未登录/已登录、隐私关闭、空数据、SPA UID 切换、权限最小化、无服务器/API Key、公开数据与敏感属性边界。证据标明适用范围；不重复计算同一缺口，也不以一个来源的证据推定所有来源。
3. **Phase 3 Adapter Engineering**：实现单请求/Source 总 timeout、AbortController、可恢复错误的 retry/exponential backoff、并发限制/节流、403/429/unauthorized/网络失败分类、schema validation、Source 独立状态、formal ErrorCode、controlled degradation；用 mock/fixture/controlled failure tests 验证。

不再要求每个 Source PASS 前亲眼遇到 valid available-empty、permission-denied、request-failed、403、429、timeout、独立 CAPTCHA、每种未知 schema 或必要字段缺失组合。空数据/隐私等全局任务仍保留；正式错误处理仍须实现。
始终保留 Evidence before claims、unknown != empty、无法确认则拒绝、不绕过 CAPTCHA/登录/权限/反爬。禁止为取得证据主动制造风控；真实网页观察与 mock/fixture 测试明确区分。临时概念映射不升级为正式 Contract。

## Alternatives

- A：所有异常继续作为逐 Source 硬门槛；真实覆盖充分，但稀有负例可无限阻塞并前移工程任务。
- B：Source、Global、Phase 3 分层；本次采用，需明确范围和证据覆盖关系。
- C：单一联合矩阵；整体风险直观，但单个来源资格与阶段职责较难追踪。

## Consequences

Source PASS 不代表 Phase 0 PASS；两个 Source PASS 也不能自动进入 Phase 1。Global Gate 必须独立完成，并由用户明确批准下一阶段。
Phase 3 仍须完整实现错误处理。已收集真实异常证据继续有效，不删除；历史日志的时间、次数、OBSERVED/NOT_VALIDATED、旧 FAIL 保留，不重新解释为不存在的成功。
当前 Phase 1 的 `RUNTIME_EXECUTION_FAILED` 与 `RUNTIME_RESPONSE_UNAVAILABLE` 仅用于既有 popup/content 工程失败分类；它们不替代本 ADR 第三层的 Phase 3 Source / Adapter formal ErrorCode 或网络异常矩阵，也不改变上述三层 Gate。
当前来源判定及动态限定范围逐项证据见 [实验报告](../architecture/phase-0-risk-experiments.md)。未来 Agent 不得将全部异常重新塞回逐 Source Gate；规则变更须明确决策依据。

## 修订（2026-09-29，已获用户批准）：两项延期验证

现有 `pagination = NOT_VALIDATED` 与 `SPA UID switch = PARTIAL` 保持原状态。它们可作为明确记录的 deferred validation / residual risk，供未来另行授权的 Phase 0 closure audit 评估；延期不是验证通过，不得写作 DONE / PASS，不得删除、弱化或重解释历史网页观察与 fixture。

- **pagination：** 已登录 4 卡与匿名 12 卡短列表均有明确终止边界，但未出现新批次，故继续分页、跨批重复及长列表终止均未验证。出现已打开、身份可确认且可能加载第二批的长列表时，须在既批 Question + Probe 的样本类别、数量与尝试次数内重验；超界或实质改变 Probe 须重新批准。现行 v0.1 仍限已批准的当前渲染卡片；任何新增的分页/完整历史能力验收或发布前，必须取得真实新批次与跨批重复边界证据，否则该新增能力只能标为未验证。受控测试不替代真实网页证据。
- **SPA UID switch：** 已测公开链接新开标签或未证实激活，未取得同一标签、同一 document 的跨 UID 路径；旧内容隔离、旧请求取消与对象一致性未验证。出现身份明确的正常同文档路径时，须在既批范围内重验，超界或新 Probe 须重新批准。任何 v0.1 同文档切 UID 能力验收或发布前，必须取得真实路径证据及受控切换/旧结果隔离测试；若真实路径仍不可得，只能明确网页实测未验证，并由用户决定是否缩减该能力范围。

本修订不改变现行 Global Gate、Notion 阶段要求或 Phase 1 前置条件。用户已批准 Notion Phase 0 延期边界及本 ADR / Spec / Plan 前置条件的同步；它们仍不构成 Global Gate 例外。即使 closure audit 被授权，它也只能提出建议，不能自行覆盖这些条件或授权下一阶段。

## 2026-09-29 最终用户处置

用户已批准 [Phase 0 closure audit](../architecture/phase-0-closure-audit-2026-09-29.md)，明确接受上述两项延期风险，决定 Phase 0 closure 完成、Global Gate 不再阻塞 Phase 1，并批准 Phase 0 → Phase 1 与已批准 Implementation Plan 的执行。pagination 仍为 NOT_VALIDATED，SPA UID switch 仍为 PARTIAL；延期不代表任一子项通过。前述 BLOCKED 和待审批表述是该决定前的历史状态，不得用于撤销本次明确授权或改写历史证据。
