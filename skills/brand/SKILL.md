---
name: brand
description: 将品牌网站、DESIGN.md、截图或 Figma/DTCG 资产迁移到 Echo / dangoui。用于统计高频视觉值和组件模式，保持 dangoui 命名不变，生成 token/component mapping，并应用到 demo 验证。
---

# Brand Skill

## 适用平台与维护

这个 skill 同时面向 Codex 和 Claude：

- Codex：使用仓库中的 `skills/brand/` 作为分发包或安装来源。
- Claude Code：使用仓库中的 `.claude/skills/brand/` 项目 skill 镜像。
- Claude.ai 自定义 skill：打包 `skills/brand/` 目录上传。
- 维护以 `skills/brand/` 为源目录；改完运行 `npm run sync:skills`，确保 `.claude/skills/brand/` 与源目录一致。

## 目标

把上游品牌 URL、DESIGN.md、截图或 Figma/DTCG 资产转成可审查、可迁移、可落地的 Echo / dangoui 资产。

## /brand 的两条工作流

`/brand` 只有两条主路，先分清，再执行。

### 1. 品牌学习（`learn-brand`）

适用场景：用户给的是品牌官网、活动页、截图、Figma、DTCG 或 demo 参考站，目标是先学会“这个品牌的视觉语言是什么”，并把它沉淀成可复用的品牌 MOD / style pack / demo 预览。

固定链路：

`/brand <品牌来源>` → 抽取器（如 dembrandt）→ 我们自己的证据校正与规则补强 → DTCG 标准层 → dangoui 映射层 → demo 预览 / `brand-mod.json`

这一条路默认**不改宿主业务项目**，重点是：

- 学会品牌视觉语言，而不是改业务功能。
- 产出可复用的 `migrations/{brand}/brand-mod.json`、证据文件、adapter、demo preset。
- 把“这个网站为什么长这样”沉淀成后续任何项目都能消费的风格资产。

### 2. 宿主换肤（`apply-host`）

适用场景：用户已经在某个千岛项目、业务项目或本地宿主项目里安装了 `/brand`，现在要把某个已有品牌视觉语言真正落到这个宿主里看结果。

固定链路：

`/brand <品牌来源或已有 brand key>` → 读取已有 MOD / style pack / 证据 → 识别宿主入口与目标页面 → 映射到 dangoui / 宿主组件 → 输出宿主项目里的真实预览

这一条路重点是：

- 决定“这个视觉语言怎么落到当前宿主项目里”。
- 保留宿主原业务内容、数据、逻辑、组件 API，只改视觉语言。
- 最终验收地址必须是宿主项目自己的地址，不是 demo 站地址。

## /brand 总入口（必经）

无论是品牌学习还是宿主换肤，`/brand` 真正开始执行前都必须先走统一入口，而不是一上来散着跑各个 guard。

统一入口职责只有三件事：

1. 先判断当前请求到底是 `learn-brand` 还是 `apply-host`
2. 读取对应 workflow contract，检查这次是不是走错路
3. 先跑 TPP gate，blocking 没清掉就立刻停下

固定入口：

```bash
node skills/brand/scripts/run-brand-workflow.mjs run ...
```

如果当前运行环境是 Claude 项目 skill 镜像，则使用：

```bash
node .claude/skills/brand/scripts/run-brand-workflow.mjs run ...
```

默认约定：

- 只有品牌来源、没有宿主目标时，入口自动分流到 `learn-brand`
- 只要传了 `--host-target`、`--plan-file`，或上下文明确是在当前项目里换肤，入口自动分流到 `apply-host`
- 不允许跳过总入口直接宣称“开始 brand learning / apply”
- 后面的 `brand-guard.mjs validate-intent / tpp-test / coverage-gate / asset-usage-gate` 等细项，是第二层 guard，不是第一层入口

这一步的意义不是多一层流程，而是把“md 里的原则”变成 AI 每次都必须先过的一道硬门。

### 边界

- `/brand` 负责：学习品牌视觉语言、沉淀 MOD / style pack、把视觉语言映射到 dangoui、以及在宿主项目里做换肤验证。
- `/qdmp` 负责：项目初始化、业务功能开发、页面/接口/交互实现。
- 两者可以配合，但不互为前置依赖；`/brand` 不能默认把自己绑死在 `/qdmp` 上。

核心原则：

