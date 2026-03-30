/**
 * NanoClawSession — Lightweight, ultra-fast AI agent.
 *
 * Designed for speed and low cost:
 *   - Default model: gpt-5-mini (or groq/llama-3.1-8b-instant for free)
 *   - Max parallel isolates: 10 (vs 20 for OpenClaw)
 *   - Max tokens: 1024 per call (vs 4096)
 *   - Optimized prompt: terse, structured, no fluff
 *   - Best for: quick Q&A, code snippets, short analysis tasks
 *
 * On Cloudflare: uses @cf/meta/llama-3.3-70b-instruct-fp8-fast (FREE, fast)
 * Local: uses gpt-5-mini via OpenAI Replit proxy
 */

import type { WebSocket } from "ws";
import { chatComplete, streamChat } from "../lib/providerRouter.js";
import { detectProvider, PROVIDER_MAP } from "../lib/providerConfig.js";

const NANO_DEFAULT_MODEL = "gpt-5-mini";
const NANO_MAX_TOKENS = 1024;
const NANO_MAX_PARALLEL = 10;
const NANO_VERSION = "NanoClaw v1.0 — ultra-fast AI agent";

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
  return "nano-" + Math.random().toString(36).slice(2, 8);
}

function writePrompt(ws: WebSocket): void {
  send(ws, { type: "output", data: "\x1b[36mnano@openclaw:~$\x1b[0m " });
}

function providerLabel(model: string): string {
  const id = detectProvider(model);
  const def = PROVIDER_MAP[id];
  return def ? def.name : id;
}

export class NanoClawSession {
  readonly sessionId: string;
  private model: string = NANO_DEFAULT_MODEL;
  private memory: Map<string, string> = new Map();
  private history: Array<{ role: "user" | "assistant"; content: string }> = [];
  private connections: Set<WebSocket> = new Set();

  constructor(sessionId: string, modelOverride?: string) {
    this.sessionId = sessionId;
    if (modelOverride) this.model = modelOverride;

    this.memory.set("PROFILE", `agent: NanoClaw\noptimized_for: speed + low_cost\nmax_tokens: ${NANO_MAX_TOKENS}\nmax_parallel: ${NANO_MAX_PARALLEL}`);
    this.memory.set("SKILLS", "fast_analysis · code_generation · quick_qa · text_processing · data_extraction");
  }

