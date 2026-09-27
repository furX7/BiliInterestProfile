# ADR-001：为什么选择 WXT

日期：2026-09-27。状态：架构决定已接受，来自 Notion。

## Context

需要维护 MV3 和 Chrome / Edge 入口，避免手工构建反复漂移。

## Decision

使用 WXT，保留 src/ 逻辑边界和 explicit imports。

## Alternatives

手写 Vite/Manifest；其他扩展框架。

## Consequences

减少入口与 manifest 重复；接受 WXT 目录约束；实际构建校验权限。

