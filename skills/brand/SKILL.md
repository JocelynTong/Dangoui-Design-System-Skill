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

把上游品牌 URL、DESIGN.md、截图或 Figma/DTCG 资产转成可审查、可迁移、可落地的 Echo / dangoui 资产。

核心原则：

- 保持 Echo / dangoui 的 token 名、组件名、props、slots 稳定。
- 品牌网站的 schema key、CSS 变量名、自然语言总结不能直接变成 dangoui token。
- 先用 2-3 个真实不同的 demo 页面做视觉方向预审，再沉淀长期资产。
- 每次映射都必须有证据、状态和落地位置。
- 当前 dangoui 不支持的能力，不伪装成正式 `--du-*`。
- 用户手动校正过的效果属于高优先级证据；后续改内容或补页面时不能静默丢失这些效果。
- 面向运营/vibecoder 的主调用方式应该是一句话：`$brand <URL>`。不要要求用户先理解 assetRoot、mapping 文件或内部模式名。

## Mode Selection

先判断用户是在“维护 skill”还是“使用 skill”。

### Mode A：Maintain Skill

当用户在 Dangoui Design System Skill 仓库中要求更新 skill 本身时使用。

触发例子：

- 更新、优化、同步、发布这个 `brand` skill。
- 刷新内置 dangoui schema、参考文档、脚本或输出模板。
- 让 Codex / Claude 都能使用这个 skill。
- 修改 `skills/brand/`、`.claude/skills/brand/`、`scripts/sync-agent-skills.mjs` 或本仓库 README。

执行规则：

- 只维护源目录 `skills/brand/`，不要手动编辑 `.claude/skills/brand/`。
- 改完运行 `npm run sync:skills` 同步 Claude Code 镜像。
- 验证 `diff -qr skills/brand .claude/skills/brand` 无差异。
- 能构建时运行 `npm run build`。
- 如用户要求，提交并 push。

Mode A 的输出是 skill 仓库变更，不是业务项目主题。

### Mode B：Apply Brand Style

当用户在任意业务项目中要求把某个品牌风格应用到当前项目、页面或 demo 时使用。

触发例子：

- “$brand https://example.com，把这个网址的风格迁移到当前项目。”
- “给这个业务项目做 3 个 Apple / Spotify / 某品牌风格 preview。”
- “把 DESIGN.md 应用到当前 Vue / React / dangoui demo。”
- “只生成迁移资产，不更新 skill 仓库。”

执行规则：

- 先识别宿主项目的框架、样式入口、demo 页面和 dangoui 使用方式。
- 不修改 Dangoui Design System Skill 仓库，除非用户明确要求回到 Mode A。
- 在宿主项目生成或更新 `migrations/{brand}/` 资产。
- 将选中的 preview 应用到宿主项目自己的页面、主题文件或 demo 入口。
- 正式 dangoui token 只写已有 `--du-*`；未承接能力写入 demo 专用样式、adapter 或 ReviewQueue。
- 运行宿主项目的构建/测试，并用浏览器验证可见 demo。
- 如果输入是 URL，直接抓取 URL 的 CSS、DOM、截图和可用媒体资产，不要要求用户手写风格描述。
- 如果未来存在公开 demo/registry 站点，例如 `design.echo.tech`，可以把生成的 `migrations/{brand}` 发布或保存为 style pack，但应用时仍以机器可读资产为准。

Mode B 的输出是宿主项目变更，不是这个 skill 的新版发布。

### Mode C：Apply Existing Migration Assets

当用户要求把已经沉淀好的迁移资产应用到业务项目时使用。此模式不重新学习品牌官网，除非迁移资产缺失、用户给了新 URL，或用户明确要求重学。

触发例子：

- “用 `migrations/hpma` 把当前 vibecoding 项目改成 HPMA 风格。”
- “不要口头描述，直接按迁移资产应用这个品牌。”
- “Claude 拉最新代码后，用这个 skill 套 HPMA 风格。”
- “基于已有 `brand-evidence / dangoui-adapter / component-mapping` 改项目。”

资产查找顺序：

1. 宿主项目 `migrations/{brand}/`
2. 公开 demo/registry 站点返回的 `{brand}` style pack
3. 如果两者都不存在，回到 Mode B 用 `$brand <URL>` 重新学习素材

必须读取的资产：

- `{assetRoot}/brand-evidence.json`
- `{assetRoot}/echo-mapping.json`
- `{assetRoot}/dangoui-adapter.json`
- `{assetRoot}/component-mapping.json`
- `{assetRoot}/preview-gate.json`
- 如存在，读取 `{assetRoot}/README.md`、`brand-profile.dtcg.json`、`uno-adapter.json`

执行规则：

