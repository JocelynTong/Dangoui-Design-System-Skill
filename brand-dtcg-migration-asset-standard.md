# 品牌迁移资产标准

本文定义品牌风格迁移的长期资产结构。目标不是只生成一次 demo，而是把品牌理解、统计证据、设计系统承接关系和代码落地关系拆开保存。这样当 Figma 变量、Echo Design System 或 dangoui 更新后，旧迁移结果可以重新匹配到正确 token 或 component API。

## 核心判断

品牌迁移资产不存最终 CSS，也不只存自然语言总结。

它必须同时保存：

- PreviewGate：正式沉淀前的 2-3 个 demo 方向、用户选择、否定和合并意见。
- BrandEvidence：原始品牌证据，包括视觉值、组件模式、频次、占比和上下文。
- BrandIntent：中立品牌意图，不绑定具体库。
- EchoMapping：映射到 Echo/Figma token、component、variant、slot、property。
- DangouiAdapter：映射到当前 dangoui `--du-*`、组件、props、slots。
- ReviewQueue：需要用户或设计系统 owner 确认的事项。

token 资产优先使用 DTCG 形态：`$type`、`$value`、`$description`、`$extensions`。

component 使用同一套证据和状态模型，但不是 DTCG 标准 token 类型。不要写 `$type: "component"`；组件映射放 companion JSON，或作为 group-level `$extensions` 元数据。

## 为什么使用 DTCG 中间层

DTCG 能让 Figma 变量、设计 token、CSS var、组件 API 使用同一套可读资产协作。

这对品牌迁移很重要：

- 品牌档案不被当前 dangoui 代码库是否落后锁死。
- 原始证据、频次、上下文、置信度不污染 token 名。
- Echo/Figma 先承接，dangoui 可以后续通过 adapter 自动升级。
- component 可以和 token 共用证据模型，但不伪装成 token。

本地 Echo token 文件已接近该结构：

- `千岛.tokens.json`、`千岛暗黑.tokens.json` 使用 `$type` / `$value` / `$extensions`。
- `Primitives-QD.json` 已有 `Radius`、`Spacing`。
- 语义 token 已有 alias 链，例如 `primary/bt/solidBg -> {primary.solidBg}`。

## 资产分层

### PreviewGate

在正式统计前，用 2-3 个 demo 验证方向。

记录：

- demo 假设：色彩、密度、圆角、阴影、媒体气质、行动入口。
- 页面范围：核心页面或核心模块。
- 用户反馈：选择、否定、合并、待确认。
- 决策：是否进入正式 BrandEvidence。

Preview demo 里的 class、裸 CSS value、临时变量不能当成设计系统真相源。

### BrandEvidence

保存原始提取结果，不急着判断最终 token。

必须记录：

- 统计口径。
- 原始值。
- 次数和占比。
- 出现位置。
- 是否属于 UI 系统、媒体资产或页面表现。
- 组件模式的结构、状态、props、slots、组合方式。

### BrandIntent

把证据翻译成中立语义，不绑定具体库。

示例：

```json
{
  "tokens": {
    "color.neutral.surface": "quiet-white",
    "radius.card": "large-soft",
    "cta.shape": "pill"
  },
  "components": {
    "card": "media-led-editorial-card",
    "navigation": "minimal-top-nav"
  }
}
```

这些 key 只用于描述品牌理解，不是 dangoui token 名。

### EchoMapping

把 BrandIntent 映射到 Echo/Figma 当前已有能力。

当前常见承接：

- color：`千岛.tokens.json`、`千岛暗黑.tokens.json`。
- radius：`Primitives-QD.json` 中的 `Radius/*`。
- spacing：`Primitives-QD.json` 中的 `Spacing/*`。
- component：Echo/Figma 组件、variant、slot、property。

CSS 距离类值在迁移资产中优先使用 DTCG `dimension`：

```json
{
  "$type": "dimension",
  "$value": { "value": 16, "unit": "px" }
}
```

如果本地 Figma 导出仍是 `$type: "number"`，在 `$extensions` 记录 `currentSourceType: "number"`。

### DangouiAdapter

面向当前代码库。

落地优先级：

1. 当前 dangoui 已有 `--du-*` 或组件 API：直接使用。
2. Echo/Figma 已有但 dangoui 未同步：使用 adapter 暂落到 `--style-*`，记录未来 `--du-*` 候选。
3. Echo/Figma 也没有：标记 `missing`，进入 ReviewQueue。

不要为了 demo 新造看似正式的 `--du-radius-*`、`--du-shadow-*` 或不存在的组件 API。

### ReviewQueue

保存不能自动决策的事项：

- 是否新增 token。
- 是否新增 component、variant、slot、property。
- 是否接受 fallback。
- 是否把页面组合沉淀成组件。
- 是否覆盖组件别名层。

`ask-user` 项不自动决策。

## 状态模型

token 和 component 共用状态：

- `mapped`：当前设计系统和 dangoui 都能准确承接。
- `fallback`：有接近值，但不能完全表达品牌原始值。
- `style-only`：只能在 demo 或页面样式层表现。
- `missing`：设计系统和 dangoui 都没有承接能力。
- `ask-user`：品牌规则和现有设计系统冲突，需要用户确认。

