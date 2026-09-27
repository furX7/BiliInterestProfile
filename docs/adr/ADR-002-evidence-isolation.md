# ADR-002：为什么 EvidenceItem 隔离 B站原始数据

日期：2026-09-27。状态：架构决定已接受，来自 Notion。

## Context

外部字段变化不应影响分析、评分和 UI。

## Decision

Raw 仅限 Source 边界和 Normalizer 接合；Core 只接收标准 Evidence，运行时严格校验。

## Alternatives

全系统共享原始 JSON；每个 Analyzer 自行解释字段。

## Consequences

需要 Normalizer 与 Contract Tests；来源变化局限在边界，不留 raw 字段后门。

