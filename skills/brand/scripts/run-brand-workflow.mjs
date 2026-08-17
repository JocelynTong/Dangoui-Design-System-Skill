#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const rawArgs = process.argv.slice(2);
const command = rawArgs[0];

if (!command || ["-h", "--help", "help"].includes(command)) {
  printHelp();
  process.exit(command ? 0 : 1);
}

if (!["run", "plan", "status", "tpp"].includes(command)) {
  fail(`Unknown command: ${command}`);
}

const mode = resolveWorkflowMode(rawArgs.slice(1));
const root = opt(rawArgs, "--root", process.cwd());
const brand = resolveBrand(rawArgs.slice(1));
const contract = runBrandGuard(root, ["workflow-contract", "--mode", mode], { allowFailure: false });
const workflowDefinition = contract?.workflowContract?.workflows?.[mode] || null;
const guardCommands = buildGuardCommands(mode, rawArgs.slice(1));
const executed = [];

if (command === "plan") {
  const outputAudit = auditWorkflowOutputs({ root, mode, brand });
  process.stdout.write(`${JSON.stringify({
    ok: true,
    command,
    workflow: mode,
    brand,
    root,
    workflowContract: contract,
    workflowDefinition,
    resolvedInputs: {
      sourceUrl: opt(rawArgs, "--source-url", ""),
      hostTarget: opt(rawArgs, "--host-target", "") || opt(rawArgs, "--host-target-or-plan", ""),
      planFile: opt(rawArgs, "--plan-file", ""),
    },
    progress: buildProgressSummary({ mode, outputAudit, executed: [] }),
    howToTest: buildHowToTest({ mode, brand }),
    message: "Workflow plan generated. This command only shows the resolved flow and current missing outputs.",
  }, null, 2)}\n`);
  process.exit(0);
}

for (const args of guardCommands) {
  const result = runBrandGuard(root, args, { allowFailure: true });
  executed.push({
    command: `node skills/brand/scripts/brand-guard.mjs ${args.join(" ")}`,
    exitCode: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  });
  if (result.status !== 0) {
    const payload = safeParseJson(result.stdout);
    const blockingSummary = summarizeBlockingResult(payload);
    process.stdout.write(`${JSON.stringify({
      ok: false,
      workflow: mode,
      root,
      workflowContract: contract,
      failedCommand: executed[executed.length - 1].command,
      blockingResult: payload || null,
      blockingSummary,
      acceptanceReport: {
        entry: "run-brand-workflow",
        mode,
        verdict: blockingSummary.verdict,
        summary: blockingSummary.reason,
        checklist: blockingSummary.missingChecklist,
        blockingPrinciples: blockingSummary.blockingPrinciples,
        nextFixes: blockingSummary.nextFixes,
      },
      stderr: result.stderr || "",
      executed,
      message: "Brand workflow stopped by TPP gate. Fix the blocking items before continuing.",
    }, null, 2)}\n`);
    process.exit(result.status || 1);
  }
}

if (command === "tpp") {
  process.stdout.write(`${JSON.stringify({
    ok: true,
    command,
    workflow: mode,
    brand,
    root,
    workflowContract: contract,
    workflowDefinition,
    executed,
    verdict: "passed",
    acceptanceReport: {
      entry: "run-brand-workflow",
      mode,
      verdict: "passed",
      summary: "TPP gate passed through the /brand total-entry workflow.",
      checklist: [],
      blockingPrinciples: [],
      nextFixes: [],
    },
    message: "TPP gate passed through the /brand total-entry workflow.",
  }, null, 2)}\n`);
  process.exit(0);
}

const outputAudit = auditWorkflowOutputs({ root, mode, brand });
const completed = outputAudit.missingOutputs.length === 0;
const progress = buildProgressSummary({ mode, outputAudit, executed });