组件可额外使用：

- `composed`：需要多个 dangoui 组件组合成品牌模式。

## 颜色色板推导规则

品牌色彩迁移要保留 DangoUI 的三级结构：一级基础色板、二级语义色板、三级组件别名。迁移时保持 token 名不变，只替换或推导 value。

展示和产出时必须保持 DangoUI 一级/二级/三级色彩结构，高频品牌色只覆盖最相似的 token，并用 `覆盖` 标记显示原值到新值的变化；同一色相行剩余色阶由真实锚点外推或插值得到时标记 `推测`；若最终值完全等于 DangoUI 原值，标记 `命中`。

### 一级基础色板

一级色板只表达颜色本身，不表达用途。

- 先按品牌采样色自身的色相、明度、饱和度归入 DangoUI 一级色板，不按 `text`、`border`、`bg`、`primary` 等语义用途归类。
- 黑就是黑、白就是白；真正的黑/白/低饱和灰归入 `neutral` 或 `white`。带明显暖棕、纸色、铜色、冷蓝等色相的颜色必须进入对应色相行。
- 单个真实采样色落到最相似的一级色阶时标记为 `覆盖`，展示原值和覆盖值；若值与 DangoUI 原色阶一致，标记为 `命中`。
- 同一色相行有 1 个及以上真实锚点时，可以补齐完整 1-9 色阶；单锚点以该锚点为中心向白色和黑色外推，多锚点在锚点之间插值，浅端向白色外推，深端向黑色外推，补齐值标记为 `推测`。
- `neutral` 和 `white` 可以推导，但只使用真正中性/低饱和锚点；不能把暖色、冷色或纯黑白以外的有色锚点错误扩展成黑白色阶。
- 一级展示中，非命中/覆盖/推测色阶应弱化；命中、覆盖、推测要明确区分，避免把推测值当成真实证据。

### 二级语义色板

二级语义色板引用一级最终色阶，不直接拿原始频次表覆盖所有 token。

- 直接被品牌证据命中的二级 token 标记为 `覆盖`。
- 未直接覆盖但原本引用彩色一级色阶的语义 token，可以按同阶位迁移到该语义族对应的品牌色相行，例如品牌 `primary` 已归入 `orange`，则原 `purple-5` 可迁移到 `orange-5`。
- 原本引用 `white`、`neutral`、`purplegray` 等反色或中性基础色的 token 不随品牌色相迁移，除非自身有直接证据。
- 二级输出必须显示最终值来自 `覆盖`、`命中` 还是 `推测`。

### 三级组件别名

三级组件别名沿用二级语义色板结果。

- 组件别名先解析真实 token chain：组件别名 → 二级语义 token → 一级基础色板。
- 若二级 token 已被覆盖或推测，三级组件别名展示同一最终值和状态。
- 不能因为组件属于 `primary`，就把白字、透明黑、中性色等反色 token 改成品牌色；只有原本引用彩色一级色阶的 token 才能按品牌色相迁移。
- 推测值可用于 demo 和 adapter 预览，但资产中必须保留状态，不能伪装成真实采样证据。

## 组件链路规则

解释组件样式时，必须先列真实链路：

```text
DOM class
→ dangoui 组件样式消费的 token
→ dangoui 组件别名映射
→ Figma / Echo alias 链
→ 当前 adapter 是否覆盖到这一层
```

不能因为按钮“看起来是 primary”，就推断它一定消费 `--du-primary-color`。

如果链路不能证明，结论标记 `unknown` 或 `ask-user`。

## 推荐文件结构

每个品牌迁移建议产出到 `migrations/{brand}/`：

- `preview-gate.json`：demo 方向和用户决策。
- `brand-profile.dtcg.json`：品牌意图和 token 候选。
- `brand-evidence.json`：原始统计证据。
- `echo-mapping.json`：Echo/Figma 承接关系。
- `dangoui-adapter.json`：当前 dangoui 落地关系。
- `component-mapping.json`：组件模式、props、slots、unsupported。
- `README.md`：中文说明、缺口、人工确认项和 demo 结果。

## 自动迁移策略

当 Echo Design System 或 dangoui 更新后，迁移脚本应读取旧品牌资产、最新 Echo/Figma DTCG token 包和最新 dangoui schema。

然后重新匹配 `fallback`、`style-only`、`missing` 项：`futureTokenCandidate` 已存在则升级为 `mapped`；组件新增 prop、slot、variant 则更新 `component-mapping.json`。

最后输出变更报告：已自动迁移、仍缺失、需要用户确认。

迁移原则：

- 永远保留原始证据和 `rawBrandValue`。
- 不因为新 token 存在就自动覆盖组件层特殊规则。
- 对 `ask-user` 项不自动决策。
- 组件 API 变化必须保留旧 adapter 以便回滚。

## AI 使用规则

- 先做 PreviewGate，再沉淀长期资产。
- 先统计高频值和组件模式，再映射。
- token 和 component 分别映射，但共用状态模型。
- 当前 dangoui 不支持的能力放 `$extensions`、adapter 或 ReviewQueue。
- demo 可用 `--style-*` 表现未同步能力，但必须标记状态。
- component mapping 不使用 `$type: "component"`。
- 组件样式分析必须从真实 token chain 出发。
