# ADR-004：为什么兴趣强度与置信度必须分离

日期：2026-09-27。状态：架构决定已接受，来自 Notion。

## Context

高相关度的单条证据不等于有把握；伪精确百分比会误导。

## Decision

InterestNode 分开存 strength 与 confidence；信号 relevance 不是最终得分，Evidence 引用必需。

## Alternatives

一个百分比代表所有含义；Analyzer 自定义最终分数。

## Consequences

UI 需清楚说明两者；样本不足要降低或不输出结论，评分公式留到后续阶段。

