import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "skills", "brand");
const claudeTarget = path.join(root, ".claude", "skills", "brand");

if (!fs.existsSync(path.join(source, "SKILL.md"))) {
  console.error("Missing source skill: skills/brand/SKILL.md");
  process.exit(1);
}

syncDirectory(source, claudeTarget);
console.log(`Synced ${path.relative(root, source)} -> ${path.relative(root, claudeTarget)}`);

function syncDirectory(from, to) {
  fs.mkdirSync(to, { recursive: true });
  removeExtraneousFiles(from, to);

  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const sourcePath = path.join(from, entry.name);
    const targetPath = path.join(to, entry.name);

    if (entry.isDirectory()) {
      syncDirectory(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function removeExtraneousFiles(from, to) {
  for (const entry of fs.readdirSync(to, { withFileTypes: true })) {
    const sourcePath = path.join(from, entry.name);
    const targetPath = path.join(to, entry.name);

    if (!fs.existsSync(sourcePath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
  }
}
