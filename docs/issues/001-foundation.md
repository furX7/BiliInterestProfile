# Issue 001：正式建立工程地基

状态：Source Qualification 为 PASS 2 / FAIL 1 / NOT_VALIDATED 1；Phase 0 Global Risk Gate 为 BLOCKED，Phase 1–2 未开始。
这是本地 Issue 草案；目标仓库为 [furX7/BiliInterestProfile](https://github.com/furX7/BiliInterestProfile)，尚未创建 GitHub Issue。
当前仍不允许进入 Phase 1；本轮按用户批准的 [ADR-007](../adr/ADR-007-phase0-gate-separation.md)重审已有证据，无新实验。基础信息与动态限定 PASS，投稿归属 FAIL，收藏 NOT_VALIDATED。历史逐 Source 异常矩阵下的 FAIL 与未验证事实保留。

## 目标

按 Notion 顺序完成 Phase 0、工程骨架和核心 Contracts，不提前实现完整分析。

## 用户价值

为将来普通用户零配置、本地运行、可解释且稳定的扩展建立基础。

## 涉及模块

Source / Normalizer / Core Contracts / Storage / Analyzer Contracts / UI shell / 测试 / CI。

## 影响判断

- Contract：是，首次定义 v1。
- 数据库 schema：是，首次定义本地数据库 v1 与迁移入口。
- 权限：需逐条审查，初始内容脚本只匹配用户空间；设置按 Notion 使用 browser.storage.local。
- 风险：Raw 泄漏、空态误判、无证据结论、迁移丢失、权限扩大、范围漂移。

## 验收标准

- [x] 三份 Notion 完整读取。
- [x] 需求冻结与原六份 ADR；新增用户批准的 ADR-007。
- [x] 至少两个来源稳定获取并成功标准化（Source Qualification：基础信息与动态，均限定范围）。
- [x] 历史三候选插件研究、真实账号重复 DOM 记录、临时映射与失败诊断。
- [x] 历史动态修正版三账号各三次新页面读取，含每账号一次明确 reload（九次，108 卡片观察）。
- [x] 主页明确 video-section 三账号各三次，含 reload，排除合集/点赞/代表作；保留合作卡片归属缺口。
- [ ] 逐卡上传者与合作角色充分确认；B 全部可见卡片合作，不能作为独立投稿通过。
- [x] 历史动态定向 Spike：有数据时隐藏空态模板不算 empty；合作占位描述不补造自述，候选拒绝并保留 partial；不替代仍未验证的全局异常或正式工程覆盖。

### Phase 0 Global Risk Gate（仍 BLOCKED）

完整证据与状态见 [Global Checklist](../architecture/phase-0-risk-experiments.md#phase-0-global-risk-gate)。以下打勾只对应 Phase 0 文档/风险范围，不宣称产品已实现。

- [x] Chrome / Edge Chromium 范围、不同类型公开样本、logged-in。
- [x] no server / no API key、public-data boundary、sensitive-attribute boundary。
- [ ] v0.1 最终 2–3 来源组合与范围（PARTIAL；已有两个资格来源，基础信息仅上下文）。
- [ ] pagination（NOT_VALIDATED）。
- [ ] logged-out（PARTIAL；主页可见，动态未知空态原因未决）。
- [ ] privacy-disabled / 明确 permission-denied（NOT_VALIDATED）。
- [ ] empty-data / 有效 available-empty（NOT_VALIDATED）。
- [ ] full SPA UID switch（PARTIAL；完整导航/新标签不等于同文档切 UID）。
- [ ] minimal permissions feasibility（PARTIAL；已有计划，尚缺选定来源需求核对）。
- [ ] Global Gate 完成后提交报告，并获用户明确批准进入 Phase 1。

**两来源 qualification threshold 已达到，不等于 Phase 1 已获准开始。只有 Global Gate 完成 + 用户明确批准后才能初始化。**

### 后续工程（本轮不执行）

request-failed、403/429/unauthorized、timeout/retry/abort、schema validation、Source 独立状态、formal ErrorCode、controlled degradation 及缺字段/未知类型 mock/fixture 测试归 Phase 3。真实未观察状态继续 NOT_VALIDATED，不要求逐 Source 在线上撞见全部负例。

- [ ] 安装依赖、strict TS、WXT MV3、四入口、React shell。
- [ ] lint、format、typecheck、unit、integration、golden、Chrome/Edge build、bundle budget。
- [ ] Phase 2 Contracts、Zod、Dexie v1、migration、Feature Flags。
- [ ] 可选失败与 Evidence 引用有真实测试。
- [ ] 无提前算法或 AI 等范围外实现。

### 历史判定

此前逐 Source 异常矩阵下为 PASS 1 / FAIL 2 / NOT_VALIDATED 1，动态在回归后仍 FAIL。2026-09-28 用户批准 ADR-007 后仅按现有证据澄清资格判定，动态限定 PASS；历史观察未改写，Global 仍 BLOCKED。

## 测试计划

匿名固定样本，schema 的正反例、存储迁移、局部失败、空样本、
Raw Fixture → Normalize → stub Analyzer → stub Scoring → Profile 的接口集成、
构建后 Playwright 基础入口验证。
stub 仅放在测试，不能作为实际产品分析。

## 回滚

尚无发布与持久数据；后续采用小分支、PR、CI、人工 Review。
实验能力通过本地 flags 关闭，数据库变化提供 migration，不要求用户清缓存。