process.stdout.write(`${JSON.stringify({
  ok: true,
  command,
  workflow: mode,
  brand,
  root,
  workflowContract: contract,
  workflowDefinition,
  executed,
  completed,
  progress,
  stepStatus: outputAudit.stepStatus,
  outputStatus: outputAudit.outputStatus,
  completedStages: outputAudit.completedStages,
  missingOutputs: outputAudit.missingOutputs,
  nextAction: outputAudit.nextAction,
  previewArtifacts: outputAudit.previewArtifacts,
  howToTest: buildHowToTest({ mode, brand }),
  message: completed
    ? "Brand workflow gate passed and the expected outputs are present."
    : "Brand workflow gate passed, but the expected outputs are still incomplete. Keep going until the missing outputs are generated.",
}, null, 2)}\n`);

function buildGuardCommands(modeName, passthroughArgs) {
  const filtered = stripCommandOnlyArgs(passthroughArgs);
  const commands = [];

  if (modeName === "apply-host" && opt(filtered, "--plan-file", "")) {
    commands.push(["validate-intent", ...filtered]);
  }

  commands.push(["tpp-test", "--mode", modeName, ...filtered]);
  return commands;
}

function stripCommandOnlyArgs(args) {
  const names = new Set(["--root", "--mode"]);
  const output = [];
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (names.has(token)) {
      index += 1;
      continue;
    }
    output.push(token);
  }
  return output;
}

function resolveWorkflowMode(args) {
  const explicit = opt(args, "--mode", "");
  if (explicit) {
    if (!["learn-brand", "apply-host"].includes(explicit)) {
      fail(`Unsupported workflow mode: ${explicit}`);
    }
    return explicit;
  }

  const hostTarget = opt(args, "--host-target", "") || opt(args, "--host-target-or-plan", "");
  const planFile = opt(args, "--plan-file", "");
  return hostTarget || planFile ? "apply-host" : "learn-brand";
}

function resolveBrand(args) {
  return opt(args, "--brand", "") || inferBrandFromSource(opt(args, "--source-url", ""));
}

function runBrandGuard(root, guardArgs, options = {}) {
  const result = spawnSync("node", ["skills/brand/scripts/brand-guard.mjs", ...guardArgs], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      BRAND_WORKFLOW_ENTRY: "run-brand-workflow",
      BRAND_WORKFLOW_MODE: mode,
    },
  });
  if (!options.allowFailure && result.status !== 0) {
    fail(result.stderr || result.stdout || `brand-guard failed: ${guardArgs.join(" ")}`);
  }
  return result;
}

function safeParseJson(text) {
  try {
    return JSON.parse(String(text || ""));
  } catch {
    return null;
  }
}

function summarizeBlockingResult(payload) {
  if (!payload || typeof payload !== "object") {
    return {
      verdict: "blocked",
      reason: "TPP gate returned a non-JSON result.",
      blockingPrinciples: [],
      missingChecklist: [],
      nextFixes: [],
    };
  }

  const checklist = Array.isArray(payload.acceptanceChecklist) ? payload.acceptanceChecklist : [];
  const workflowAudit = payload.workflowAudit && typeof payload.workflowAudit === "object"
    ? payload.workflowAudit
    : {};
  const blockingPrinciples = Array.isArray(payload.blockingPrinciples)
    ? payload.blockingPrinciples
    : Array.isArray(payload.blocking)
      ? payload.blocking
      : [];

  const missingChecklist = checklist
    .filter((item) => item?.required && item?.status !== "complete")
    .map((item) => ({
      id: item.id,
      label: item.label,
      why: item.why || "",
      fix: item.fix || "",
    }));

  const nextFixes = dedupe(
    [
      ...missingChecklist.map((item) => item.fix).filter(Boolean),
      ...blockingPrinciples.map((item) => item?.fix).filter(Boolean),
    ],
  );

  return {
    verdict: workflowAudit.verdict || payload.verdict || "blocked",
    reason: payload.message || workflowAudit.summary || "TPP gate blocked the workflow.",
    mode: workflowAudit.resolvedMode || payload.workflow || "",
    blockingPrinciples: blockingPrinciples.map((item) => ({
      id: item?.id || item?.principle || "",
      title: item?.title || "",
      reason: item?.reason || "",
      message: item?.message || "",
      fix: item?.fix || "",
    })),
    missingChecklist,
    nextFixes,
  };
}

function dedupe(items) {
  return [...new Set(items)];
}

