# Phase 0：成熟项目方法研究

研究日期：2026-09-27；报告整理：2026-09-28（Asia/Shanghai）。先研究，再开展本轮页面实验。
范围：公开 README、许可证、GitHub 元数据、固定提交的源文件和相关 Issue；没有安装、运行或复制这些项目的代码。
维护活跃度不等于当前每个功能可用，Issue 也不等于已复现的本项目故障。

## 候选与许可证

| 项目 | 规模与维护观察 | 固定研究提交 | 许可证及复用判断 |
| --- | --- | --- | --- |
| [Bilibili-Evolved](https://github.com/the1812/Bilibili-Evolved) | 未归档；约 30,595 stars；仓库 push 2026-09-27；最新 release v2.11.4，2026-09-26 | `fa06dcec095dbccaba82f50ae2318c8d61c26671` | [LICENCE.md](https://github.com/the1812/Bilibili-Evolved/blob/fa06dcec095dbccaba82f50ae2318c8d61c26671/LICENCE.md)：MIT 基础附加分发/支持约束；GitHub SPDX 为 NOASSERTION。不能仅标成纯 MIT；本轮仅借鉴方法 |
| [BewlyCat](https://github.com/keleus/BewlyCat) | 未归档；约 4,309 stars；push 2026-09-26；最新 release v1.8.0，2026-09-25 | `9d0b0c6683fc88ac8f19f15d1780cdb6eaecfdfa` | [LICENSE](https://github.com/keleus/BewlyCat/blob/9d0b0c6683fc88ac8f19f15d1780cdb6eaecfdfa/LICENSE)：MIT 基础自定义限制，涉及非浏览器客户端封装等；SPDX 为 NOASSERTION。后续复制前需逐项审查，本轮仅方法研究 |
| [bilibili-history-wxt](https://github.com/mundane799699/bilibili-history-wxt) | 未归档；约 134 stars，规模较小，成熟度证据弱于前两项；push/commit 2026-09-12；没有 latest release（接口 404），不推测发布版本 | `612731262eb10c4a80898e4513a1ad5a853b5eb9` | [LICENSE](https://github.com/mundane799699/bilibili-history-wxt/blob/612731262eb10c4a80898e4513a1ad5a853b5eb9/LICENSE)：MIT；复用须保留通知，本轮仍未复制代码 |

元数据由 GitHub 公开 API 读取；源文件通过 GitHub contents API 按固定提交读取。
第三项作为活跃 WXT 实践候选，不把它描述成已验证的通用公开空间采集器。
历史参考 [BewlyBewly](https://github.com/BewlyBewly/BewlyBewly)：MIT，2025-02-26 归档、最后 release v0.41.1；不计入活跃候选。

## 1. Bilibili-Evolved

固定提交根：[源代码](https://github.com/the1812/Bilibili-Evolved/tree/fa06dcec095dbccaba82f50ae2318c8d61c26671)。

| 检查项 | 源文件观察 | 对本项目的判断 |
| --- | --- | --- |
| UID | `src/core/utils/index.ts` 的 getUID 读取 DedeUserID；`src/core/user-info.ts` 从 nav 获取登录信息 | 是当前登录者 UID，不是被浏览空间 UID；不能作为兴趣画像目标身份 |
| 页面生命周期 | `src/core/observer.ts` 提供 MutationObserver childList/subtree；动态 manager 观察卡片插入和移除 | 借鉴局部 DOM 观察与清理；这些文件不能证明跨 UID 路由完整处理 |
| 投稿 | 动态 manager 能读取 major.archive 的视频标题/描述 | 不等同于完整公开投稿列表可用；本次没有对该项目投稿功能做安装验收 |
| 动态 | `src/components/feeds/api/manager/v2.ts` 对 `.bili-dyn-list__item`、`.bili-dyn-item`、`.bili-opus-view` 定位；读取 Vue 数据 modules/id_str/type，并适配 modules 数组或 map | DOM 卡片生命周期可借鉴；依赖 Vue 内部对象与旧/新字段属于脆弱边界，不复制这种内部读取方式 |
| 收藏 | 自定义导航 favorites 指向自己的 favlist | 不是任意目标账号公开收藏权限的证明 |
| 登录 | nav 的 -101 表示未登录；部分功能依赖本人会话 | 应逐来源记录登录要求，不能推断“全部需要”或“全部不需要” |

风险资料：[Issue #686](https://github.com/the1812/Bilibili-Evolved/issues/686) 为历史 2020 年视频风险页面、验证码及 412 报告，包含正常浏览场景；不当成当前风险阈值。
[Issue #5632](https://github.com/the1812/Bilibili-Evolved/issues/5632) 为 2026 年分类动态空对象读取 code 的异常，提示 schema/响应形态需要独立处理。
适合借鉴：卡片观察、ID 字符串、字段版本隔离、可选字段处理。
不适合：读取登录者 cookie 识别目标、依赖框架私有数据、把插件能工作当成来源稳定性证明。

## 2. BewlyCat

固定提交根：[源代码](https://github.com/keleus/BewlyCat/tree/9d0b0c6683fc88ac8f19f15d1780cdb6eaecfdfa)。

| 检查项 | 实现观察 | 对本项目的判断 |
| --- | --- | --- |
| UID | 空间相关请求显式传 mid/host_mid/up_mid | 参数角色不同，应从当前空间 URL 确定目标；不能复用登录者信息作为目标 |
| SPA | `src/contentScripts/index.ts` 比较 lastUrl、导航序号、排队 microtask；监听 popstate/hashchange/pageshow 及注入脚本转发的 pushstate/replacestate | 借鉴路由代数与过期结果拒绝。只监听 popstate 不覆盖全部 history 改写；主世界注入须另审权限与必要性 |
| 投稿 | `src/background/messageListeners/api/user.ts` getUserVideos 调用 `/x/space/wbi/arc/search`，mid/pn/ps/order/tid | 存在签名及接口变化风险；本轮没有调用此接口，也没有使用私有签名方案 |
| 动态 | moment.ts 的 getUserMoments 使用 `/x/polymer/web-dynamic/v1/feed/space`，host_mid/offset/features；getMomentsByUp 的 feed/all 是另一种会话信息流 | 空间动态与自己的关注信息流必须分开；接口实现不是普通未登录可访问性的证据 |
| 收藏 | favorite.ts 使用 folder/created/list-all、resource/list、folder/collected/list、space/fav/season/list | 分清文件夹与资源、公开与私人。收藏修改 POST 能力不属于本项目 |
| 视频元信息 | video.ts 使用 web-interface/view、player/pagelist 等 | 不把推荐接口或播放器信息当作目标行为证据 |
| 风控 | ForYou.vue 识别推荐接口风险、冷却并检查可疑空结果 | 学习显式错误/冷却；该逻辑针对首页推荐，不能推断所有空间空态都是风控 |
| 登录 | 不同 API/功能要求不同，存在会话相关功能 | 以本项目逐来源实验为准；不移植身份/token 切换及回退模式 |

[Issue #1043](https://github.com/keleus/BewlyCat/issues/1043) 报告多次手动刷新后首页白屏（报告版本 1.7.5）；不能推导本项目安全请求次数。
[Issue #752](https://github.com/keleus/BewlyCat/issues/752) 报告同页换视频残留旧评论，提醒路由变化须清理结果。
README 提到 2026 年推荐接口变化；这是维护背景，未在本机复现。
适合借鉴：导航序号、加载/失败与空态分离、冷却提示。
不适合：推荐数据充当用户兴趣来源、签名与身份回退、收藏修改、宽泛权限。

## 3. bilibili-history-wxt

固定提交根：[源代码](https://github.com/mundane799699/bilibili-history-wxt/tree/612731262eb10c4a80898e4513a1ad5a853b5eb9)。

| 检查项 | 实现观察 | 对本项目的判断 |
| --- | --- | --- |
| 身份/登录 | README 需要本人登录；后台使用自己的 history/cursor，会读取 SESSDATA | 属于私人历史，不符合本项目公开目标账号范围；未读取或保存此类凭据 |
| 注入与页面 | content.ts 匹配全站、document_start 转发 window 消息；injected.ts 包装 window.fetch 观察自己的历史删除请求 | 不是用户空间 SPA UID 识别方案，不能用它证明公开动态/投稿可获取 |
| 投稿/动态 | 检查到的入口与后台不提供任意目标账号公开投稿/动态抽取 | 未确认，不凭项目名或 WXT 推测能力 |
| 收藏 | 后台有收藏同步、检查点和错误分类，限流时暂停并保留 retryAfter 等状态 | 学习暂停与状态保留；本人收藏同步不是公开收藏权限验证 |
| 风险 | 历史分页设约 1 秒间隔、进度及冷却；未找到可明确归因的验证码 Issue | 间隔不是安全保证；未找到 Issue 不等于无风控 |
| 网络/AI | 有历史上传服务与可选 WebDAV/AI | 不引入后端、私人历史、云端数据或 AI 依赖 |

适合借鉴：错误类型、检查点、限流后停止、本地状态管理。
不适合：全站权限、cookie、fetch 包装、历史删除、历史上传及私人数据范围。

## 对 Phase 0 的结论

1. 优先研究当前可见公开 DOM；路由身份来自 URL，正文区块与引用区块必须分开。
2. 成熟项目同样依赖易变接口或 DOM；没有材料能保证匿名空间 API 持续可用。
3. 验证码与可疑空态是失败状态设计输入，不能据第三方逻辑绕过限制。
4. 后续采用来源独立失败、路由代数、有限等待和完整度标记；仍受 Notion 来源 Gate 约束。
5. 所有候选只做公开代码研究；没有安装验证，因此“最近仍能使用”仅有维护与 Issue 证据，不能写成功实测。
