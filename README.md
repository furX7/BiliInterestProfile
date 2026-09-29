# B站兴趣画像——看看你啥成分？

> 一个本地优先、零配置、可解释的 B 站公开兴趣画像浏览器扩展项目。

**B站兴趣画像（BiliInterestProfile）**计划根据用户正常可访问的公开投稿、动态、收藏、评论及其他明确公开内容，在浏览器本地分析兴趣组成。
目标是把分散的兴趣线索整理成看得懂、能查看依据的画像，帮助普通用户了解主要兴趣及其变化。

未来使用流程：

```text
安装扩展 → 打开 B 站用户主页 → 点击“分析兴趣” → 查看兴趣画像
```

目标体验：无需服务器、无需注册项目账号、无需 API Key、无需配置本地 AI；默认本地处理，面向不懂编程的普通用户。浏览器计划优先支持 Chrome / Edge Chromium。

**🚧 当前仍处于早期开发，尚无正式可安装版本。上述流程与功能均为计划，不能作为完成品使用。**

## 🚧 当前状态

**Phase 0 closure 已获批准；当前在 Phase 1 工程验证中，尚未完成整个 Phase 1。**

- 当前没有正式安装包，也没有已完成的兴趣分析功能。
- 已初始化 WXT / TypeScript 工程，并实现用户从扩展 popup 显式触发当前公开动态页的采集链路；它只返回脱敏来源状态，不生成兴趣画像。
- Chrome / Edge 生产扩展的已允许站点访问路径已取得真实安装态观察；持续未允许状态为 `BLOCKED_ENV`，撤销后即时及重载后的行为为 `NOT_VERIFIED`，均不是通过结论。
- Source qualification（来源资格）：**PASS 2 / FAIL 1 / 未验证 1**。

**Phase 0 closure 已获用户批准，Global Gate 不再阻塞 Phase 1**：pagination 仍 NOT_VALIDATED、SPA UID switch 仍 PARTIAL，作为明确接受的延期风险保留，并须按既定条件重验。v0.1 仅以公开动态当前渲染卡片作为兴趣行为证据，基础资料只作身份与上下文，投稿排除、收藏暂不纳入；不宣称多源行为印证。logged-out 在限定最低证据路径内 DONE；历史零卡原因未知，不证明匿名访问普遍稳定或独立服务器响应稳定。
通过项为公开基础信息快照，以及已登录公开动态页当前渲染内容的限定范围验证，不能代表兴趣分析已经可用。投稿仍有合作内容归属缺口，收藏尚未完成验证。
两来源资格门槛、Phase 0 closure 和进入 Phase 1 的用户审批均已完成；pagination 与 SPA UID switch 的历史证据状态保持不变。
详见 [Phase 0 实验报告](docs/architecture/phase-0-risk-experiments.md)。
当前运行时范围及两项安装态残余风险见 [安装态审计](docs/architecture/runtime-analysis-install-audit.md)。

## 为什么做这个项目

项目的目标包括兴趣层级、多来源验证、兴趣强度、置信度、时间变化和判断依据，而不止于“关键词 → 用户标签”。

```text
公开行为 → 标准化证据 → 兴趣识别 → 多来源验证
        → 兴趣强度 → 置信度 → 时间变化 → 可解释画像
```

一次偶然浏览或单条互动，不应该直接被当成强兴趣。长期重复出现、多个独立来源交叉印证，才应该提升判断置信度。
项目只分析公开可访问内容，不读取私人浏览历史；计划明确提示样本不足和来源缺失。

## 未来效果示意 / 计划效果

**以下是虚构的展示示意，不是当前产品输出。数字仅演示兴趣强度，不代表实测结果、准确率或概率，也不等同于判断置信度。**

```text
游戏          89%
├─ 二次元游戏  76%
│  ├─ 原神
│  ├─ 崩坏：星穹铁道
│  └─ 明日方舟
├─ FPS
└─ 独立游戏

科技          73%
├─ AI / 大模型
├─ 编程
└─ 数码硬件

动漫          61%
音乐          38%
历史          25%
```

