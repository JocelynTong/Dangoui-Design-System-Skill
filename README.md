# Dangoui Design System Skill

这个仓库提供一个可给 Codex 和 Claude 共用的 `brand` skill，用来把品牌网站、DESIGN.md、截图或 Figma/DTCG 资产迁移到 Echo / dangoui 的 token、component mapping 和 demo 视觉验证。

## 入口

- Codex 分发包：`skills/brand/`
- Claude Code 项目 skill：`.claude/skills/brand/`
- Claude.ai 自定义 skill 上传包：打包 `skills/brand/`

## 同步

维护源目录：

```bash
skills/brand/
```

改完同步 Claude Code 镜像：

```bash
npm run sync:skills
```

不要手动维护两份 skill。`.claude/skills/brand/` 是 Claude Code 镜像，由同步脚本生成。

## 两种模式

### Mode A：维护 Skill

在这个仓库里使用，目标是更新工具本身。

示例：

```text
帮我更新 brand skill，让它支持从截图里提取颜色频次，并同步 Claude 版本，然后 push。
```

会改动：

```text
skills/brand/
.claude/skills/brand/
scripts/
references/
README.md
```

推荐流程：

```bash
npm run sync:skills
diff -qr skills/brand .claude/skills/brand
npm run build
git add --all
git commit -m "Update brand skill"
git push
```

### Mode B：应用品牌风格

在开发者自己的项目里使用，目标是把某个品牌风格应用到当前项目或 demo。

示例：

```text
用 brand skill，把 https://example.com 的品牌风格迁移到当前项目，先给我 3 个 demo 方向。
```

典型输出在宿主项目里：

```text
migrations/{brand}/
src/styles/brand-theme.css
src/pages/BrandPreview.vue
```

Mode B 不更新这个 skill 仓库；如果使用中发现 skill 缺能力，再回到 Mode A 维护。

## 使用场景

- 为其他项目先生成 2-3 个 demo 视觉方向，让用户选择风格。
- 统计品牌高频颜色、圆角、间距、阴影和组件模式。
- 生成 `migrations/{brand}/` 下的 DTCG、Echo mapping、dangoui adapter、component mapping 和 README。
- 把已确认方向应用到 demo，同时区分正式 `--du-*` token 和 `demoOnlyVisualControls`。

## 验证

```bash
npm run build
```
