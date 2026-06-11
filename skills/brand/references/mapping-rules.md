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

一级色板必须先从源资产做全量抽取，不是 Top N 高频表，也不是最终 token mapping 的反推结果。所有从 CSS token、CSS declaration、截图采样、图片资产、已有 design token 中进入本次口径的颜色都要先列出，并按频次从高到低排序；存在于 token / 候选映射但证据未命中的颜色保留为 `0 次`。频次、占比和上下文用于排序与解释映射决策，不能替代完整色板。

判断维度：

- 色相：红、橙、黄、绿、青、蓝、紫、中性色。
- 明度：高明度、中明度、低明度。
- 饱和度：高饱和、低饱和、近灰。
- 冷暖：偏冷、偏暖、中性。
- 频率：大面积、高频、低频但稳定。

Color 输出至少拆成两组：

- `colorInventory`：完整颜色清单，按 count 降序记录 raw value、归一化 value、count、percent、来源、上下文、是否 UI color / media color / asset color；无证据命中的候选色 count 记 `0`。
- `rankedColorEvidence`：高频或关键颜色证据，记录 count、percent、target mapping、理由。
- `dangoColorStructure`：默认 DangoUI baseline 必须展示一级基础色板、二级语义 token、三级组件别名，说明颜色如何从基础色阶进入语义层，再进入组件别名层。

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

### Radius / Border / Shadow 分层

圆角、边框、divider/frame、阴影不能互相代偿，也不能从控件习惯泛化到页面容器。

Radius 判断：

- `frame/card/media radius` 和 `control radius` 分开记录。
- 图片边框、官网装饰框、卡牌外壳若是直角，frame/card/media radius 记为 `0px`。
- button、input、tag 出现 `5px / 8px / 999px` 只能证明 control radius，不能推导 card/media 也是圆角。
- 通用 demo 容器样式造成的圆角不是品牌证据；必须用 computed style 和来源证据交叉确认。

Border 判断：

- 先判断来源：真实 CSS `border`、图片 border asset、伪元素角线、内框、外框。
- 替换品牌边框时，优先替换目标容器本身的 border；不要默认在容器内部再画一层框。
- 如果用伪元素表达装饰边框，必须标明它模拟的是外沿角线、内框还是 asset fallback。
- 边框选择器必须限定到 demo/组件目标，避免证据面板、频次表、mapping 区被误套。

Divider / Frame 判断：

- 每个参考站都要提取 `hairline`、`frame`、`selection divider` 三类；没有特殊框也要记录 `none / plain hairline`。
- 普通分割线可以映射到 `--du-border-*`；装饰框、斜切框、角线、图片边框必须进入 `demoOnlyVisualControls` 的 frame recipe。
- Frame recipe 至少包含：目标作用域、线色/线宽、真实容器 border、角线或图片 asset fallback、radius、反例排除区域。

Shadow 判断：

- 阴影和发光只有在源站 CSS、图片采样或明确视觉证据存在时才保留。
- 选中态、hover 态、active 态不能为了“更明显”自行加 shadow。
- 没有依据的 shadow 要删除或标为 `style-only / ask-user`。

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
- 页面 demo 不是 component mapping 本身；如果做 2-3 个页面验证，每页必须有真实不同的结构和内容模式，不能只替换页面标题或复用同一通用 feed。

## 5. Existing Migration Assets 应用规则

当宿主项目已有 `migrations/{brand}` 或公开 demo/registry 站点返回的 style pack 时，优先应用资产，不重新学习品牌。

资产查找顺序：

1. 宿主项目 `migrations/{brand}/`
2. 公开 demo/registry 站点返回的 `{brand}` style pack
3. 如果两者都不存在，回到素材学习流程：`$brand <URL>`

应用顺序：

1. `{assetRoot}/brand-evidence.json`：确认原始证据、频次、上下文和用户校准过的判断。
2. `{assetRoot}/dangoui-adapter.json`：提取可进入 `--du-*` 的 tokens，以及只能进 `demoOnlyVisualControls` 的内容。
3. `{assetRoot}/component-mapping.json`：决定页面结构和 dangoui 组件组合。
4. `{assetRoot}/preview-gate.json`：决定应该应用到哪些核心页面或 preview 页面。
5. `{assetRoot}/echo-mapping.json` / `brand-profile.dtcg.json`：确认 fallback、style-only、missing、ask-user。

落地约束：

- `mapped` token 可以进入主题变量或 token override。
- `fallback` token 可以使用最近值，但必须保留注释或 adapter 记录。
- `style-only` 只进页面样式层、主题 class、asset 或 demo visual control。
- `missing` 和 `ask-user` 不要强行实现成假 token。
- 如果迁移资产和宿主项目现有设计系统冲突，先保留宿主项目 API 和命名，再用局部 theme class 承接品牌表现。
- 如果 `dangoui-adapter.json` 暴露 `--style-border-frame`、`--style-divider-color`、`*Frame.applyRecipe` 或类似 frame/divider recipe，必须落地为 CSS recipe。只初始化 `--du-border-1` 或 Divider 颜色会丢失装饰框。
- Frame/divider recipe 至少包含：目标作用域、真实容器 border、贴边角线或 asset fallback、radius、反例排除区域。

## 5. 废弃层

`--du-c-*` 视为旧层，不作为品牌迁移目标。

如果真实 DOM class 仍出现 `du-c-*`，只把它作为组件别名链路证据，不把它作为新品牌迁移的输出 token。