function buildProgressSummary({ mode, outputAudit, executed }) {
  const stepStatus = outputAudit?.stepStatus || {};
  const entries = Object.entries(stepStatus);
  const completedSteps = entries
    .filter(([, status]) => status === "complete")
    .map(([step]) => step);
  const remainingSteps = entries
    .filter(([, status]) => status !== "complete")
    .map(([step]) => step);

  return {
    mode,
    totalStepCount: entries.length,
    completedStepCount: completedSteps.length,
    remainingStepCount: remainingSteps.length,
    completedSteps,
    remainingSteps,
    lastExecutedGuards: Array.isArray(executed) ? executed.map((item) => item.command) : [],
  };
}

function buildHowToTest({ mode, brand }) {
  const brandArgs = brand ? ` --brand ${brand}` : "";
  return {
    plan: `node skills/brand/scripts/run-brand-workflow.mjs plan --mode ${mode}${brandArgs}`,
    tpp: `node skills/brand/scripts/run-brand-workflow.mjs tpp --mode ${mode}${brandArgs}`,
    status: `node skills/brand/scripts/run-brand-workflow.mjs status --mode ${mode}${brandArgs}`,
    run: `node skills/brand/scripts/run-brand-workflow.mjs run --mode ${mode}${brandArgs}`,
  };
}

function auditWorkflowOutputs({ root, mode, brand }) {
  const migrationDir = brand ? path.join(root, "migrations", brand) : "";
  const previewFile = brand ? path.join(root, "public", "brand-previews", `${brand}.json`) : "";
  const previewRegistry = path.join(root, "public", "brand-previews", "registry.json");
  const files = {
    brandMod: migrationDir ? path.join(migrationDir, "brand-mod.json") : "",
    brandEvidence: migrationDir ? path.join(migrationDir, "brand-evidence.json") : "",
    actionEvidence: migrationDir ? path.join(migrationDir, "action-evidence-score.skills.json") : "",
    dembrandt: migrationDir ? path.join(migrationDir, "third-party-evidence.dembrandt.json") : "",
    dangouiAdapter: migrationDir ? path.join(migrationDir, "dangoui-adapter.json") : "",
    previewGate: migrationDir ? path.join(migrationDir, "preview-gate.json") : "",
    computedEvidence: migrationDir ? path.join(migrationDir, "computed-evidence.json") : "",
    visualQuality: migrationDir ? path.join(migrationDir, "visual-quality-report.json") : "",
    componentMapping: migrationDir ? path.join(migrationDir, "component-mapping.json") : "",
    previewFile,
  };
  const exists = Object.fromEntries(
    Object.entries(files).map(([key, value]) => [key, Boolean(value) && fs.existsSync(value)]),
  );
  const registryHasBrand = brand ? previewRegistryIncludes(previewRegistry, brand) : false;

  if (mode === "learn-brand") {
    const outputStatus = [
      {
        key: "brand-mod.json",
        status: exists.brandMod ? "complete" : "missing",
        file: rel(root, files.brandMod),
      },
      {
        key: "brand-evidence.json",
        status: exists.brandEvidence ? "complete" : "missing",
        file: rel(root, files.brandEvidence),
      },
      {
        key: "dangoui-adapter.json",
        status: exists.dangouiAdapter ? "complete" : "missing",
        file: rel(root, files.dangouiAdapter),
      },
      {
        key: "demo-preview",
        status: exists.previewFile && registryHasBrand ? "complete" : "missing",
        file: rel(root, files.previewFile),
      },
    ];
    const missingOutputs = outputStatus.filter((item) => item.status !== "complete").map((item) => item.key);
    return {
      stepStatus: {
        "extract-third-party": exists.dembrandt ? "complete" : "pending",
        "normalize-dtcg": exists.brandMod ? "complete" : "pending",
        "collect-brand-evidence": exists.brandEvidence && exists.actionEvidence ? "complete" : "pending",
        "tpp-test": "complete",
        "map-to-dangoui": exists.dangouiAdapter ? "complete" : "pending",
        "emit-demo-preview": exists.previewFile && registryHasBrand ? "complete" : "pending",
      },
      outputStatus,
      completedStages: outputStatus.filter((item) => item.status === "complete").map((item) => item.key),
      missingOutputs,
      nextAction: missingOutputs[0]
        ? `Generate ${missingOutputs[0]} before treating this brand as learned.`
        : "Ready to use this learned brand in demo preview or host apply.",
      previewArtifacts: {
        previewFile: rel(root, files.previewFile),
        registry: rel(root, previewRegistry),
      },
    };
  }

  const outputStatus = [
    {
      key: "coverage-level",
      status: exists.previewGate ? "complete" : "missing",
      file: rel(root, files.previewGate),
    },
    {
      key: "computed-verification-result",
      status: exists.computedEvidence || exists.visualQuality ? "complete" : "missing",
      file: rel(root, exists.computedEvidence ? files.computedEvidence : files.visualQuality),
    },
    {
      key: "host-project-preview-url",
      status: exists.previewFile && registryHasBrand ? "complete" : "missing",
      file: rel(root, files.previewFile),
    },
  ];
  const missingOutputs = outputStatus.filter((item) => item.status !== "complete").map((item) => item.key);
  return {
    stepStatus: {
      "load-existing-mod": exists.brandMod || exists.brandEvidence ? "complete" : "pending",
      "diagnose-host": "complete",
      "tpp-test": "complete",
      "map-to-dangoui": exists.dangouiAdapter || exists.componentMapping ? "complete" : "pending",
      "apply-preview": missingOutputs.length === 0 ? "complete" : "pending",
    },
    outputStatus,
    completedStages: outputStatus.filter((item) => item.status === "complete").map((item) => item.key),
    missingOutputs,
    nextAction: missingOutputs[0]
      ? `Complete ${missingOutputs[0]} before calling the host-apply flow finished.`
      : "Host apply preview is ready for review.",
    previewArtifacts: {
      previewFile: rel(root, files.previewFile),
      previewGate: rel(root, files.previewGate),
      computedEvidence: rel(root, files.computedEvidence),
    },
  };
}