- 保持 Echo / dangoui 的 token 名、组件名、props、slots 稳定。
- `/brand` 输入中的 brand key 永远只是风格来源标识，不是路由名、页面名、组件名或业务内容生成指令。任何品牌、任何网站、任何 demo/registry URL 都遵守这一条；除非用户明确要求 preview，否则 brand key 不能自动变成 `/brandKey`、`BrandKeyPage.vue`、`BrandKeyComponent` 或新业务页面。
- 品牌网站的 schema key、CSS 变量名、自然语言总结不能直接变成 dangoui token。
- 先用 2-3 个真实不同的 demo 页面做视觉方向预审，再沉淀长期资产。
- 每次映射都必须有证据、状态和落地位置。
- `brand-mod.json` 是 `/brand` 面向后续消费者的主产物：它把 manifest、tokens、componentVariants、slots、assets、layoutRules、platformOverrides 和 verification 收敛成一个独立换肤协议。MOD 指模块化品牌视觉包，不是游戏品类限定；`/qdmp` 只是可能的消费者之一，不是 `/brand` 的前置依赖。
- `brand-mod.json` 的 token 层采用“双轨制”：`tokens.dtcg` 是标准表达层，`tokens.mapped` / `tokens.styleOnly` 是兼容镜像层。DTCG 只负责 token contract，不替代 assets、layoutRules、componentVariants、slots。
- 单个品牌踩出的坑不能直接升级成全局硬规则；先写入 `verification.ruleCandidates`，说明 observedIn、abstractMechanism、appliesWhen、evidenceRequired、scriptCheck 和 promotion。`promotion.level = candidate-warning` 只提醒和记录，`blocking` 才能中断执行；只有当机制被至少两个不同品牌验证，或属于 inspector/rollback 这类平台通用机制时，才升级为 blocking guard。
- 生成或更新 `migrations/<brand>/brand-mod.json` 后，运行 `node .claude/skills/brand/scripts/brand-guard.mjs rule-candidate-gate --brand <brand>`。blocking 必须修复；candidate-warning 只进入本次最终说明和下一品牌学习清单，不能被当成已经证明的全局规则。
- 生成或更新 `migrations/<brand>/brand-mod.json` 后，还要运行 `node scripts/normalize-brand-mod-dtcg.mjs migrations/<brand>/brand-mod.json --write`，再运行 `node scripts/validate-brand-mod.mjs migrations/<brand>/brand-mod.json`。normalize 负责把 legacy mirrors 同步成 `tokens.dtcg`，validate 负责检查 DTCG 覆盖完整且扩展字段齐全。
- 任何设计语言证据都先从最终渲染结果开始：真实 DOM / computed style / loaded asset / 截图区域；再反查 CSS rule、inline style、token、`@font-face`、图片/视频/动效来源；最后才决定 token、style-only recipe、asset 或未承接。不要只从源码文件、文件名、本地资产目录或品牌印象推断。
- 当前 dangoui 不支持的能力，不伪装成正式 `--du-*`。
- 用户手动校正过的效果属于高优先级证据；后续改内容或补页面时不能静默丢失。
- 面向运营/vibecoder 的主调用方式是一句话：`/brand <URL>`。不要要求用户先理解 assetRoot、mapping 文件或内部模式名。

## Reference 路由

按任务读取，不要一次性加载全部细节：

- `references/brand-dtcg-migration-asset-standard.md`：长期资产架构、`style.json`、Figma REST-like document 与 DTCG tokens。
- `references/mapping-rules.md`：颜色、资产、组件、Frame/Divider、Radius/Shadow、style pack 应用链路和风格原子表达规则。
- `references/output-template.md`：迁移文件、README、最终交付格式。
- `references/dangoui.design-system.json`：当前 demo 的 dangoui token/component 快照；正式项目迁移后以宿主项目真实 dangoui 源码为准。

如果宿主项目另有最新 dangoui schema、Echo/Figma DTCG 文件或本地组件源码，优先使用宿主项目真实文件，本 skill 内置快照只当 fallback。

## 路由判断

先判断用户是在“维护 skill”还是“使用 skill”。

### A. Maintain Skill

执行规则：

- 触发：更新、优化、同步、发布 skill；刷新 schema / reference / script；修改 `skills/brand/` 或同步脚本。
- 只维护源目录 `skills/brand/`，不要手动编辑 `.claude/skills/brand/`。
- 新增 md 前必须询问用户；优先复用已有 references。
- 改完运行 `npm run sync:skills`。
- 验证 `diff -qr skills/brand .claude/skills/brand` 无差异。
- 能构建时运行 `npm run build`。
- 只有用户要求时才 commit / push。

### B. Learn Brand Style (`learn-brand`)

执行规则：

