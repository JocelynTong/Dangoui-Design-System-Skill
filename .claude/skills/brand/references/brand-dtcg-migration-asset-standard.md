# 品牌迁移资产标准

本文定义品牌风格迁移的长期资产结构。目标不是只生成一次 demo，而是把品牌理解、统计证据、设计系统承接关系和代码落地关系拆开保存。这样当 Figma 变量、Echo Design System 或 dangoui 更新后，旧迁移结果可以重新匹配到正确 token 或 component API。

## 目录

- `核心判断`：品牌迁移资产为什么要拆层。
- `为什么使用 DTCG 中间层`：DTCG、Echo、Figma 与 dangoui 的关系。
- `统一 style.json 数据契约`：`document` + `tokens` 的主入口。
- `document 规则`：Figma REST-like 节点字段。
- `tokens 规则`：DTCG token 与 `$extensions`。
- `components / assets / brandMetadata`：组件、素材和品牌元数据。
- `落地目标`：如何转译到 DangoUI、Vue、UnoCSS、assets。

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

## 统一 style.json 数据契约

长期可复用的品牌风格包优先沉淀为一个 `style.json`。这个文件不是最终 CSS，也不是纯 DTCG token 文件；它是供 skill 读取并转译到 DangoUI、Vue、UnoCSS 和 assets 引用的机器可读中间态。

`style.json` 使用一个文件承载两类标准语义：

- `document`：使用 Figma REST API 的节点树语义，描述页面、图层、组件实例、图片填充、边框、阴影、布局和状态证据。
- `tokens`：使用 DTCG 语义，描述可复用变量和 token，保留 `$type`、`$value`、`$description`、`$extensions`。

不要把页面、组件或媒体结构塞进 DTCG token；DTCG 只表达可复用设计值。不要把 token alias 链改写成自造组件字段；Figma / Echo 导出的 token 元数据应保留在 `$extensions.com.figma.*` 或对应 vendor key 中。

最小结构：

```json
{
  "name": "re1999",
  "schemaVersion": 1,
  "source": {
    "type": "web",
    "url": "https://example.com"
  },
  "document": {
    "id": "style:re1999",
    "name": "RE1999 Brand Style",
    "type": "DOCUMENT",
    "children": []
  },
  "components": {},
  "componentSets": {},
  "styles": {},
  "tokens": {
    "$extensions": {
      "com.figma.modeName": "re1999"
    }
  },
  "assets": {},
  "brandMetadata": {
    "targets": ["dangoui", "vue", "unocss"],
    "status": "draft",
    "demoWorkflow": {
      "pages": []
    }
  }
}
```

### document 规则

`document` 和所有子节点尽量沿用 Figma REST API 字段名：

- `id`、`name`、`type`、`children`
- `absoluteBoundingBox`、`absoluteRenderBounds`
- `fills`、`strokes`、`strokeWeight`、`cornerRadius`、`rectangleCornerRadii`
- `effects`、`opacity`、`blendMode`
- `componentId`、`componentProperties`、`overrides`
- `boundVariables`

如果来源是 Figma 链接，保留 REST API 返回的原始节点字段；不要改写节点 id。URL 中 `node-id=14205-618298` 对应 API id `14205:618298`。

如果来源是网页、截图或 DESIGN.md，也生成类 Figma 节点：

```json
{
  "id": "web:re1999:media-card",
  "name": "Media Card",
  "type": "FRAME",
  "absoluteBoundingBox": { "x": 0, "y": 0, "width": 343, "height": 184 },
  "fills": [
    { "type": "IMAGE", "imageRef": "asset:gallery-01", "scaleMode": "FILL" }
  ],
  "strokes": [],
  "cornerRadius": 0,
  "children": []
}
```

网页生成节点的 `id` 必须稳定、可追溯，建议包含来源、品牌、页面和语义名。节点的 `name` 使用可读组件/区域名，不能只写 DOM class。

### tokens 规则

`tokens` 内部遵循 DTCG 形态。Figma 变量导出的 metadata 保留在 `$extensions.com.figma.*`：

