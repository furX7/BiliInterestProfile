# Phase 0：最小权限计划

这是权限设计与实验待办，不是已生成的 Manifest。当前没有扩展或权限变更。

| 候选范围 | 使用功能 | 原因 | 更小方案与当前决定 |
| --- | --- | --- | --- |
| 内容脚本匹配 https://space.bilibili.com/* | 将来识别当前公开用户主页与 SPA 用户切换 | 入口只在用户空间触发 | 不匹配全部 B站或全部网站；Phase 1 构建后审查实际 manifest |
| storage | 将来保存设置与少量本地状态 | Notion 指定 browser.storage.local；证据和画像用 IndexedDB | 如暂不持久化设置，则推迟加入；加入时注明实际调用者 |
| B站 API host permissions | 将来 Source 采集 | 尚无成功采集证据，当前不能确定需要的域名与路径 | Phase 0 不申请；真实来源实验成功后分别判断页面提取和跨域请求需求 |

不为未实现功能增加 cookies、history、webRequest、downloads、unlimitedStorage、
全域 tabs 或 <all_urls>。当前没有后台采集、遥测或云端域名。

WXT 开发模式可能追加热更新权限；只能以生产构建的 Manifest 审查发行权限，
分别检查 Chrome 与 Edge 的产物，不能用开发模式结果证明最小权限。
依据：[WXT Manifest 官方说明](https://wxt.dev/guide/essentials/config/manifest)。

## 后续验证

- 比较源码配置与两个生产 manifest 的 permissions / host_permissions / content_scripts。
- 每次权限变化在 Issue / PR 中写明调用者、使用功能、原因和更小方案。
- Chrome / Edge 实际安装检查提示范围，禁止未经依据扩大权限。
- 设置持久化与 IndexedDB 的权限需求分别验证，不把它们混为一谈。
