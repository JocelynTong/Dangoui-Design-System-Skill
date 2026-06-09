# Apple 到 Dangoui 的风格迁移草稿

来源：`/Users/jocelyn/Downloads/DESIGN-apple.md`

生成脚本：`scripts/create-dangoui-mapping-doc.mjs`

## 1. 上游品牌风格摘要

这是一个以产品摄影为核心的界面，把营销页面处理成类似博物馆展陈的产品画廊。全出血产品区块在浅色与深色画布之间交替，搭配 SF Pro Display 式标题、紧凑字距，以及唯一的行动蓝 `#0066cc` 作为交互色。界面控件尽量后退，让产品本身成为主角：不使用装饰渐变，不给控件增加阴影，只保留产品图像落在表面时的标志性投影。

## 2. 高频视觉值统计

> 已补一版上游组件引用口径；生产版仍必须补真实网页统计。次数 / 占比不能只凭上游 YAML 推断，应来自目标页面 CSS、DOM 计算样式、截图取样或 Figma 数据。
>
> 占比公式：该视觉值出现次数 / 本次统计中所有视觉值出现次数总和。统计前必须先写清口径，例如只统计 UI 颜色，还是把图片、渐变、阴影、圆角也纳入。
>
> 当前表格口径：上游 DESIGN 文档的 `components:` 对 `colors.*` 的引用次数，共 46 次。它可以作为第一轮推导依据，但不能替代真实网页统计。

| 原始值 | 次数 | 占比 | 证据 | 角色判断 | Dangoui 映射目标 |
|---|---:|---:|---|---|---|
| `#1d1d1f` | 10 | 21.7% | `components.* -> colors.ink` | 文字层级 | `--du-text-*` / `--du-white-*` |
| `#ffffff` | 6 | 13% | `components.* -> colors.canvas` | 中性表面 | `--du-bg-*` 或承接缺口 |
| `#ffffff` | 6 | 13% | `components.* -> colors.on-dark` | 文字层级 | `--du-text-*` / `--du-white-*` |
| `#0066cc` | 6 | 13% | `components.* -> colors.primary` | 品牌行动入口 | `--du-primary-*` |
| `#f5f5f7` | 4 | 8.7% | `components.* -> colors.canvas-parchment` | 中性表面 | `--du-bg-*` 或承接缺口 |
| `#ffffff` | 4 | 8.7% | `components.* -> colors.on-primary` | 文字层级 | `--du-text-*` / `--du-white-*` |
| `#333333` | 2 | 4.3% | `components.* -> colors.ink-muted-80` | 文字层级 | `--du-text-*` / `--du-white-*` |
| `#272729` | 2 | 4.3% | `components.* -> colors.surface-tile-1` | 中性表面 | `--du-bg-*` 或承接缺口 |
| `#2997ff` | 1 | 2.2% | `components.* -> colors.primary-on-dark` | 品牌行动入口 | `--du-primary-*` |
| `#000000` | 1 | 2.2% | `components.* -> colors.surface-black` | 中性表面 | `--du-bg-*` 或承接缺口 |
| `#d2d2d7` | 1 | 2.2% | `components.* -> colors.surface-chip-translucent` | 中性表面 | `--du-bg-*` 或承接缺口 |
| `#fafafc` | 1 | 2.2% | `components.* -> colors.surface-pearl` | 中性表面 | `--du-bg-*` 或承接缺口 |
| `#2a2a2c` | 1 | 2.2% | `components.* -> colors.surface-tile-2` | 中性表面 | `--du-bg-*` 或承接缺口 |
| `#252527` | 1 | 2.2% | `components.* -> colors.surface-tile-3` | 中性表面 | `--du-bg-*` 或承接缺口 |

## 3. 一级色板层

待补：根据高频统计，按色相、明度、饱和度、冷暖和中性色关系归纳颜色原料。

注意：这里不要直接命名为 primary / success / error。

## 4. 二级色板层

### 4.1 中性基础

待补：映射到 `--du-bg-*`、`--du-text-*`、`--du-icon-*`、`--du-border-*`、`--du-white-*`、`--du-default-*`、`--du-trans-black-*`。

### 4.2 品牌语义

待补：把主要行动入口、次要行动入口和主品牌识别映射到 `--du-primary-*`、`--du-secondary-*`。

### 4.3 业务语义

待补：仅当存在明确业务行动色时映射到 `--du-trade-*`。

### 4.4 基础语义

待补：仅当存在明确状态语义时映射 `--du-error-*`、`--du-success-*`、`--du-warning-*`、`--du-default-*`、`--du-white-*`、`--du-trans-black-*`、`--du-mask-*`。

### 4.5 Disabled / Disabledtemp

待补：从低对比、低饱和或较浅色阶推导，保留 dangoui 的 `disabledtemp` 命名。

## 5. 三级组件层

默认从二级色板层派生，不优先单独覆盖。

如果要让某个组件 token 拥有特殊视觉，先询问用户。

上游组件模式候选：

- `components.button-primary`
- `components.button-primary-focus`
- `components.button-primary-active`
- `components.button-secondary-pill`
- `components.button-dark-utility`
- `components.button-pearl-capsule`
- `components.button-store-hero`
- `components.button-icon-circular`
- `components.text-link`
- `components.text-link-on-dark`
- `components.global-nav`
- `components.sub-nav-frosted`
- `components.product-tile-light`
- `components.product-tile-parchment`
- `components.product-tile-dark`
- `components.product-tile-dark-2`
- `components.product-tile-dark-3`
- `components.store-utility-card`
- `components.configurator-option-chip`
- `components.configurator-option-chip-selected`
- `components.search-input`
- `components.floating-sticky-bar`
- `components.environment-quote-card`
- `components.footer`

## 6. 承接缺口

从上游文档识别到但 dangoui token 暂无承接的部分：

- 字体排印：dangoui 当前 token 清单没有字体排印 token，需记录为承接缺口或另建非 token 规则。
- 媒体 / 摄影 / 产品区块：图片、材质、摄影氛围不能直接写入 dangoui color token。
- 背景模糊 / 磨砂表面：dangoui 当前 token 清单没有对应模糊 token，需记录为承接缺口。
- 圆角 / 阴影 / 渐变：除非 dangoui 暴露对应 `--du-*`，否则不要伪装成 token。

## 7. 可做 / 不可做

待补：从上游 DESIGN 文档的可做 / 不可做、概览、布局、字体排印、响应式行为中提炼。

## 8. 最终 Dangoui Token Draft

```css
:root {
  /* 待补：只输出已有 --du-* token，不创建新 token 名 */
}
```