- 触发：`/brand <URL>`、截图 / DESIGN.md / Figma / DTCG 输入，目标是先学习品牌并沉淀可复用资产。
- 进入 learn-brand 后，第一步不是直接跑零散 guard，而是先执行统一入口：`node skills/brand/scripts/run-brand-workflow.mjs run --mode learn-brand --brand <brand> --source-url <URL>`；若在 Claude 项目镜像中执行，则改用 `.claude/skills/brand/scripts/run-brand-workflow.mjs`。
- 不修改 skill 仓库，除非用户明确要求维护 skill 本身。
- 输入是 URL 时直接抓取 CSS、DOM、截图和可用媒体资产；不要要求用户手写风格描述。
- 生成或更新 `migrations/{brand}/`，先沉淀 `brand-mod.json`、证据、adapter、demo preset 与标准 demo 预览。
- learn-brand 默认交付物是品牌 MOD / style pack / demo 预览；不能默认把 brand learning 直接执行成宿主项目换肤。
- 如果后续还要把该品牌落到真实宿主项目，再切到 C 路径执行。
- 如果输入是 demo 站 URL，例如 `/#/brand/{brand}/pages/{pageId}`，它只能作为风格来源和 style pack 定位依据；`brand` 不是新路由名，`pageId` 不是新页面目标。默认目标是当前业务项目的默认入口/根路由/当前用户正在验收的业务页面。最终预览地址必须来自当前业务项目的 dev server / route，不能原样返回 demo 站 URL。
- 换肤默认保护宿主业务内容：保留原页面路由、数据、文案、信息层级和业务交互，只迁移色彩、字体、边框、圆角、阴影、资产层、动效和组件状态。除非用户明确要求重写内容，不得把参考站文案、角色、栏目或剧情搬进宿主项目。
- 换肤默认保护宿主组件结构：宿主已有 DangoUI / 业务组件时，必须复用原组件、props、slots、DOM/API 和交互；不得为了“看起来像参考站”手写替代组件结构。品牌风格只能覆盖 token、状态样式、资产层和有证据的 style-only recipe。
- 主题 CSS / token 文件只是中间产物；必须被宿主项目页面实际引用，并能在宿主项目 dev server 里看到变化。
- 运行宿主项目构建/测试，并用浏览器验证可见 demo；只启动 dev server 不等于构建通过。
- 完成时给出宿主项目预览地址和已换肤页面入口。
- 若输入是品牌官网且没有现成 style pack / demo 站资产，不能直接在业务项目里临时捏品牌 preview route。先把官网证据注册到标准 demo 预览：生成 `migrations/{brand}/...`、`public/brand-previews/{brand}.json` 和 registry，让 demo 站出现完整的参考站 / 风格 / 组件 / 页面结构。标准 demo/registry 是“风格能力验收”，业务项目只负责最终 apply 或明确允许后的实验预览。没有标准 demo gate 通过时，不碰业务项目，除非用户明确说“可以在当前项目中实验”。
- 标准 demo registry 是机器协议，不是报告文本：`public/brand-previews/registry.json` 必须使用 `brands[].id/path/migrationRoot/standardDemo/businessApply`，preview JSON 的 `brand/preset.id/pages/styleRecipeDetails/assets` 必须能被 demo 运行时消费。写入后运行 demo 仓库的 `npm run validate:brand-preview`；失败时先修协议，不要声称 demo 已接入。协议通过只代表“能渲染”，不代表“像官网”。
- 标准 demo 还必须过 visual quality gate：运行 `npm run validate:brand-quality -- --brand <brand>` 生成 `migrations/{brand}/visual-quality-report.json`。如果输出是 `draft-visual-preview`，最终只能说“草稿预览/待校准”，并列出主色、Hero、资产、动效、截图或 computed 缺口；只有 `npm run validate:brand-quality:strict -- --brand <brand>` 通过，才可称为“视觉质量已验收”。

### C. Apply Existing Style Pack (`apply-host`)

触发：应用已有 `migrations/{brand}`、本地 style pack、公开 demo/registry URL，或“不要口头描述，直接把某风格套到当前宿主项目里”。

资产查找顺序：

1. 宿主项目 `migrations/{brand}/`
2. 宿主项目同级或用户提供的本地 style pack
3. 公开 demo/registry 站点返回的 `{brand}` style pack
4. 都不存在时，回到 B 路径重新学习素材

必须读取：

- `{assetRoot}/style.json`，如存在，作为机器读取主入口；`document` 遵循 Figma REST-like 节点树，`tokens` 遵循 DTCG。
- `{assetRoot}/brand-evidence.json`
- `{assetRoot}/echo-mapping.json`
- `{assetRoot}/dangoui-adapter.json`
- `{assetRoot}/component-mapping.json`
- `{assetRoot}/preview-gate.json`
- 如存在，读取 `{assetRoot}/README.md`、`brand-profile.dtcg.json`、`uno-adapter.json`

执行规则：

- 以 `{assetRoot}` 的 JSON 作为事实来源；不要凭品牌名或审美直觉改样式。
- 进入 apply-host 后，第一步也必须先执行统一入口：`node skills/brand/scripts/run-brand-workflow.mjs run --mode apply-host --brand <brand> --source-url <URL> --host-target <target> --plan-file <plan>`；若在 Claude 项目镜像中执行，则改用 `.claude/skills/brand/scripts/run-brand-workflow.mjs`。
- `dangoui-adapter.tokens` 里的现有 `--du-*` 可以进入主题 token；`demoOnlyVisualControls` 只能进入页面样式层、主题 class、asset 或 ReviewQueue。
- `component-mapping.json` 决定组件组合方式；不要把页面组合误判为需要新增 dangoui 组件。
- 应用前必须诊断宿主：默认入口、目标文件、样式入口、组件类名、DangoUI API、硬编码视觉值、当前 token 消费点。
- 必须生成并消费 `migrations/{brand}/selector-map.json`：CSS selector 必须命中宿主真实 DOM，不能把 demo class 当宿主 targetScope。
- 必须落到宿主真实页面/路由/组件或明确允许的业务 preview；只新增 theme CSS、只 import 主题、只列 token 状态都不算完成。
- 必须做 `evidence -> adapter token/recipe -> generated CSS -> consuming selector/component -> computed style` 链路校验；详见 `references/mapping-rules.md`。
- 必须做 coverage gate：color、font、radius、border、shadow、frame-or-asset、active-state 至少检查一遍，并按结果降级最终话术。
- 标准 demo gate 和业务 apply 分开：标准 demo/registry 负责风格能力验收，业务项目只负责最终 apply 或用户明确允许的临时业务预览。
- 主题 CSS 必须处在能影响目标页面的作用域和加载顺序；Vue scoped、CSS Modules、Taro page chunk、Tailwind、inline style 等特殊覆盖规则按 `references/mapping-rules.md` 处理。
- 宿主视觉债务必须 token 化或进入 review：硬编码色、字体、圆角、边框、阴影、动效、inline style、`:style`、Tailwind arbitrary class、旧主题变量和主题耦合 class 都要扫描。
- 自动处理的视觉项沉淀为运营可理解的“可调整项”；业务语义色表或库存/价格/状态/属性色进入 `needsReview`，必要时给出品牌化映射实验。
- 资产证据不能只写进 migration：抽象纹理、背景、frame、mask、边框、光效、占位媒体层应进入 style-only asset/recipe；未承接时 coverage 降级。
- 默认在宿主 git 仓库改动前创建 rollback checkpoint commit；`/brand rollback` 回到最近一次 `/brand` 前的 checkpoint。
- 必须启动或复用宿主项目 dev server，给出当前业务项目预览地址；不要把 demo 站 URL 当成业务项目验收地址。
- 必须验证默认初始状态：根地址、默认首页、默认 TabBar 选中页、首屏可见区域都要实际套用主题。
- 默认入口读取 app/page 配置，不能靠文件名猜；默认先 in-place 换肤已有入口和已有页面，不因 brand key 新建路由。
- 只有用户明确允许时才创建业务 preview route；若误生成未请求 preview artifacts，checkpoint 保护下自动清理并重建验证。
- 迁移组件状态时按 demo 站同类风格原子和同类 DangoUI 组件对齐，缺能力写未承接，不自造替代组件。
- 预览地址必须来自宿主项目实际 dev server 日志或浏览器验证；构建/启动未得到成功或明确失败前，不能写“构建成功”。
- 启动预览要解析实际 host/port；DNS 不可解析自动 fallback，端口冲突用实际端口；报告区分本次新增问题和宿主既有噪音。
- CSS / asset / font / Taro / Vite 细节按 `scan-css` 与 `mapping-rules.md` 处理：二进制不能 `@import`、CSS import 顺序要合法、Taro/Vite 可改 JS 入口导入、字体路径和 computed font 必须验证。
- 用户执行中补充反馈时先记录并继续执行；除非明确停止、回滚或改变目标。
- 每次 `/brand` 结束记录 run log：项目完整记录 + 全局脱敏摘要；不做静默网络上传。

