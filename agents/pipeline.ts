/**
 * Bid-Master v4 — Sequential Agent Pipeline
 *
 * Orchestrates two phases in sequence using the Claude Agent SDK:
 *   Phase 2a: Implementation Agent — executes a task contract
 *   Phase 3:  Merge Gate Validator — validates the agent's output
 *
 * Usage:
 *   npx tsx agents/pipeline.ts --contract <path-to-task-contract>
 *
 * Requirements:
 *   npm install @anthropic-ai/claude-agent-sdk
 *   export ANTHROPIC_API_KEY=your-key
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { IMPLEMENTATION_PROMPT } from "./prompts/phase2a-implementation";
import { buildMergeGatePrompt } from "./prompts/phase3-merge-gate";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, basename } from "path";

// ─── Configuration ───────────────────────────────────────────────

interface PipelineConfig {
  /** Absolute path to the task contract markdown file */
  contractPath: string;
  /** Repository root (defaults to cwd) */
  repoRoot: string;
  /** Sprint phase identifier, e.g. "s3" */
  sprintPhase: string;
  /** Task ID extracted from contract filename, e.g. "S3-003" */
  taskId: string;
  /** Maximum agentic turns per phase */
  maxTurns: number;
  /** Whether to run Phase 3 automatically after Phase 2a */
  autoValidate: boolean;
}

// ─── CLI Argument Parsing ────────────────────────────────────────

function parseArgs(): PipelineConfig {
  const args = process.argv.slice(2);
  const flags: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length) {
      flags[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }

  const contractPath = flags["contract"];
  if (!contractPath) {
    console.error("Usage: npx tsx agents/pipeline.ts --contract <path>");
    console.error("");
    console.error("Options:");
    console.error("  --contract    Path to task contract file (required)");
    console.error("  --repo        Repository root (default: cwd)");
    console.error("  --max-turns   Max agentic turns per phase (default: 80)");
    console.error("  --phase-only  Run only '2a' or '3' (default: both)");
    process.exit(1);
  }

  const repoRoot = flags["repo"] || process.cwd();
  const maxTurns = parseInt(flags["max-turns"] || "80", 10);
  const phaseOnly = flags["phase-only"];

  // Extract task ID from contract filename (e.g., "S3-003-documents-list.md" → "S3-003")
  const contractFilename = basename(contractPath, ".md");
  const taskIdMatch = contractFilename.match(/^(S\d+-\d+)/i);
  const taskId = taskIdMatch ? taskIdMatch[1].toUpperCase() : contractFilename;

  // Extract sprint phase from task ID (e.g., "S3-003" → "s3")
  const sprintMatch = taskId.match(/^S(\d+)/i);
  const sprintPhase = sprintMatch ? `s${sprintMatch[1]}` : "s0";

  return {
    contractPath: resolve(contractPath),
    repoRoot: resolve(repoRoot),
    sprintPhase,
    taskId,
    maxTurns,
    autoValidate: phaseOnly !== "2a",
  };
}

// ─── Phase 2a: Implementation Agent ──────────────────────────────

async function runImplementationAgent(config: PipelineConfig): Promise<{
  sessionId: string | undefined;
  success: boolean;
  producedFiles: string[];
}> {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║  PHASE 2a: IMPLEMENTATION AGENT              ║");
  console.log(`║  Task: ${config.taskId.padEnd(38)}║`);
  console.log("╚══════════════════════════════════════════════╝\n");

  const contractContent = readFileSync(config.contractPath, "utf-8");

  const prompt = `${IMPLEMENTATION_PROMPT}

═══════════════════════════════════════════════
TASK CONTRACT
═══════════════════════════════════════════════

${contractContent}`;

  let sessionId: string | undefined;
  let lastResult = "";
  const producedFiles: string[] = [];

  for await (const message of query({
    prompt,
    options: {
      allowedTools: ["Read", "Edit", "Write", "Bash", "Glob", "Grep"],
      permissionMode: "acceptEdits",
      maxTurns: config.maxTurns,
      cwd: config.repoRoot,
      systemPrompt: `You are a contract-bound implementation agent for bid-master-v4. You execute exactly one task contract. You have zero architectural authority. Repository root: ${config.repoRoot}. Branch: main.`,
    },
  })) {
    // Capture session ID for potential resume
    if (message.type === "system" && "subtype" in message && message.subtype === "init") {
      sessionId = (message as any).session_id;
    }

    // Stream assistant messages to console
    if (message.type === "assistant" && message.message?.content) {
      for (const block of message.message.content) {
        if ("text" in block) {
          process.stdout.write(block.text as string);
        } else if ("name" in block) {
          console.log(`\n  → Tool: ${block.name}`);
        }
      }
    }

    // Capture result
    if ("result" in message) {
      lastResult = (message as any).result || "";
    }
  }

  console.log("\n\n─── Phase 2a Complete ───\n");

  return {
    sessionId,
    success: true,
    producedFiles,
  };
}

