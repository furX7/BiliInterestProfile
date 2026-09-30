# BiliInterestProfile 架构

本文件描述已冻结的工程边界；代码实现状态见 README 与开发记录。
产品与工程唯一权威来源见 [Notion 来源](docs/architecture/source-of-truth.md)。

## 单向数据流

Bilibili 页面 → Source Adapter → Normalizer → Evidence Store → Analyzer
→ Scoring Engine → Interest Profile → UI / Renderer

Notion 的六层核心边界：采集、标准化、证据仓库、分析器、统一评分、最终画像。
页面为输入，UI 为输出，不新增反向耦合。

## 四个扩展点

1. SourceAdapter：增加公开来源，处理分页、外部 schema 与采集状态。
2. Analyzer：仅基于 Evidence 产生结构化信号；API version 从 1 开始。
3. SemanticProvider：可选本地语义能力，失败时回退规则/元数据。
4. Renderer：只消费统一 InterestProfile，不采集、不重新评分。

不建立万能插件接口或任意第三方 JavaScript 执行系统。

## 三条不可破坏规则

1. B站原始字段不得穿透 Core，需经过 Source Adapter 与 Normalizer。
2. 所有可选能力失败必须可降级；数据不足正常返回结构化结果。
3. 所有画像结论必须追溯 Evidence，不能只有算法结论。

## 允许依赖与禁止方向

| 模块 | 允许 | 禁止 |
| --- | --- | --- |
| Core Contracts | Zod、统一错误/标准化类型 | Source 原始字段、网络、Storage 实现、UI |
| Source | Source 边界原始 schema、标准 Contract | 最终评分、UI、Analyzer |
| Normalizer | Source 原始 schema、Evidence Contract | UI、最终评分 |
| Evidence Store | Evidence Contract、Dexie | Analyzer、UI、B站网络 |
| Analyzer | Evidence、AnalysisContext、Result、可选 Semantic Contract | Source、Normalizer、cookie、网络、数据库、UI |
| Scoring / Trend / Taxonomy | 标准信号与 Evidence、Profile Contract | Source 原始 JSON、网络、UI、数据库 |
| Pipeline | 标准 Contract 与注入的边界能力 | B站字段与特定来源网络细节 |
| Renderer / UI | InterestProfile、用户可见消息 | Source、Normalizer、抓取、评分实现、原始 JSON |
| Entry points | 装配模块与扩展生命周期 | 把网络、评分和界面写进同一个入口 |

Source/Normalizer 边界完成外部校验后交付 SourceResult（标准 Evidence）。
RawSourceResult 仅允许来源边界和指定 Normalizer 接合使用，不能从 Core 导出。
存储读写同样校验 schema，不信任历史数据。

## 失败、版本与持久化

可预期失败采用 Result，区分 warnings、recoverable、用户消息与诊断。
complete / partial / empty 有明确语义，empty 不能掩盖验证失败。
各 Source、Analyzer 有独立 timeout 与 AbortSignal，不使可选失败拖垮主体。
兴趣强度 0–100 与置信度 0–1 分开，Topic 用稳定 ID。
持久化记录保留 schemaVersion、collectedAt、sourceVersion、TTL；数据库升级需迁移。
实验 Feature Flag 默认关闭。实现代码后用 lint 与 Contract Tests 强制这些约束。

## 当前阶段

用户已批准 Phase 0 closure，并批准 P1 携带已登记环境债务进入 P2 Contract First。Source Qualification 仍为 PASS 2 / FAIL 1 / NOT_VALIDATED 1；历史 Global Gate BLOCKED 判定保留，pagination 仍 NOT_VALIDATED、SPA UID switch 仍 PARTIAL。分层规则见 [ADR-007](docs/adr/ADR-007-phase0-gate-separation.md)，历史证据见 [真实风险实验](docs/architecture/phase-0-risk-experiments.md)。
P1 当前渲染卡片 Pipeline 与显式 runtime 触发已具备；单次空态候选保持 unknown/null。Playwright bundled Chromium smoke 仍 BLOCKED_ENV / NOT_VERIFIED，Engineering Foundation Task 6/8 与 Plan incomplete；债务 OPEN，环境首次恢复或 merge main 前（先到者）须补跑。P1 未全面验证完成。
P2 新增分层合同、Zod 与合成 contract tests，保留 P1 合同。外层 Result 调用成败与内层 RawSourceResult.status 来源状态分别校验，两层 warning 独立；仅 Source/Normalizer 接合可见 raw，P1 Pipeline 唯一既有 registry 装配边除外。EvidenceId 的 ev_ 仅是 P2 v1 语法命名空间，无稳定 ID producer。Analyzer、Profile 与未来存储 envelope 只有数据合同，无算法、真实画像、Store 或 migration。见 [P2 Spec](docs/superpowers/specs/2026-09-30-phase2-contract-first-design.md)。