执行 guard：

- 这一组 `brand-guard.mjs` 都属于第二层 guard。第一层入口必须先走 `/brand 总入口（必经）` 里的 `run-brand-workflow.mjs`，让脚本先判定当前是 `learn-brand` 还是 `apply-host`，再决定后面要跑哪些 guard。

- 应用风格前，在宿主项目运行 `node .claude/skills/brand/scripts/brand-guard.mjs resolve-demo`，从全局配置 `~/.codex/brand-skill/config.json`、环境变量或参数判断标准 demo/registry 是否可用。无标准 demo/registry 且无现成 style pack 时，先运行 `draft-style-pack` 写临时草稿；不要默认创建业务 preview route。
- 应用风格前，在宿主项目运行 `node .claude/skills/brand/scripts/brand-guard.mjs checkpoint --brand <brand> --source-url <URL> --command "/brand <URL>"`；若当前 skill 不在 `.claude` 路径，使用实际安装路径。默认自动做，不要求用户加参数。
- 改代码前先写一个很短的执行计划，推荐 JSON：`{"sourceUrl":"...","targetRoute":"/","preserveBusinessContent":true,"createNewBrandRoute":false}`；自然语言计划也可以，但必须包含 source URL 是风格来源、宿主已有目标页面/路由、保留原业务内容/数据/逻辑、不会新建品牌路由/页面。然后运行 `node .claude/skills/brand/scripts/brand-guard.mjs validate-intent --source-url <URL> --plan-file <plan>`。如果用户明确要求新建 preview 页面，才可加 `--allow-preview`。该 guard 未通过时不能编辑业务代码。
- 确定目标文件前运行 `node .claude/skills/brand/scripts/brand-guard.mjs detect-entry`。Taro 项目必须使用输出的 `files` 作为默认入口文件；不要直接假设 `pages/index/index.vue` 是首页。
- 如果发现已生成未请求的品牌 preview artifacts，先运行 `node .claude/skills/brand/scripts/brand-guard.mjs cleanup-preview --brand <brand>` 查看 dry-run；确认只包含品牌 preview 文件/路由后，在 checkpoint 之后运行 `cleanup-preview --brand <brand> --execute` 自动删除，再继续 in-place 应用。
- 对无现成 style pack 的官网 URL，先运行 `node .claude/skills/brand/scripts/brand-guard.mjs resolve-demo`。若能定位本地标准 demo 根目录，进入该 demo 根目录运行 `register-demo-preview --brand <brand> --source-url <URL>`，生成 `migrations/{brand}/style-pack-draft.json`、`public/brand-previews/{brand}.json` 和 `public/brand-previews/registry.json`；随后运行 `demo-gate --brand <brand> --demo-root <demoRoot>` 验证参考站、风格、组件、页面结构。若暂时没有本地/在线标准 demo，才运行 `draft-style-pack` 生成临时草稿；此时不碰业务项目，除非用户明确允许“在当前项目中实验”。
- 如果使用第三方抽取器（例如 dembrandt / extract-design-system），必须先运行 `node .claude/skills/brand/scripts/brand-guard.mjs import-dembrandt --brand <brand> --input <extractor-result.json> --source-url <URL>`，把结果写成 `migrations/{brand}/third-party-evidence.dembrandt.json`。第三方结果只能作为 raw computed evidence 候选：可喂给颜色、按钮、圆角、阴影、字体的初始判断，但不能直接覆盖 `style.json`、`dangoui-adapter.json`、demo preset 或业务代码；随后仍必须跑 `score-action-evidence`、`collect-rendered-assets`、`asset-usage-gate`、`coverage-gate`、`demo-gate`，并以 Brand guard 输出作为最终映射依据。
- 在 learn-brand 路径里，`import-dembrandt`、DTCG normalize/validate、`collect-site-evidence` / `score-action-evidence` 完成后，必须立刻通过总入口运行 `node skills/brand/scripts/run-brand-workflow.mjs tpp --mode learn-brand --brand <brand> --source-url <URL>`，或执行 `npm run validate:brand:tpp -- --mode learn-brand --brand <brand> --source-url <URL>`。TPP test 是“第三方抽取 -> DTCG 标准层 -> 我们自己的证据 -> dangoui 映射 / demo”之间的总闸门：它专门检查是否把分类色误提成主色、是否缺 CTA / active 客观证据、是否把规则只写在 md 没落到结构或脚本里。只要 `--du-primary-color` 不是由 action evidence 里的 CTA / active 颜色证明出来，就必须 blocking，不能继续生成 demo preset、dangoui adapter、theme token 或业务 apply 结果。
- 标准 demo 预览写入后，在 demo 根目录运行 `npm run validate:brand-preview`；如果 demo 仓库同时有 `validate:brand`，优先运行它。该 gate 必须在最终给出 demo 预览地址前通过。随后运行 `npm run validate:brand-quality -- --brand <brand>`；报告里若出现主色来自分类色、CTA 未作为主色证据、Hero/图片/字体/动效缺 rendered evidence、资产丰富但页面表达过少等 warning，预览等级必须降为 `draft-visual-preview`，并先修 demo 或明确告诉用户还没到可 apply 的质量。
- 对无现成 style pack 的官网 URL，在写 `dangoui-adapter.json`、demo preset 或任何主基调 token 前，必须先运行 `node .claude/skills/brand/scripts/brand-guard.mjs collect-site-evidence --brand <brand> --source-url <URL>`，再运行 `validate-tone --brand <brand>`。还必须运行 `collect-rendered-assets --brand <brand> --source-url <URL> --html-file <rendered/html> --css-files <css> --computed-file <computed-json>` 生成 `rendered-asset-inventory.json`，把 DOM `img/currentSrc/srcset/poster`、CSS `background/mask/border-image`、`::before/::after`、字体和网络资源统一归类。`site-evidence.json` 是主基调判断门票；`rendered-asset-inventory.json` 是 Hero/Image/Frame/Asset/Font 判断门票。脚本会按 CSS token、HTML inline style、角色权重和图片/asset 降权输出 `dominantToneDecision`。如果浏览器/截图环境可用，必须先把 NavigationBar、Hero、CTA、Card、Tag/Tabs、BottomBar 等关键节点的 computed style 存成 JSON，再用 `collect-site-evidence --computed-file <file>` 合并证据，并用 `validate-tone --require-computed` 复核。所有设计语言维度都按 computed-first 溯源：颜色看 computed color/background/border/shadow；字体看 computed `font-family` 再反查 `@font-face src`；圆角/边框/阴影看最终像素和来源 rule；动效看 computed animation/transition/transform；图片和 frame 看实际加载的 `img/currentSrc/background-image/mask/border-image`。未通过 `validate-tone`、缺少关键 computed 证据或缺少 rendered asset inventory 时，只能生成草稿和待确认项，不能凭截图局部色、品牌名、文件目录、本地资产缺失或用户一句反馈直接覆盖 adapter/demo token 结论。
- 写入或应用 replacement 后，运行 `node .claude/skills/brand/scripts/brand-guard.mjs validate-role-replacements --brand <brand> --css-files <theme/demo css files>`。该 guard 强制每条 computed replacement 有 `role / replacement / antiScopes`，并扫描 CSS 中明显的角色泄漏：例如文档说明卡、代码块、示例分组不能使用 control radius；大范围 `.phone span/p/small` 文字覆盖会产生 warning，必须人工确认是否按 `text-on-dark / text-on-light` 分层。guard blocking 未清零前不能声称完成迁移。
- 确定宿主目标页面后，运行 `node .claude/skills/brand/scripts/brand-guard.mjs scan-host-debt --brand <brand> --files <target files>`；若未传 `--files`，脚本会使用 `detect-entry` 的默认入口。输出中的 `autoFix` 必须自动处理，不询问运营；`visualDebt` 是本次 token/recipe 替换清单；`tokenizationPlan` 是必须消费的源码视觉值 token 化计划，并按 `fixStrategy` 执行：`tokenize-inline` 改静态 inline 值，`tokenize-dynamic` 保留条件但替换视觉字面量，`extract-class` 给复杂 gradient/border 加语义 class 并移到 CSS/recipe，`preserve-semantic` 进入业务语义确认；`needsReview` 只用于业务语义风险，例如状态色/价格色/库存色/游戏属性色，优先保留语义并映射到 semantic token；只有 `blocking` 才能暂停执行。该扫描必须识别 Tailwind arbitrary class，例如 `bg-[#f0ebe0]`、`text-[#333]`、`bg-white`，`:style` / inline style 视觉锁，以及 `TYPE_HEX` / `colorMap` / `typeColor` / `statusColorMap` 这类业务语义色表；发现 `inline-style-visual-lock` 时必须改源码绑定值，不能只写 theme CSS。扫描结果里的 `operatorAdjustmentGuide.autoApplied` 是已自动更改、但运营可能想微调的通用视觉项；最终回复必须用白话说明这些“可调整项”以及用户可以怎么要求改方向。`operatorAdjustmentGuide.needsOperatorDecision` 才是需要确认或保留的业务语义风险。
- 对每个目标页面运行 `node .claude/skills/brand/scripts/brand-guard.mjs create-selector-map --brand <brand> --files <target files>`；若未传 `--files`，脚本会使用默认入口。生成或更新 `migrations/{brand}/selector-map.json`。Theme CSS 必须优先使用其中的 `.theme-{brand} .<hostClass>` selector。若走 preview，确认 apply 时也必须用同一张 selector-map 合并回原页面。
- 生成/改动 CSS 后运行 `node .claude/skills/brand/scripts/brand-guard.mjs scan-css --root .`；有 blocking 时必须修复后再 build。
- 应用后运行 `node .claude/skills/brand/scripts/brand-guard.mjs coverage-gate --brand <brand> --files <target files/theme files> --evidence-file migrations/<brand>/site-evidence.json`，把输出的 `coverageLevel` 用在最终话术和 `validate-final --coverage-level`。coverage gate 必须读取 computed evidence 和 `preview-gate.json` 的 `assetRoleCoverage`：发现 CTA、导航、Hero、卡片、frame 等核心角色仍有 baseline/默认色，或强 IP/官网缺少 Menu、入口、角色、CTA 状态、frame 等高频资产角色时，输出 mismatch / missing 并降级覆盖等级。coverageLevel 低时必须降级说法，不能写“完整套用风格”。
- 应用后运行 `node .claude/skills/brand/scripts/brand-guard.mjs asset-usage-gate --brand <brand> --files <target files/theme files>`。该 gate 检查资产层级、装饰挂载、图片比例/重复和 inspector 高亮是否误导；有 blocking 时必须修复，有 warning 时只能按保守应用口径表达。
- 启动 dev server 后，把 server 日志传给 `node .claude/skills/brand/scripts/brand-guard.mjs parse-dev-server --log <logfile>`，最终输出使用脚本解析出的 actualUrl。
- 对 Taro H5 / 小程序项目，apply 后必须用浏览器或渲染快照验证实际 DOM selector 命中；可保存 DOM 到 `rendered.html` 后运行 `node .claude/skills/brand/scripts/brand-guard.mjs verify-dom --brand <brand> --html rendered.html`。如果 `.theme-{brand}` 不在真实 DOM 中，改用 `.taro_page`、`taro-view-core` 或实际渲染 class 作为主题作用域，不要只相信 Vue 源码里有 class。浏览器可用时还要记录旧值到新值的 computed diff，至少看 font-family、border-radius、border-color、box-shadow、background-image、active tab state。
- 最终回复前运行 `node .claude/skills/brand/scripts/brand-guard.mjs validate-final --file <draft> --brand-label <demo/registry 中展示的品牌名或风格名> --source-url <URL> --coverage-level <coverageLevel>`。缺业务预览 URL 是硬失败，必须继续执行；已有业务预览 URL 但缺风格名或默认入口验证时，先把 URL 给用户可见，再修正最终话术，不能用内部 token 表替代结果。最终 URL 不能是输入 demo URL 的原路径；不能把 demo/registry 页面当作业务成果。
- 最终回复前或紧随其后运行 `node .claude/skills/brand/scripts/brand-guard.mjs record-run --brand <brand> --source-url <URL> --coverage-level <coverageLevel> --missing <comma dims> --target-route <route> --preview-url <url> --default-url <url> --style-pack <true|false> --generated-preview <true|false>`。这条记录不阻塞预览交付；失败时只把记录失败写进技术备注，不影响用户看结果。
- 用户执行 `/brand rollback` 时，先运行 `node .claude/skills/brand/scripts/brand-guard.mjs rollback` 查看 dry-run，再经确认后运行 `rollback --execute`。

