/**
 * Bid-Master v4 — Subagent Pipeline (Advanced)
 *
 * Uses the Claude Agent SDK's native subagent system to run Phase 2a
 * and Phase 3 as defined agents within a single orchestrator.
 *
 * Features:
 *   - Automatic failure recovery (re-runs Phase 2a with gate feedback)
 *   - Configurable retry count
 *   - Isolated context windows per phase
 *   - Session persistence between retries
 *
 * Usage:
 *   npx tsx agents/pipeline-subagent.ts --contract <path> [--retries 2]
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { IMPLEMENTATION_PROMPT } from "./prompts/phase2a-implementation";
import { buildMergeGatePrompt } from "./prompts/phase3-merge-gate";
import { readFileSync } from "fs";
import { resolve, basename } from "path";

function parseArgs() {
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
    console.error("Usage: npx tsx agents/pipeline-subagent.ts --contract <path> [--retries N]");
    process.exit(1);
  }

  const repoRoot = flags["repo"] || process.cwd();
  const maxRetries = parseInt(flags["retries"] || "2", 10);
  const contractFilename = basename(contractPath, ".md");
  const taskIdMatch = contractFilename.match(/^(S\d+-\d+)/i);
  const taskId = taskIdMatch ? taskIdMatch[1].toUpperCase() : contractFilename;
  const sprintMatch = taskId.match(/^S(\d+)/i);
  const sprintPhase = sprintMatch ? `s${sprintMatch[1]}` : "s0";

  return {
    contractPath: resolve(contractPath),
    repoRoot: resolve(repoRoot),
    sprintPhase,
    taskId,
    maxRetries,
  };
}

async function main() {
  const config = parseArgs();
  const contractContent = readFileSync(config.contractPath, "utf-8");

  const mergeGatePromptText = buildMergeGatePrompt(
    config.taskId,
    config.contractPath,
    config.sprintPhase
  );

  // Build the orchestrator prompt that tells Claude how to run the pipeline
  const orchestratorPrompt = `You are a pipeline orchestrator for bid-master-v4.

You will execute a two-phase pipeline. Use the subagents defined below.

CONTRACT FILE: ${config.contractPath}
TASK ID: ${config.taskId}

═══ PHASE 1: Run the "implementor" agent ═══
Pass it the task contract content below. It will read context files, write code, and run verification.

═══ PHASE 2: Run the "validator" agent ═══
After the implementor finishes, run the validator to check all 10 automated gates plus constitution compliance.

═══ FAILURE RECOVERY ═══
If the validator reports FAIL:
1. Read the gate report's Re-Run Appendix
2. Re-run the implementor agent with the original contract PLUS the Re-Run Appendix appended
3. Re-run the validator
4. Maximum ${config.maxRetries} retry cycles. After that, report final status.

═══ TASK CONTRACT ═══
${contractContent}

Begin now. Run the implementor agent first.`;

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  BID-MASTER v4 — SUBAGENT PIPELINE           ║");
  console.log(`║  Task: ${config.taskId.padEnd(39)}║`);
  console.log(`║  Max retries: ${String(config.maxRetries).padEnd(32)}║`);
  console.log("╚══════════════════════════════════════════════╝\n");

  for await (const message of query({
    prompt: orchestratorPrompt,
    options: {
      allowedTools: ["Read", "Edit", "Write", "Bash", "Glob", "Grep", "Task"],
      permissionMode: "acceptEdits",
      maxTurns: 200,
      cwd: config.repoRoot,
      agents: {
        implementor: {
          description:
            "Contract-bound implementation agent. Executes one task contract, writes only the files specified, follows strict line limits and layer boundaries.",
          prompt: IMPLEMENTATION_PROMPT,
          tools: ["Read", "Edit", "Write", "Bash", "Glob", "Grep"],
        },
        validator: {
          description:
            "Merge gate validator. Runs 10-point automated checks plus constitution compliance against a task contract. Produces a gate report.",
          prompt: mergeGatePromptText,
          tools: ["Read", "Glob", "Grep", "Bash", "Write"],
        },
      },
    },
  })) {
    if (message.type === "assistant" && message.message?.content) {
      for (const block of message.message.content) {
        if ("text" in block) {
          process.stdout.write(block.text as string);
        } else if ("name" in block) {
          console.log(`\n  → ${block.name}`);
        }
      }
    }

    if ("result" in message) {
      console.log("\n\n═══ PIPELINE COMPLETE ═══");
      console.log((message as any).result || "");
    }
  }
}

main().catch((err) => {
  console.error("Pipeline error:", err);
  process.exit(1);
});
