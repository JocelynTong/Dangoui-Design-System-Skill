# 输出模板

本文档只回答一件事：`$brand` 完成分析后，应该产出哪些文件、每个文件写什么。

不在这里解释映射规则；映射规则见 `mapping-rules.md`。
不在这里解释长期资产架构；资产架构见 `brand-dtcg-migration-asset-standard.md`。

## 1. 推荐目录

```text
migrations/{brand}/
  preview-gate.json
  brand-evidence.json
  brand-profile.dtcg.json
  echo-mapping.json
  dangoui-adapter.json
  uno-adapter.json
  component-mapping.json
  README.md
```

## 2. JSON 文件职责

### `preview-gate.json`

保存正式迁移前的视觉方向预审结果：

- 2-3 个 preview demo 的方向说明。
- 每个方向的气质、信息密度、色彩假设、组件模式假设和核心页面。
- 用户选择、合并、否定或继续探索的决定。
- 被否定方向的原因。
- 进入正式 DTCG / Echo / dangoui 迁移的决策。

preview demo 的临时 class、裸 CSS value 和页面变量只能作为探索证据，不能直接成为正式 token。

### `brand-evidence.json`

只保存原始统计证据：

- UI color 高频值。
- radius / spacing / shadow / motion 等非 color 值。
- component pattern 高频模式。
- 每项必须有统计口径、次数、占比、上下文。

### `brand-profile.dtcg.json`

保存 DTCG 风格 token 资产：

- token 使用 `$type`、`$value`、`$description`、`$extensions`。
- component 不是 DTCG token，只能作为 group metadata 摘要或引用 `component-mapping.json`。
- fallback、style-only、missing、ask-user 写入 `$extensions.com.echo.brandMigration`。

### `echo-mapping.json`

保存品牌意图到 Echo/Figma 的承接：

- color 到语义 token。
- radius / spacing 到 primitives。
- shadow / motion / typography 的缺口或未来候选。
- component 到 Echo/Figma 组件候选。

### `dangoui-adapter.json`

保存当前代码落地关系：

- 已有 `--du-*` 如何赋值。
- 当前只能通过 `--style-*` 表现的内容。
- 未来可能迁移到的 `--du-*` 候选。
- 当前 dangoui 组件、props、slots 的承接状态。

### `uno-adapter.json`

保存 Echo / dangoui 到 UnoCSS 渲染层的适配关系：

- `uno-preset-echo` 如何暴露 token utility。
- 页面布局、间距、排版等 utility 使用规则。
- 哪些 preview demo class 只是临时表现。
- 哪些 `--style-*` 仍是 `style-only` 或 `fallback`。
- 是否需要更新 `uno.config.ts`、文档站示例或 preset。

不要把 `tailwind.config.js` 作为 Echo / dangoui 工作流的默认 token 输出。外部 Tailwind 项目只能作为兼容产物单独标记。

### `component-mapping.json`

保存组件模式映射：

- `brandPattern`
- `echoComponentCandidate`
- `dangouiComponents`
- `props`
- `slots`
- `usesTokens`
- `unsupported`
- `tokenChain`
- `status`

## 3. README 结构

```md
# {Brand} 迁移说明

来源：`{来源路径或 URL}`

## 0. Preview Gate

> 目的：先确认视觉方向，再进入正式 DTCG / Echo / dangoui 迁移。

| 方向 | 核心页面 | 气质 | 信息密度 | 组件模式假设 | 决策 | 原因 |
|---|---|---|---|---|---|---|
| `preview-a` | 首页、详情页 | 清爽克制 | 中 | `media-card`、`primary-cta` | selected | 更符合目标用户 |

## 1. 品牌风格摘要

用中文总结品牌气质、页面结构、识别手段、行动入口、页面节奏和可做 / 不可做。

## 2. 高频视觉值统计

> 统计口径：{UI color / radius / spacing / shadow / motion 等}
>
> 占比公式：该视觉值出现次数 / 本次统计中所有视觉值出现次数总和。

| 类型 | 原始值 | 次数 | 占比 | 证据 | 角色判断 | 承接 |
|---|---|---:|---:|---|---|---|
| color | `#ffffff` | 42 | 38% | 首屏、卡片、导航 | 中性表面 | `--du-bg-1` |

## 3. 高频组件模式统计

> 统计口径：{组件模式统计范围}
>
> 占比公式：该组件模式出现次数 / 本次统计中所有组件模式出现次数总和。

| 组件模式 | 次数 | 占比 | 证据 | Echo/Figma 候选 | Dangoui 落地 | 状态 |
|---|---:|---:|---|---|---|---|
| `media-led-card` | 9 | 36% | 首页 feed | `Card` | `DuCard + DuTag` | `composed` |

## 4. Token Mapping

说明 color、radius、spacing、shadow 等如何承接。

## 5. Component Mapping

说明品牌组件模式如何落到 Echo/Figma 和 dangoui。

## 6. 客观 Token Chain

当涉及组件样式问题，列出真实链路：

```text
DOM class
→ dangoui style token
→ dangoui alias
→ Figma / Echo alias
→ adapter
```

## 7. 承接缺口

分为：

- token 缺口。
- component 缺口。
- props / slots / variant 缺口。
- style-only 内容。

## 8. 机器可读资产

列出本次产出的 JSON 文件。

## 9. UnoCSS 渲染适配

说明哪些 utility 来自 `uno-preset-echo`，哪些只是 demo 布局，哪些 `--style-*` 属于 `style-only` 或 `fallback`。不要把 Tailwind 配置列为默认产物。

## 10. Demo 应用说明

说明哪些值进入 `--du-*`，哪些值只是 `--style-*`，哪些组件是真实渲染、组合或占位。
```
