import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const packageRoot =
  process.argv[2] || "/private/tmp/dangoui-3.6.16-inspect/package";
const outputFile =
  process.argv[3] || path.resolve("data/dangoui.design-system.json");

const srcRoot = path.join(packageRoot, "src");
const themeFile = path.join(packageRoot, "dist/theme.css");
const packageJsonFile = path.join(packageRoot, "package.json");

async function walk(dir, predicate, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, predicate, acc);
    } else if (predicate(fullPath)) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function relativeToPackage(filePath) {
  return path.relative(packageRoot, filePath).split(path.sep).join("/");
}

function cssClassFromName(name) {
  return `du-${name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase()}`;
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function extractCssVars(text) {
  return uniq([...text.matchAll(/--du-[a-z0-9-]+/gi)].map((match) => match[0]));
}

function extractThemeTokens(themeCss) {
  const tokenMap = new Map();
  for (const match of themeCss.matchAll(/(--du-[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    if (!tokenMap.has(match[1])) {
      tokenMap.set(match[1], match[2].trim());
    }
  }
  return [...tokenMap.entries()].map(([name, value]) => ({
    name,
    value,
    usage: inferTokenUsage(name),
  }));
}

function inferTokenUsage(name) {
  if (name.includes("bg")) return "背景/容器表面";
  if (name.includes("text")) return "文本颜色";
  if (name.includes("border")) return "边框颜色";
  if (name.includes("mask")) return "遮罩/覆盖层";
  if (name.includes("primary")) return "主品牌色";
  if (name.includes("success")) return "成功状态";
  if (name.includes("warning")) return "警告状态";
  if (name.includes("error")) return "错误状态";
  if (name.includes("icon")) return "图标颜色";
  return "dangoui token";
}

function extractProps(vueText) {
  const propsMatch = vueText.match(/defineProps\s*<\s*\{([\s\S]*?)\}\s*>\s*\(\s*\)/);
  if (!propsMatch) return {};

  const props = {};
  const propBlock = propsMatch[1]
    .replace(/\/\*\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  for (const rawLine of propBlock.split("\n")) {
    const line = rawLine.trim();
    const match = line.match(/^([A-Za-z_$][\w$]*)(\?)?\s*:\s*(.+)$/);
    if (!match) continue;
    props[match[1]] = {
      required: !match[2],
      type: match[3].replace(/,$/, "").trim(),
    };
  }

  const defaultsMatch = vueText.match(/withDefaults\s*\([\s\S]*?defineProps[\s\S]*?,\s*\{([\s\S]*?)\}\s*,?\s*\)/);
  if (defaultsMatch) {
    for (const rawLine of defaultsMatch[1].split("\n")) {
      const line = rawLine.trim();
      const match = line.match(/^([A-Za-z_$][\w$]*)\s*:\s*(.+),?$/);
      if (match && props[match[1]]) {
        props[match[1]].default = match[2].replace(/,$/, "").trim();
      }
    }
  }

  return props;
}

function extractDescription(vueText, componentName) {
  const firstComment = vueText.match(/\/\*\*\s*\n([\s\S]*?)\*\//);
  if (!firstComment) return `${componentName} component from dangoui.`;
  const text = firstComment[1]
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").trim())
    .filter(Boolean)
    .join(" ");
  return text || `${componentName} component from dangoui.`;
}

async function findStyleFile(vueFile, componentName) {
  const dir = path.dirname(vueFile);
  const candidates = [
    path.join(dir, `${componentName}.scss`),
    path.join(dir, "style.scss"),
    path.join(dir, `${componentName}.css`),
    path.join(dir, "style.css"),
  ];
  for (const candidate of candidates) {
    try {
      await readFile(candidate, "utf8");
      return candidate;
    } catch {
      // Try the next style naming convention.
    }
  }
  return null;
}

async function buildComponent(vueFile) {
  const componentName = path.basename(vueFile, ".vue");
  const vueText = await readFile(vueFile, "utf8");
  const styleFile = await findStyleFile(vueFile, componentName);
  const styleText = styleFile ? await readFile(styleFile, "utf8") : "";
  const className =
    vueText.match(/['"`](du-[a-z0-9-]+)['"`]/i)?.[1] ||
    styleText.match(/\.(du-[a-z0-9-]+)/i)?.[1] ||
    cssClassFromName(componentName);

  const tokenNames = uniq([...extractCssVars(vueText), ...extractCssVars(styleText)]);
  return {
    name: componentName,
    package: "dangoui",
    className,
    sourcePath: relativeToPackage(vueFile),
    stylePath: styleFile ? relativeToPackage(styleFile) : null,
    description: extractDescription(vueText, componentName),
    props: extractProps(vueText),
    tokens: Object.fromEntries(tokenNames.map((token) => [token.replace(/^--du-/, ""), token])),
  };
}

const packageJson = JSON.parse(await readFile(packageJsonFile, "utf8"));
const themeCss = await readFile(themeFile, "utf8");
const vueFiles = await walk(srcRoot, (filePath) => filePath.endsWith(".vue"));
const components = (await Promise.all(vueFiles.map(buildComponent))).sort((a, b) =>
  a.name.localeCompare(b.name),
);

const catalog = {
  source: {
    package: packageJson.name,
    version: packageJson.version,
    generatedFrom: [relativeToPackage(themeFile), "src/**/*.vue", "src/**/*.scss"],
  },
  tokens: extractThemeTokens(themeCss),
  components,
  missingComponents: [
    {
      name: "TabBar",
      reason: "The current demo has a bottom navigation target, but dangoui@3.6.16 does not ship a TabBar component. It only ships Tabs/Tab for horizontal content switching.",
      status: "needs-user-supplied-schema",
    },
  ],
};

await mkdir(path.dirname(outputFile), { recursive: true });
await writeFile(outputFile, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(
  `Generated ${catalog.components.length} components and ${catalog.tokens.length} tokens -> ${outputFile}`,
);
