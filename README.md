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

## 使用场景

- 为其他项目先生成 2-3 个 demo 视觉方向，让用户选择风格。
- 统计品牌高频颜色、圆角、间距、阴影和组件模式。
- 生成 `migrations/{brand}/` 下的 DTCG、Echo mapping、dangoui adapter、component mapping 和 README。
- 把已确认方向应用到 demo，同时区分正式 `--du-*` token 和 `demoOnlyVisualControls`。

## 验证

```bash
npm run build
```
