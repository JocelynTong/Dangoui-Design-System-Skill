---
name: brand
description: 将品牌网站、DESIGN.md、截图或 Figma/DTCG 资产迁移到 Echo / dangoui。用于统计高频视觉值和组件模式，保持 dangoui 命名不变，生成 token/component mapping，并应用到 demo 验证。
---

# Brand Skill

## 适用平台

这个 skill 同时面向 Codex 和 Claude：

- Codex：使用仓库中的 `skills/brand/` 作为分发包或安装来源。
- Claude Code：使用仓库中的 `.claude/skills/brand/` 项目 skill 镜像。
- Claude.ai 自定义 skill：打包 `skills/brand/` 目录上传。

维护时以 `skills/brand/` 为源目录，改完运行：

```bash
npm run sync:skills
```

同步后的 `.claude/skills/brand/` 内容必须与源目录一致。

## 目标

把上游品牌风格转成可审查、可迁移、可落地的 Echo / dangoui 资产。

核心原则：

- 保持 Echo / dangoui 的 token 名、组件名、props、slots 稳定。
- 品牌网站的 schema key、CSS 变量名、自然语言总结不能直接变成 dangoui token。
- 先用 2-3 个 demo 做视觉方向预审，再沉淀长期资产。
- 每次映射都必须有证据、状态和落地位置。
- 当前 dangoui 不支持的能力，不伪装成正式 `--du-*`。

## 每次必读文件

- `references/brand-dtcg-migration-asset-standard.md`：长期资产架构。
- `references/mapping-rules.md`：映射判定规则。
- `references/output-template.md`：输出格式。
- `references/dangoui.design-system.json`：当前 demo 的 dangoui token/component 快照；正式项目迁移后以真实 dangoui 源码为准。

如果宿主项目另有最新 dangoui schema 或 Echo/Figma DTCG 文件，优先使用宿主项目的真实文件，并把本 skill 内置快照只当作 fallback。

## 输入

最低输入：

- 目标品牌 URL、截图、DESIGN.md 或 Figma/DTCG 文件。
- 当前项目的 dangoui token/component schema。
- 可验证的 demo 页面。

更好输入：

- CSS / DOM computed style / 截图取样。
- 品牌页面组件结构。
- Echo/Figma token 文件，例如 `千岛.tokens.json`、`千岛暗黑.tokens.json`、`Primitives-QD.json`。

## 工作流

### 1. Preview Gate

先生成 2-3 个低成本 demo 方向。

每个方向记录：

- 视觉假设：色彩、密度、圆角、阴影、媒体气质、行动入口。
- 组件假设：页面结构、核心组件、组合方式。
- 用户反馈：选择、否定、合并、待确认。

只有通过用户预审的方向，才进入正式统计和迁移资产。

### 2. 品牌证据统计

统计前必须声明口径。

允许口径：

- UI 颜色：背景、文字、边框、图标、按钮。
- 非 UI token：圆角、间距、阴影、渐变、动效。
- 媒体资产：图片、插画、视频、摄影色。
- 组件模式：结构、props、slots、variant、状态、组合方式。

占比公式：

```text
占比 = 该值出现次数 / 本次统计口径内所有值出现次数总和
```

不要把 UI 颜色、媒体资产、圆角、阴影混在同一张百分比表。

### 3. 资产分层

把信息拆成五层：

- BrandEvidence：原始值、频次、占比、上下文。
- BrandIntent：中立品牌意图，不绑定具体库。
- EchoMapping：映射到 Echo/Figma token、组件、variant、slot、property。
- DangouiAdapter：映射到当前 dangoui `--du-*`、组件、props、slots。
- ReviewQueue：需要用户或设计系统 owner 确认的事项。

token 使用 DTCG 风格：`$type`、`$value`、`$description`、`$extensions`。

component 不是 DTCG 标准 token 类型，不要写 `$type: "component"`；组件映射放 companion JSON 或 group-level `$extensions`。

### 4. 映射判定

使用 `mapping-rules.md`。

摘要：

- 一级色板层：只描述颜色本身。
- 二级色板层：映射到 App 用色角色。
- 三级组件层：组件别名默认继承或派生自二级色板层。
- 非 color token：优先映射到 Echo/Figma primitives。
- component pattern：先映射 Echo/Figma 组件候选，再映射 dangoui。
- 组件样式解释：必须先证明真实 token chain。

禁止：

- 新造 `surface.card`、`background.page` 这类 token。
- 把废弃 `--du-c-*` 作为迁移目标。
- 从 `primary`、`success` 等语义直觉跳到组件样式结论。

### 5. 承接状态

每个 token 和 component 映射都标记状态：

- `mapped`：当前设计系统和 dangoui 都能准确承接。
- `fallback`：有接近值，但不能完全表达品牌原始值。
- `style-only`：只能在 demo 或页面样式层表现。
- `missing`：设计系统和 dangoui 都没有承接能力。
- `ask-user`：品牌规则和现有设计系统冲突，需要用户确认。

demo 中未同步能力放在 `demoOnlyVisualControls`，不要放进 `dangouiTokens`。

### 6. 生成输出

使用 `output-template.md`。

必须回答：

- 高频值是什么，次数和占比是多少。
- 为什么映射到这些 Echo/dangoui token。
- 组件模式如何映射到 Echo/dangoui component。
- 哪些只是 demo 视觉控制。
- 哪些是 fallback、style-only、missing、ask-user。
- 组件样式问题的真实 token chain。

可用脚本：

- `skills/brand/scripts/create-dangoui-mapping-doc.mjs`
- 项目本地 `scripts/create-dangoui-mapping-doc.mjs`

Claude.ai 自定义 skill 上传后，优先使用 skill 内的 `scripts/create-dangoui-mapping-doc.mjs`。

脚本生成后必须复核，不要直接交付。

### 7. 应用到 Demo

应用时：

- 保持 dangoui token 名称不变，只替换 value。
- UI 展示高频值、次数、占比和映射 token。
- UI 展示组件模式、dangoui component、props/slots、unsupported。
- 不支持的风格特征用 demo 专用视觉控制或 placeholder 表达。
- 运行构建。
- 用浏览器验证预设、token、组件映射和视觉效果。

## 验收清单

- 正文中文。
- 统计口径明确。
- 高频表有原始值、次数、占比、证据、角色判断、映射目标。
- 上游 schema key 没混成 dangoui token。
- 没新造非 dangoui token 名。
- 没把废弃 `--du-c-*` 当迁移目标。
- token 和 component 都有承接状态。
- 组件样式解释有真实 token chain。
- `dangouiTokens` 和 `demoOnlyVisualControls` 分离。
- 构建通过并完成浏览器验证。
