/**
 * NemoClawSession — Neural Experimental Multi-Objective AI Agent
 *
 * Designed for deep reasoning and complex analysis:
 *   - Default model: o4-mini (OpenAI reasoning) or deepseek-r1 (free)
 *   - Extended thinking: Chain-of-thought reasoning before responding
 *   - Max tokens: 16384 (long-form reasoning + output)
 *   - Max parallel: 5 (deep, high-quality calls vs many cheap calls)
 *   - Best for: complex debugging, research, architecture decisions, long analysis
 *
 * On Cloudflare: uses @cf/deepseek-ai/deepseek-r1-distill-qwen-32b (FREE, reasoning)
 * Local: uses o4-mini via OpenAI Replit proxy, or groq/deepseek-r1-distill-llama-70b
 */

import type { WebSocket } from "ws";
import { chatComplete, streamChat } from "../lib/providerRouter.js";
import { detectProvider, PROVIDER_MAP } from "../lib/providerConfig.js";
import { AGENTIC_WORKFLOWS } from "./RealAgentSession.js";
import { loadSkillsForAgent, saveSkill, formatSkillsForPrompt } from "../lib/skillsManager.js";

const NEMO_DEFAULT_MODEL = "o4-mini";
const NEMO_MAX_TOKENS = 16384;
const NEMO_MAX_PARALLEL = 5;
const NEMO_VERSION = "NemoClaw v1.0 — Neural Experimental Multi-Objective reasoning agent";

export interface TerminalMessage {
  type: "output" | "token" | "system" | "error" | "task_start" | "task_complete" | "pong";
  data?: string;
  taskId?: string;
  timeMs?: number;
  tokens?: number;
  isolateId?: string;
}