function previewRegistryIncludes(registryFile, brand) {
  if (!brand || !fs.existsSync(registryFile)) return false;
  try {
    const json = JSON.parse(fs.readFileSync(registryFile, "utf8"));
    const items = Array.isArray(json)
      ? json
      : Array.isArray(json?.brands)
        ? json.brands
        : Array.isArray(json?.items)
          ? json.items
          : [];
    return items.some((item) => item?.id === brand);
  } catch {
    return false;
  }
}

function inferBrandFromSource(sourceUrl) {
  if (!sourceUrl) return "";
  try {
    const url = new URL(sourceUrl);
    const host = url.hostname.replace(/^www\./, "");
    const lastPath = url.pathname.split("/").filter(Boolean).at(-1) || "";
    return sanitizeBrandKey(lastPath || host.split(".")[0] || "");
  } catch {
    return "";
  }
}

function sanitizeBrandKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function rel(root, file) {
  return file ? path.relative(root, file) : "";
}

function opt(args, name, fallback) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) return fallback;
  return args[index + 1];
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function printHelp() {
  const cwd = process.cwd();
  const script = path.relative(cwd, new URL(import.meta.url).pathname);
  const contractPath = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "workflow-contract.json");
  const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  const workflows = Object.keys(contract.workflows).join(", ");
  console.log(`run-brand-workflow

Usage:
  node ${script} run --brand pokemon30 --source-url "https://pokemon30th.com/"
  node ${script} run --brand pokemon30 --source-url "https://pokemon30th.com/" --host-target src/pages/home/index.vue --plan-file plan.json
  node ${script} status --mode learn-brand --brand pokemon30
  node ${script} tpp --mode learn-brand --brand pokemon30 --source-url "https://pokemon30th.com/"
  node ${script} plan --mode learn-brand --brand pokemon30 --source-url "https://pokemon30th.com/"

Behavior:
  - resolves workflow mode automatically (${workflows})
  - \`plan\` only shows the resolved workflow and current missing outputs
  - \`tpp\` only verifies the blocking gate through total-entry
  - \`run\` verifies the gate and audits expected workflow outputs
  - \`status\` reuses the audit output so you can quickly see how many steps are left
  - any real execution must go through this total-entry wrapper
`);
}
