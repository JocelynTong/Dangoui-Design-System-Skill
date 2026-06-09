# Notion 迁移说明

来源：`/Users/jocelyn/Downloads/DESIGN-notion.md`

## 0. Preview Gate

| 方向 | 核心页面 | 气质 | 信息密度 | 组件模式假设 | 决策 | 原因 |
|---|---|---|---|---|---|---|
| `preview-a` | 文档首页、知识库 | 暖白、克制、文档感 | 中 | `paper-doc-card`、`pill-primary-cta` | selected | 最符合 Notion chrome |
| `preview-b` | 文档首页 | 深靛首屏岛屿 | 中 | `hero-band` | merged | 只作为首页局部视觉控制 |
| `preview-c` | 知识库 | 贴纸更强 | 中低 | `sticker-personality-layer` | rejected | 贴纸色不应主导 UI token |

## 1. 品牌风格摘要

Notion 是暖白纸面、近黑大字、轻 hairline 和单一蓝色行动入口的文档生产力系统。多色贴纸承载品牌人格，但不负责布局结构和 CTA 语义。

## 2. 高频视觉值统计

> 统计口径：`DESIGN-notion.md` 中 `components.*` 对 `colors.*` 的引用次数；占比 = 该值出现次数 / 本次统计内所有颜色引用次数。

| 类型 | 原始值 | 次数 | 占比 | 证据 | 角色判断 | 承接 |
|---|---|---:|---:|---|---|---|
| color | `#ffffff` | 8 | 24.2% | canvas、surface、on-primary | 中性表面 / 暗底文字 | `--du-bg-1` / `--du-white-*` |
| color | `#000000` | 7 | 21.2% | ink、button-secondary、feature-card | 主文本 | `--du-text-1` |
| color | `#f6f5f4` | 3 | 9.1% | canvas-soft、featured pricing、footer | 暖灰页面底 | `--du-bg-2` |
| color | `#0075de` | 3 | 9.1% | primary CTA、badge、active indicator | 主要行动入口 | `--du-primary-color` |
| color | `#e6e6e6` | 2 | 6.1% | hairline、divider、table border | 细边界 | `--du-border-1` |
| color | 多色贴纸 | 9 | 27.3% | accent palette | 品牌人格资产 | `demoOnlyVisualControls` |

## 3. 高频组件模式统计

| 组件模式 | 次数 | 占比 | 证据 | Echo/Figma 候选 | Dangoui 落地 | 状态 |
|---|---:|---:|---|---|---|---|
| `paper-doc-card` | 9 | 28.1% | feature/pricing/auth/modal card | `Card` | `DuCard + DuTag` | `composed` |
| `pill-primary-cta` | 4 | 12.5% | primary button、badge pill | `Button` | `DuButton` | `mapped` |
| `quiet-search-doc-list` | 3 | 9.4% | text-input、table、app-shell row | `Search + List` | `DuSearch + DuCard` | `composed` |
| `sticker-personality-layer` | 6 | 18.8% | sticker palette | `Image/Illustration` | demo CSS | `style-only` |

## 4. Token Mapping

正式 `--du-*` 只承接中性表面、文字、边界和蓝色行动入口。圆角、阴影、贴纸色和深靛 hero island 当前放在 `demoOnlyVisualControls`。

## 5. Component Mapping

组件映射见 `component-mapping.json`。Notion 文档卡片是 `DuCard` 组合，CTA 是 `DuButton type="primary"`，知识库搜索由 `DuSearch + DuCard` 承接。

## 6. 客观 Token Chain

```text
DuButton primary
→ --du-bt-* component alias
→ --du-primary-* semantic token
→ dangoui-adapter.json 中的 Notion primary action
```

```text
DuCard
→ surface / text / border variables
→ --du-bg-1 / --du-text-1 / --du-border-1
→ Notion paper surface adapter
```

## 7. 承接缺口

- typography：NotionInter、display tracking 目前不是 dangoui token。
- sticker palette：只作为品牌资产和 demo 视觉层，不进入语义 token。
- pill radius：当前通过 demo class 表达。

## 8. 机器可读资产

- `preview-gate.json`
- `brand-evidence.json`
- `brand-profile.dtcg.json`
- `echo-mapping.json`
- `dangoui-adapter.json`
- `uno-adapter.json`
- `component-mapping.json`

## 9. Demo 应用说明

Demo 增加 `Notion` preset 和三个品牌页：文档首页、知识库、团队计划。正式 token 写入 `dangouiTokens`，未同步能力写入 `demoOnlyVisualControls`。