最终输出口径：

- 面向运营/vibecoder 时，默认只输出当前业务项目预览 URL、已应用的风格名/方向、原业务内容是否保留、默认入口是否验证。不要默认输出 token 表、adapter 表、文件清单或内部术语。
- 最终话术必须带覆盖等级：`complete-style-preview` 可说完整风格预览；`conservative-application` 只能说保守应用；`color-layer-application` 只能说颜色层应用。不要在覆盖不足时写“已完整套用”。
- 如果 `scan-host-debt` 返回 `operatorAdjustmentGuide.autoApplied`，最终回复增加一行“可调整项”：用运营能懂的话按类别说明哪些视觉已自动改过，以及用户可以怎么要求继续调整。它可以覆盖颜色、字体、圆角、阴影、边框、动效、布局节奏、按钮/卡片/筛选/选中态等，不局限于某个组件场景。这不是确认阻塞，不要暂停执行。
- 风格名/方向优先使用 demo/registry/style pack 中的展示名或用户输入中的品牌名，例如 `1999`、`HPMA`、`CZN`；不要把 1999 这类已命名风格泛化成“复古档案风格”一类二次命名。
- 技术细节只在用户追问、验证失败或需要人工补资产时展开。

维护者汇总：

- 项目内汇总：`node .claude/skills/brand/scripts/brand-guard.mjs summarize-runs --scope project`
- 全局脱敏汇总：`node ~/.codex/skills/brand/scripts/brand-guard.mjs summarize-runs --scope global`
- 汇总用于判断哪些 source host 高频出现、哪些 coverage 维度常缺、哪些品牌值得沉淀为维护版 style pack。

