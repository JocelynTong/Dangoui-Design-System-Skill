import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const skillsRoot = path.join(root, "skills");
const claudeSkillsRoot = path.join(root, ".claude", "skills");

if (!fs.existsSync(skillsRoot)) {
  console.error("Missing skills directory");
  process.exit(1);
}

for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const source = path.join(skillsRoot, entry.name);
  const claudeTarget = path.join(claudeSkillsRoot, entry.name);

  if (!fs.existsSync(path.join(source, "SKILL.md"))) continue;

  syncDirectory(source, claudeTarget);
  console.log(`Synced ${path.relative(root, source)} -> ${path.relative(root, claudeTarget)}`);
}

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
