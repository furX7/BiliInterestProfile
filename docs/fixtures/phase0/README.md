# Phase 0 实测摘要

这些 JSON 来自 2026-09-27 真实浏览器公开 DOM 观察，整理于 2026-09-28。
不包含正式生产 schema、采集器或测试工程。

- [read-log.json](read-log.json)：三账号九读、一次无效上下文、登录前两读；记录真实观察时间和计数。
- [mapping-candidates.json](mapping-candidates.json)：基础信息、视频摘录、修正转发评论的 Raw/Candidate 对照。
- [diagnostic-cases.json](diagnostic-cases.json)：无效 UID、转发误归属、历史验证码后假空、日期/链接缺失。

脱敏规则：UID 与昵称换别名，简介、视频标题和视频标识换明确占位符，空间 sourceUrl 中的 UID 替为 TEST_A/B/C；这些 URL 是**匿名引用模板，不可直接访问**。
提交版本不包含真实账号映射；[实验报告](../../architecture/phase-0-risk-experiments.md) 保留样本类型与观察，不可用于直接定位原账号。
仅保留“翻得好！”这一最短必要评论片段、日期和结构，以复核转发边界与缺失时间处理；未保留完整动态、收藏内容或可识别简介。
占位符代表真实观察字段已脱敏，不是虚构的线上成功数据；摘要不声称不可逆匿名化。
没有合成普通账号成功数据。历史案例未记录时间的 observedAt 为 null，不捏造时间。
不同字段缺失会保留 null；不把来源错误包装成成功空数组。

核心字段仅为用户批准的临时 Evidence-like 格式；外层 metadata/raw/diagnostic 不会进入将来核心分析层。
timestamp=null 表示精确发布时间不可得；observedAt 是读取时刻。quality 是手工完整度标签。
每账号三读中第二读复用当前 DOM、第三读刷新；不是三次独立接口调用。
详见 [映射说明](../../architecture/phase-0-normalization.md)。
