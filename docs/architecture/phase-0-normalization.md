# Phase 0：临时字段映射与诊断

这里只是 Evidence-like JSON 概念验证；不创建正式 TypeScript interface、Zod、Adapter 或 Contract tests。
来源与 Gate 见 [实验记录](phase-0-risk-experiments.md)。

## 字段映射

| Candidate 字段 | profile | video 主页摘录 | dynamic 可见卡片 |
| --- | --- | --- | --- |
| source | `profile` | `video` | `dynamic` |
| userId | 当前空间 URL 首段 UID；落盘替换 TEST_A/B/C | 同左，但仅明确属于目标投稿区块才可归属 | 空间 UID；不能取 @链接、转发者、全站导航登录者 UID |
| timestamp | null：身份快照没有发布时间 | null：本次只观察日期粒度或缺日期 | null：相对时间/无年份月日不足以确定精确时间 |
| title | 昵称；fixture 替换 PUBLIC_NAME | `.bili-video-card__title a` 文本 | 文字动态没有标题则 null；不能混入播放时长或原作者标题 |
| text | `.sign.header-sign .pure-text` 简介；联系信息脱敏 | 本次无稳定描述则 null | 转发取 `.bili-dyn-content__forw__desc`；非引用正文按卡片类型读取；只保存有限摘录并标 partial |
| tags | []，表示没有观察到标签字段 | []，不从标题推断 | []；看到话题不代表已经稳定解析 tags |
| category | null | null：未取得分区，不猜 | null：动态形式不是兴趣分区 |
| sourceUrl | 公开空间主页，提交时以别名替换 UID | 视频 BV 链接，删除追踪参数；提交时替换真实视频标识 | 缺单条链接时空间动态页，提交时以别名替换 UID；追溯粒度 page，不能宣称 item |
| quality | 0.25：弱兴趣上下文 | 0.60：标题/BV 可见，缺精确时间/分区 | 0.50：可见评论摘录，缺稳定 item ID/精确时间 |

quality 是本阶段手工完整度标签，非产品评分或概率。以上值不构成算法。
空 tags 与未知时间/分区属于记录字段缺失，与整个来源“成功空列表”完全不同。
观察时间 observedAt 留在记录元数据，不替代 timestamp。

## 真实 Raw → Candidate 示例

### 基础信息

Raw：TEST_B 空间头部昵称与简介都为非空文本；三读结构一致。提交版本用 PUBLIC_NAME_B / PUBLIC_DESCRIPTION_B 取代可识别文本。
Candidate：source=profile、匿名 TEST_B、脱敏昵称与简介、timestamp=null。
详见 [mapping-candidates.json](../fixtures/phase0/mapping-candidates.json)。
三账号正例与无效 UID 0 构成基础信息的稳定读取/拒绝案例，不代表其兴趣判断价值充足。

### 视频

Raw：TEST_A 主页合集卡片有标题、BV 链接，dateLabel=2024年1月10日。提交版本将标题和真实视频标识替为脱敏占位符。
Candidate：保持标题字段及规范化视频 URL 的映射关系；timestamp=null，不把日期补成午夜；category=null。
该卡片是主页可见合集摘录，未作为完整投稿来源通过证据。代表作缺日期也保留 null。
同页点赞卡片不应归入投稿，即便同样匹配视频选择器。

### 转发动态

Raw：TEST_C 第一卡片当前用户评论“翻得好！”，引用区是其他作者的视频；引用标题不影响边界验证，提交时脱敏。
V1：只读 `.bili-dyn-content__orig`，错误取得引用原文；该结果**拒绝作为当前用户原创正文**。
V2：检测引用边界，读取 `.bili-dyn-content__forw__desc`，得到“翻得好！”；原作者内容不进入 text。
Candidate：title=null、text=翻得好！、timestamp=null、sourceUrl=匿名动态页、quality=0.5。
详见 [diagnostic-cases.json](../fixtures/phase0/diagnostic-cases.json)。
V2 已在 C 复读与刷新各一次验证；尚未完成 A/B/C 修正版三次回归，因此动态仍 FAIL。
也未解决所有正文类型与稳定单条引用，不能据此发布生产 normalizer。

## 拒绝与降级

- UID 0、非正整数、当前目标与卡片身份不一致：拒绝候选，SRC_INVALID_CONTEXT。
- 有效目标缺必要昵称、非预期正文类型/引用边界不明：schema-invalid 或单项跳过并标 partial。
- CAPTCHA：restricted，持续到来源重新经过正常验证；关闭后的空态不改成 available-empty。
- 明确权限拒绝：SRC_PERMISSION_DENIED/unavailable；未找到真实样本，只有设计规则。
- 明确网络/请求错误：request-failed/unavailable；尚未观察真实 HTTP/业务码。
- 不明空态：status-unknown/unavailable，items=null；不制造成功 `[]`。
- 真空：有效目标 + 明确成功/结束状态 + 无限制证据；本轮未找到符合条件样本。

## 保存与可复核性

JSON 为实测字段摘要，含脱敏占位符和本轮手工映射。占位符不代表虚构线上内容。
提交前已在报告和 fixture 中统一替换真实 UID、昵称、简介、视频标题和视频标识；不再公开真实账号映射。
只保留“翻得好！”等验证当前评论与引用边界所必需的最短片段；脱敏摘要仍不声称不可逆匿名化。
不保存全页 HTML、全量动态正文、评论人、登录导航、徽章、会话凭据或用户私人信息。
这些 fixture 只能复核观察与候选映射，不能代替真实重复访问或 Gate。