```json
{
  "tokens": {
    "color": {
      "copper": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [0.71, 0.35, 0.16],
          "alpha": 1,
          "hex": "#B55829"
        },
        "$description": "用于 1999 角线、重点标题和选中态。",
        "$extensions": {
          "echo.brand.role": "accent"
        }
      }
    }
  }
}
```

来自 Figma token export 的内容，例如 `千岛.tokens.json`，如果已有 `$extensions.com.figma.variableId`、`com.figma.scopes`、`com.figma.aliasData`、`com.figma.modeName`，必须保留。不要把这些 metadata 平铺成普通 token。

### Brand MOD `tokens.dtcg` 规则

`brand-mod.json` 里的 token 层分成两层职责：

- `tokens.dtcg`：标准层，作为 `/brand` 对外的 canonical token contract。
- `tokens.mapped` / `tokens.styleOnly`：兼容层，给当前 demo、adapter 和旧脚本继续消费。

也就是说，后续新增消费者优先读 `tokens.dtcg`，当前存量链路还可以继续读 legacy mirrors，但不能只维护 mirrors 不维护 DTCG。

推荐形态：

```json
{
  "tokens": {
    "dtcg": {
      "$description": "Canonical token contract",
      "mapped": {
        "du-primary-color": {
          "$type": "color",
          "$value": "#B55829",
          "$extensions": {
            "echo.brand.target": "--du-primary-color",
            "echo.brand.channel": "mapped"
          }
        }
      },
      "styleOnly": {
        "style-frame-border": {
          "$type": "string",
          "$value": "url(...) 30 stretch",
          "$extensions": {
            "echo.brand.target": "--style-frame-border",
            "echo.brand.channel": "styleOnly"
          }
        }
      }
    },
    "mapped": {
      "--du-primary-color": {
        "value": "#B55829"
      }
    },
    "styleOnly": {
      "--style-frame-border": {
        "value": "url(...) 30 stretch"
      }
    }
  }
}
```

约束：

- 每个 DTCG token 都必须带 `$extensions["echo.brand.target"]`，明确它最终映射到哪个 legacy key / consumer key。
- 每个 DTCG token 都必须带 `$extensions["echo.brand.channel"]`，值只能是 `mapped` 或 `styleOnly`。
- `tokens.dtcg` 必须完整覆盖 `tokens.mapped` 和 `tokens.styleOnly`；不能只写一部分。
- `tokens.dtcg` 负责“token 表达标准化”，不负责替代 `componentVariants`、`slots`、`assets`、`layoutRules`、`platformOverrides`。
- 如果某个值本质上是图片、frame、layout layering、slot recipe 或平台差异，不要硬塞成 token，只在 token 中保留需要被消费的那部分引用值。

### Brand MOD `semanticRoles` 规则

`tokens.dtcg` 解决“值如何标准化表达”，`semanticRoles` 解决“这些值在视觉语言里分别扮演什么角色”。

也就是说：

- `tokens.dtcg` 回答的是“这个值是什么”。
- `semanticRoles` 回答的是“这个值该被页面/组件当成什么来消费”。

推荐把下列角色作为第一批稳定协议：

- `surface.page`
- `surface.card`
- `text.primary`
- `text.secondary`
- `text.tertiary`
- `border.subtle`
- `action.primary.fill`
- `action.active.fill`
- `action.neutral.surface`
- `action.text.border`
- `accent.secondary`
- `typography.body.family`
- `typography.display.family`
- `shape.card.radius`
- `shape.control.radius`
- `elevation.card.shadow`

约束：

- role 名必须是跨品牌、跨站点、跨 demo 可复用的语义名，不能写成 `pokemon30Primary`、`rocomPurpleBg` 这类品牌专属命名。
- token-backed role 要保留 `target` 和 `dtcgPath`，方便回溯到 `--du-*` / `--style-*` 和 DTCG 标准层。
- action / active / neutral 这类交互角色允许来自 action evidence 采样链路，而不只是全站颜色频次。
- `BrandIntent` 继续保留为人工总结层，但不能替代 `semanticRoles`；真正给脚本、validator、未来消费者读的 canonical 机器合同，是 `brand-mod.json` 里的 `semanticRoles`。

