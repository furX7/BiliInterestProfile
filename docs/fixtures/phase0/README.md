# Phase 0 实测摘要

这些 JSON 保留 2026-09-27 历史观察，并追加 2026-09-28 真实公开 DOM 回归（Asia/Shanghai）。
不包含正式生产 schema、采集器或测试工程。

- [read-log.json](read-log.json)：保留历史九读与负例；regression20260928 追加动态九次、主页区块九次、每来源各三次 reload、逐卡脱敏字段及不计数的工具失败。
- [mapping-candidates.json](mapping-candidates.json)：基础信息、视频摘录、修正转发评论的 Raw/Candidate 对照。
- [diagnostic-cases.json](diagnostic-cases.json)：无效 UID、转发误归属、历史验证码后假空、日期/链接缺失。

脱敏规则：UID 与昵称换别名，简介、视频标题和视频标识换明确占位符，空间 sourceUrl 中的 UID 替为 TEST_A/B/C；这些 URL 是**匿名引用模板，不可直接访问**。
提交版本不包含真实账号映射；[实验报告](../../architecture/phase-0-risk-experiments.md) 保留样本类型与观察，不可用于直接定位原账号。
仅保留“翻得好！”与用于拒绝的“分享动态”最短片段、日期、长度和结构，以复核边界；未保留完整动态、收藏内容或可识别简介。公开视频 ID 和收藏夹 ID 也替换为模板；模板不是稳定 Evidence ID。
占位符代表真实观察字段已脱敏，不是虚构的线上成功数据；摘要不声称不可逆匿名化。
没有合成普通账号成功数据。历史案例未记录时间的 observedAt 为 null，不捏造时间。
不同字段缺失会保留 null；不把来源错误包装成成功空数组。

核心字段仅为用户批准的临时 Evidence-like 格式；外层 metadata/raw/diagnostic 不会进入将来核心分析层。
timestamp=null 表示精确发布时间不可得；observedAt 是读取时刻。quality 是手工完整度标签。
历史每账号第二读复用 DOM、第三读刷新；本轮动态第二读离页再返回，主页第二读在切至其他账号后返回，第三读均明确 reload，不复用同一个 DOM 冒充三次。
这些是新页面渲染周期证据，不能证明三次独立接口请求或服务端响应；卡片计数为已渲染 DOM，未遍历历史。
投稿区块 B 10 张均合作，过滤零候选不判 empty；动态通用转发文案不产生兴趣 Evidence。当时逐 Source 异常矩阵下判定 PASS 1 / FAIL 2 / NOT_VALIDATED 1。
2026-09-28 用户批准 [ADR-007](../../adr/ADR-007-phase0-gate-separation.md)后，当前 Source Qualification 为 PASS 2 / FAIL 1 / NOT_VALIDATED 1，Phase 0 Global Risk Gate 仍 BLOCKED。
没有新实验，三份 JSON 完全保留；其中 sourceGate、gate.counts、remainingBlockers 是历史验收元数据，不能覆盖当前分层规则。OBSERVED/NOT_VALIDATED、时间、次数、样本和映射没有改动。
详见 [映射说明](../../architecture/phase-0-normalization.md)。