## WebFetch / Sandbox Fallback

当 URL 无法被 WebFetch、浏览器、网络或沙箱完整抓取时，不要立刻要求运营贴 CSS 或手写风格描述。降级顺序：

1. 判断输入类型：品牌官网 URL、公开 demo/registry URL、本地 demo URL、截图、Figma/DTCG 文件或普通自然语言。
2. 如果输入是 demo/registry URL，优先从 path、query、metadata 或 registry API 解析 `brandKey/sourceUrl/stylePackUrl`；不要把 demo 站自身当品牌官网重新学习。
3. 如果输入是品牌官网 URL，先根据 URL、页面标题、registry 索引或 `migrations/*/style.json.source` 推断 brand key。
4. 在当前业务项目查找匹配的 `migrations/{brand}/style.json`。
5. 查找已安装全量本地 style packs，例如 `migrations/*/style.json` 和 `public/assets/`。
6. 查公开 registry，例如 `GET /api/brand-migrations?source={encodedUrl}` 或 `GET /api/brand-migrations/{brand}`。
7. 只有 style pack 不存在、registry 不存在、URL 也无法采集，才请求替代素材。

请求替代素材时保持低门槛：优先 2-3 张核心页面截图，其次 HTML/CSS/network assets，再其次 Figma 链接或 DTCG/tokens JSON。不要把“请粘贴 CSS 文件内容”作为默认第一选择。

