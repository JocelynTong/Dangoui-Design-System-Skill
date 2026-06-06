# Dangoui Token 命名学习笔记

本文档基于 `data/dangoui.design-system.json` 和 `dangoui-tokens-by-prefix.md`，总结 dangoui token 命名规律、创建人的可能意图，以及后续 AI 做“大品牌风格学习 → 填入 dangoui token value”时应该遵守的规则。

## 核心观察

dangoui tokens 不是 `surface.card`、`background.page` 这一类通用设计系统抽象命名。

它的稳定契约是 CSS 变量名：`--du-*`。

从现有 token 看，dangoui 大致有三层：

1. 一级色板层：原始色阶、黑白透明阶梯、中性色阶。
2. 二级色板层：把一级色板分配到 App 的真实用色角色里，包括中性基础、品牌语义、业务语义、基础语义和禁用态。
3. 三级组件层：组件自己的 token 入口，通常继承或派生自二级色板层。

因此，把外部品牌风格映射进 dangoui 时，必须保持 `--du-*` 名称不变，只填 value。

## 命名规律

### 1. 一级色板层

一级色板层负责提供最基础的颜色原料。它不直接表达“这个颜色用在按钮还是背景”，而是先把颜色组织成可推导、可替换的色阶。

`primary`、`secondary`、`success`、`warning`、`error`、`trade`、`white`、`default`、`trans-black` 这些大组都有重复结构。

多数颜色家族先从 1-9 色阶开始：

```text
--du-primary-1
--du-primary-2
...
--du-primary-9
```

可以推断：

- `1` 通常是最浅的 tint。
- `5` 或 `6` 通常是代表性可用色。
- `9` 通常是最深的色值。

所以做品牌迁移时，应先提取品牌主色，再生成兼容的 1-9 色阶，而不是只改一个 `--du-primary-color`。

### 2. 二级色板层

二级色板层是在一级色板层之上，进一步把颜色分配给 App 里的实际用色角色。后续做品牌风格迁移时，AI 应该主要在这一层判断“这个颜色承担什么职责”。

#### 2.1 中性基础：App 中约 60% 的用色

中性基础承担页面中最大面积、最高频的视觉职责，包括 text、icon、bg、border，以及 neutral / white 相关层级。

典型 token：

```text
--du-bg-1
--du-bg-2
--du-bg-3
--du-bg-4
--du-text-1
--du-text-2
--du-text-3
--du-text-disabled
--du-border-1
--du-border-2
--du-border-3
--du-icon-1
--du-icon-2
--du-icon-3
--du-icon-disabled
--du-white-1 ... --du-white-9
--du-default-1 ... --du-default-9
--du-trans-black-1 ... --du-trans-black-9
```

可以推断：

- `bg`：页面背景、容器背景。
- `text`：一级、二级、三级、禁用文字。
- `border`：不同强度的边框。
- `icon`：不同强调层级的图标颜色。
- `white` / `default` / `trans-black`：黑白透明阶梯，用于覆盖、暗色模式、弱强调、默认控件等。

这些是品牌风格迁移最安全的第一批目标，因为它们控制整体气质，而不是单个组件细节。

#### 2.2 品牌语义：App 中约 30% 的用色

品牌语义承担主品牌识别和主要行动入口，主要对应 CTA Primary / Secondary。

典型 token：

```text
--du-primary-1 ... --du-primary-9
--du-primary-color
--du-primary-border
--du-primary-soft-bg
--du-primary-solid-bg
--du-primary-solid-color
--du-primary-text-color
--du-primary-outline-color
--du-secondary-1 ... --du-secondary-9
--du-secondary-color
--du-secondary-solid-bg
--du-secondary-text-color
```

在 1-9 色阶之后，每个颜色家族会重复一组用途型别名：

```text
--du-primary-color
--du-primary-border
--du-primary-soft-bg
--du-primary-solid-bg
--du-primary-solid-color
--du-primary-text-color
--du-primary-outline-color
```

