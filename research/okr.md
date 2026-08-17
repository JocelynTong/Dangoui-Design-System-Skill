# Heavy Style Site / Brand MOD OKR

## Objective

在扩大 `$brand` skill 泛化测试前，先把 1999 / HPMA / RoCom 这类重风格网站研究透，明确「正确答案」应该如何采集、识别、映射和落地，并将验证结果收敛为可被 DangoUI、业务项目和后续消费者读取的 Brand MOD Schema。

这里的 MOD 是“模块化品牌视觉包”的类比，不是游戏品类限定，也不是游戏 MOD。这个阶段不以“10 个 MOD 全自动跑通”或“所有端一次兼容”为主要目标，而是先把游戏站、剧本杀站、IP 活动页、品牌官网这类高风格化网站的可复用方法沉淀出来。当前先验证 3 个代表性 MOD、每个 2-3 个真实页面；方法稳定并通过业务 apply 后，再扩展到 10 个 MOD 和产品化消费协议。

## Key Results

| KR | Target | Status |
|---|---|---|
| KR1 | 1999 / HPMA / RoCom 都有 2-3 个真实不同页面作为黄金样本 | in progress |
| KR2 | 每个黄金样本都有 `assetInventory`，覆盖 DOM `<img src>`、CSS background、PNG/WebP/SVG、字体包、纹理、边框、选中态和插画/场景图 | in progress |
| KR3 | 每条关键资产都记录 role、targetScope、implementation、fallback、antiScopes | in progress |
| KR4 | 每个黄金样本至少有 1 个真实图片或 mask/font asset 被应用到 demo，而不是只用 gradient 模拟 | in progress |
| KR5 | 普通 `--du-*` token 映射和 `style-only asset recipe` 分层清楚 | in progress |
| KR6 | 已人工校准并验证过的通用规则反写到 `skills/brand/` | in progress |
| KR7 | Claude 扮演首次使用的运营/vibecoder，只用 `/brand <URL>` 能完成 style pack 复用或 2-3 页 preview 验证 | pending |
| KR8 | Demo 站每个参考站/页面/风格说明都有唯一 URL，可被 `/brand <demo URL>` 解析为 style pack | in progress |
| KR9 | 从黄金样本收敛 `Brand MOD Schema v0.1`，明确 manifest、tokens、component variants、slots、assets、layout rules、platform overrides | drafted |
| KR10 | 至少选择 1 个真实千岛业务项目完成 business apply，验证默认入口、真实组件、computed diff、preview gate 与 rollback | pending |
| KR11 | 输出 `/brand` 与下游消费者的职责契约：`/brand` 负责风格采集/生成/应用，`/qdmp` 只是在千岛小程序项目中的可选消费方 | drafted |
| KR12 | 对 uni-app + Vue、Taro + Vue/React 等锁定链路分别记录 build、开发者工具、H5、真机与包体结果，不以“Vue 可编译”替代运行验证 | pending |

## Scope And Terminology

不要再把“10 个黄金模板”和“10 个 Brand MOD”当成同一个目标：

- `page template`：业务页面结构，例如官网首页、资讯页、角色档案页、发布器。
- `Brand MOD / style pack`：建立在 DangoUI 语义上的模块化品牌视觉包，例如 1999、HPMA、CZN、RoCom；它不是游戏品类限定。
- `business apply`：把某个 MOD 应用到真实业务项目的已有页面、默认入口与真实组件。
- `/qdmp`：千岛小程序功能初始化 skill，后续可以消费 Brand MOD，但不负责品牌证据采集、风格抽取或换肤判断。

当前研究阶段优先形成 `3 个代表性 MOD × 每个 2-3 个黄金页面`，不要求做满笛卡尔积。10 个页面模板和 10 个 MOD 是后续两个独立扩展维度。

## Target Architecture And Verification Boundary

目标架构采用以下共识：

```text
Brand MOD
  -> DangoUI token / component semantics / slots
  -> Vue 或 React 实现
  -> Taro / uni-app 跨端编译链
  -> 微信小程序 / 千岛小程序 / H5

DangoUI 原生或跨端移动实现
  -> iOS / Android
```