function send(ws: WebSocket, msg: TerminalMessage): void {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function genId(): string {
  return "nemo-" + Math.random().toString(36).slice(2, 8);
}

function writePrompt(ws: WebSocket): void {
  send(ws, { type: "output", data: "\x1b[35mnemo@openclaw:~$\x1b[0m " });
}

function providerLabel(model: string): string {
  const id = detectProvider(model);
  const def = PROVIDER_MAP[id];
  return def ? def.name : id;
}

export class NemoClawSession {
  readonly sessionId: string;
  private model: string = NEMO_DEFAULT_MODEL;
  private memory: Map<string, string> = new Map();
  private history: Array<{ role: "user" | "assistant"; content: string }> = [];
  private connections: Set<WebSocket> = new Set();
  private thinkingMode = true;

  constructor(sessionId: string, modelOverride?: string) {
    this.sessionId = sessionId;
    if (modelOverride) this.model = modelOverride;

    this.memory.set("PROFILE", `agent: NemoClaw\noptimized_for: deep_reasoning + complex_analysis\nthinking_mode: enabled\nmax_tokens: ${NEMO_MAX_TOKENS}`);
    this.memory.set("SKILLS", [
      "deep_reasoning: Chain-of-thought analysis for complex problems",
      "architecture_review: System design and trade-off analysis",
      "research_synthesis: Multi-source research and citation",
      "code_audit: Deep security and performance analysis",
      "hypothesis_testing: Propose → test → evaluate → iterate",
      "long_form_writing: Detailed reports, documentation, specs",
    ].join("\n"));
    this.memory.set("REASONING_APPROACH", `
When given a problem, I:
1. Break it into components
2. Analyze each with chain-of-thought
3. Consider alternatives and trade-offs
4. Synthesize a comprehensive answer
5. Validate my reasoning
`);
  }

  onConnect(ws: WebSocket): void {
    this.connections.add(ws);
    send(ws, {
      type: "system",
      data: [
        `\x1b[35m╔══════════════════════════════════════════════════╗\x1b[0m`,
        `\x1b[35m║\x1b[0m  \x1b[1mNemoClaw\x1b[0m — Reasoning AI Agent              \x1b[35m║\x1b[0m`,
        `\x1b[35m╚══════════════════════════════════════════════════╝\x1b[0m`,
        `\x1b[90mSession:   ${this.sessionId}\x1b[0m`,
        `\x1b[90mModel:     ${this.model}\x1b[0m`,
        `\x1b[90mProvider:  ${providerLabel(this.model)}\x1b[0m`,
        `\x1b[90mMode:      Deep reasoning · ${NEMO_MAX_TOKENS} tok · ${NEMO_MAX_PARALLEL} parallel max\x1b[0m`,
        `\x1b[90mThinking:  Chain-of-thought enabled\x1b[0m`,
        ``,
        `Optimized for complex problems. Type \x1b[33mhelp\x1b[0m for commands.`,
        `\x1b[90mNote: NemoClaw takes longer but reasons deeply.\x1b[0m`,
      ].join("\n"),
    });
    writePrompt(ws);
  }

  onClose(ws: WebSocket): void {
    this.connections.delete(ws);
  }

  async onMessage(ws: WebSocket, raw: string): Promise<void> {
    let msg: { type: string; data?: string };
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === "ping") { send(ws, { type: "pong" }); return; }
    if (msg.type === "input" && msg.data !== undefined) {
      await this.route(ws, msg.data);
    }
  }

  private async route(ws: WebSocket, raw: string): Promise<void> {
    const cmd = raw.trim();
    if (!cmd) { writePrompt(ws); return; }
    const lower = cmd.toLowerCase();

    send(ws, { type: "output", data: `\x1b[35mnemo@openclaw:~$\x1b[0m ${cmd}` });

    if (lower === "help") { this.sendHelp(ws); writePrompt(ws); return; }
    if (lower === "clear") {
      this.history = [];
      send(ws, { type: "system", data: "Context cleared." });
      writePrompt(ws); return;
    }
    if (lower === "status") { this.sendStatus(ws); writePrompt(ws); return; }
    if (lower === "whoami") { this.sendWhoami(ws); writePrompt(ws); return; }
    if (lower === "memory") { this.sendMemory(ws); writePrompt(ws); return; }
    if (lower === "history") { this.sendHistory(ws); writePrompt(ws); return; }
    if (lower === "version") { send(ws, { type: "output", data: NEMO_VERSION }); writePrompt(ws); return; }
    if (lower === "thinking on") { this.thinkingMode = true; send(ws, { type: "system", data: "\x1b[35m✓ Chain-of-thought reasoning enabled.\x1b[0m" }); writePrompt(ws); return; }
    if (lower === "thinking off") { this.thinkingMode = false; send(ws, { type: "system", data: "\x1b[90m✓ Thinking mode disabled.\x1b[0m" }); writePrompt(ws); return; }
    if (lower.startsWith("ping")) {
      send(ws, { type: "output", data: "\x1b[31mping: network isolated (globalOutbound: null)\x1b[0m" });
      writePrompt(ws); return;
    }
    if (lower.startsWith("remember ")) {
      const rest = cmd.slice(9);
      const ci = rest.indexOf(":");
      if (ci > 0) {
        this.memory.set(rest.slice(0, ci).trim().toUpperCase(), rest.slice(ci + 1).trim());
        send(ws, { type: "system", data: `\x1b[35m✓ Memory updated.\x1b[0m` });
      } else {
        send(ws, { type: "error", data: "Usage: remember <key>: <value>" });
      }
      writePrompt(ws); return;
    }
    if (lower.startsWith("model ")) {
      this.model = cmd.slice(6).trim();
      send(ws, { type: "system", data: `\x1b[35m✓ Model: ${this.model} (${providerLabel(this.model)})\x1b[0m` });
      writePrompt(ws); return;
    }

    // skills — list all learned skills
    if (lower === "skills" || lower === "skill list") {
      const skills = await loadSkillsForAgent("any", 50);
      if (skills.length === 0) {
        send(ws, { type: "output", data: "\x1b[90mNo skills yet. Run AutoResearch to learn skills, or: skill learn <name>: <desc>\x1b[0m" });
      } else {
        send(ws, { type: "output", data: `\x1b[1m\x1b[35mNemoClaw Learned Skills (${skills.length})\x1b[0m\n` + skills.map(s => `• \x1b[1m${s.name}\x1b[0m \x1b[90m(${s.category}, ${(s.score*100).toFixed(0)}%, ${s.source})\x1b[0m\n  ${s.description}`).join("\n") });
      }
      writePrompt(ws); return;
    }

    // skill learn <name>: <desc>
    if (lower.startsWith("skill learn ")) {
      const rest = cmd.slice(12);
      const ci = rest.indexOf(":");
      if (ci > 0) {
        const id = await saveSkill({ name: rest.slice(0, ci).trim(), description: rest.slice(ci + 1).trim(), implementation: rest.slice(ci + 1).trim(), agentType: "nemoclaw", sessionId: this.sessionId, source: "manual", score: 0.75 });
        send(ws, { type: "system", data: `\x1b[35m✓ Skill stored (${id}). Will be injected into future reasoning.\x1b[0m` });
      } else {
        send(ws, { type: "error", data: "Usage: skill learn <name>: <description and implementation approach>" });
      }
      writePrompt(ws); return;
    }

    // Workflows
    if (lower === "workflow list" || lower === "workflow") {
      this.sendWorkflowList(ws); writePrompt(ws); return;
    }
    if (lower.startsWith("workflow run ")) {
      await this.runWorkflow(ws, cmd.slice("workflow run ".length).trim());
      writePrompt(ws); return;
    }

    // Streaming chat
    if (lower.startsWith("chat ")) {
      await this.runChat(ws, cmd.slice(5).trim());
      writePrompt(ws); return;
    }

    // Parallel reasoning
    if (lower.startsWith("parallel ")) {
      const parts = cmd.slice(9).split(" ");
      const n = Math.min(parseInt(parts[0]) || 3, NEMO_MAX_PARALLEL);
      if (n > 0) {
        await this.runParallel(ws, n, parts.slice(1).join(" "));
        writePrompt(ws); return;
      }
    }

    // Default: deep reasoning isolate
    await this.runIsolate(ws, cmd);
    writePrompt(ws);
  }

  private buildSystemPrompt(dbSkillsText = ""): string {
    const thinkingInstructions = this.thinkingMode
      ? `\n\nReasoning approach: Think step-by-step before answering. Structure your thoughts:
1. Problem decomposition
2. Analysis of each component
3. Trade-off consideration
4. Synthesis and conclusion

Use <think>...</think> tags for your internal reasoning if helpful.`
      : "";

    return [
      "You are NemoClaw, a deep-reasoning AI agent built for complex analysis.",
      "You have persistent memory, chain-of-thought reasoning, and multi-objective optimization.",
      "Be thorough, structured, and rigorous. Use headers, bullet points, and code blocks as appropriate.",
      thinkingInstructions,
      "",
      this.memory.get("SKILLS") ? `## Built-in Skills\n${this.memory.get("SKILLS")}` : "",
      dbSkillsText || "",
      this.memory.get("MEMORY") ? `## Agent Memory\n${this.memory.get("MEMORY")}` : "",
      this.memory.get("REASONING_APPROACH") ? `## Reasoning Approach\n${this.memory.get("REASONING_APPROACH")}` : "",
    ].filter(Boolean).join("\n");
  }

  private async runChat(ws: WebSocket, message: string): Promise<void> {
    const taskId = genId();
    send(ws, { type: "task_start", taskId });

    if (this.thinkingMode) {
      send(ws, { type: "system", data: `\x1b[90m[${taskId}] ↑ NemoClaw thinking + streaming (${this.model})...\x1b[0m` });
    } else {
      send(ws, { type: "system", data: `\x1b[90m[${taskId}] ↑ NemoClaw streaming (${this.model})...\x1b[0m` });
    }

    const dbSkills = await loadSkillsForAgent("nemoclaw", 6);
    const dbSkillsText = formatSkillsForPrompt(dbSkills);

    this.history.push({ role: "user", content: message });
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: this.buildSystemPrompt(dbSkillsText) },
      ...this.history.slice(-20),
    ];

    const start = Date.now();
    let full = "";
    let tokens = 0;
    try {
      for await (const chunk of streamChat(this.model, messages, NEMO_MAX_TOKENS)) {
        full += chunk;
        tokens++;
        send(ws, { type: "token", data: chunk });
      }
      send(ws, { type: "output", data: "" });
      this.history.push({ role: "assistant", content: full });
      const timeMs = Date.now() - start;
      send(ws, { type: "task_complete", taskId, timeMs, tokens });
      send(ws, { type: "system", data: `\x1b[90m[${taskId}] ✓ ${timeMs}ms | ~${tokens} tokens | ${providerLabel(this.model)}\x1b[0m` });
    } catch (err) {
      send(ws, { type: "error", data: `\x1b[31mError: ${err instanceof Error ? err.message : String(err)}\x1b[0m` });
    }
  }

  async runIsolate(ws: WebSocket, task: string): Promise<{ output: string; exitCode: number; timeMs: number }> {
    const id = genId();
    const start = Date.now();
    if (this.thinkingMode) {
      send(ws, { type: "system", data: `\x1b[90m[${id}] ↑ NemoClaw reasoning-isolate (${this.model}, ${NEMO_MAX_TOKENS} tok)...\x1b[0m` });
    } else {
      send(ws, { type: "system", data: `\x1b[90m[${id}] ↑ NemoClaw isolate (${this.model})...\x1b[0m` });
    }

    const dbSkills = await loadSkillsForAgent("nemoclaw", 6);
    const dbSkillsText = formatSkillsForPrompt(dbSkills);

    let output = "";
    let exitCode = 0;
    try {
      output = await chatComplete(this.model, [
        { role: "system", content: this.buildSystemPrompt(dbSkillsText) + "\nEnd with [EXIT: 0] on success, [EXIT: 1] on failure." },
        { role: "user", content: task },
      ], NEMO_MAX_TOKENS);
      const m = output.match(/\[EXIT:\s*(\d)\]/);
      exitCode = m ? parseInt(m[1]) : 0;
      output = output.replace(/\[EXIT:\s*\d+\]\s*$/m, "").trimEnd();
    } catch (err) {
      output = `NemoClaw reasoning error: ${err instanceof Error ? err.message : String(err)}`;
      exitCode = 1;
    }

    const timeMs = Date.now() - start;
    send(ws, { type: exitCode === 0 ? "output" : "error", data: `${exitCode === 0 ? "" : "\x1b[31m"}${output}\x1b[0m`, isolateId: id });
    send(ws, { type: "system", data: `\x1b[90m[${id}] ✓ ${timeMs}ms | exit:${exitCode} | deep-reasoning\x1b[0m` });
    return { output, exitCode, timeMs };
  }

  private async runParallel(ws: WebSocket, count: number, task: string): Promise<void> {
    const wallStart = Date.now();
    send(ws, { type: "system", data: `\x1b[35m⚡ NemoClaw: ${count} parallel deep-reasoning isolates...\x1b[0m` });

    const ids = Array.from({ length: count }, () => genId());
    for (const id of ids) send(ws, { type: "system", data: `\x1b[90m[${id}] ↑ Spawning reasoning-isolate...\x1b[0m` });

    const objectives = [
      "Correctness and logical soundness",
      "Performance and scalability implications",
      "Security and safety considerations",
      "Alternative approaches and trade-offs",
      "Edge cases and failure modes",
    ];

    const results = await Promise.all(ids.map((id, i) =>
      chatComplete(this.model, [
        { role: "system", content: this.buildSystemPrompt() },
        { role: "user", content: `${task}\n\nFocus specifically on: ${objectives[i % objectives.length]}\nBe thorough and rigorous in your analysis.` },
      ], NEMO_MAX_TOKENS).then(raw => {
        const out = raw.replace(/\[EXIT:\s*\d+\]\s*$/m, "").trimEnd();
        send(ws, { type: "output", data: `\x1b[35m[${id}]\x1b[0m ${out}`, isolateId: id });
        send(ws, { type: "system", data: `\x1b[90m[${id}] ✓ Reasoning complete\x1b[0m` });
        return { id, exitCode: 0 };
      }).catch(err => {
        send(ws, { type: "error", data: `\x1b[31m[${id}] Failed: ${err.message}\x1b[0m` });
        return { id, exitCode: 1 };
      })
    ));

    const wallMs = Date.now() - wallStart;
    const ok = results.filter(r => r.exitCode === 0).length;
    send(ws, { type: "system", data: `\x1b[35m✓ ${ok}/${count} reasoning-isolates done · ${wallMs}ms · deep analysis complete\x1b[0m` });
  }

  private async runWorkflow(ws: WebSocket, workflowId: string): Promise<void> {
    const workflow = AGENTIC_WORKFLOWS.find(w => w.id === workflowId);
    if (!workflow) {
      send(ws, { type: "error", data: `\x1b[31mWorkflow not found: ${workflowId}\nRun: workflow list\x1b[0m` });
      return;
    }

    const wallStart = Date.now();
    send(ws, { type: "system", data: `\x1b[35m⚡ NemoClaw running: ${workflow.icon} ${workflow.name}\x1b[0m\n\x1b[90m  ${workflow.steps.length} steps · deep reasoning per step\x1b[0m` });

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const id = genId();
      send(ws, { type: "system", data: `\x1b[90m\nStep ${i + 1}/${workflow.steps.length}: ${step.description}\x1b[0m` });
      send(ws, { type: "system", data: `\x1b[90m[${id}] ↑ Reasoning through step...\x1b[0m` });

      try {
        const raw = await chatComplete(this.model, [
          {
            role: "system",
            content: `You are NemoClaw executing step "${step.description}" of workflow "${workflow.name}".
Workflow description: ${workflow.description}
Apply deep reasoning and chain-of-thought analysis.
Be specific, thorough, and actionable.`,
          },
          { role: "user", content: `Execute step ${i + 1}: ${step.description}` },
        ], NEMO_MAX_TOKENS);

        send(ws, { type: "output", data: raw.replace(/\[EXIT:\s*\d+\]\s*$/m, "").trimEnd() });
        send(ws, { type: "system", data: `\x1b[90m[${id}] ✓\x1b[0m` });
      } catch (err) {
        send(ws, { type: "error", data: `\x1b[31m[${id}] Error: ${err instanceof Error ? err.message : String(err)}\x1b[0m` });
      }
    }

    const wallMs = Date.now() - wallStart;
    send(ws, { type: "system", data: `\n\x1b[35m✓ ${workflow.icon} ${workflow.name} complete\x1b[0m\n\x1b[90m  ${wallMs}ms · ${workflow.steps.length} deep-reasoning steps\x1b[0m` });
  }

  private sendHelp(ws: WebSocket): void {
    send(ws, {
      type: "output",
      data: `\x1b[1m\x1b[35mNemoClaw — Deep Reasoning Agent Commands\x1b[0m

\x1b[33mReasoning Execution:\x1b[0m
  \x1b[35m<any text>\x1b[0m              Deep reasoning in isolate (${NEMO_MAX_TOKENS} tok)
  \x1b[35mchat <message>\x1b[0m          Streaming chain-of-thought conversation
  \x1b[35mparallel <N> <task>\x1b[0m     ${NEMO_MAX_PARALLEL} concurrent deep reasoning streams
  \x1b[35mworkflow run <id>\x1b[0m       Run workflow with reasoning per step
  \x1b[35mworkflow list\x1b[0m           List all agentic workflows

\x1b[33mReasoning Control:\x1b[0m
  \x1b[35mthinking on\x1b[0m             Enable chain-of-thought (default: on)
  \x1b[35mthinking off\x1b[0m            Disable chain-of-thought for speed

\x1b[33mMemory:\x1b[0m
  \x1b[35mmemory\x1b[0m                  Show all memory files
  \x1b[35mremember <K>: <V>\x1b[0m      Persist to agent memory

\x1b[33mModel:\x1b[0m
  \x1b[35mmodel <name>\x1b[0m            Switch model (default: ${NEMO_DEFAULT_MODEL})
  \x1b[90mRecommended: o4-mini, o3, groq/deepseek-r1-distill-llama-70b\x1b[0m

\x1b[33mSystem:\x1b[0m
  \x1b[35mstatus\x1b[0m · \x1b[35mwhoami\x1b[0m · \x1b[35mhistory\x1b[0m · \x1b[35mclear\x1b[0m

\x1b[90mNemoClaw reasons deeply. For speed, use NanoClaw.\x1b[0m`,
    });
  }

  private sendStatus(ws: WebSocket): void {
    send(ws, {
      type: "output",
      data: [
        `Agent: \x1b[35mNemoClaw\x1b[0m (\x1b[32mACTIVE\x1b[0m)`,
        `Session:      ${this.sessionId}`,
        `Model:        ${this.model}`,
        `Provider:     ${providerLabel(this.model)}`,
        `Max tokens:   ${NEMO_MAX_TOKENS}`,
        `Max parallel: ${NEMO_MAX_PARALLEL}`,
        `Thinking:     ${this.thinkingMode ? "enabled (chain-of-thought)" : "disabled"}`,
        `Memory:       ${this.memory.size} keys`,
        `History:      ${this.history.length} messages`,
        `Connections:  ${this.connections.size}`,
      ].join("\n"),
    });
  }

  private sendWhoami(ws: WebSocket): void {
    send(ws, {
      type: "output",
      data: [
        `\x1b[35mAgent:\x1b[0m      NemoClaw v1.0`,
        `\x1b[35mFull name:\x1b[0m  Neural Experimental Multi-Objective Agent`,
        `\x1b[35mSession:\x1b[0m    ${this.sessionId}`,
        `\x1b[35mModel:\x1b[0m      ${this.model}`,
        `\x1b[35mProvider:\x1b[0m   ${providerLabel(this.model)}`,
        `\x1b[35mOptimized:\x1b[0m  Deep reasoning · Complex analysis · Long-form`,
        `\x1b[35mThinking:\x1b[0m   ${this.thinkingMode ? "chain-of-thought enabled" : "disabled"}`,
        `\x1b[35mNetwork:\x1b[0m    Isolated (globalOutbound: null)`,
      ].join("\n"),
    });
  }

  private sendMemory(ws: WebSocket): void {
    if (!this.memory.size) { send(ws, { type: "output", data: "No memory files." }); return; }
    const text = Array.from(this.memory.entries())
      .map(([k, v]) => `\x1b[35m[${k}]\x1b[0m\n${v}`).join("\n\n");
    send(ws, { type: "output", data: text });
  }

  private sendHistory(ws: WebSocket): void {
    if (!this.history.length) { send(ws, { type: "output", data: "No conversation history." }); return; }
    const text = this.history.slice(-10).map(h =>
      `\x1b[35m[${h.role.toUpperCase()}]\x1b[0m ${h.content.slice(0, 150)}${h.content.length > 150 ? "..." : ""}`
    ).join("\n");
    send(ws, { type: "output", data: text });
  }

  private sendWorkflowList(ws: WebSocket): void {
    const byCategory = AGENTIC_WORKFLOWS.reduce((acc, w) => {
      if (!acc[w.category]) acc[w.category] = [];
      acc[w.category].push(w);
      return acc;
    }, {} as Record<string, typeof AGENTIC_WORKFLOWS>);

    const lines = [`\x1b[35mNemoClaw Workflows (${AGENTIC_WORKFLOWS.length}) — Deep reasoning per step:\x1b[0m\n`];
    for (const [cat, wfs] of Object.entries(byCategory)) {
      lines.push(`\x1b[33m${cat}:\x1b[0m`);
      for (const w of wfs) {
        lines.push(`  ${w.id.padEnd(24)} ${w.icon} ${w.name}`);
      }
      lines.push("");
    }
    lines.push("Run: workflow run <id>");
    send(ws, { type: "output", data: lines.join("\n") });
  }
}
