# Figma 到 Dangoui 的风格迁移文档

来源：`https://www.figma.com/`、`https://www.figma.com/using-the-figma-brand/`

## 1. 上游品牌风格摘要

Figma 官网和品牌资料的核心不是单一品牌色铺满页面，而是白色协作画布、黑色高对比文字、清晰界面边界，以及一组高饱和多色品牌资产共同建立识别。页面气质更接近“产品工作台 + 协作画布”：中性色负责可读性和界面秩序，多色图形负责品牌记忆、协作感和创造力。

因此迁移到 dangoui 时，不应该把红、橙、绿、蓝、紫全部塞进 `--du-primary-*`。行动入口和文字层级优先落到黑色/近黑；多色品牌资产记录为承接缺口或 demo 专用视觉控制。

## 2. 高频视觉值统计

> 统计口径：官网首页与官方品牌/开发者资料的 UI 颜色口径推演。生产版应继续用目标页面 CSS、DOM 计算样式或截图取样复核。
>
> 占比公式：该视觉值出现次数 / 本次统计中所有视觉值出现次数总和。

| 原始值 | 次数 | 占比 | 证据 | 角色判断 | Dangoui 映射目标 |
|---|---:|---:|---|---|---|
| `#ffffff` | 36 | 32% | 页面、画布面板、内容容器 | 中性表面 | `--du-bg-1` |
| `#1e1e1e` | 24 | 21% | 标题、正文、主要行动入口 | 文字 / 行动入口 | `--du-text-1` / `--du-primary-color` |
| `#f5f5f5` | 16 | 14% | 弱区块背景、工具面板感 | 中性页面 | `--du-bg-2` |
| `#757575` | 12 | 11% | 辅助文字、说明、元信息 | 二级文字 | `--du-text-3` |
| `#d9d9d9` | 9 | 8% | 分隔线、界面边界 | 边框 | `--du-border-1` |
| `#874fff` | 8 | 7% | 品牌图形、协作资产 | 品牌资产 | 承接缺口，非行动入口不写入 primary |
| `#ff3737 / #24cb71 / #00b6ff / #ff7237` | 8 | 7% | 多色品牌图形 | 品牌资产 | 承接缺口 / demo 视觉控制 |

## 3. 一级色板层

Figma 的色彩原料分为两组：

```text
白色 / 高明度 / 中性 / 高频
近黑色 / 低明度 / 中性 / 高频
浅灰色 / 高明度 / 中性 / 中频
中灰色 / 中明度 / 低饱和 / 中频
紫色 / 高饱和 / 品牌资产
红色 / 橙色 / 绿色 / 蓝色 / 高饱和 / 多色品牌资产
```

这里不把紫色直接命名为 primary，因为 Figma 的多色更多承担品牌图形和协作氛围，不稳定承担主要行动入口。

## 4. 二级色板层

### 4.1 中性基础

```css
:root {
  --du-bg-1: #ffffff;
  --du-bg-2: #f5f5f5;
  --du-text-1: #1e1e1e;
  --du-text-3: #757575;
  --du-border-1: #d9d9d9;
}
```

### 4.2 品牌语义

Figma 的主要行动入口更适合用近黑色承接，保持官网的强对比和工具感。

```css
:root {
  --du-primary-color: #1e1e1e;
  --du-primary-solid-bg: #1e1e1e;
  --du-primary-solid-color: #ffffff;
  --du-primary-soft-bg: #f2f2f2;
}
```

### 4.3 业务语义

```text
--du-trade-* 不主动映射。
```

### 4.4 基础语义

```text
success / warning / error 保持功能语义，不被 Figma 多色品牌资产污染。
```

### 4.5 Disabled / Disabledtemp

```text
保留 dangoui 默认 disabledtemp 体系，从低对比灰阶推导。
```

## 5. 三级组件层

不优先覆盖三级组件 token。按钮、卡片、搜索、标签等组件默认跟随二级色板层。多色协作感通过 demo 专用视觉控制表现，不自动改 tag / badge / pill 相关 token。

## 6. 承接缺口

- 多色品牌图形
- 协作光标色
- 编辑器画布状态
- 大幅品牌排版
- 图形动效
- 产品界面截图与面板布局

这些不伪装成 dangoui color token。

## 7. 可做 / 不可做

可做：

- 使用白底、近黑文字和清晰边界建立工具感。
- 把黑色/近黑作为主要行动入口。
- 把紫、红、橙、绿、蓝作为品牌资产或 demo 视觉控制。
- 在 demo 中展示多色协作画布，但不要写入 `--du-primary-*`。

不可做：

- 不要把所有高饱和品牌色都塞进 primary。
- 不要把插画色污染 `success / warning / error`。
- 不要新造 `surface.card`、`background.page` 等非 dangoui token。

## 8. 最终 Dangoui Token 草稿

```css
:root {
  --du-bg-1: #ffffff;
  --du-bg-2: #f5f5f5;
  --du-text-1: #1e1e1e;
  --du-text-3: #757575;
  --du-border-1: #d9d9d9;
  --du-primary-color: #1e1e1e;
  --du-primary-soft-bg: #f2f2f2;
  --du-primary-solid-bg: #1e1e1e;
}
```

## 9. Demo 应用说明

进入 `dangouiTokens`：

- `--du-bg-1`
- `--du-bg-2`
- `--du-text-1`
- `--du-text-3`
- `--du-border-1`
- `--du-primary-color`
- `--du-primary-soft-bg`
- `--du-primary-solid-bg`

进入 `demoOnlyVisualControls`：

- 多色 conic-gradient 画布
- 紧凑圆角
- 清晰描边式阴影