对产品和路演可以简化为：DangoUI 支持 Vue 后，就具备通过 Taro / uni-app 承接微信小程序、千岛小程序和 H5 的路径；如果能产出 iOS / Android 可运行代码，就能继续覆盖移动端。

但工程验收必须保留边界：框架“支持 Vue”代表具备承接路径，不代表任意 Vue 组件自动兼容所有目标端。DangoUI 使用的模板节点、事件、构建常量、主题样式、portal、宿主节点和原生能力仍必须由对应编译插件/适配层处理，并在锁定版本上完成真实运行验证。“构建通过”不能单独作为生产可用依据。

## Why

Apple / Spotify 这类全球品牌更偏标准题，色彩、排版、圆角和组件层级稳定，AI 不太容易学偏。

真实业务更容易用到的是 1999 / HPMA / CZN 这类高风格化网站。它们的关键风格通常来自：

- PNG / WebP / SVG 图片资产。
- 背景纹理、纸张、金属、噪点、光效。
- 装饰边框、角花、卡牌框、媒体框。
- 选中态背景、按钮图、特殊 icon。
- 自定义字体包和标题字形。
- 插画、角色、物件和场景图。

如果只抽色和映射 token，会丢掉最像原网站的部分。

## Initiatives

### I1. Asset Acquisition

确认采集阶段能拿到核心资产：

- CSS background URLs。
- DOM inline image URLs，例如 `<img src="./img/role/false.webp">`。
- 相对路径图片解析，例如 `./img/role/false.webp` 要补全为基于页面 URL 的绝对 URL 或本地 assetPath。
- network image / font files。
- transparent PNG / SVG。
- selected / active state images。
- frame / 9-slice / border-image assets。
- texture / noise / paper / metal backgrounds。

### I2. Asset Role Recognition

识别每个资产在风格系统中的角色：

- `brand-mark`
- `background`
- `selected-bg`
- `asset-frame`
- `texture`
- `icon`
- `illustration`
- `divider`

特别注意：`<img src="./img/role/false.webp">` 这类角色图、人物图、状态图应识别为 `illustration` 或 `role-art`，不能因为它不是 CSS background、不是 logo、不是 frame 就漏掉。

### I3. Mapping And Implementation

判断每个资产如何承接：

- DangoUI `Image`
- existing `<img>` / page media slot
- icon slot / button icon
- CSS background
- mask
- border-image / 9-slice
- pseudo-element
- `demoOnlyVisualControls.assetRecipes`
- `ReviewQueue`

### I4. Demo Validation

证明资产没有在 demo 落地时丢失：

- 去掉资产后是否明显不像。
- DOM `<img src>` 资产是否进入 `assetInventory`，并保留原始相对路径和解析后的可访问路径。
- selected / active 状态是否使用正确资产或 fallback。
- frame asset 是否替代父容器 border。
- radius / divider / frame / asset 是否联动。
- 证据区、mapping 区、DangoUI baseline 是否没有被污染。

### I5. Claude Roleplay Validation

用 Claude Code / Claude.ai 扮演第一次使用 skill 的运营或 vibecoder，验证入口是否足够低门槛：

- 只给一句 `/brand <URL>`；URL 可以是品牌官网、demo 站或 registry 站，不要求用户知道 `{brand}`。
- 不解释 `assetRoot`、mapping 文件、demo 内部实现或模式名。
- 观察 Claude 是否自动扫描 `migrations/*/style.json` 或 registry，判断已有 style pack 与重新采集 URL 的分流。
- 如果输入是 demo 站唯一地址，观察 Claude 是否从 `/#/brand/{brand}/...` 解析 brand key，而不是重新学习 demo 站外壳。
- 如果 WebFetch / 沙箱无法抓取 URL，观察 Claude 是否先提示安装/复用本地全量 style packs，而不是默认要求粘贴 CSS。
- 观察 Claude 是否先给 2-3 个真实页面 preview，而不是组件拼盘。
- 观察 Claude 是否能区分正式 DangoUI token / component、`style-only` asset recipe 和 ReviewQueue。