## 安装到其他业务项目

推荐安装“skill + 全量本地 style packs”，不要只安装某一个品牌：

```bash
mkdir -p .claude/skills migrations public/assets
rm -rf .claude/skills/brand
cp -R /Users/jocelyn/Downloads/vibecoding-docs-demo/.claude/skills/brand .claude/skills/brand
cp -R /Users/jocelyn/Downloads/vibecoding-docs-demo/migrations/. migrations/
cp -R /Users/jocelyn/Downloads/vibecoding-docs-demo/public/assets/. public/assets/
```

安装完成后，用简短提示告诉用户：

```text
已安装 brand skill。你现在可以用：
/brand <品牌官网 URL 或 demo 站 URL>

它会自动判断是否复用本地/registry style pack；没有可复用资产时，会采集 URL 或让你补截图/Figma/HTML 等素材。常见用途：学习一个网站风格、生成 2-3 个预览页面、把已沉淀风格应用到当前项目。
```

## Public Demo / Registry

公开 demo 站不是口头风格说明；它应该托管 `migrations/{brand}/style.json`、`brand-evidence.json`、`dangoui-adapter.json`、`component-mapping.json`、`preview-gate.json`。推荐 API：`GET /api/brand-migrations/{brand}` 和 `GET /api/brand-migrations?source={encodedUrl}`。

Demo 站必须给每个参考站和页面稳定 URL：

```text
/#/brand/{brand}/pages/{pageId}
/#/brand/{brand}/style/{styleCategory}
/#/brand/{brand}/components/{componentName}
```

当用户输入 demo 站 URL 时，先从 hash path 解析 brand/page/style/component，再查 `migrations/{brand}/style.json` 或 registry；不要重新学习 demo 站外壳本身。

如果 agent 正在业务项目中执行，demo 站 URL 的含义是“把这个风格套到本项目”，不是“打开 demo 站检查”。输出中的 `预览地址` 必须是业务项目地址；demo URL 只能出现在 `来源风格` 字段。

## Claude Roleplay Validation

当用户要求“给 Claude 试用”“让 Claude 扮演运营/vibecoder 验证 skill 是否好用”时，按真实使用者验证，不按维护者视角解释内部文件。测试入口只允许是一句话：`/brand <品牌 URL>`，或在已有 style pack 的业务项目里用 `/brand <任意品牌官网 URL 或 demo 站 URL>` 触发自动复用。

验收问题：

- 用户是否只用一句 `/brand <URL>` 就能开始？
- Agent 是否自动找 URL、style pack 或 migration，而不是询问内部实现细节？
- 预览是否是 2-3 个真实页面，而不是同一页面换文案或组件摊平？
- 是否复用了真实 assets，并说明哪些是 DangoUI token、哪些是 `style-only`？
- 是否输出缺口清单，方便后续更新 DangoUI 或业务组件？
- 是否构建通过，并给出宿主项目预览地址完成浏览器可见验证？

## 工作流

### 1. Preview Gate

先生成 2-3 个真实不同的 demo 方向或页面：页面结构、内容模式和组件组合都要不同，不能只换文案或摊平组件。强风格网站必须从源站导航、首屏 CTA、二屏模块、资讯/角色/商品/世界观/媒体入口和真实资产中选页面；Hero、Frame、Asset、Motion 等表达细则见 `references/mapping-rules.md` 和 demo 站对应风格原子。

最小 learn-brand 执行链固定为：