- 以 `{assetRoot}` 的 JSON 作为事实来源；不要凭记忆、品牌名或审美直觉改样式。
- 不要要求用户手动复制 JSON；如果用户给的是 URL，直接重新学习并生成 `migrations/{brand}`。
- `dangoui-adapter.tokens` 里的现有 `--du-*` 可以进入主题 token；`demoOnlyVisualControls` 只能进入页面样式层、主题 class、asset 或 ReviewQueue。
- `component-mapping.json` 决定组件组合方式；不要把页面组合误判为需要新增 dangoui 组件。
- `preview-gate.json` 决定 2-3 个页面方向；每页必须有真实不同的结构和关键内容，不得只换 tab 文案。
- 如果 `dangoui-adapter.json` 的 `demoOnlyVisualControls` 包含 `--style-border-frame`、`--style-divider-color`、`*Frame.applyRecipe` 或类似 frame/divider recipe，必须初始化对应 CSS recipe；只设置 `--du-border-1` 不算完成特殊边框。
- 如果目标项目没有相同页面，选择 2-3 个最接近的现有页面/模块应用；没有可用页面时先生成 preview 页面。
- 对用户校准过的效果做回归：字体、icon/asset、边框、圆角、阴影、选中态、证据区排除规则。
- HPMA 等装饰框风格要区分 frame/card/media radius 和 control radius；直角框保持 `0px`，button/input 可以保留 control radius。
- 替换边框时优先替换真实容器 border 或贴边角线；不要默认在容器内部再套一层框。
- 没有证据的 active/hover shadow 不添加。
- 完成后运行目标项目构建/测试，并用浏览器验证正例和反例。

Mode C 的输出是业务项目风格应用变更，不是重新生成品牌迁移资产。

### Public Demo / Registry Flow

未来如果本仓库发布为类似 `design.echo.tech` 的公开 demo 站，推荐流程是：

1. 运营或 vibecoder 输入 `$brand <品牌 URL>`。
2. skill 抓取 URL，生成 2-3 个 preview 页面并写入 `migrations/{brand}`。
3. demo 站展示 preview、证据、mapping、component gap 和 QA 状态。
4. 用户确认后，`migrations/{brand}` 成为可复用 style pack。
5. 其他项目应用时可以再次输入 `$brand <同一 URL>` 重新学习，或使用已发布的 style pack。

公开站点不是口头风格说明；它应该托管机器可读资产，例如：

```text
migrations/{brand}/brand-evidence.json
migrations/{brand}/dangoui-adapter.json
migrations/{brand}/component-mapping.json
migrations/{brand}/preview-gate.json
```

如果站点提供 API，优先约定：

```text
GET /api/brand-migrations/{brand}
GET /api/brand-migrations?source={encodedUrl}
```

没有 API 时，skill 仍应能从 URL 重新学习，不要求运营写长 prompt。

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

先生成 2-3 个低成本 demo 方向或页面；如果用户要求“2-3 个 demo 页面”，必须让页面结构、内容模式和组件组合都不同，不能只切换 tab 文案或复用同一套通用渲染。

每个方向记录：

- 视觉假设：色彩、密度、圆角、阴影、媒体气质、行动入口。
- 组件假设：页面结构、核心组件、组合方式。
- 用户反馈：选择、否定、合并、待确认。

只有通过用户预审的方向，才进入正式统计和迁移资产。

页面 demo 的最低要求：

- 每页有独立主体结构，例如首页、资讯/活动页、图鉴/详情页。
- 每页至少有 2 个该页面独有的可见内容或组件模式。
- 切换页面后必须用浏览器或 DOM 验证关键文案/组件确实变化。
- 不要把 `components` 数组当作页面实现；必须有实际渲染分支或真实路由。

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

Color 产物必须分成 `完整色板` 和 `高频映射证据` 两层：

- 完整色板先列出本次口径内所有颜色，包括低频但稳定的 UI 色、媒体资产色、截图采样色和 token 色。
- 高频映射证据再说明 count、percent、上下文和 target mapping。
- 不允许只输出 Top N 频次表后声称完成 color 学习；Top N 只能解释优先级，不能代表全部 color inventory。

对边框、圆角、阴影要分开统计和判断：

- 边框/框体：区分真实 CSS border、图片边框资产、伪元素角线、内框、外框。
- Divider / Frame：每个参考站都必须提取普通分割线、卡片边界、媒体框、选中底线和装饰框 recipe；没有特殊框也要记录为 `none / plain hairline`。
- 圆角：区分 frame/card/media 容器圆角和 button/input/tag 等 control 圆角；不要把 control radius 泛化到所有容器。
- 阴影：只有在来源证据明确时才迁移；不能为了“选中态更明显”自行加 shadow。
- 如果用户指出某个效果没有来源依据，降级为 `style-only` 或删除，并把理由写入资产。

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
- 用浏览器验证预设、token、组件映射、页面差异和视觉效果。

改 demo 或业务项目时的回归规则：

- 改内容结构前，先识别已校准的视觉效果：字体包、icon/asset、边框、圆角、阴影、选中态、证据区排除规则。
- 新增页面或新 class 时，必须继承或显式接入已校准效果；不能因为 class 变了导致效果失效。
- 修一个区域的边框/阴影时要限定作用域，避免证据面板、映射表、频次区等非 demo 容器被误套。
- 替换边框时优先替换容器真实边界；不要默认在内部再加一层框。若必须用伪元素，说明是外沿装饰、内框还是资产替代。
- 特殊装饰边框统一归入 divider/frame recipe：需要同时初始化颜色、线宽、角线/图片资产 fallback、作用域和反例排除规则。
- 圆角必须由证据驱动：直角框就保持 `0px`；按钮/输入可以保留 control radius，但不能推导成 card/media radius。
- 修改后至少验证一个正例和一个反例：正例是目标 demo 元素生效，反例是不该生效的证据/映射区域未被污染。

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
- 2-3 个 demo 页面不是同一套通用内容；切换后结构和关键内容可验证不同。
- 用户已校准的字体、icon、边框、圆角、阴影没有在后续内容改造中丢失。
- 边框不是误加内框；圆角不是由通用容器样式或控件习惯误推导。