## Golden Samples

| Brand | Focus | Asset Root | Progress |
|---|---|---|---|
| 1999 | archive frame, straight radius, logo / texture / selected asset lane | `migrations/re1999/` | Brand MOD drafted |
| HPMA | ornate frame, media border, font package, magic glow | `migrations/hpma/` | Brand MOD drafted |
| RoCom | bright game/IP official home, section background chain, warm CTA, pet/media asset layer | `migrations/rocom/` | first standard Brand MOD sample |
| CZN | dark immersive layout, HUD frame, character / media asset | `migrations/czn/` | pending |

## Brand MOD Schema v0.1

这一轮已把 P0 第一项从讨论收敛成可验证草案：

- Schema：`schemas/brand-mod.v0.1.schema.json`
- RoCom 样本：`migrations/rocom/brand-mod.json`
- HPMA 样本：`migrations/hpma/brand-mod.json`
- 1999 样本：`migrations/re1999/brand-mod.json`
- 校验脚本：`npm run validate:brand-mod`

### 核心字段

- `manifest`：品牌来源、展示名、产物边界、生产者和是否与 `/qdmp` 解耦。
- `tokens`：正式 `--du-*` 映射、style-only 控制和语义 token。
- `componentVariants`：组件变体、目标 DangoUI 语义、证据来源和状态。
- `slots`：Hero、Frame、Image、Icon、Font、Section 等可挂载位置。
- `assets`：官网图片、字体、纹理、伪元素背景、mask、frame 和 fallback。
- `layoutRules`：模块背景链、图片适配、inspector overlay、底部导航预留。
- `platformOverrides`：H5、Taro、uni-app、微信/千岛小程序的路径和兼容约束。
- `verification`：computed-first 证据、coverage gate、asset gate 和 known gaps。

### /brand 输出边界

`/brand` 的主职责是先定义“这个品牌的视觉语言是什么”，再把它转成可执行的 Brand MOD；如果用户同时给了宿主页面/项目目标，它还要负责把这套视觉语言直接落到那个宿主上：

```text
source URL / demo URL / style pack
  -> evidence
  -> brand-mod.json
  -> demo preview 或 business apply
```

`/brand` 不负责初始化功能项目、不负责生成业务逻辑、不把 brand key 自动变成路由或页面。它的长期机器产物是 `brand-mod.json`，不是口头风格描述。

### 下游消费协议

未来任何消费者，包括但不限于千岛小程序初始化链路、业务 apply 脚本或别的宿主框架，都只应该读取 Brand MOD 的稳定字段：

```text
manifest
tokens
componentVariants
slots
assets
layoutRules
platformOverrides
verification
```

如果 `/qdmp` 后续接入，它也只是 Brand MOD 的一个可选消费方：负责识别千岛小程序项目、安装依赖、组装页面能力和提示平台兼容；它不重新判断品牌风格，也不覆盖 `/brand` 的证据链。

### 第一份标准化样本

优先选择 RoCom 作为第一份标准化样本，因为它最能暴露 Brand MOD 的难点：

- 有首屏大图、CTA 资产、下载入口、福利图、日历图、角色/媒体图等多类型资产。
- 有 `::after` 模块背景、撕纸衔接、z-index 层叠和滚动底部预留。
- 能检验 `layoutRules.sectionBackgroundChain`、`assets`、`slots` 和 `verification` 是否真的够用。
- 它比只换颜色的品牌更容易证明 Brand MOD 不是 token 表，而是一套可迁移的设计语言结构。

### RoCom 经验如何通用化

RoCom 不直接变成全局规则。每个坑先变成规则候选，等 2 个以上品牌证明是同类机制，再升级成强制 guard。