// ─── Phase 3: Merge Gate Validator ───────────────────────────────

async function runMergeGateValidator(config: PipelineConfig): Promise<{
  passed: boolean;
  reportPath: string;
}> {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║  PHASE 3: MERGE GATE VALIDATOR               ║");
  console.log(`║  Validating: ${config.taskId.padEnd(33)}║`);
  console.log("╚══════════════════════════════════════════════╝\n");

  const prompt = buildMergeGatePrompt(config.taskId, config.contractPath, config.sprintPhase);

  // Ensure gate-reports directory exists
  const gateReportsDir = resolve(
    config.repoRoot,
    `tasks/sprint-${config.sprintPhase}/gate-reports`
  );
  mkdirSync(gateReportsDir, { recursive: true });

  const expectedReportPath = resolve(gateReportsDir, `${config.taskId}-gate.md`);
  let passed = false;

  for await (const message of query({
    prompt,
    options: {
      allowedTools: ["Read", "Glob", "Grep", "Bash", "Write"],
      permissionMode: "acceptEdits",
      maxTurns: config.maxTurns,
      cwd: config.repoRoot,
      systemPrompt: `You are a merge gate validator for bid-master-v4. You validate agent output against task contracts. You have ZERO authority to modify code. Read-only analysis only, except for writing the gate report file. Repository root: ${config.repoRoot}.`,
    },
  })) {
    if (message.type === "assistant" && message.message?.content) {
      for (const block of message.message.content) {
        if ("text" in block) {
          process.stdout.write(block.text as string);
        } else if ("name" in block) {
          console.log(`\n  → Tool: ${block.name}`);
        }
      }
    }

    if ("result" in message) {
      const result = String((message as any).result || "");
      passed = result.includes("PASS") && !result.includes("FAIL");
    }
  }

  console.log("\n\n─── Phase 3 Complete ───\n");

  return {
    passed,
    reportPath: expectedReportPath,
  };
}

// ─── Pipeline Orchestrator ───────────────────────────────────────

async function main() {
  const config = parseArgs();

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  BID-MASTER v4 — AGENT PIPELINE              ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log(`║  Contract: ${basename(config.contractPath).padEnd(35)}║`);
  console.log(`║  Task ID:  ${config.taskId.padEnd(35)}║`);
  console.log(`║  Sprint:   ${config.sprintPhase.padEnd(35)}║`);
  console.log(`║  Repo:     ${config.repoRoot.slice(-35).padEnd(35)}║`);
  console.log("╚══════════════════════════════════════════════╝");

  // ── Phase 2a ──
  const implResult = await runImplementationAgent(config);
  console.log(`Phase 2a session: ${implResult.sessionId || "unknown"}`);

  if (!config.autoValidate) {
    console.log("\n--phase-only=2a specified. Stopping before validation.");
    console.log("Run with --phase-only 3 to validate separately.");
    return;
  }

  // ── Phase 3 ──
  const gateResult = await runMergeGateValidator(config);

  // ── Summary ──
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║  PIPELINE SUMMARY                            ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log(`║  Phase 2a: COMPLETE                          ║`);
  console.log(`║  Phase 3:  ${(gateResult.passed ? "PASS ✓" : "FAIL ✗").padEnd(35)}║`);
  console.log(`║  Report:   ${basename(gateResult.reportPath).padEnd(35)}║`);
  console.log("╚══════════════════════════════════════════════╝");

  if (!gateResult.passed) {
    console.log("\nGate FAILED. Review the report and re-run with corrections:");
    console.log(`  cat ${gateResult.reportPath}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Pipeline error:", err);
  process.exit(1);
});
