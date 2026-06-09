# 映射判定规则

本文档只回答一件事：当 `$brand` 已经拿到品牌证据、Echo/Figma token 和 dangoui schema 后，如何客观判断映射关系。

不在这里解释资产架构；资产架构见 `brand-dtcg-migration-asset-standard.md`。
不在这里规定输出文档格式；输出格式见 `output-template.md`。

## 1. 先证明链路

任何组件样式问题，先追踪真实 token chain，再做语义判断。

顺序固定为：

```text
DOM class
→ dangoui 组件样式消费的 token
→ dangoui 组件别名映射
→ Figma / Echo alias 链
→ 当前 adapter 是否覆盖到这一层
```

禁止从命名直觉直接下结论，例如：

```text
看到 primary 按钮，就推断它使用 --du-primary-color。
```

Button outline 示例：

```text
DOM: du-button--outline + du-c-primary-bt
dangoui style: border: 1px solid var(--du-bt-border)
dangoui alias: bt-border -> primary-border
Figma alias: primary/bt/border -> {primary.border} -> {primary.5}
```

因此描边问题应检查 `--du-bt-border` / `--du-primary-border`，不是直接跳到 `--du-primary-color`。

## 2. Color 三层判断

### 一级色板层

只描述颜色本身，不赋予 UI 语义。

判断维度：

- 色相：红、橙、黄、绿、青、蓝、紫、中性色。
- 明度：高明度、中明度、低明度。
- 饱和度：高饱和、低饱和、近灰。
- 冷暖：偏冷、偏暖、中性。
- 频率：大面积、高频、低频但稳定。

不要在一级色板层命名为 `primary`、`secondary`、`success`、`warning`、`error`、`trade`。

### 二级语义层

根据真实使用位置分配到 App 角色：

- 中性基础：`--du-bg-*`、`--du-text-*`、`--du-icon-*`、`--du-border-*`、`--du-white-*`、`--du-default-*`、`--du-trans-black-*`。
- 品牌语义：`--du-primary-*`、`--du-secondary-*`，只承接主要行动入口或稳定品牌强调。
- 业务语义：`--du-trade-*`，只承接交易、购买、价格、促销等业务行动色。
- 基础语义：`--du-error-*`、`--du-success-*`、`--du-warning-*`、`--du-mask-*` 等明确状态色。
- Disabled / Disabledtemp：保留 dangoui 现有 `disabledtemp` 命名。

不要把插画、摄影、装饰渐变色塞进 `primary / success / warning / error`。

### 三级组件别名层

三级组件 token 默认继承或派生自二级语义层。

示例：

```text
--du-bt-*
--du-in-*
--du-checkbox-*
--du-radio-*
--du-switch-*
--du-*-tag-*
```

规则：

- 不优先用组件别名 token 做品牌迁移入口。
- 但解释组件样式时，必须按组件别名链路追踪。
- 不自动覆盖 tag、badge、pill、label 等组件专属视觉；需要特殊覆盖时列入 `ask-user`。

## 3. 非 Color Token

如果 Echo/Figma primitives 已有对应 token，优先承接到 primitives。

当前已知：

```text
Radius/Large = 16
Radius/Medium = 12
Radius/Normal = 8
Radius/Small = 4
Radius/Mini = 2

Spacing/Large = 16
Spacing/Medium = 12
Spacing/Normal = 8
Spacing/Small = 4
Spacing/Mini = 2
```

规则：

- 品牌原始值能准确匹配 primitives：`mapped`。
- 可用最近 primitives 表达但不完全匹配：`fallback`。
- Echo/Figma 有 token，但 dangoui 未同步：dangoui adapter 标为 `style-only`。
- Echo/Figma 和 dangoui 都没有：`missing`。
- 需要用户判断是否新增 token：`ask-user`。

DTCG 表达：

- CSS 距离类值使用 `$type: "dimension"`，例如 `{ "value": 16, "unit": "px" }`。
- 如果 Figma 当前导出为 `$type: "number"`，在 `$extensions.currentSourceType` 记录原始来源。
- 缺失 shadow 不输出空 `$value`，只记录缺口、原始值和未来候选。

## 4. Component Pattern

组件迁移不是按名字匹配，而是按品牌组件模式映射。

每个组件模式至少记录：

- `brandPattern`
- `status`
- `echoComponentCandidate`
- `dangouiComponent` 或 `dangouiComponents`
- `props`
- `slots`
- `usesTokens`
- `unsupported`
- `tokenChain`

状态定义：

- `mapped`：单个 dangoui 组件和现有 props/slots 能准确承接。
- `composed`：需要多个 dangoui 组件组合。
- `fallback`：可近似承接，但缺少部分 variant、slot 或状态。
- `style-only`：结构可承接，但品牌特征只能靠页面样式表现。
- `missing`：dangoui 没有对应组件或核心能力。
- `ask-user`：是否新增组件、variant、slot 或组件专属 token 需要确认。

规则：

- 不发明 dangoui 组件名。
- 不把页面组合误判为组件库新增需求；先记录为 `composed`。
- 涉及新增组件、variant、slot、组件专属 token 时，列入 `ask-user`。
- 弹层、toast、tooltip、upload、calendar 等依赖触发态的组件，可在 demo 占位，但 component mapping 必须记录真实状态。

## 5. 废弃层

`--du-c-*` 视为旧层，不作为品牌迁移目标。

如果真实 DOM class 仍出现 `du-c-*`，只把它作为组件别名链路证据，不把它作为新品牌迁移的输出 token。