| RoCom 问题 | 抽象机制 | 适用条件 | 脚本动作 |
|---|---|---|---|
| `::after` 背景、雪碧图、`picture/source` 一开始没抓全 | rendered asset inventory 必须抓 DOM 图、CSS 图、伪元素图、mask、frame、字体 | 官网用图片/伪元素/背景承载风格，而不只是颜色 | `collect-rendered-assets` 抓证据；`validate-brand-mod` 检查 `ruleCandidates` |
| 撕纸背景被做成单个卡片、纯色漏出、下一段背景盖住内容 | section background chain 要分清背景层、衔接层、内容层和 z-index | 页面模块之间靠叠层、撕纸、mask、波浪、纹理衔接 | `layoutRules.sectionBackgroundChain` 必须写 sourceSelector、coverage、layer policy |
| hover 标签导致 hero/image 缩放、阴影消失 | inspector 只能是绝对定位调试层，不能进布局流 | demo 有 hover label、蓝框、click target、marker | `asset-usage-gate` 后续做 hover 前后 bounding box / computed diff |
| 图片被塞进固定高卡片、padding、background-image，比例错 | Image slot 必须区分内容图、装饰背景、frame，并记录 fit 策略 | poster、banner、日历图、奖励条、图库图等是内容资产 | `asset-usage-gate` 检查 content-media 是否误用 background、缺 aspect-ratio/object-fit |
| Feed 最后一排被 TabBar 挡住 | 固定底栏页面必须有 bottom reserve 和可滚到底的 spacer | 有 TabBar、BottomBar、FAB、home indicator、安全区 | `bottomBarReserve` 必填；后续补滚动到最后节点截图 gate |

当前策略：RoCom 负责提供最复杂的第一批证据；HPMA、1999 或下一个官网样本负责验证这些机制是否真的通用。只通用机制，不通用 RoCom 的具体视觉形态。

### RoCom 当前收尾口径

RoCom 先冻结为“复杂资产和背景链路基线”，不再继续按像素级修图无限拉长这一轮。

- 保留价值：它证明 `$brand` 必须能处理 `computed style`、伪元素背景、`picture/source`、内容图片比例、滚动底栏预留和 inspector hover 污染。
- 不直接通用：撕纸、星星、蓝紫背景、具体按钮文案和具体官网构图只属于 RoCom，不自动写成全局品牌规则。
- 可以通用：背景层和内容层分离、下一模块覆盖上一模块边缘、内容图不能误当背景图、hover 标记不能挤压布局、TabBar 页面必须能滚到底。
- 下一步用法：RoCom 不再作为“继续修到完全像官网”的唯一战场，而是作为新站实验时的对照样本，看同类机制是否再次出现。

### 候选规则升级判断

这一步的目的不是把 RoCom 经验全部硬编码，而是把“网站特例”和“换肤机制”拆开。能跨 HPMA、1999、RoCom 都成立的机制，才进入 guard；只有 RoCom 需要的撕纸、星星、蓝紫背景，仍然留在 RoCom 自己的 assets / layoutRules 里。

| 候选机制 | HPMA / 1999 反证 | 当前等级 | 下一步 |
|---|---|---|---|
| rendered asset inventory | HPMA 有 frame/font/hero 资产，1999 有纹理/font/state/icon 资产；证明“不能只抓颜色”，但伪元素背景主要来自 RoCom | candidate-warning | 先完善 crawler，抓 DOM 图、CSS 图、伪元素、mask、font；稳定后再升 blocking |
| section background chain | HPMA 是魔法氛围层，1999 是档案纹理层，RoCom 是撕纸叠层；共同点是背景层和内容层必须分开 | candidate-warning | `layoutRules.sectionBackgroundChain` 先必填；视觉叠层脚本稳定后再阻断 |
| inspector overlay 不进布局 | 三个站都依赖 demo inspector；hover tag 影响布局是平台级错误 | blocking | `asset-usage-gate` 增加 hover 前后 bounding box / computed diff |
| content image fit | 三个站都有 hero/content/media 不同图像角色；不能统一拉伸或统一 background | candidate-warning | 补 source rendered box 与目标 slot 的比例对比脚本 |
| bottom fixed reserve | 三个站都是手机 mockup，有 TabBar / BottomBar / safe area | blocking | 保留 schema 强制；后续补“滚到最后节点仍可见”的截图 gate |

### 下一站学习实验记录