### brandMetadata / pluginData 规则

迁移、转译和业务目标信息不要污染 Figma 原字段，也不要伪装成 DTCG token。

- 全局信息放 `brandMetadata`：目标技术栈、迁移状态、ReviewQueue、source、license、QA。
- 场景化 demo 信息放 `brandMetadata.demoWorkflow`：页面角色、分发侧、展示侧、交互状态、资产角色和反模式。
- 节点级迁移信息可放 `pluginData["echo.brand"]`，模拟 Figma 插件数据语义，用于描述 asset role、DangoUI/Vue/UnoCSS 目标和迁移意图。
- token 级扩展放 DTCG `$extensions`，使用 vendor key，例如 `echo.brand.role`。

示例：

```json
{
  "id": "web:re1999:corner-frame",
  "name": "Corner Line Frame",
  "type": "FRAME",
  "fills": [],
  "strokes": [],
  "pluginData": {
    "echo.brand": {
      "assetRole": "frame-decoration",
      "migrationIntent": "replace-default-border",
      "targets": {
        "dangoui": { "component": "Card" },
        "vue": { "component": "DuCard" },
        "unocss": { "shortcut": "re1999-corner-frame" }
      }
    }
  }
}
```

### demoWorkflow 规则

`style.json` 必须记录参考站应该如何被 demo，而不是只记录 token 和节点。强风格网站尤其要先还原真实页面场景，再转译到 DangoUI / Vue / UnoCSS。

页面选择必须来自源站证据。`home-distribution`、`news-feed`、`archive-profile`、`media-gallery`、`feature-showcase` 只是候选角色，不是固定模板；不同网站可以是商品详情、玩法专题、票务页、故事章节或其他真实栏目。

示例：

```json
{
  "brandMetadata": {
    "demoWorkflow": {
      "pages": [
        {
          "id": "page:re1999-home",
          "sourceNavigation": ["首页", "新闻", "角色", "媒体"],
          "selectedPagesReason": "源站首页有内容分发、角色档案和媒体露出，因此 demo 选择首页、资讯、档案、媒体。",
          "scenarioRole": "home-distribution",
          "distributionSide": ["NEWS", "ARCHIVE", "MEDIA"],
          "displaySide": ["hero", "featured-record", "visual-index"],
          "interactiveStates": ["entry.active", "tag.selected"],
          "assetRoles": ["hero-background", "gallery-cover", "title-font", "corner-frame"],
          "antiPatterns": ["download-card-without-source-need", "rounded-generic-card", "inner-frame-by-default"]
        }
      ]
    }
  }
}
```

页面角色建议：

- `home-distribution`：首页同时承担入口分发和品牌展示。
- `news-feed`：资讯、公告、活动列表和 tabs/tag 状态。
- `archive-profile`：角色、档案、世界观、图鉴。
- `media-gallery`：PV、壁纸、图库、访谈和缩略图。
- `feature-showcase`：玩法、特色、活动机制。

如果参考站没有下载转化为核心场景，不要为了组件覆盖率添加下载 card 或二维码模块。组件覆盖率必须服从真实页面场景。

App shell / mock device 规则：

- StatusBar、NavigationBar 外壳、底部 TabBar、HomeIndicator、FAB 是 demo 的 app shell，不是品牌网页证据；不要写进品牌 token 频次或 component pattern 统计。
- 这只限制“采样统计”，不限制“应用换肤”。如果 demo 站已经把 app shell 主题化，应用到业务项目时仍要把它作为页面壳消费点迁移；不能因为它不是品牌网页证据就保留默认样式。
- StatusBar 高度、NavigationBar 44px、TabBar 48px、HomeIndicator 34px 这类设备尺寸是 demo 容器规则，不从参考站采样。
- App shell 默认浮在 z 轴上，不占内容布局高度；页面内容必须能滚到 shell 下方，不能被 grid 行或固定容器裁掉。
- 首页/分发侧可以保留底部 TabBar 和发布 FAB；展示侧、发布侧、反馈侧隐藏底部 TabBar 和 FAB，只保留透明 HomeIndicator。
- Hero 背景可以延伸到 StatusBar / NavigationBar 背后；Hero 的主文案、行动入口和关键信息必须避开 NavigationBar 可读区。
- NavigationBar 的返回箭头、标题和右侧动作必须共用 44px 槽位中线；不要用外部 padding 造成视觉偏移。
- FAB 使用 DangoUI Icon 或 icon config；不要用纯文本字符伪装图标。FAB 阴影默认轻量，只有来源证据明确时才加强。