这说明创建人不希望组件直接消费一级色板数字，而是消费二级色板层里的“用途”。

例如：

- `--du-primary-color`：可读的主强调色。
- `--du-primary-soft-bg`：浅色强调背景。
- `--du-primary-solid-bg`：实心按钮/控件背景。
- `--du-primary-solid-color`：实心背景上的文字或图标颜色。
- `--du-primary-border`：描边色。
- `--du-primary-text-color`：强调文字色。

所以做品牌迁移时，生成一级色板后，还应该同步填二级色板层中的语义 token。

#### 2.3 业务语义：App 中约 30% 的用色

业务语义承载业务强相关的行动色或交易色，例如 CTA Trade。

典型 token：

```text
--du-trade-1 ... --du-trade-9
--du-trade-color
--du-trade-border
--du-trade-soft-bg
--du-trade-solid-bg
--du-trade-solid-color
--du-trade-text-color
--du-trade-outline-color
```

`trade` 不应该简单理解成 error 或 warning，它更像业务动作色。做品牌迁移时，只有当目标品牌有明确业务行动色时，才应该填这一组。

#### 2.4 基础语义：App 中约 10% 的用色

基础语义用于需要引起用户注意的 CTA、ghost 模式 CTA、提示、反馈和特殊状态。

典型 token：

```text
--du-error-*
--du-success-*
--du-warning-*
--du-default-*
--du-white-*
--du-trans-black-*
--du-mask-*
```

其中：

- `error`：错误、危险、破坏性行动。
- `success`：成功、完成、正反馈。
- `warning`：警告、提醒、需注意。
- `default`：默认弱强调、普通次级动作。
- `white`：深色或图片背景上的浅色系统。
- `trans-black` / `mask`：遮罩、覆盖、透明黑阶梯。

#### 2.5 Disabled / Disabledtemp

很多 token 使用 `disabledtemp`：

```text
--du-primary-disabledtemp-color
--du-primary-solid-disabledtemp-bg
--du-primary-tag-disabledtemp-color
```

可以推断它代表某种临时禁用态、加载禁用态，或者 dangoui 特有的 disabled 变体。

不要新造 disabled 命名。后续 AI 必须保留 `disabledtemp` 这个现有命名，并从较浅色阶或低对比色中推导 value。

### 2.6 `c` 组：废弃全局层

`--du-c-*` 这一组已经向良臻确认，后续会逐渐被新版 token 替代，应视为废弃层：

```text
--du-c-text-primary
--du-c-text-2
--du-c-bg-primary
--du-c-bg-2
--du-c-warning
--du-c-success
--du-c-error
--du-c-mask-primary
```

它和 `--du-text-*`、`--du-bg-*`、各语义色彩家族有重叠。

做品牌迁移时，不要使用 `--du-c-*` 作为映射目标。即使看到历史组件使用了 `--du-c-*`，也应该优先寻找新版 token 承接；如果没有承接关系，记录为迁移风险或 schema gap，而不是继续强化废弃命名。

### 3. 三级组件层

三级组件层是具体组件自己的 token 入口。它不应该成为品牌迁移时自由发挥的第一目标，而应该默认继承或派生自二级色板层。

部分分组属于三级组件层：

```text
--du-bt-solid-bg
--du-bt-color
--du-in-solid-bg
--du-checkbox-bg
--du-radio-bg
--du-switch-bg
--du-primary-tag-color
--du-primary-tag-soft-bg
--du-primary-tag-solid-bg
--du-primary-tag-text-color
```

很多 value 是：

```text
var(--du-default-*)
```

这说明创建人的意图是做一层间接引用：组件有自己的 token 入口，但默认继承或派生自二级色板层。

做品牌迁移时，不要优先覆盖三级组件层。应该先改上游二级色板层，再由三级组件层跟随派生。

例如 `tag` tokens 不应该被当成独立风格区：