每换一个新网站，只做 P0 闭环，不扩 10 个 MOD，也不重构旧 demo。

```text
sourceUrl:
brandKey:
siteType:
styleEvidence:
  - computed 里最稳定的颜色、字体、圆角、阴影、边框
assetEvidence:
  - DOM img / picture / source
  - CSS background / ::before / ::after / mask
  - font / sprite / frame / section background
modDraft:
  - manifest / tokens / componentVariants / slots / assets / layoutRules / platformOverrides
demoPreview:
  - 标准 demo 站预览地址
verification:
  - validate:brand-mod
  - rule-candidate-gate
  - browser computed / screenshot
ruleCandidates:
  - 这次新出现的问题
  - 是否和 RoCom / HPMA / 1999 同类
decision:
  - 留在本品牌
  - 升成 candidate-warning
  - 升成 blocking guard
```

P0 验收只看五件事：

- 证据不是靠印象猜的，而是从浏览器最终渲染结果和源码来源反查出来的。
- `brand-mod.json` 能表达这次风格，不靠临时散落 CSS 解释一切。
- demo 预览能展示风格、组件、页面三个层面的能力，不混进业务项目 preview。
- guard 能说清楚“通过 / 警告 / 阻断”，不是只靠人肉记忆。
- 最终话术诚实区分“完整风格预览”“保守应用”“仅颜色层应用”。

## Sample Checklists

### 1999

- [x] 建立 `migrations/re1999/`
- [x] 记录 `assetInventory`
- [x] 应用 `/assets/re1999-logo.png` 到 NavigationBar watermark
- [x] 下载并本地存储 DOM inline role-art 样本：`./img/character/1.png` -> `/assets/brand-assets/re1999/img/character/1.png`
- [x] 下载并本地存储字体、纹理、角色装饰层、状态图样本：`Serif/Sans/Didot`、`BG2.png`、`role/false.webp`、`role/1bg.png`、`icon/b/bc.png`
- [x] 补充背景/纹理候选：`BG.png`、`BGM.png`、`01.jpg`、`kv/m.jpg`、`m/m_00000.jpg`、`loginBg.png`
- [x] 补 selected-bg 真实资产样本：`icon/b.png` + `icon/bc.png`
- [ ] 验证 selected-bg 如何从源站局部 hover 图标映射到通用选中态
- [ ] 补 texture / paper / noise 真实资产或确认 fallback
- [ ] 补 frame / corner asset 真实资产或确认 CSS fallback
- [x] 将 1999 demo 三页改成更接近真实站点结构：首页主视觉/下载入口、公告 NEWS 区、档案角色页
- [ ] 对 2-3 页做截图 / DOM 回归

### HPMA

- [x] 记录 media border / font / icon asset 证据
- [x] 修正 ornate frame 替代父容器 border
- [ ] 将 `assetInventory` 升级到和 1999 同一结构
- [ ] 验证 font package / icon asset / media border 是否都能被 Claude 复用
- [ ] 对 2-3 页做截图 / DOM 回归

### CZN

- [ ] 复查现有 migration asset
- [ ] 识别 HUD frame / character asset / media background / selected state
- [ ] 建 `assetInventory`
- [ ] 验证 `<img src="./img/role/*.webp">` 这类角色图是否被采集并归类为 illustration / role-art
- [ ] 应用至少一个真实图片或 mask asset 到 demo
- [ ] 对 2-3 页做截图 / DOM 回归

### RoCom

- [x] 建立 `migrations/rocom/`
- [x] 从现有 demo 草稿反向整理首页、资讯、影像、精灵图鉴、发布器结构
- [x] 建 `asset-inventory.json`
- [x] 补官网模块证据：首页、专属福利、玩法前瞻、活动日历、皮卡月刊、活动直通车
- [x] 记录首屏背景、奖励图、活动日历图、奖品条等官方资产 URL
- [ ] 用截图/DOM/CSS 继续校准首屏比例、按钮位置、字体和模块密度
- [ ] 将“专属福利 / 活动日历”落成 demo 站真实页面，而不是只停在 migration 证据里
- [ ] 对 RoCom 标准 demo 做浏览器截图 / DOM 回归
- [ ] 选择一个业务项目做 business apply，验证强 IP 模板能否迁移到非游戏页面

