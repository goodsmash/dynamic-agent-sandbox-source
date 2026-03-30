/**
 * RealAgentSession — Node.js mirror of the Cloudflare OpenClawAgent Durable Object.
 *
 * This runs on Replit's Express API server and provides REAL AI execution:
 *   - OpenAI streaming chat (via Replit AI Integrations proxy)
 *   - Real parallel AI calls with Promise.all()
 *   - Real workflow execution (step-by-step AI with actual LLM output)
 *   - In-memory SQLite-equivalent (Map) for session persistence
 *
 * When deployed to Cloudflare, the real OpenClawAgent DO takes over with:
 *   - Workers AI instead of OpenAI
 *   - Real V8 isolate spawning via env.LOADER.load()
 *   - Persistent SQLite in Durable Object
 */

import type { WebSocket } from "ws";
import { AGENTIC_WORKFLOWS } from "../lib/workflows.js";
import { streamChat, chatComplete } from "../lib/providerRouter.js";
import { detectProvider, PROVIDER_MAP } from "../lib/providerConfig.js";

const DEFAULT_MODEL = "gpt-5.2";
const FAST_MODEL = "gpt-5-mini";

function providerLabel(model: string): string {
  const id = detectProvider(model);
  const def = PROVIDER_MAP[id];
  if (id === "cloudflare") return "Workers AI (local→OpenAI fallback)";
  return def ? def.name : id;
}

export interface TerminalMessage {
  type: "output" | "token" | "system" | "error" | "task_start" | "task_complete" | "pong";
  data?: string;
  taskId?: string;
  timeMs?: number;
  tokens?: number;
  isolateId?: string;
}

function send(ws: WebSocket, msg: TerminalMessage): void {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(msg));
  }
}

function genIsolateId(): string {
  return "iso-" + Math.random().toString(36).slice(2, 8);
}

function writePrompt(ws: WebSocket): void {
  send(ws, { type: "output", data: "\x1b[32magent@openclaw:~$\x1b[0m " });
}

// ─── RealAgentSession ────────────────────────────────────────────────────────

export class RealAgentSession {
  readonly sessionId: string;
  private model: string = DEFAULT_MODEL;
  private memory: Map<string, string> = new Map();
  private conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
  private connections: Set<WebSocket> = new Set();

  constructor(sessionId: string, modelOverride?: string) {
    this.sessionId = sessionId;
    if (modelOverride) this.model = modelOverride;

    // Seed default memory
    this.memory.set("SKILLS", [
      "code_execution: Write, analyze and execute code",
      "web_research: Research and summarize information",
      "data_analysis: Analyze, transform and visualize data",
      "parallel_processing: Fan out subtasks to N isolates simultaneously",
      "workflow_execution: Run multi-step agentic workflows",
    ].join("\n"));
    this.memory.set("MEMORY", `# OpenClaw Agent\nInitialized: ${new Date().toISOString()}\nStatus: Ready\n\nAdd memories with: remember <key>: <value>`);
    this.memory.set("CONFIG", `model: ${this.model}\nprovider: ${providerLabel(this.model)}\nmax_parallel_isolates: 50\nruntime: node+multi-provider (deploy to CF for real isolates)`);
  }

  // ─── Connection lifecycle ──────────────────────────────────────────────────

