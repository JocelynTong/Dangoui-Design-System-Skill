import fs from "node:fs";
import path from "node:path";

const [, , inputPath, brandArg, outputArg] = process.argv;

if (!inputPath || !brandArg) {
  console.error("用法：node scripts/create-dangoui-mapping-doc.mjs <DESIGN.md> <品牌名> [输出.md]");
  process.exit(1);
}

const source = fs.readFileSync(inputPath, "utf8");
const frontMatter = extractFrontMatter(source);
const brandName = brandArg;
const outputPath = outputArg || path.join("migrations", `${slugify(brandName)}-to-dangoui.md`);

const description = extractScalar(frontMatter, "description") || "";
const colors = extractYamlMap(frontMatter, "colors");
const colorRefs = countColorRefs(frontMatter);
const typography = Object.keys(extractYamlNestedKeys(frontMatter, "typography"));
const components = Object.keys(extractYamlNestedKeys(frontMatter, "components"));
const colorRefTotal = Object.values(colorRefs).reduce((sum, count) => sum + count, 0);

const colorRows = colors
  .filter(({ key }) => !colorRefTotal || colorRefs[key])
  .sort((a, b) => (colorRefs[b.key] || 0) - (colorRefs[a.key] || 0) || a.key.localeCompare(b.key))
  .map(({ key, value }) => {
    const guess = guessDangouiTarget(key);
    const count = colorRefs[key] || 0;
    const percent = colorRefTotal ? formatPercent(count / colorRefTotal) : "待补";
    const evidence = colorRefTotal ? `\`components.* -> colors.${key}\`` : `\`colors.${key}\``;
    return `| \`${value}\` | ${colorRefTotal ? count : "待补"} | ${percent} | ${evidence} | ${guess.role} | ${guess.target} |`;
  })
  .join("\n");

const doc = `# ${brandName} 到 Dangoui 的风格迁移草稿

来源：\`${inputPath}\`

生成脚本：\`scripts/create-dangoui-mapping-doc.mjs\`

## 1. 上游品牌风格摘要

${description ? "待补：已读取上游 `description`，请在这里改写为中文品牌摘要，不要直接保留英文原文。" : "待补：补充中文品牌风格摘要。"}

## 2. 高频视觉值统计

> 已自动补一版上游组件引用口径；生产版仍必须补真实网页统计。次数 / 占比不能只凭上游 YAML 推断，应来自目标页面 CSS、DOM 计算样式、截图取样或 Figma 数据。
>
> 占比公式：该视觉值出现次数 / 本次统计中所有视觉值出现次数总和。统计前必须先写清口径，例如只统计 UI 颜色，还是把图片、渐变、阴影、圆角也纳入。
>
> 当前自动填充口径：上游 DESIGN 文档的 \`components:\` 对 \`colors.*\` 的引用次数，共 ${colorRefTotal || "待补"} 次。它可以作为第一轮推导依据，但不能替代真实网页统计。

| 原始值 | 次数 | 占比 | 证据 | 角色判断 | Dangoui 映射目标 |
|---|---:|---:|---|---|---|
${colorRows || "| 待补 | 待补 | 待补 | 待补 | 待补 | 待补 |"}

## 3. 一级色板层

待补：根据高频统计，按色相、明度、饱和度、冷暖和中性色关系归纳颜色原料。

注意：这里不要直接命名为 primary / success / error。

## 4. 二级色板层

### 4.1 中性基础

待补：映射到 \`--du-bg-*\`、\`--du-text-*\`、\`--du-icon-*\`、\`--du-border-*\`、\`--du-white-*\`、\`--du-default-*\`、\`--du-trans-black-*\`。

### 4.2 品牌语义

待补：把主要行动入口、次要行动入口和主品牌识别映射到 \`--du-primary-*\`、\`--du-secondary-*\`。

### 4.3 业务语义

待补：仅当存在明确业务行动色时映射到 \`--du-trade-*\`。

### 4.4 基础语义

待补：仅当存在明确状态语义时映射 \`--du-error-*\`、\`--du-success-*\`、\`--du-warning-*\`、\`--du-default-*\`、\`--du-white-*\`、\`--du-trans-black-*\`、\`--du-mask-*\`。

### 4.5 Disabled / Disabledtemp

待补：从低对比、低饱和或较浅色阶推导，保留 dangoui 的 \`disabledtemp\` 命名。

## 5. 三级组件层

默认从二级色板层派生，不优先单独覆盖。

如果要让某个组件 token 拥有特殊视觉，先询问用户。

上游组件模式候选：

${components.map((name) => `- \`components.${name}\``).join("\n") || "- 待补"}