## Workflow

```text
1. demo
  ↓ 先做 2-3 个页面，暴露不像的地方
2. 采集
  ↓ 抓 CSS / DOM / screenshot / network / image/font assets
3. 识别
  ↓ 判断 color、radius、frame、asset role 和反例区域
4. 映射
  ↓ 分流到 --du-*、DangoUI component、style-only CSS、asset recipe、ReviewQueue
```

## Commercialization Roadmap

这条路线用于把 `$brand` 从“AI 换肤命令”推进成“设计语言模板资产服务”。后续如果节奏乱了，优先回到这里判断当前该攻破哪一层。

### 核心判断

商业化护城河不是 `/brand <URL>` 本身，而是长期积累的专业模板资产库：

```text
高质量页面模板
  -> 官网模块证据
  -> DangoUI 组件映射
  -> style-only 资产层
  -> token 可替换点
  -> 业务项目 apply 验证
```

模板不是 UI 截图，而是可迁移的设计语言结构：页面怎么排、哪些资产必须保留、哪些 token 能替换、哪些业务语义不能乱改、哪些状态/动效必须显形。

### 风险优先级

| Priority | Risk | Why It Matters | 攻破方式 | Status |
|---|---|---|---|---|
| P0 | 黄金样本方法尚未稳定 | 过早铺开 10 个 MOD，会把不稳定方法复制十次 | 先完成 3 个代表性 MOD、每个 2-3 个真实页面，并收敛 Brand MOD Schema v0.1 | in progress |
| P0 | 官网还原停留在 token 换肤 | 强风格站真正像不像，取决于布局、资产、字体、frame、动效和模块比例 | `/brand 官网` 第一阶段先做官网模块证据提取，不直接换肤 | next |
| P1 | 模板分类不准 | 网站匹配错模板，后续页面结构和组件映射都会错 | 建 template taxonomy：适用条件、反例、必要组件、验收点 | pending |
| P1 | 设计经验没有结构化沉淀 | 设计师改完 demo 但没变成规则，护城河不会增长 | 每次设计介入后沉淀模板规则、可替换点、asset role、anti-pattern | pending |
| P1 | Demo 站和业务项目断链 | demo 漂亮但业务项目失真，用户不会付费 | 每个模板必须跑 business apply：默认入口、真实组件、computed diff、rollback | pending |
| P1 | 跨端支持被理解为自动兼容 | Vue 能编译不代表 Taro / uni-app / Dimina / 真机运行一致 | 按锁定链路建立 build、模拟器、H5、Android、iOS、包体验证矩阵 | pending |
| P1 | `/brand` 与下游消费者职责重叠 | 采集、生成、初始化和平台兼容混在一起会导致维护边界不清 | 固化职责契约：`/brand` 产出/应用 Brand MOD，`/qdmp` 只在千岛小程序场景消费协议并组装正确实现 | drafted |
| P2 | 运营不知道怎么选模板 | 模板强但不可理解，会降低转化 | 用运营白话命名：游戏官网首屏、活动报名发布器、角色档案页等 | pending |
| P2 | 风格资产版权和复用边界 | 强 IP 资产不能随意搬到客户项目 | 区分可学习的设计语言和不可复用的官方内容资产 | pending |
| P2 | 自动化质量验收不够 | Agent 容易 build 过了就说完成 | 建 preview gate：首屏相似、模块顺序、资产、字体、状态、业务命中 | pending |
| P3 | 规模化维护成本 | 100+ 模板会变成素材堆 | registry 化：版本、场景、依赖组件、成功案例、失败反馈 | pending |
| P3 | 变现包装不清晰 | “AI 换肤”容易被低价工具卷 | 对外包装为“品牌设计语言迁移 + 运营页面模板资产库” | pending |

### 攻破顺序

