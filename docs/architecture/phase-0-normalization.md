# Phase 0：临时字段映射与诊断

这里只是 Evidence-like JSON 概念验证；不创建正式 TypeScript interface、Zod、Adapter 或 Contract tests。
来源与 Gate 见 [实验记录](phase-0-risk-experiments.md)。

## 字段映射

| Candidate 字段 | profile | video 主页摘录 | dynamic 可见卡片 |
| --- | --- | --- | --- |
| source | `profile` | `video` | `dynamic` |
| userId | 当前空间 URL 首段 UID；落盘替换 TEST_A/B/C | 先确认 video-section 与标题/页面 UID；区块归属仅支持 partial，合作/上传者不明不能当独立投稿 | 空间 UID + 头部昵称/卡片顶层作者显示名一致；不取 @、引用作者、登录者 UID；卡片作者 UID 未暴露须保留边界 |
| timestamp | null：身份快照没有发布时间 | null：本次只观察日期粒度或缺日期 | null：相对时间/无年份月日不足以确定精确时间 |
| title | 昵称；fixture 替换 PUBLIC_NAME | `.bili-video-card__title a` 文本 | 文字动态没有标题则 null；不能混入播放时长或原作者标题 |
| text | `.sign.header-sign .pure-text` 简介；联系信息脱敏 | 本次无稳定描述则 null | 转发只取 `.bili-dyn-content__forw__desc`；“分享动态”等通用 label 不当自述；非引用读取 orig 描述/opus 段落/视频描述，排除他人互动评论 |
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
历史 V2 只在 C 复读与刷新各一次验证；2026-09-28 已补齐 A/B/C 各三次新页面读取及 reload，见 [读取日志](../fixtures/phase0/read-log.json) 的 regression20260928。
本轮已修补这个回归次数缺口。异常矩阵、必要字段缺失/未知类型的真实拒绝样本仍不足，动态保持 FAIL；不能据此发布生产 normalizer。

## 2026-09-28：实际回归的映射和降级

- 所有动态卡片保留 dateLabel（含行为后缀）；相对日期或无年份月日不倒推时间，timestamp=null，observedAt 单独存储。
- 有 reference：只读取目标用户转发描述，不以引用标题/原文补 text/title。没有明确目标描述则丢弃；该缺描述负例本轮未遇到，规则不是已通过的异常实测。
- 无 reference：分别从 orig 描述、opus 段落、视频描述与视频标题取候选；按钮、播放统计和他人评论不进入正文。
- C 第 2 张实际显示“分享动态”，第 2/3 读确认通用 label；候选 text=null、candidate=null，保留诊断而不生成兴趣 Evidence。不能猜是用户手写，也不能转用引用内容。
- 九次均未观察到单条动态 href：sourceUrl=空间动态页、traceGranularity=page、status=partial；@链接、视频 BV、短链不冒充动态 permalink。没有制造稳定动态 ID。
- 主页仅 `.section-wrap.video-section` 且标题“视频”，URL UID 与 `.sic-fsp-uid_line` 对应可见 UID 一致、昵称非空时记录区块候选。top-section、lists-section、like-section、收藏、订阅等全部排除。
- 每张视频标题非空，实际 href 中 BV 格式与 URL 主机核对后，删除追踪 query/hash，保留 canonical 视频 URL；落盘用 BV_REDACTED 模板，索引仅为诊断行号，不能作为稳定 Evidence ID。
- `.union-tag` 合作卡片没有独立上传者身份确认：不产出独立投稿候选。非合作卡片也只有区块绑定证据，保留 partial 与 uploader-uid-not-confirmed-on-card，不推断 creator。
- B 每读 10 张均为合作，过滤后 0 候选：来源降级 unavailable / SRC_ATTRIBUTION_UNCONFIRMED、items=null；原始页面有数据，不得写 available-empty 或成功 `[]`。
- 本轮投稿区块每张日期都有值；历史缺日期案例仍映射 null。动态 title 缺失与精确时间缺失已在真实卡片映射；缺必要 title/BV/作者、未知类型的拒绝仍缺真实负例。

上述是本次只读探针与手工 JSON 概念映射，不是生产 Normalizer。实际卡片与 Raw/Candidate 对照见 [候选](../fixtures/phase0/mapping-candidates.json) 和 [诊断](../fixtures/phase0/diagnostic-cases.json)。

## 2026-09-28：动态负例定向 Spike

一个既有公开目标的第 1 张动态：作者显示名与空间头部一致；dateLabel 为“10小时前 · 与他人联合创作”；视频描述仅 `-`，没有可识别的非引用自述节点，相关视频标题非空但作者归属未确认。
只读概念映射已返回 candidate=null、text=null、title=null、status=partial；占位 `-` 不构成兴趣正文，相关合作视频标题不得补作当前用户自述。这是已知结构的部分正文拒绝实证，不是未知 schema 或缺作者实证。
历史 C“分享动态”候选拒绝继续有效；没有为本轮伪造新的缺作者/未知类型卡片。

同一动态页有 12 卡而隐藏空态节点仍存在。状态判定必须区分可见语义、已渲染卡片与隐藏模板；仅空节点存在不能返回 available-empty。没有有效真空、明确权限拒绝或来源请求失败实测，相关规则仍是提案。
见 [候选](../fixtures/phase0/mapping-candidates.json) 与 [诊断](../fixtures/phase0/diagnostic-cases.json) 中 `dynamic-placeholder-co-creation-spike`、`hidden-empty-node-on-nonempty-dynamic-spike`。

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
不保存全页 HTML、全量动态正文、评论人、登录导航、徽章、会话凭据或用户私人信息。公开正文/标题只保留存在性、长度及脱敏占位符；最短归属片段仅“翻得好！”与用于拒绝的“分享动态”。
这些 fixture 只能复核观察与候选映射，不能代替真实重复访问或 Gate。