- `--du-primary-tag-soft-bg` 应从 `--du-primary-soft-bg` 派生。
- `--du-primary-tag-color` 应从 `--du-primary-color` 派生。
- 不要因为目标品牌有 badge、pill、label 风格就自动单独改 tag tokens。
- 如果确实需要让某个三级组件 token 拥有区别于上游二级色板 token 的特殊视觉，必须先询问用户确认。

## 哪些 Token 最适合做品牌风格填值

第一批最适合填值的是二级色板层里控制全局视觉气质、但不过度绑定单个组件的 token：

```text
--du-bg-1
--du-bg-2
--du-bg-3
--du-bg-4
--du-text-1
--du-text-2
--du-text-3
--du-text-disabled
--du-border-1
--du-border-2
--du-border-3
--du-icon-1
--du-icon-2
--du-icon-3
--du-primary-1 ... --du-primary-9
--du-primary-color
--du-primary-soft-bg
--du-primary-solid-bg
--du-primary-solid-color
--du-primary-text-color
--du-primary-border
```

判断理由：

- 它们描述页面氛围、文字层级、边框强度和品牌强调色。
- 它们被多个组件共享，改一次能影响整体风格。
- 它们不是某一个组件的实现细节。
- 它们能让同一棵 dangoui 组件树只通过 value 替换就改变品牌气质。

第二优先级是：

```text
--du-success-*
--du-warning-*
--du-error-*
--du-default-*
--du-white-*
--du-trans-black-*
--du-mask-*
```

这些适合补充状态色、透明层、暗色/亮色覆盖关系。

低优先级是：

```text
--du-bt-*
--du-in-*
--du-checkbox-*
--du-radio-*
--du-switch-*
```

它们是三级组件层。除非目标品牌对某个组件有明确特殊视觉，并且用户确认要单独改，否则不要优先改。

## 给 AI 的映射规则

当 AI 学习一个品牌网站时，按以下流程处理：

1. 统计高频原始视觉值：hex、rgba、阴影、渐变、间距、圆角。
2. 不只看频次，还要判断使用语义。
3. 先生成一级色板层，不直接让组件消费裸色阶。
4. 全局背景映射到二级色板层的 `--du-bg-*`。
5. 文字层级映射到二级色板层的 `--du-text-*`。
6. 图标层级映射到二级色板层的 `--du-icon-*`。
7. 品牌主色和 CTA Primary / Secondary 映射到 `--du-primary-*`、`--du-secondary-*`。
8. 业务行动色或交易色映射到 `--du-trade-*`，前提是目标品牌有明确业务行动色。
9. 成功、警告、错误这类明确状态色映射到 `--du-success-*`、`--du-warning-*`、`--du-error-*`。
10. 遮罩和黑色透明层映射到 `--du-mask-*` 或 `--du-trans-black-*`。
11. 不使用 `--du-c-*` 作为品牌迁移目标，因为它是废弃层。
12. 三级组件层默认从二级色板层派生；如果要单独改组件风格，先询问用户。
13. 不创建新 token 名。
14. 不把圆角、阴影、渐变硬塞进 dangoui token，除非 dangoui 暴露了对应 `--du-*` 名称。
15. 如果某个风格特征没有 dangoui token 承接，记录为 `schema gap` 或 `demo-only visual control`，不要伪装成 token。

## 对创建人命名意图的总结

dangoui 的 token 创建人更偏向一种务实的 CSS 变量系统：

- 一级色板层负责提供可替换的色彩原料。
- 二级色板层负责承接 App 真实用色角色。
- 三级组件层通过别名继承或派生自二级色板层。
- 稳定契约是 `--du-*` 变量名，而不是跨品牌抽象词汇。

一句话总结：

> dangoui 不是让 AI 自由创造设计语言，而是让 AI 在固定 `--du-*` 变量空间里替换 value，从而让组件库保持稳定、可控、可复用。