1. `/brand <URL>`
2. 先走统一入口：`node skills/brand/scripts/run-brand-workflow.mjs run --mode learn-brand --brand <brand> --source-url <URL>`，或 `npm run brand:learn -- --brand <brand> --source-url <URL>`
3. 统一入口内部先跑：`import-dembrandt`（或其他第三方抽取结果写入 raw evidence）前置后的 TPP gate 所需检查
4. 再补齐 DTCG normalize / validate、`collect-site-evidence`、`score-action-evidence`、`collect-rendered-assets`
5. `tpp-test`
6. 通过后才允许继续写 `brand-mod.json`、`dangoui-adapter.json`、demo preview 和后续 apply

如果 `tpp-test` 没过，AI 不能以“md 里已经写了原则”为由继续往下走，必须先修 blocking 或明确把结果降级成草稿。
同时 `tpp-test` 现在会检查自己是不是由 `run-brand-workflow.mjs` 触发；直接绕过总入口去跑 `brand-guard.mjs tpp-test`，会被判定为 `missing-total-entry`。

每页记录：`sourceNavigation`、`selectedPagesReason`、`scenarioRole`、`interactiveStates`、`assetRoles`、`antiPatterns`。

### 2. 品牌证据统计

统计前声明口径：UI 颜色、非 UI token、媒体资产、图片资产、组件模式分开统计。占比只在同一口径内计算。图片资产单独进 `assetInventory`。Color 输出分为 `完整色板` 和 `高频映射证据`；DangoUI baseline 只展示一级/二级/三级关系，不做频次统计。细则见 `references/mapping-rules.md`。

### 3. 资产分层

把信息拆成 BrandEvidence、BrandIntent、EchoMapping、DangouiAdapter、ReviewQueue。`style.json` 是长期机器主入口：`document` 用 Figma REST-like 节点树，`tokens` 用 DTCG 结构。详细契约见 `references/brand-dtcg-migration-asset-standard.md`。

### 4. 装饰边界识别

映射前先判断边界类型：plain border、divider、frame、asset frame、texture frame。普通边界可进入 `--du-border-*` / Divider；frame、asset、texture 进入 style-only recipe / asset / ReviewQueue。必须联动检查 radius、background、shadow、asset，不要把装饰框当普通 border。

### 5. 映射判定

使用 `references/mapping-rules.md`。摘要：一级色板只描述颜色；二级色板映射 App 用色角色；三级组件别名继承或派生自二级；非 color token 优先映射 Echo/Figma primitives；DangoUI adapter 必须证明真实 `--du-*`、prop、slot 或 class 存在；style-only 不能伪装成正式 token。禁止新造 token、使用废弃 `--du-c-*`、从语义直觉跳到组件样式结论。

### 6. 承接状态

每个 token 和 component 映射都标记状态：`mapped`、`fallback`、`style-only`、`missing`、`ask-user`。demo 中未同步能力放在 `demoOnlyVisualControls`，不要放进 `dangouiTokens`。

### 7. 生成输出

使用 `references/output-template.md`。必须回答：高频值、次数、占比、映射理由、组件映射、demo-only 内容、承接状态和真实 token chain。可用脚本：`skills/brand/scripts/create-dangoui-mapping-doc.mjs` 或项目本地同名脚本；脚本生成后必须复核。

### 8. 应用到 Demo 或宿主项目

保持 dangoui token 名称不变，只替换 value；不支持的风格特征用 demo 专用视觉控制或 placeholder 表达；运行构建并用浏览器验证。宿主项目应用时保护原业务内容、原组件结构、默认入口首屏和构建完整性；新增页面或 class 必须继承已校准效果。设备外壳不是品牌内容。Frame / Divider 不全局套用，只给有证据的重点容器。Layout / Spacing / Radius / Shadow / 风格原子表达以 demo 站 description 和 `references/mapping-rules.md` 为准。

## 最终回答格式

执行模式默认只保留：

```text
当前项目预览地址：（必须是已验证可访问的业务项目 URL）
风格方向：（一句运营能懂的话，说明这次换成什么感觉）
默认入口首屏验证：（根地址 / 默认首页 / 默认 TabBar 页是否已换肤）
已换肤页面/路由：
实际改动文件：
已应用的风格能力：
可选应用建议：
未承接/待确认：
```

如果还没有启动成功或没有验证可访问 URL，不要填写 demo 站地址；写“预览阻塞”并说明失败命令、退出码或日志。

预览成功后的首屏回复优先给运营可读信息：业务项目 URL + 风格方向一句话 + 默认入口是否已换肤。token、DangoUI、selector、adapter、computed style 等技术细节只放在简短附录或未承接里，不要作为主输出。

当 style pack 含有 `style-only` 能力时，把术语翻译成运营能理解的页面位置，例如卡片外框、页面底纹、图片展示区、选中状态、主视觉动效。

不要把 token 表、迁移资产读取结果、审计报告、计划说明当成交付物；这些只能作为内部依据或最终简短附录。最终必须说明原业务内容是否保留，若有任何内容、字段、路由或交互被改动，必须列入“未承接/待确认”并说明原因。

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
- 2-3 个 demo 页面不是同一套通用内容；切换后结构和关键内容可验证不同。
- 用户已校准的字体、icon、边框、圆角、阴影没有在后续内容改造中丢失。
- 边框不是误加内框；圆角不是由通用容器样式或控件习惯误推导。
- 构建通过并完成浏览器验证。