## 6. 承接缺口

从上游文档识别到但 dangoui token 暂无承接的部分：

${schemaGapHints({ typography, components }).map((item) => `- ${item}`).join("\n")}

## 7. 可做 / 不可做

待补：从上游 DESIGN 文档的可做 / 不可做、概览、布局、字体排印、响应式行为中提炼。

## 8. 最终 Dangoui Token Draft

\`\`\`css
:root {
  /* 待补：只输出已有 --du-* token，不创建新 token 名 */
}
\`\`\`
`;

fs.writeFileSync(outputPath, doc);
console.log(outputPath);

function extractFrontMatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : "";
}

function extractScalar(yaml, key) {
  const match = yaml.match(new RegExp(`^${escapeRegExp(key)}:\\s*(.+)$`, "m"));
  if (!match) return "";
  return stripQuotes(match[1].trim());
}

function extractYamlMap(yaml, section) {
  const block = extractIndentedBlock(yaml, section);
  return block
    .split("\n")
    .map((line) => line.match(/^  ([A-Za-z0-9_-]+):\s*["']?([^"'\n]+)["']?\s*$/))
    .filter(Boolean)
    .map((match) => ({ key: match[1], value: match[2].trim() }));
}

function extractYamlNestedKeys(yaml, section) {
  const block = extractIndentedBlock(yaml, section);
  const result = {};
  for (const line of block.split("\n")) {
    const match = line.match(/^  ([A-Za-z0-9_-]+):\s*$/);
    if (match) result[match[1]] = true;
  }
  return result;
}

function countColorRefs(yaml) {
  const block = extractIndentedBlock(yaml, "components");
  const result = {};
  for (const match of block.matchAll(/\{colors\.([A-Za-z0-9_-]+)\}/g)) {
    result[match[1]] = (result[match[1]] || 0) + 1;
  }
  return result;
}

function extractIndentedBlock(yaml, section) {
  const lines = yaml.split("\n");
  const start = lines.findIndex((line) => line.trim() === `${section}:`);
  if (start === -1) return "";
  const out = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\S/.test(line)) break;
    out.push(line);
  }
  return out.join("\n");
}

function guessDangouiTarget(key) {
  if (/canvas|surface|bg|tile|parchment|pearl/i.test(key)) {
    return { role: "中性表面", target: "`--du-bg-*` 或承接缺口" };
  }
  if (/^primary(?:-|$)|accent|focus|link|blue/i.test(key)) {
    return { role: "品牌行动入口", target: "`--du-primary-*`" };
  }
  if (/ink|body|text|muted|on-dark|on-primary/i.test(key)) {
    return { role: "文字层级", target: "`--du-text-*` / `--du-white-*`" };
  }
  if (/divider|hairline|border/i.test(key)) {
    return { role: "边框", target: "`--du-border-*`" };
  }
  return { role: "需要证据", target: "待补" };
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

function schemaGapHints({ typography, components }) {
  const hints = [];
  if (typography.length) hints.push("字体排印：dangoui 当前 token 清单没有字体排印 token，需记录为承接缺口或另建非 token 规则。");
  if (components.some((name) => /tile|hero|photography|environment/i.test(name))) {
    hints.push("媒体 / 摄影 / 产品区块：图片、材质、摄影氛围不能直接写入 dangoui color token。");
  }
  if (components.some((name) => /sticky|frosted|blur/i.test(name))) {
    hints.push("背景模糊 / 磨砂表面：dangoui 当前 token 清单没有对应模糊 token，需记录为承接缺口。");
  }
  hints.push("圆角 / 阴影 / 渐变：除非 dangoui 暴露对应 --du-*，否则不要伪装成 token。");
  return hints;
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function stripQuotes(value) {
  return value.replace(/^["']|["']$/g, "");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