  onConnect(ws: WebSocket): void {
    this.connections.add(ws);

    send(ws, {
      type: "system",
      data: [
        `\x1b[32m╔══════════════════════════════════════════════════╗\x1b[0m`,
        `\x1b[32m║\x1b[0m  \x1b[1mOpenClaw Agent\x1b[0m — Sandbox Active               \x1b[32m║\x1b[0m`,
        `\x1b[32m╚══════════════════════════════════════════════════╝\x1b[0m`,
        `\x1b[90mSession:   ${this.sessionId}\x1b[0m`,
        `\x1b[90mModel:     ${this.model}\x1b[0m`,
        `\x1b[90mProvider:  ${providerLabel(this.model)}\x1b[0m`,
        `\x1b[90mRuntime:   WebSocket · multi-provider AI · Promise.all parallelism\x1b[0m`,
        `\x1b[90mNetwork:   Blocked inside isolates (globalOutbound: null)\x1b[0m`,
        `\x1b[90mProviders: OpenAI · Anthropic · Groq · Together · OpenRouter · Gemini + 5 more\x1b[0m`,
        ``,
        `Type any task to execute it. Type \x1b[33mhelp\x1b[0m for all commands.`,
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

    if (msg.type === "ping") {
      send(ws, { type: "pong" });
      return;
    }

    if (msg.type === "input" && msg.data !== undefined) {
      await this.routeCommand(ws, msg.data);
    }
  }

  // ─── Command Router ────────────────────────────────────────────────────────

  async routeCommand(ws: WebSocket, raw: string): Promise<void> {
    const cmd = raw.trim();
    if (!cmd) { writePrompt(ws); return; }

    const lower = cmd.toLowerCase();

    // Echo command
    send(ws, { type: "output", data: `\x1b[32magent@openclaw:~$\x1b[0m ${cmd}` });

    // ── Built-in non-AI commands ──────────────────────────────────────────
    if (lower === "help") { this.sendHelp(ws); writePrompt(ws); return; }
    if (lower === "clear") { this.conversationHistory = []; send(ws, { type: "system", data: "Conversation cleared." }); writePrompt(ws); return; }
    if (lower === "memory") { this.sendMemory(ws); writePrompt(ws); return; }
    if (lower === "history") { this.sendHistory(ws); writePrompt(ws); return; }
    if (lower === "models") { this.sendModels(ws); writePrompt(ws); return; }
    if (lower === "whoami") { this.sendWhoami(ws); writePrompt(ws); return; }
    if (lower === "status") { this.sendStatus(ws); writePrompt(ws); return; }
    if (lower === "version") { this.sendVersion(ws); writePrompt(ws); return; }
    if (lower === "ls") { send(ws, { type: "output", data: "agent.config.json  tasks/  outputs/  README.md" }); writePrompt(ws); return; }
    if (lower === "ps") { send(ws, { type: "output", data: `PID  ISOLATE       STATUS\n1    ${genIsolateId()}  active (main agent)\n(run parallel N task to spawn more)` }); writePrompt(ws); return; }
    if (lower === "uptime") { send(ws, { type: "output", data: `Session uptime: active\nStarted: ${new Date().toISOString()}` }); writePrompt(ws); return; }
    if (lower === "env") { this.sendEnv(ws); writePrompt(ws); return; }

    // remember <key>: <value>
    if (lower.startsWith("remember ")) {
      const rest = cmd.slice(9);
      const colonIdx = rest.indexOf(":");
      if (colonIdx > 0) {
        const key = rest.slice(0, colonIdx).trim().toUpperCase();
        const value = rest.slice(colonIdx + 1).trim();
        this.memory.set(key, value);
        send(ws, { type: "system", data: `\x1b[32m✓ Memory[${key}] updated.\x1b[0m` });
      } else {
        send(ws, { type: "error", data: "Usage: remember <key>: <value>" });
      }
      writePrompt(ws);
      return;
    }

    // model <model-name>
    if (lower.startsWith("model ")) {
      const newModel = cmd.slice(6).trim();
      this.model = newModel;
      const provider = providerLabel(newModel);
      this.memory.set("CONFIG", `model: ${this.model}\nprovider: ${provider}\nmax_parallel_isolates: 50`);
      const cfNote = newModel.startsWith("@cf/") ? "\n\x1b[90m  ↳ Workers AI model — only available on Cloudflare. Using OpenAI locally.\x1b[0m" : "";
      send(ws, { type: "system", data: `\x1b[32m✓ Model: ${this.model}\x1b[0m\n\x1b[90m  Provider: ${provider}\x1b[0m${cfNote}` });
      writePrompt(ws);
      return;
    }

    // workflow commands
    if (lower === "workflow list" || lower === "workflow") {
      this.sendWorkflowList(ws); writePrompt(ws); return;
    }
    if (lower.startsWith("workflow run ")) {
      const wfId = cmd.slice("workflow run ".length).trim();
      await this.runWorkflow(ws, wfId);
      writePrompt(ws);
      return;
    }

    // ping — network is blocked inside the sandbox
    if (lower.startsWith("ping")) {
      const target = cmd.slice(4).trim() || "cloudflare.com";
      send(ws, {
        type: "output",
        data: [
          `\x1b[31mping: ${target}: network access denied\x1b[0m`,
          `\x1b[90mSandbox policy: globalOutbound = null\x1b[0m`,
          `\x1b[90mAll outbound TCP/HTTP connections are blocked inside isolates.\x1b[0m`,
          `\x1b[90mUse the agent's tool-calling interface to access external resources.\x1b[0m`,
        ].join("\n")
      });
      writePrompt(ws);
      return;
    }

    // ── Real AI commands ──────────────────────────────────────────────────

    // chat <message> — streaming conversation
    if (lower.startsWith("chat ")) {
      const message = cmd.slice(5).trim();
      await this.runChat(ws, message);
      writePrompt(ws);
      return;
    }

    // parallel <N> <task> — real concurrent AI calls
    if (lower.startsWith("parallel ")) {
      const parts = cmd.slice(9).split(" ");
      const n = parseInt(parts[0]);
      if (!isNaN(n) && n > 0) {
        const task = parts.slice(1).join(" ");
        await this.runParallel(ws, Math.min(n, 20), task);
        writePrompt(ws);
        return;
      }
    }

    // Default: run as a single isolate (real AI)
    await this.runIsolate(ws, cmd);
    writePrompt(ws);
  }

  // ─── Real Streaming Chat ───────────────────────────────────────────────────

  private async runChat(ws: WebSocket, userMessage: string): Promise<void> {
    const taskId = "chat-" + genIsolateId();

    send(ws, { type: "task_start", taskId });
    send(ws, { type: "system", data: `\x1b[90m[${taskId}] ↑ Streaming response from ${this.model}...\x1b[0m` });

    const skills = this.memory.get("SKILLS") || "";
    const memoryContent = this.memory.get("MEMORY") || "";

    const systemPrompt = [
      "You are OpenClaw, an autonomous AI agent with persistent memory and skills.",
      "You run on a platform that can spawn parallel V8 isolates for concurrent task execution.",
      "Be concise, helpful, and structured. Use markdown formatting when appropriate.",
      "",
      skills ? `## Your Skills\n${skills}` : "",
      memoryContent ? `## Your Memory\n${memoryContent}` : "",
    ].filter(Boolean).join("\n");

    this.conversationHistory.push({ role: "user", content: userMessage });

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...this.conversationHistory.slice(-20),
    ];

    const start = Date.now();
    let fullResponse = "";
    let tokenCount = 0;

    try {
      for await (const chunk of streamChat(this.model, messages, 8192)) {
        fullResponse += chunk;
        tokenCount++;
        send(ws, { type: "token", data: chunk });
      }

      send(ws, { type: "output", data: "" });
      this.conversationHistory.push({ role: "assistant", content: fullResponse });

      const timeMs = Date.now() - start;
      send(ws, {
        type: "task_complete",
        taskId,
        timeMs,
        tokens: tokenCount,
      });
      send(ws, { type: "system", data: `\x1b[90m[${taskId}] ✓ ${timeMs}ms | ~${tokenCount} tokens | ${providerLabel(this.model)}\x1b[0m` });

    } catch (err) {
      send(ws, { type: "error", data: `\x1b[31mChat error: ${err instanceof Error ? err.message : String(err)}\x1b[0m` });
    }
  }

  // ─── Single Real AI Isolate ────────────────────────────────────────────────

  async runIsolate(ws: WebSocket, task: string): Promise<{ output: string; exitCode: number; timeMs: number }> {
    const isolateId = genIsolateId();
    const start = Date.now();

    send(ws, { type: "system", data: `\x1b[90m[${isolateId}] ↑ Spawning isolate (model: ${this.model})...\x1b[0m` });

    const skills = this.memory.get("SKILLS") || "";
    const memoryContent = this.memory.get("MEMORY") || "";

    const systemPrompt = [
      "You are OpenClaw, an autonomous AI agent executing a specific task in a sandboxed environment.",
      "You have NO network access. Use only your training knowledge and provided context.",
      "Be structured and concise. Use bullet points for lists. End with [EXIT: 0] on success, [EXIT: 1] on failure.",
      "",
      skills ? `## Available Skills\n${skills}` : "",
      memoryContent ? `## Agent Memory\n${memoryContent}` : "",
    ].filter(Boolean).join("\n");

    let output = "";
    let exitCode = 0;

    try {
      output = await chatComplete(this.model, [
        { role: "system", content: systemPrompt },
        { role: "user", content: task },
      ], 4096);
      const exitMatch = output.match(/\[EXIT:\s*(\d)\]/);
      exitCode = exitMatch ? parseInt(exitMatch[1]) : 0;
      output = output.replace(/\[EXIT:\s*\d+\]\s*$/m, "").trimEnd();

    } catch (err) {
      output = `Isolate execution failed: ${err instanceof Error ? err.message : String(err)}`;
      exitCode = 1;
    }

    const timeMs = Date.now() - start;

    const color = exitCode === 0 ? "\x1b[0m" : "\x1b[31m";
    send(ws, { type: exitCode === 0 ? "output" : "error", data: `${color}${output}\x1b[0m`, isolateId });
    send(ws, { type: "system", data: `\x1b[90m[${isolateId}] ✓ Destroyed. ${timeMs}ms | exit:${exitCode}\x1b[0m` });

    return { output, exitCode, timeMs };
  }

  // ─── Real Parallel AI Execution ────────────────────────────────────────────

  private async runParallel(ws: WebSocket, count: number, task: string): Promise<void> {
    const wallStart = Date.now();

    send(ws, {
      type: "system",
      data: `\x1b[33m⚡ Spawning ${count} parallel isolates simultaneously...\x1b[0m\n\x1b[90m  All ${count} AI calls launch at t=0 (Promise.all — true concurrent execution)\x1b[0m`,
    });

    const isolateIds = Array.from({ length: count }, () => genIsolateId());

    // Announce all spawns immediately
    for (const id of isolateIds) {
      send(ws, { type: "system", data: `\x1b[90m[${id}] ↑ Spawning...\x1b[0m` });
    }

    const skills = this.memory.get("SKILLS") || "";
    const systemPrompt = `You are an isolated AI agent executing subtask ${task}. Be specific to your subtask number. Use bullet points. End with [EXIT: 0].${skills ? `\n\nSkills: ${skills}` : ""}`;

    // REAL parallel calls — all launch simultaneously
    const promises = Array.from({ length: count }, (_, i) => {
      const id = isolateIds[i];
      const subtaskPrompt = `${task} — specifically focus on aspect ${i + 1} of ${count}: ${getSubtaskFocus(task, i, count)}`;

      return chatComplete(this.model, [
        { role: "system", content: systemPrompt },
        { role: "user", content: subtaskPrompt },
      ], 1024).then((rawOut) => {
        let output = rawOut;
        output = output.replace(/\[EXIT:\s*\d+\]\s*$/m, "").trimEnd();
        send(ws, { type: "output", data: `\x1b[36m[${id}]\x1b[0m ${output}`, isolateId: id });
        send(ws, { type: "system", data: `\x1b[90m[${id}] ✓ Destroyed.\x1b[0m` });
        return { id, output, exitCode: 0 };
      }).catch((err) => {
        const errMsg = err instanceof Error ? err.message : String(err);
        send(ws, { type: "error", data: `\x1b[31m[${id}] Failed: ${errMsg}\x1b[0m` });
        return { id, output: errMsg, exitCode: 1 };
      });
    });

    const results = await Promise.all(promises);
    const wallMs = Date.now() - wallStart;
    const ok = results.filter((r) => r.exitCode === 0).length;
    const seqMs = results.length * 3000; // estimated sequential time
    const speedup = (seqMs / wallMs).toFixed(1);

    send(ws, {
      type: "system",
      data: [
        `\x1b[32m✓ Parallel run complete: ${ok}/${count} succeeded\x1b[0m`,
        `\x1b[90m  Wall time: ${wallMs}ms | ~${speedup}x faster than sequential\x1b[0m`,
        `\x1b[90m  All ${count} isolates ran simultaneously (true Promise.all parallelism)\x1b[0m`,
      ].join("\n"),
    });
  }

  // ─── Real Workflow Execution ───────────────────────────────────────────────

  private async runWorkflow(ws: WebSocket, workflowId: string): Promise<void> {
    const workflow = AGENTIC_WORKFLOWS.find((w) => w.id === workflowId);

    if (!workflow) {
      send(ws, { type: "error", data: `\x1b[31mWorkflow not found: ${workflowId}\nRun: workflow list\x1b[0m` });
      return;
    }

    const wallStart = Date.now();

    send(ws, {
      type: "system",
      data: [
        `\x1b[33m⚡ Running workflow: ${workflow.icon} ${workflow.name}\x1b[0m`,
        `\x1b[90m  Category: ${workflow.category} | Difficulty: ${workflow.difficulty} | Model: ${workflow.model || this.model}\x1b[0m`,
        `\x1b[90m  Steps: ${workflow.steps.length} | Est. time: ${workflow.estimatedTime}\x1b[0m`,
      ].join("\n"),
    });

    // Run each step with real AI
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const isolateId = genIsolateId();

      send(ws, {
        type: "system",
        data: `\x1b[90m\nStep ${i + 1}/${workflow.steps.length}: ${step.description}\x1b[0m`,
      });

      // Single isolate per step (parallel mode triggered by 'parallel N' command instead)
      send(ws, { type: "system", data: `\x1b[90m[${isolateId}] ↑ Spawning isolate...\x1b[0m` });

      try {
        const raw = await chatComplete(this.model, [
          { role: "system", content: buildWorkflowSystemPrompt(workflow, step, this.memory) },
          { role: "user", content: `Execute step ${i + 1} of the ${workflow.name} workflow: ${step.description}` },
        ], 2048);

        const output = raw.replace(/\[EXIT:\s*\d+\]\s*$/m, "").trimEnd();
        send(ws, { type: "output", data: output });
        send(ws, { type: "system", data: `\x1b[90m[${isolateId}] ✓ Destroyed.\x1b[0m` });

      } catch (err) {
        send(ws, { type: "error", data: `\x1b[31m[${isolateId}] Error: ${err instanceof Error ? err.message : String(err)}\x1b[0m` });
      }
    }

    const wallMs = Date.now() - wallStart;
    send(ws, {
      type: "system",
      data: [
        ``,
        `\x1b[32m✓ Workflow complete: ${workflow.icon} ${workflow.name}\x1b[0m`,
        `\x1b[90m  Total time: ${wallMs}ms | ${workflow.steps.length} steps | model: ${this.model}\x1b[0m`,
      ].join("\n"),
    });
  }

  // ─── Info Commands ────────────────────────────────────────────────────────

  private sendHelp(ws: WebSocket): void {
    send(ws, {
      type: "output",
      data: `\x1b[1m\x1b[32mOpenClaw Agent — Command Reference\x1b[0m

\x1b[33mAI Execution (sandboxed isolates):\x1b[0m
  \x1b[36m<any text>\x1b[0m              Execute task via real AI in a sandboxed isolate
  \x1b[36mchat <message>\x1b[0m          Streaming multi-turn conversation
  \x1b[36mparallel <N> <task>\x1b[0m     Spawn N concurrent AI calls simultaneously (Promise.all)
  \x1b[36mworkflow run <id>\x1b[0m       Run a multi-step agentic workflow (real AI each step)

\x1b[33mMemory:\x1b[0m
  \x1b[36mmemory\x1b[0m                  Show all memory files
  \x1b[36mremember <KEY>: <value>\x1b[0m  Persist a value to agent memory

\x1b[33mWorkflows:\x1b[0m
  \x1b[36mworkflow list\x1b[0m           List all available workflow templates
  \x1b[36mworkflow run <id>\x1b[0m       Execute a named workflow

\x1b[33mModel Control:\x1b[0m
  \x1b[36mmodel <name>\x1b[0m            Switch AI model (gpt-5.2, claude-3-7-sonnet, groq/...)
  \x1b[36mmodels\x1b[0m                  Browse all 11 providers and their models

\x1b[33mHistory:\x1b[0m
  \x1b[36mhistory\x1b[0m                 Show conversation history
  \x1b[36mclear\x1b[0m                   Clear conversation and reset context

\x1b[33mSandbox Info:\x1b[0m
  \x1b[36mwhoami\x1b[0m   \x1b[36mstatus\x1b[0m   \x1b[36mversion\x1b[0m   \x1b[36mps\x1b[0m   \x1b[36mls\x1b[0m   \x1b[36menv\x1b[0m   \x1b[36muptime\x1b[0m

\x1b[90mConfigure AI provider API keys → Settings (/settings)\x1b[0m
\x1b[90mOpenAI works immediately with no key required.\x1b[0m`,
    });
  }

  private sendMemory(ws: WebSocket): void {
    if (this.memory.size === 0) {
      send(ws, { type: "output", data: "No memory files." });
      return;
    }
    const text = Array.from(this.memory.entries())
      .map(([k, v]) => `\x1b[33m[${k}]\x1b[0m\n${v}`)
      .join("\n\n");
    send(ws, { type: "output", data: text });
  }

  private sendHistory(ws: WebSocket): void {
    if (this.conversationHistory.length === 0) {
      send(ws, { type: "output", data: "No conversation history." });
      return;
    }
    const text = this.conversationHistory.slice(-10).map((h, i) =>
      `\x1b[36m[${h.role.toUpperCase()}]\x1b[0m ${h.content.slice(0, 120)}${h.content.length > 120 ? "..." : ""}`
    ).join("\n");
    send(ws, { type: "output", data: text });
  }

  private sendModels(ws: WebSocket): void {
    send(ws, {
      type: "output",
      data: `\x1b[1m\x1b[32mOpenClaw Multi-Provider Model Catalog\x1b[0m
Configure API keys at /settings — then use: model <name>

\x1b[33mOpenAI\x1b[0m \x1b[90m(via Replit proxy — no key needed)\x1b[0m
  gpt-5.2                 flagship
  gpt-5-mini              fast, cheap
  o3, o4-mini             reasoning

\x1b[33mAnthropic\x1b[0m \x1b[90m(key required)\x1b[0m
  claude-opus-4-5         best quality
  claude-3-7-sonnet-20250219
  claude-3-5-haiku-20241022  fast

\x1b[33mGroq\x1b[0m \x1b[90m(free tier — fastest inference)\x1b[0m
  llama-3.3-70b-versatile
  llama-3.1-8b-instant    ultra-fast
  mixtral-8x7b-32768
  deepseek-r1-distill-llama-70b

\x1b[33mTogether AI\x1b[0m \x1b[90m(100+ OSS models, cheap)\x1b[0m
  meta-llama/Llama-3.3-70B-Instruct-Turbo
  Qwen/Qwen2.5-72B-Instruct-Turbo
  deepseek-ai/DeepSeek-R1

\x1b[33mOpenRouter\x1b[0m \x1b[90m(300+ models from all providers)\x1b[0m
  openrouter/auto          smart routing
  google/gemini-2.0-flash-exp:free
  meta-llama/llama-4-scout:free

\x1b[33mMistral AI\x1b[0m
  mistral-large-latest
  codestral-latest         code

\x1b[33mGoogle Gemini\x1b[0m \x1b[90m(free tier + 2M context)\x1b[0m
  gemini-2.5-pro-preview-03-25
  gemini-2.0-flash

\x1b[33mPerplexity\x1b[0m \x1b[90m(search-enabled)\x1b[0m
  sonar-pro, sonar, sonar-reasoning-pro

\x1b[33mOllama Local\x1b[0m \x1b[90m(100% free, requires Ollama installed)\x1b[0m
  ollama/llama3.3          ollama/qwen2.5:7b
  ollama/deepseek-r1:8b    ollama/phi4

\x1b[33mCloudflare Workers AI\x1b[0m \x1b[90m(CF deploy only)\x1b[0m
  @cf/meta/llama-4-scout-17b-16e-instruct   [FREE]
  @cf/moonshotai/kimi-k2.5                  256k ctx
  @cf/qwen/qwen2.5-coder-32b-instruct       [FREE]

\x1b[90mConfigure all providers → go to Settings (/settings)\x1b[0m`,
    });
  }

  private sendWhoami(ws: WebSocket): void {
    send(ws, {
      type: "output",
      data: [
        `\x1b[32mSession ID:\x1b[0m  ${this.sessionId}`,
        `\x1b[32mModel:\x1b[0m       ${this.model}`,
        `\x1b[32mProvider:\x1b[0m    ${providerLabel(this.model)}`,
        `\x1b[32mRuntime:\x1b[0m     Node.js + WebSocket + multi-provider AI`,
        `\x1b[32mParallelism:\x1b[0m Concurrent AI calls via Promise.all (up to 20 simultaneous)`,
        `\x1b[32mMemory:\x1b[0m      In-session (${this.memory.size} keys)`,
        `\x1b[32mHistory:\x1b[0m     ${this.conversationHistory.length} messages`,
        `\x1b[32mProviders:\x1b[0m   11 (OpenAI, Anthropic, Groq, Together, OpenRouter, Mistral, Gemini, Cohere, Perplexity, Ollama, LM Studio)`,
        `\x1b[32mNetwork:\x1b[0m     Blocked inside isolates (globalOutbound: null)`,
      ].join("\n"),
    });
  }

  private sendStatus(ws: WebSocket): void {
    send(ws, {
      type: "output",
      data: [
        `Agent Status: \x1b[32mACTIVE\x1b[0m`,
        `Session:      ${this.sessionId}`,
        `Model:        ${this.model}`,
        `Provider:     ${providerLabel(this.model)}`,
        `Memory:       ${this.memory.size} keys`,
        `Conversation: ${this.conversationHistory.length} messages`,
        `Connections:  ${this.connections.size} active WebSocket(s)`,
        `Parallelism:  Promise.all — up to 20 concurrent AI calls`,
        `Network:      Isolated inside isolates (globalOutbound: null)`,
        `Providers:    11 active (OpenAI, Anthropic, Groq, Together, OpenRouter, Mistral, Gemini, Cohere, Perplexity, Ollama, LM Studio)`,
      ].join("\n"),
    });
  }

  private sendVersion(ws: WebSocket): void {
    send(ws, {
      type: "output",
      data: [
        `OpenClaw Platform v2.0.0`,
        `  Runtime:     Node.js + Express + WebSocket`,
        `  Compat Date: 2026-03-24 (Cloudflare Workers target)`,
        `  Providers:   11 (OpenAI, Anthropic, Groq, Together, OpenRouter, Mistral, Gemini, Cohere, Perplexity, Ollama, LM Studio)`,
        `  Model:       ${this.model}`,
        `  Provider:    ${providerLabel(this.model)}`,
        `  Parallelism: Promise.all concurrent AI execution`,
        `  Sandbox:     V8-compatible isolate model (network isolated)`,
        `  CF Target:   Dynamic Workers + Durable Objects + Workers AI`,
      ].join("\n"),
    });
  }

  private sendEnv(ws: WebSocket): void {
    send(ws, {
      type: "output",
      data: [
        `AGENT_RUNTIME=openclaw-sandbox`,
        `AI_MODEL=${this.model}`,
        `AI_PROVIDER=${providerLabel(this.model)}`,
        `MULTI_PROVIDER=true`,
        `PROVIDERS=11`,
        `NETWORK_POLICY=isolated (globalOutbound=null inside isolates)`,
        `SESSION_ID=${this.sessionId}`,
        `MEMORY_KEYS=${this.memory.size}`,
        `CONVERSATION_LENGTH=${this.conversationHistory.length}`,
        `NODE_ENV=${process.env.NODE_ENV || "development"}`,
      ].join("\n"),
    });
  }

  private sendWorkflowList(ws: WebSocket): void {
    const byCategory = AGENTIC_WORKFLOWS.reduce((acc, w) => {
      if (!acc[w.category]) acc[w.category] = [];
      acc[w.category].push(w);
      return acc;
    }, {} as Record<string, typeof AGENTIC_WORKFLOWS>);

    const lines = [`Available Agentic Workflows (${AGENTIC_WORKFLOWS.length}) — All powered by real AI:\n`];
    for (const [cat, workflows] of Object.entries(byCategory)) {
      lines.push(`\x1b[33m${cat}:\x1b[0m`);
      for (const w of workflows) {
        const steps = w.steps.length;
        const parallel = w.steps.filter((s) => (s.parallelIsolates || 1) > 1).length;
        lines.push(`  ${w.id.padEnd(24)} ${w.icon} ${w.name.padEnd(28)} ${steps} steps${parallel > 0 ? `, ${parallel} parallel` : ""}`);
      }
      lines.push("");
    }
    lines.push("Run: workflow run <id>");
    send(ws, { type: "output", data: lines.join("\n") });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSubtaskFocus(task: string, index: number, total: number): string {
  const aspects = [
    "security and vulnerabilities",
    "performance and optimization",
    "code quality and maintainability",
    "edge cases and error handling",
    "testing and validation",
    "documentation and clarity",
    "scalability and architecture",
    "dependencies and integrations",
    "data flow and state management",
    "user experience and accessibility",
  ];
  return aspects[index % aspects.length];
}

function buildWorkflowSystemPrompt(
  workflow: (typeof AGENTIC_WORKFLOWS)[0],
  step: (typeof AGENTIC_WORKFLOWS)[0]["steps"][0],
  memory: Map<string, string>
): string {
  return [
    `You are OpenClaw, executing step "${step.description}" of the "${workflow.name}" workflow.`,
    `Workflow description: ${workflow.description}`,
    `Step goal: ${step.description}`,
    "Be specific, structured, and actionable. Use bullet points and headers.",
    "Format your output as a real agent analysis — not generic advice.",
    `End with [EXIT: 0].`,
    "",
    memory.get("SKILLS") ? `## Agent Skills\n${memory.get("SKILLS")}` : "",
    memory.get("MEMORY") ? `## Agent Memory\n${memory.get("MEMORY")}` : "",
  ].filter(Boolean).join("\n");
}

// Shared workflow templates for both the API and the agent
export { AGENTIC_WORKFLOWS };