```text
1. 研究透 3 个代表性 MOD，每个覆盖 2-3 个真实页面
2. 建官网模块证据提取，收敛 Brand MOD Schema v0.1
3. 跑 1 个真实千岛业务 apply，验证 computed diff、preview gate 与 rollback
4. 明确 `/brand` 与下游消费者契约，并完成黄金链路原型
5. 分别扩到 10 个 MOD 与 10 个高频页面模板
6. 建模板分类、registry、版本和兼容治理
7. 再扩到 30 / 50 / 100+，形成商业化包装
```

### 10 个黄金页面模板候选

先服务高频运营场景，不追求覆盖所有页面：

- 游戏 / IP 官网首页
- 活动预约 / 下载落地页
- 资讯公告页
- 角色档案 / 人物详情页
- 媒体图库 / PV 展示页
- 商品详情页
- 社区帖子详情页
- 订单详情 / 状态页
- 内容 Feed 首页
- 发布器 / 活动报名表单

每个黄金模板必须包含：

- 页面结构：真实模块顺序和主次关系。
- 组件映射：DangoUI 组件、业务组件、缺口组件。
- 风格原子：Color、Typography、Radius、Shadow、Divider/Frame、Asset、Motion、Button、Layout。
- 可替换点：哪些 token / recipe 可以换。
- 不可替换点：业务语义色、官方内容资产、数据逻辑。
- 验收标准：demo 站可见、业务项目可 apply、rollback 可回退。

### 节奏判断

如果当前不知道该做什么，按这个判断：

- 如果 demo 不像官网：回到“官网模块证据提取”。
- 如果 demo 像但业务项目不像：回到“business apply 验证”。
- 如果每次都要人工重新解释：回到“模板规则沉淀”。
- 如果运营不知道选哪个：回到“模板分类和白话命名”。
- 如果模板越来越多但难维护：回到“registry 化”。

## File Ownership

- 阶段 OKR 和进度：`research/okr.md`
- 单品牌事实资产：`migrations/{brand}/`
- 已验证后要给 Claude / Codex 复用的规则：`skills/brand/`
- 历史讨论摘要：`memory.md`

## Showcase Retrospective

### 一句话

这轮联调让 `$brand` 从“能提取风格”推进到“能把风格接到真实项目里”。

### 复盘结论

#### 1. Style pack 不是最终产物，命中真实页面才是

过去的成功标准偏向“生成了 token、theme CSS、adapter 报告”。

真正的验收应该是：用户打开业务项目后，真实页面上的真实元素已经消费了这套 token / recipe，并且 computed style 能证明链路命中。

```text
evidence
  -> adapter token / recipe
  -> generated CSS / asset
  -> host selector / component
  -> computed style
```

讲法：

> 不是有了一包风格资产就算换肤，必须看到它接到了业务项目的真实页面上。

#### 2. 换肤前必须先理解宿主项目

style pack 是目标风格，宿主项目是实际落地点。两边不会天然对齐。

联调里暴露的问题：

- demo selector 是 `.ink-card`，宿主真实 class 是 `.re1999-card`。
- theme CSS 生成了，但没有 selector 命中真实 DOM。
- 宿主 scoped style 和硬编码色值继续覆盖主题变量。
- 路由、默认首页、TabBar 选中页没有被纳入验收。

因此 `$brand` 应用前必须做宿主项目诊断：

- 默认入口和路由。
- 页面文件和样式入口。
- 组件 class / DangoUI 组件 / 业务组件结构。
- 当前 token 消费点。
- 硬编码颜色、圆角、阴影、边框、字体、动效。

讲法：

> AI 不能只认识参考站，也要先认识当前项目。否则它会拿一套漂亮的 CSS 去打一个不存在的 class。

#### 3. 默认改原页面，但要有版本锚点可回退

目标不是新建一个品牌展示页，而是让当前业务项目真正换肤。

正确策略：

- 默认换肤原页面、原路由、原 TabBar 默认入口。
- 保留业务文案、数据、字段、图片语义和交互。
- 只迁移视觉层：色彩、字体、边框、圆角、阴影、资产、动效和组件状态。
- 不在业务 UI 上塞回退开关；回退由 vibecoder / Claude 通过命令执行。

