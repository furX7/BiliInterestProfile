# ADR-005：为什么默认不使用服务器

日期：2026-09-27。状态：架构决定已接受，来自 Notion。

## Context

用户画像集中存储增加隐私风险、部署与账户门槛。

## Decision

本地 IndexedDB 保存证据/画像，browser.storage.local 保存设置，不设后端或账号系统。

## Alternatives

服务器画像数据库；云同步与账户作为前置。

## Consequences

设备间默认不共享；需版本、TTL、迁移与后续本地删除能力；不上传内容遥测。