如果参考站没有角色、媒体、公测、NEWS 等栏目，不要为了复用已有 demo 结构硬造；应根据源站导航和模块证据重新命名 demo tab、分发入口和页面内容。

### 转译规则

skill 读取 `style.json` 后再转译到当前项目：

- DangoUI：组件、props、slots、已有 `--du-*` token。
- Vue：页面/组件组合结构。
- UnoCSS：shortcuts、rules、theme 扩展。
- assets：字体、纹理、插画、选中态和装饰层引用。

不要把 CSS 文件、Figma 文件或 Tailwind config 当作默认目标产物。CSS 只是 UnoCSS/Vue 最终构建结果；Figma 是输入来源或结构参考，不是当前默认输出目标。

### 参考依据

上述契约来自以下公开规范和项目内实证，不是自造格式：

- Figma REST API：文件和节点接口返回 `document`、`components`、`componentSets`、`styles`，节点包含 `id`、`name`、`type`、`children`、`fills`、`strokes`、`effects`、`componentId`、`componentProperties`、`boundVariables`、`absoluteBoundingBox` 等字段。Figma 链接中的 `node-id=14205-618298` 在 API 中对应 `14205:618298`。
- Figma variables / tokens export：本地 `千岛.tokens.json` 证明 Figma token 导出使用 DTCG 风格 `$type`、`$value`、`$extensions`，并用 `$extensions.com.figma.variableId`、`com.figma.scopes`、`com.figma.aliasData`、`com.figma.modeName` 保留 Figma metadata。
- W3C / Design Tokens Community Group：DTCG 格式使用 JSON 表达 design token，核心字段为 `$type`、`$value`、`$description`、`$extensions`；适合表达 token 和 alias，不适合表达页面节点树。
- Figma Schema 2025 design systems recap：设计系统正在成为 AI、设计和代码之间的 translation layer；variables、Code Connect、MCP、npm package imports 等能力说明设计系统数据需要同时能被设计工具和代码工具理解。
- 1999 / HPMA / CZN demo 调试：重风格站点的关键资产往往是纹理、字体、插画、边框、选中态和装饰层；这些不能只放进 token 表，必须通过 Figma REST-like 节点树和 assets 记录结构、位置、状态与用途。

参考链接：

- https://developers.figma.com/docs/rest-api/
- https://developers.figma.com/docs/rest-api/file-endpoints/
- https://developers.figma.com/docs/rest-api/file-node-types/
- https://www.figma.com/blog/schema-2025-design-systems-recap/
- https://www.w3.org/community/design-tokens/
- https://www.designtokens.org/tr/drafts/format/

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

- `style.json`：长期风格包主产物；`document` 使用 Figma REST-like 节点树，`tokens` 使用 DTCG，`brandMetadata` / `pluginData` 承接转译信息。
- `preview-gate.json`：demo 方向和用户决策。
- `brand-profile.dtcg.json`：品牌意图和 token 候选。
- `brand-evidence.json`：原始统计证据。
- `echo-mapping.json`：Echo/Figma 承接关系。
- `dangoui-adapter.json`：当前 dangoui 落地关系。
- `component-mapping.json`：组件模式、props、slots、unsupported。
- `README.md`：中文说明、缺口、人工确认项和 demo 结果。

新迁移优先生成 `style.json`。旧迁移资产可以继续保留分文件；当两者同时存在时，以 `style.json` 为机器读取主入口，分文件作为兼容和审查辅助。

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