  onConnect(ws: WebSocket): void {
    this.connections.add(ws);
    send(ws, {
      type: "system",
      data: [
        `\x1b[36m╔══════════════════════════════════════════════════╗\x1b[0m`,
        `\x1b[36m║\x1b[0m  \x1b[1mNanoClaw\x1b[0m — Ultra-fast AI Agent             \x1b[36m║\x1b[0m`,
        `\x1b[36m╚══════════════════════════════════════════════════╝\x1b[0m`,
        `\x1b[90mSession:   ${this.sessionId}\x1b[0m`,
        `\x1b[90mModel:     ${this.model}\x1b[0m`,
        `\x1b[90mProvider:  ${providerLabel(this.model)}\x1b[0m`,
        `\x1b[90mMode:      Ultra-fast · ${NANO_MAX_PARALLEL} parallel max · ${NANO_MAX_TOKENS} tokens\x1b[0m`,
        `\x1b[90mOptimized: Speed + low cost — ideal for quick tasks\x1b[0m`,
        ``,
        `Type any task for instant execution. Type \x1b[33mhelp\x1b[0m for commands.`,
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

    send(ws, { type: "output", data: `\x1b[36mnano@openclaw:~$\x1b[0m ${cmd}` });

    // Fast built-ins (no AI cost)
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
    if (lower === "version") {
      send(ws, { type: "output", data: NANO_VERSION });
      writePrompt(ws); return;
    }
    if (lower.startsWith("ping")) {
      send(ws, { type: "output", data: "\x1b[31mping: network isolated (globalOutbound: null)\x1b[0m" });
      writePrompt(ws); return;
    }
    if (lower.startsWith("remember ")) {
      const rest = cmd.slice(9);
      const ci = rest.indexOf(":");
      if (ci > 0) {
        this.memory.set(rest.slice(0, ci).trim().toUpperCase(), rest.slice(ci + 1).trim());
        send(ws, { type: "system", data: `\x1b[36m✓ Memory updated.\x1b[0m` });
      } else {
        send(ws, { type: "error", data: "Usage: remember <key>: <value>" });
      }
      writePrompt(ws); return;
    }
    if (lower.startsWith("model ")) {
      this.model = cmd.slice(6).trim();
      this.memory.set("PROFILE", `agent: NanoClaw\nmodel: ${this.model}\nprovider: ${providerLabel(this.model)}`);
      send(ws, { type: "system", data: `\x1b[36m✓ Model: ${this.model} (${providerLabel(this.model)})\x1b[0m` });
      writePrompt(ws); return;
    }

    // Streaming chat
    if (lower.startsWith("chat ")) {
      await this.runChat(ws, cmd.slice(5).trim());
      writePrompt(ws); return;
    }

    // Parallel fast execution
    if (lower.startsWith("parallel ")) {
      const parts = cmd.slice(9).split(" ");
      const n = Math.min(parseInt(parts[0]) || 3, NANO_MAX_PARALLEL);
      if (n > 0) {
        await this.runParallel(ws, n, parts.slice(1).join(" "));
        writePrompt(ws); return;
      }
    }

    // Default: fast isolate execution
    await this.runIsolate(ws, cmd);
    writePrompt(ws);
  }

  private async runChat(ws: WebSocket, message: string): Promise<void> {
    const taskId = genId();
    send(ws, { type: "task_start", taskId });
    send(ws, { type: "system", data: `\x1b[90m[${taskId}] ↑ NanoClaw streaming (${this.model})...\x1b[0m` });

    const systemPrompt = `You are NanoClaw, a ultra-fast AI agent. Be brief, precise, and structured. ${
      this.memory.get("SKILLS") ? `Skills: ${this.memory.get("SKILLS")}` : ""
    }`;

    this.history.push({ role: "user", content: message });
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...this.history.slice(-10),
    ];

    const start = Date.now();
    let full = "";
    let tokens = 0;
    try {
      for await (const chunk of streamChat(this.model, messages, NANO_MAX_TOKENS)) {
        full += chunk;
        tokens++;
        send(ws, { type: "token", data: chunk });
      }
      send(ws, { type: "output", data: "" });
      this.history.push({ role: "assistant", content: full });
      const timeMs = Date.now() - start;
      send(ws, { type: "task_complete", taskId, timeMs, tokens });
      send(ws, { type: "system", data: `\x1b[90m[${taskId}] ✓ ${timeMs}ms | ~${tokens} tokens\x1b[0m` });
    } catch (err) {
      send(ws, { type: "error", data: `\x1b[31mError: ${err instanceof Error ? err.message : String(err)}\x1b[0m` });
    }
  }

  async runIsolate(ws: WebSocket, task: string): Promise<{ output: string; exitCode: number; timeMs: number }> {
    const id = genId();
    const start = Date.now();
    send(ws, { type: "system", data: `\x1b[90m[${id}] ↑ Nano-isolate (${this.model}, ${NANO_MAX_TOKENS} tok)...\x1b[0m` });

    const systemPrompt = `You are NanoClaw, a fast AI agent. Be concise and direct.
${this.memory.get("SKILLS") ? `Skills: ${this.memory.get("SKILLS")}` : ""}
${this.memory.get("MEMORY") ? `Memory: ${this.memory.get("MEMORY")}` : ""}
End with [EXIT: 0] on success, [EXIT: 1] on failure.`;

    let output = "";
    let exitCode = 0;
    try {
      output = await chatComplete(this.model, [
        { role: "system", content: systemPrompt },
        { role: "user", content: task },
      ], NANO_MAX_TOKENS);
      const m = output.match(/\[EXIT:\s*(\d)\]/);
      exitCode = m ? parseInt(m[1]) : 0;
      output = output.replace(/\[EXIT:\s*\d+\]\s*$/m, "").trimEnd();
    } catch (err) {
      output = `NanoClaw error: ${err instanceof Error ? err.message : String(err)}`;
      exitCode = 1;
    }

    const timeMs = Date.now() - start;
    send(ws, { type: exitCode === 0 ? "output" : "error", data: `${exitCode === 0 ? "" : "\x1b[31m"}${output}\x1b[0m`, isolateId: id });
    send(ws, { type: "system", data: `\x1b[90m[${id}] ✓ ${timeMs}ms | exit:${exitCode}\x1b[0m` });
    return { output, exitCode, timeMs };
  }

  private async runParallel(ws: WebSocket, count: number, task: string): Promise<void> {
    const wallStart = Date.now();
    send(ws, { type: "system", data: `\x1b[36m⚡ NanoClaw: ${count} parallel fast-isolates...\x1b[0m` });

    const ids = Array.from({ length: count }, () => genId());
    for (const id of ids) send(ws, { type: "system", data: `\x1b[90m[${id}] ↑ Spawning...\x1b[0m` });

    const systemPrompt = `You are NanoClaw, a fast AI agent for parallel subtask execution. Be brief and specific to your aspect. End with [EXIT: 0].`;
    const aspects = ["core analysis", "edge cases", "optimization", "validation", "alternatives", "implementation", "testing", "documentation", "security", "performance"];

    const results = await Promise.all(ids.map((id, i) =>
      chatComplete(this.model, [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${task} — focus on: ${aspects[i % aspects.length]}` },
      ], NANO_MAX_TOKENS).then(raw => {
        const out = raw.replace(/\[EXIT:\s*\d+\]\s*$/m, "").trimEnd();
        send(ws, { type: "output", data: `\x1b[36m[${id}]\x1b[0m ${out}`, isolateId: id });
        send(ws, { type: "system", data: `\x1b[90m[${id}] ✓\x1b[0m` });
        return { id, exitCode: 0 };
      }).catch(err => {
        send(ws, { type: "error", data: `\x1b[31m[${id}] Failed: ${err.message}\x1b[0m` });
        return { id, exitCode: 1 };
      })
    ));

    const wallMs = Date.now() - wallStart;
    const ok = results.filter(r => r.exitCode === 0).length;
    send(ws, { type: "system", data: `\x1b[36m✓ ${ok}/${count} nano-isolates done · ${wallMs}ms wall time\x1b[0m` });
  }

  private sendHelp(ws: WebSocket): void {
    send(ws, {
      type: "output",
      data: `\x1b[1m\x1b[36mNanoClaw — Fast Agent Commands\x1b[0m

\x1b[33mExecution:\x1b[0m
  \x1b[36m<any text>\x1b[0m            Execute fast in nano-isolate (${NANO_MAX_TOKENS} tok max)
  \x1b[36mchat <message>\x1b[0m        Streaming conversation
  \x1b[36mparallel <N> <task>\x1b[0m   Up to ${NANO_MAX_PARALLEL} concurrent nano-isolates

\x1b[33mMemory:\x1b[0m
  \x1b[36mmemory\x1b[0m                Show memory
  \x1b[36mremember <K>: <V>\x1b[0m    Store to memory

\x1b[33mModel:\x1b[0m
  \x1b[36mmodel <name>\x1b[0m          Switch model (default: ${NANO_DEFAULT_MODEL})

\x1b[33mSystem:\x1b[0m
  \x1b[36mstatus\x1b[0m · \x1b[36mwhoami\x1b[0m · \x1b[36mhistory\x1b[0m · \x1b[36mclear\x1b[0m

\x1b[90mNanoClaw is optimized for speed. For deep analysis, use NemoClaw.\x1b[0m`,
    });
  }

  private sendStatus(ws: WebSocket): void {
    send(ws, {
      type: "output",
      data: [
        `Agent: \x1b[36mNanoClaw\x1b[0m (\x1b[32mACTIVE\x1b[0m)`,
        `Session:    ${this.sessionId}`,
        `Model:      ${this.model}`,
        `Provider:   ${providerLabel(this.model)}`,
        `Max tokens: ${NANO_MAX_TOKENS}`,
        `Max parallel: ${NANO_MAX_PARALLEL}`,
        `Memory:     ${this.memory.size} keys`,
        `History:    ${this.history.length} messages`,
        `Connections:${this.connections.size}`,
      ].join("\n"),
    });
  }

  private sendWhoami(ws: WebSocket): void {
    send(ws, {
      type: "output",
      data: [
        `\x1b[36mAgent:\x1b[0m     NanoClaw v1.0`,
        `\x1b[36mSession:\x1b[0m   ${this.sessionId}`,
        `\x1b[36mModel:\x1b[0m     ${this.model}`,
        `\x1b[36mProvider:\x1b[0m  ${providerLabel(this.model)}`,
        `\x1b[36mOptimized:\x1b[0m Speed · Low cost · Quick tasks`,
        `\x1b[36mLimits:\x1b[0m    ${NANO_MAX_TOKENS} tokens/call · ${NANO_MAX_PARALLEL} parallel max`,
        `\x1b[36mNetwork:\x1b[0m   Isolated (globalOutbound: null)`,
      ].join("\n"),
    });
  }

  private sendMemory(ws: WebSocket): void {
    if (!this.memory.size) { send(ws, { type: "output", data: "No memory files." }); return; }
    const text = Array.from(this.memory.entries())
      .map(([k, v]) => `\x1b[36m[${k}]\x1b[0m\n${v}`).join("\n\n");
    send(ws, { type: "output", data: text });
  }

  private sendHistory(ws: WebSocket): void {
    if (!this.history.length) { send(ws, { type: "output", data: "No conversation history." }); return; }
    const text = this.history.slice(-10).map((h) =>
      `\x1b[36m[${h.role.toUpperCase()}]\x1b[0m ${h.content.slice(0, 100)}${h.content.length > 100 ? "..." : ""}`
    ).join("\n");
    send(ws, { type: "output", data: text });
  }
}
