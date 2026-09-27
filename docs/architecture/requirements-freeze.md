# Phase 0：需求冻结

日期：2026-09-27。产品名：B站兴趣画像；工程名：BiliInterestProfile。

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
- v0.1 行为来源候选为投稿和动态，收藏作为候补；基础信息仅身份/自述上下文。基础信息与动态已达到限定 Source Qualification，投稿归属未通过；最终组合仍未冻结，Global Gate 仍 BLOCKED，见 [ADR-007](../adr/ADR-007-phase0-gate-separation.md)。

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
Phase 2 验收：Contract Tests 拦截非法数据、Raw 不泄露、
Evidence 追溯约束、部分失败与版本迁移测试。

禁止范围：完整采集器、兴趣算法、完整时间趋势/多源融合、分享卡片、云 AI、
本地大模型、ONNX、WebGPU、聚类、第三方代码执行、后端或账户系统。
