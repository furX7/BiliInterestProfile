# Phase 0：需求冻结

日期：2026-09-27。产品名：B站兴趣画像；工程名：BiliInterestProfile。

当前状态补充（2026-09-30）：下文保留 Phase 0 冻结历史。来源组合与 Phase 0 closure 已获批准，用户已批准 P1 带 Playwright 环境债务进入 P2 Contract First；pagination NOT_VALIDATED、SPA PARTIAL 保留。P1 smoke BLOCKED_ENV / NOT_VERIFIED、Task 6/8 与 Engineering Foundation Plan incomplete、债务 OPEN；环境首次恢复或 merge main 前（先到者）必须补跑。

## 产品与平台

- 首期 Chrome / Edge Chromium，Manifest V3；暂不为 Firefox 添加额外兼容分支。
- 基础功能无服务器、无账号系统、无 API Key、无强制本地 AI。
- 默认不上传被分析用户数据；不建立服务器端 B站用户画像数据库。
- 普通用户的目标流程：安装 → 用户主页 → 点击分析 → 本地可解释结果。
- 当前阶段尚不提供分析能力，不能宣传已可用。
- 仅处理当前用户正常可访问的公开内容，不绕过验证、访问控制或隐私限制。
- 不推断医疗、精神健康、性取向等敏感属性或现实人格。
- 后续相关产品用语统一为“公开表达特征 / 互动风格”。
- 数据缺失、空样本及可选来源失败都不是整次分析异常终止条件。
- Phase 0 历史冻结时的行为来源候选为投稿和动态，收藏作为候补；当时最终组合未冻结、Global Gate BLOCKED。现已批准 v0.1 仅公开动态当前渲染卡片为行为证据，基础资料只作身份/上下文，投稿排除、收藏暂不纳入；历史资格与风险见 [ADR-007](../adr/ADR-007-phase0-gate-separation.md)。

## 工程约束

- TypeScript strict、WXT、React、Zod、IndexedDB、Dexie、Vitest、Playwright、pnpm。
- B站来源一律 Adapter 化；原始字段仅在 Source 与 Normalizer 接合处使用。
- 六个核心边界为 Source、Normalizer、Evidence Store、Analyzer、Scoring、Profile Model。
- 四个长期扩展点为 SourceAdapter、Analyzer、SemanticProvider、Renderer。
- 任何结论必须带 Evidence 引用；兴趣强度与置信度分开。
- 预期失败返回 Result；用户消息与开发诊断分开。
- 所有外部输入与持久化数据运行时校验。
- 持久化需 schemaVersion / collectedAt / sourceVersion / TTL，升级需 migration。
- 实验能力通过本地 Feature Flag 默认关闭。
- 每次权限增加记录功能、原因及更小权限替代方案。
- SPA 用户切换与旧请求取消/旧结果丢弃列入后续 E2E。

## 验收

Phase 0 分别验收 Source Qualification 与 Global Risk Gate，见 [风险实验记录](phase-0-risk-experiments.md)；两来源资格达到不代表整体通过或允许进入 Phase 1。
Phase 1 验收：依赖冻结安装、lint、format、typecheck、unit、integration、
fixture/golden、Chrome / Edge MV3 build、bundle budget；E2E 环境允许时执行。
Phase 2 验收：TS/Zod 正反 Contract Tests、Raw 隔离、Evidence 身份/引用闭包、两层 Result/来源状态及 warning 独立、P1 compatibility、未来存储 envelope 的 schema 版本兼容。没有持久数据时不实现 migration 或伪称 migration tests；真实 Store、稳定 EvidenceId producer 与已有数据的破坏性变更迁移留给获批后续阶段。

禁止范围：完整采集器、兴趣算法、完整时间趋势/多源融合、分享卡片、云 AI、
本地大模型、ONNX、WebGPU、聚类、第三方代码执行、后端或账户系统。
