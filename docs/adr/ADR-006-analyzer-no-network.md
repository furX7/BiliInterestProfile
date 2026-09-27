# ADR-006：为什么 Analyzer 禁止直接请求网络

日期：2026-09-27。状态：架构决定已接受，来自 Notion。

## Context

采集耦合会使 Analyzer 无法离线测试、难以降级，并扩大隐私风险。

## Decision

Analyzer 只接收 Evidence 与 AnalysisContext，只返回结构化 AnalyzerResult；禁止网络、cookie、数据库、DOM。

## Alternatives

Analyzer 自行抓取；统一万能 Plugin 权限。

## Consequences

采集交给 Source；Pipeline 装配超时与局部失败；以静态限制和断网 fixtures 验证。