未来计划逐步输出：兴趣强度、判断置信度、兴趣层级、时间变化、判断依据和数据完整度提示。
这些能力会按 Roadmap 分阶段推进，不代表 v0.1 将一次实现全部内容。

## 🔒 隐私原则

- **Local First / 本地优先**：默认在浏览器本地处理。
- 默认不建立服务器端用户画像数据库，不上传被分析用户的公开内容。
- 不要求注册项目账号、填写 API Key 或配置本地 AI。
- 分析结果计划保存在本地，用户未来应能清除本地分析数据。
- 只分析用户正常访问时可见的公开信息，不绕过登录、隐私限制或验证码。
- 项目不尝试从公开内容推断医疗状态、精神健康、性取向或其他敏感私人属性。

## 架构原则

计划的数据流：

```text
Bilibili
    ↓
Source Adapter
    ↓
Normalizer
    ↓
Evidence Store
    ↓
Analyzer
    ↓
Scoring Engine
    ↓
Interest Profile
    ↓
UI
```

三条不可破坏的工程纪律：

1. **任何 B 站原始字段都不能直接穿透到 Core。**
2. **任何可选能力失败后都必须存在降级路径。**
3. **任何画像结论都必须能够追溯到 Evidence。**

详见 [架构文档](ARCHITECTURE.md)。

## 🛣️ Roadmap

以下均为计划；版本顺序遵循 [Notion 产品与工程约束](docs/architecture/source-of-truth.md)。

| 阶段 | 目标 |
| --- | --- |
| **Phase 0（已完成 closure）** | 来源资格与全局风险分别记录；pagination、SPA UID switch 保留已接受的延期风险 |
| **Phase 1（进行中）** | 工程骨架、采集链路与安装态验收；不等于兴趣画像完成 |
| **v0.1** | 稳定采集、基础兴趣画像、可解释证据 |
| **v0.2** | 多来源融合、时间趋势、置信度 |
| **v0.3** | 本地轻量语义能力、长尾兴趣发现、自动降级 |
| **v0.5** | 「B站眼中的我」、分享卡片、UI 打磨 |
| **v1.0** | 稳定接口、Analyzer 架构、完整测试与文档、正式发布 |

## 技术方向

**Phase 1 已启动；当前代码与后续计划应分开看：**

当前已有 TypeScript strict、WXT、React、Manifest V3、Zod、Vitest 与 Chrome / Edge 生产构建；Playwright 依赖已列入工程，但不能据此宣称真实安装态自动化验收完成。IndexedDB / Dexie 等后续存储能力尚未实现。仓库已有 `package.json`，测试、lint、typecheck 分别使用 `pnpm test`、`pnpm lint`、`pnpm typecheck`。

## 成熟项目参考原则

项目会参考成熟、活跃的 B 站插件和浏览器扩展，学习 SPA 适配、页面数据读取、Manifest V3、缓存、CI 和错误降级。
直接复用第三方代码前会检查 License；许可证不兼容或不明确时，只学习思路，重新实现。
当前仅做方法研究，**未复制第三方代码**。详见 [成熟项目研究](docs/architecture/mature-plugin-research.md)。

## 项目文档

- [产品与工程来源](docs/architecture/source-of-truth.md)
- [Phase 0 实验报告](docs/architecture/phase-0-risk-experiments.md)
- [验证码与空态观察](docs/architecture/bilibili-antibot-observations.md)
- [临时字段映射](docs/architecture/phase-0-normalization.md)
- [脱敏样本与诊断案例](docs/fixtures/phase0/README.md)
- [工程执行记录](docs/architecture/engineering-ledger.md)
- [当前任务 Issue 001](docs/issues/001-foundation.md)

## License

开源许可证将在正式公开发布前确定。

## 📌 项目状态

**当前阶段：Phase 1 工程验证。**项目尚无正式可安装版本，也尚未生成兴趣画像。

如果你对这个方向感兴趣，可以关注项目后续更新。