命令语义：

```text
/brand <style-url>
  -> 默认创建 rollback checkpoint commit
  -> 应用风格到原页面

/brand rollback
  -> 回到最近一次 /brand 前的 checkpoint

/brand commit --rollback
  -> 只创建 checkpoint，不应用风格
```

代码落地：

- 如果是 GitHub / GitLab 这类 git 项目，动业务代码前自动创建 checkpoint commit。
- 写入 `migrations/_brand-rollbacks/latest.json`，记录 branch、checkpoint commit、命令和 brand。
- `/brand rollback` 读取 latest manifest，回到执行 `/brand` 前的原始版本。
- 非 git 项目才 fallback 到文件备份和 rollback manifest。

默认验收：

- 打开业务项目默认 URL 看到目标风格。
- 执行 `/brand rollback` 能回到执行 `/brand` 前的原始版本。
- 换肤和回退都使用同一套业务内容和路由语义，不复制参考站内容。

讲法：

> 对运营来说，最自然的结果是“我原来的页面变成了这个风格”。但为了安心试风格，skill 要在动手前自动打一个可回退的版本锚点。

#### 4. 风格迁移是工程接线，不是重新画页面

这轮问题不是审美错，而是接线错。

典型断点：

- token 定义了，但没人消费。
- selector 写了，但没命中 DOM。
- theme import 了，但被 scoped style 隔离。
- frame recipe 写了，但只变成普通 border。
- build 没跑，dev server 掩盖了 PostCSS / asset 错误。

所以 skill 的核心流程要变成：

```text
找风格
  -> 找宿主入口
  -> 对齐 selector
  -> 替换硬编码
  -> 接入 token / recipe
  -> build
  -> 浏览器 computed style 验收
```

讲法：

> 真正难的不是“AI 知道 RE1999 是古铜黑金”，而是它能把古铜黑金接到当前项目的每一个真实消费点上。

#### 5. 框架机制必须进入规则

Vue scoped、CSS Modules、Taro chunk、PostCSS、rem/rpx 转换都不是边角问题。

它们决定风格是否真的能落地。

这轮补进去的规则：

- 字体不能 `@import .ttf`，必须 `@font-face`。
- theme CSS 不能塞进 Vue `<style scoped>` 后假设全局生效。
- 选择器必须有 adapter selector -> host selector 的对齐表。
- 硬编码色值和旧阴影必须替换或覆盖。
- dev server 成功不能替代 build 成功。

讲法：

> 设计系统迁移最后会落到工程细节上。AI 必须懂这些前端机制，才不会只生成看起来正确、实际无效的风格包。

### Showcase 叙事结构

#### 起点

我们一开始以为目标是：

> 从一个网站学出颜色、字体、边框、动效，再生成一个 DangoUI 风格包。

#### 发现

联调后发现，真实难点是：

> 风格包只是中间产物。真正要交付的是当前业务项目可预览、可回退、可验证的换肤结果。

#### 转折

因此 `$brand` 的工作流从“生成资产”升级成：

```text
/brand <URL>
  -> 找到或学习 style pack
  -> 诊断宿主项目
  -> 对齐组件和 selector
  -> 应用到原页面
  -> 提供原版回溯通道
  -> build + 浏览器验收
```

#### 价值

对运营 vibecoders：

- 不需要懂 token、selector、CSS scoped。
- 只需要输入 `/brand <URL>`。
- 能看到自己的项目换成目标风格。
- 如果不满意，可以回到原版继续调。

对设计系统：

- 能发现 DangoUI 缺哪些 token、组件、布局和 style-only 能力。
- 能把重风格网站里的边框、资产、动效显性化。
- 能把 AI 每次踩坑沉淀成下一次自动化规则。

### 适合放在演讲里的金句

- 风格迁移不是“画得像”，而是“接得上”。
- style pack 不是终点，computed style 才是验收。
- 运营要的是“我的页面变成这个风格”，不是“多了一个风格 demo 页面”。
- AI 不能只学参考站，也要先读懂宿主项目。
- 原页面换肤要大胆，原版回溯要安全。
