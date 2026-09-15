# SWAW Pro 资料速记

整理于 2026-09-15；依据官方资料，尚未做项目内验证。

方向：See What Affects What。保留主题分类，逐步增加实体、事件、时间、关系与证据；追踪影响，不把相关性或模型推断当成已证实因果。

| 用途 | 资料 | 判断 |
| --- | --- | --- |
| 实体与来源 | [FollowTheMoney](https://followthemoney.tech/docs/)、[逐条陈述模型](https://followthemoney.tech/docs/statements/) | 优先借鉴稳定身份、属性来源与时间记录；领域模型不必照搬。 |
| 时间关系 | [Graphiti](https://github.com/getzep/graphiti) | 小样本验证关系更新、历史查询、实体合并与来源冲突；需模型及图存储。 |
| 情报平台 | [OpenCTI](https://docs.opencti.io/latest/usage/getting-started/) | 参考实体、报告和关系交互；安全领域约束与部署较重。 |
| 采集与变化 | [Crawlee](https://crawlee.dev/js/docs/introduction)、[changedetection.io](https://github.com/dgtlmoon/changedetection.io) | 优先 RSS/API；按需补充网页采集或重点页面差异监测。 |
| 证据抽取 | [LangExtract](https://github.com/google/langextract) | 从文本抽取结构及原文位置；仍需校验，简单任务可先用现有 Node 流程。 |
| 存储与筛选 | [SQLite](https://www.sqlite.org/whentouse.html)、[Typesense](https://typesense.org/docs/guide/tips-for-filtering.html) | 单机原型先用 SQLite；检索需求明确后再加派生索引。 |
| 文档关联问答 | [Microsoft GraphRAG](https://microsoft.github.io/graphrag/) | 面向文档图谱与检索问答，不等同于影响验证。 |
| 因果研究 | [DoWhy](https://github.com/py-why/dowhy)、[Tigramite](https://github.com/jakobrunge/tigramite) | 后期有明确变量、结构化观测与方法假设时再评估。 |
| 商业参考 | [Feedly Market Intelligence](https://feedly.com/market-intelligence)、[Palantir Ontology](https://www.palantir.com/docs/foundry/ontology/overview) | 分别参考关注与筛选体验、围绕实体组织分析与行动的思路。 |

最小路径：少量来源 → 事件与原文证据 → 核查 → 单一数据源 → 实体时间线与组合筛选；Hugo 继续负责发布。

验收重点：别名归并准确；发布/生效/采集时间分开；多报道去重；冲突不静默覆盖；判断可追溯、可修正；维护与模型成本可承受。
