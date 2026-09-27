# Issue 001：正式建立工程地基

状态：Phase 0 继续验证已记录；PASS 1 / FAIL 2 / 未验证 1，来源门槛仍阻塞，Phase 1–2 未开始。
这是本地 Issue 草案；目标仓库为 [furX7/BiliInterestProfile](https://github.com/furX7/BiliInterestProfile)，尚未创建 GitHub Issue。
当前仍不允许进入 Phase 1；本次整理提交只涉及 README、脱敏、链接、忽略规则和状态一致性。

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
- [x] 需求冻结与六份 ADR。
- [ ] 两个来源稳定获取与标准化。
- [ ] Phase 1 来源门槛通过（用户明确要求不提前放行）。
- [x] 本轮三候选插件研究、真实账号重复 DOM 记录、临时映射与失败诊断。
- [ ] 动态修正版三账号各三次、真实空/权限/请求失败状态补证及跨 UID SPA 验证。
- [ ] 两来源 PASS 后提交报告并获用户进入 Phase 1 的确认（本轮禁止自动初始化）。
- [ ] 安装依赖、strict TS、WXT MV3、四入口、React shell。
- [ ] lint、format、typecheck、unit、integration、golden、Chrome/Edge build、bundle budget。
- [ ] Phase 2 Contracts、Zod、Dexie v1、migration、Feature Flags。
- [ ] 可选失败与 Evidence 引用有真实测试。
- [ ] 无提前算法或 AI 等范围外实现。

## 测试计划

匿名固定样本，schema 的正反例、存储迁移、局部失败、空样本、
Raw Fixture → Normalize → stub Analyzer → stub Scoring → Profile 的接口集成、
构建后 Playwright 基础入口验证。
stub 仅放在测试，不能作为实际产品分析。

## 回滚

尚无发布与持久数据；后续采用小分支、PR、CI、人工 Review。
实验能力通过本地 flags 关闭，数据库变化提供 migration，不要求用户清缓存。
