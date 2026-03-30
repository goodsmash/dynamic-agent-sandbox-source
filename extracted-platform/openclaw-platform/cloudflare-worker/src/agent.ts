/**
 * OpenClawAgent — Durable Object Agent Soul
 *
 * Built with the official Cloudflare Agents SDK (npm package: "agents").
 * https://developers.cloudflare.com/agents/
 *
 * Each session gets ONE Durable Object instance that:
 *   - Has a persistent SQLite database for memory, skills, and task history
 *   - Handles WebSocket connections from the browser terminal
 *   - Streams AI responses via Workers AI (no external API keys needed)
 *   - Spawns fresh V8 isolates via env.LOADER.load() for sandboxed code execution
 *
 * Architecture:
 *   Browser xterm.js ──WebSocket──► OpenClawAgent DO
 *                                       │
 *                                  SQLite (memory, skills, history)
 *                                       │
 *                              env.AI.run("@cf/...") ── Stream tokens back
 *                                       │
 *                              env.LOADER.load() ── V8 isolate (ephemeral)
 */

import { Agent } from "agents";
import { createWorkersAI } from "workers-ai-provider";
import { streamText } from "ai";
import type { Env, IsolateTask, IsolateResult, TerminalMessage } from "./types/index";
import { DEFAULT_AGENT_MODEL } from "./models";

// ─────────────────────────────────────────────────────────────────────────────
// OPENCLAW_CORE — the execution engine injected into every V8 isolate
//
// This code string runs INSIDE the Dynamic Worker, completely isolated from
// this Durable Object. It cannot access the DO's scope, memory, or bindings
// unless explicitly passed via the env parameter in LOADER.load().
//
// Network: globalOutbound: null — no outbound fetch() from inside the isolate.
// ─────────────────────────────────────────────────────────────────────────────
const OPENCLAW_CORE = `
export default {
  async fetch(request, env) {
    const start = Date.now();
    const isolateId = env.ISOLATE_ID || 'iso-' + Math.random().toString(36).slice(2, 8);

    try {
      const { task, skills, memory, model } = await request.json();

      const system = [
        "You are OpenClaw, an autonomous AI agent executing a specific task in a secure V8 sandbox.",
        "You have NO network access. Use only your built-in knowledge and provided context.",
        "",
        skills ? "=== AGENT SKILLS ===\\n" + skills : "",
        memory ? "=== AGENT MEMORY ===\\n" + memory : "",
        "",
        "Execute the task. Be concise and structured. End with [EXIT: 0] on success, [EXIT: 1] on failure.",
      ].filter(Boolean).join("\\n");

      let output = "";
      let tokensUsed = 0;

      if (env.AI) {
        // Workers AI — runs on Cloudflare's infrastructure, no API key needed
        const result = await env.AI.run(
          model || "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
          {
            messages: [
              { role: "system", content: system },
              { role: "user", content: task }
            ],
            max_tokens: 2048,
          }
        );
        output = result.response || JSON.stringify(result);
        tokensUsed = result.usage?.total_tokens || 0;
      } else {
        // Fallback message when AI binding not available
        output = "[No AI binding configured. The isolate received your task: " + task + "]";
      }

      const exitMatch = output.match(/\\[EXIT:\\s*(\\d)\\]/);
      const exitCode = exitMatch ? parseInt(exitMatch[1]) : 0;
      const clean = output.replace(/\\[EXIT:\\s*\\d+\\]\\s*$/m, "").trimEnd();

      return new Response(JSON.stringify({
        output: clean,
        isolateId,
        executionTimeMs: Date.now() - start,
        tokensUsed,
        exitCode,
      }), { headers: { "Content-Type": "application/json" } });

    } catch (err) {
      return new Response(JSON.stringify({
        output: "Isolate execution failed: " + String(err),
        isolateId,
        executionTimeMs: Date.now() - start,
        tokensUsed: 0,
        exitCode: 1,
      }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// OpenClawAgent Durable Object
// ─────────────────────────────────────────────────────────────────────────────
export class OpenClawAgent extends Agent<Env> {
  // Track active WebSocket connections to this agent instance
  private connections: Set<WebSocket> = new Set();
  // Which AI model this agent uses
  private model: string = DEFAULT_AGENT_MODEL;

  /**
   * Called once when this Durable Object is first created.
   * Initializes the SQLite schema and seeds default agent files.
   */
  async onStart(): Promise<void> {
    // Persistent memory storage
    await this.sql`
      CREATE TABLE IF NOT EXISTS memory (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `;

    // Full conversation history for context
    await this.sql`
      CREATE TABLE IF NOT EXISTS conversation (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        role       TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content    TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `;

    // Every isolate execution is logged here (audit, billing, debugging)
    await this.sql`
      CREATE TABLE IF NOT EXISTS execution_log (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        isolate_id       TEXT NOT NULL,
        command          TEXT NOT NULL,
        output           TEXT NOT NULL,
        model            TEXT NOT NULL,
        exit_code        INTEGER NOT NULL DEFAULT 0,
        execution_ms     INTEGER,
        tokens_used      INTEGER DEFAULT 0,
        created_at       TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `;

    // Seed default memory files on first run
    const existing = await this.sql<{ key: string }>`
      SELECT key FROM memory WHERE key = 'SKILLS'
    `;

    if (!existing || existing.length === 0) {
      const now = new Date().toISOString();
      await this.sql`
        INSERT INTO memory (key, value) VALUES
        ('SKILLS', 'code_execution: Write and analyze code\nweb_research: Research from provided context\ndata_analysis: Analyze and summarize data\nparallel_processing: Run subtasks in parallel V8 isolates'),
        ('MEMORY', '# OpenClaw Agent\nInitialized: ${now}\nStatus: Ready\n\nAdd memories with: remember <key>: <value>'),
        ('CONFIG', 'model: ${DEFAULT_AGENT_MODEL}\nmax_parallel_isolates: 50\nnetwork: disabled (globalOutbound: null)')
      `;
    }
  }

  /**
   * Called when a browser WebSocket connects to this agent.
   * The browser xterm.js connects via: wss://worker.dev/api/ws/:sessionId
   */
  async onConnect(connection: WebSocket): Promise<void> {
    this.connections.add(connection);

    // Read model config from persistent memory
    const config = await this.sql<{ value: string }>`
      SELECT value FROM memory WHERE key = 'CONFIG'
    `;
    const configText = config[0]?.value || "";
    const modelMatch = configText.match(/^model:\s*(.+)$/m);
    if (modelMatch) this.model = modelMatch[1].trim();

    this.send(connection, {
      type: "system",
      data: [
        `\x1b[32m╔═══════════════════════════════════════════════════╗\x1b[0m`,
        `\x1b[32m║\x1b[0m  \x1b[1mOpenClaw Agent\x1b[0m — Durable Object Active           \x1b[32m║\x1b[0m`,
        `\x1b[32m╚═══════════════════════════════════════════════════╝\x1b[0m`,
        `\x1b[90mInstance: ${this.id.toString().slice(0, 16)}...\x1b[0m`,
        `\x1b[90mModel:    ${this.model}\x1b[0m`,
        `\x1b[90mMemory:   Persistent SQLite (survives restarts)\x1b[0m`,
        `\x1b[90mNetwork:  Disabled inside isolates (globalOutbound: null)\x1b[0m`,
        ``,
        `Type a task or \x1b[33mhelp\x1b[0m for commands.`,
      ].join("\n"),
    });
  }

  /**
   * Called when the WebSocket connection closes.
   */
  async onClose(connection: WebSocket): Promise<void> {
    this.connections.delete(connection);
  }

  /**
   * Called for every incoming WebSocket message from the browser.
   */
  async onMessage(connection: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const raw = typeof message === "string" ? message : new TextDecoder().decode(message);

    let msg: TerminalMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.type === "ping") {
      connection.send(JSON.stringify({ type: "pong" } satisfies TerminalMessage));
      return;
    }

    if (msg.type === "input") {
      await this.routeCommand(connection, msg.data);
    }
  }

  // ─── Command Router ───────────────────────────────────────────────────────
  private async routeCommand(connection: WebSocket, raw: string): Promise<void> {
    const cmd = raw.trim();
    if (!cmd) return;

    // Echo the typed command with the prompt prefix
    this.send(connection, {
      type: "output",
      data: `\x1b[32magent@openclaw:~$\x1b[0m ${raw}`,
    });

    // ── Built-in commands ──────────────────────────────────────────────────
    if (cmd === "help") {
      return this.sendHelp(connection);
    }

    if (cmd === "memory") {
      const rows = await this.sql<{ key: string; value: string }>`
        SELECT key, value FROM memory ORDER BY key
      `;
      const text = rows.map((r) =>
        `\x1b[33m[${r.key}]\x1b[0m\n${r.value}`
      ).join("\n\n");
      return void this.send(connection, { type: "output", data: text || "No memory files." });
    }

    if (cmd === "history") {
      const rows = await this.sql<{
        isolate_id: string; command: string; model: string;
        execution_ms: number; exit_code: number; created_at: string;
      }>`
        SELECT isolate_id, command, model, execution_ms, exit_code, created_at
        FROM execution_log ORDER BY id DESC LIMIT 25
      `;
      const text = rows.length > 0
        ? rows.map((r) =>
            `\x1b[36m[${r.isolate_id}]\x1b[0m \x1b[90m${r.created_at}\x1b[0m exit:${r.exit_code} ${r.execution_ms}ms\n  ${r.command}`
          ).join("\n")
        : "No executions yet.";
      return void this.send(connection, { type: "output", data: text });
    }

    if (cmd === "models") {
      return this.sendModelList(connection);
    }

    if (cmd === "clear") {
      await this.sql`DELETE FROM conversation`;
      return void this.send(connection, { type: "system", data: "Conversation history cleared." });
    }

    if (cmd === "whoami") {
      return void this.send(connection, {
        type: "output",
        data: [
          `\x1b[32mAgent ID:\x1b[0m ${this.id.toString()}`,
          `\x1b[32mModel:\x1b[0m    ${this.model}`,
          `\x1b[32mRuntime:\x1b[0m  Cloudflare Durable Objects (SQLite)`,
          `\x1b[32mIsolates:\x1b[0m Dynamic Workers (LOADER binding)`,
        ].join("\n"),
      });
    }

    // remember <key>: <value>
    if (cmd.startsWith("remember ")) {
      const rest = cmd.slice(9);
      const colonIdx = rest.indexOf(":");
      if (colonIdx > 0) {
        const key = rest.slice(0, colonIdx).trim().toUpperCase();
        const value = rest.slice(colonIdx + 1).trim();
        await this.sql`
          INSERT INTO memory (key, value) VALUES (${key}, ${value})
          ON CONFLICT(key) DO UPDATE SET value = ${value}, updated_at = datetime('now')
        `;
        return void this.send(connection, {
          type: "system",
          data: `\x1b[32m✓ Memory[${key}] updated.\x1b[0m`,
        });
      }
    }

    // model <model-id> — switch the AI model for this agent
    if (cmd.startsWith("model ")) {
      const newModel = cmd.slice(6).trim();
      this.model = newModel;
      await this.sql`
        INSERT INTO memory (key, value) VALUES ('CONFIG', ${"model: " + newModel + "\nmax_parallel_isolates: 50\nnetwork: disabled"})
        ON CONFLICT(key) DO UPDATE SET value = ${"model: " + newModel + "\nmax_parallel_isolates: 50\nnetwork: disabled"}, updated_at = datetime('now')
      `;
      return void this.send(connection, {
        type: "system",
        data: `\x1b[32m✓ Model switched to: ${newModel}\x1b[0m`,
      });
    }

    // parallel <count> <task> — spawn N isolates simultaneously
    if (cmd.startsWith("parallel ")) {
      const parts = cmd.slice(9).split(" ");
      const count = parseInt(parts[0]);
      if (!isNaN(count) && count > 0) {
        const task = parts.slice(1).join(" ");
        return void this.runParallel(connection, count, task);
      }
    }

    // chat <message> — multi-turn conversation with memory using streamText
    if (cmd.startsWith("chat ")) {
      const message = cmd.slice(5).trim();
      return void this.runChat(connection, message);
    }

    // Default: run as a single sandboxed isolate task
    await this.runIsolate(connection, cmd);
  }

  // ─── Stream AI Response (Chat Mode) ──────────────────────────────────────
  /**
   * Multi-turn conversational AI using Workers AI + Vercel AI SDK.
   * Streams tokens back to the terminal character by character.
   * Conversation history is persisted in the DO's SQLite.
   */
  private async runChat(connection: WebSocket, userMessage: string): Promise<void> {
    const taskId = "chat-" + Math.random().toString(36).slice(2, 8);

    this.send(connection, {
      type: "task_start",
      taskId,
      model: this.model,
    });

    // Load conversation history from SQLite
    const history = await this.sql<{ role: string; content: string }>`
      SELECT role, content FROM conversation ORDER BY id DESC LIMIT 20
    `;
    const reversedHistory = history.reverse();

    // Save user message to history
    await this.sql`
      INSERT INTO conversation (role, content) VALUES ('user', ${userMessage})
    `;

    // Load agent memory for system prompt context
    const skills = await this.sql<{ value: string }>`SELECT value FROM memory WHERE key = 'SKILLS'`;
    const memory = await this.sql<{ value: string }>`SELECT value FROM memory WHERE key = 'MEMORY'`;

    const systemPrompt = [
      "You are OpenClaw, an AI agent with persistent memory running on Cloudflare's global network.",
      "You have access to skills and memory. Be helpful, concise, and structured.",
      "",
      skills[0]?.value ? `## Your Skills\n${skills[0].value}` : "",
      memory[0]?.value ? `## Your Memory\n${memory[0].value}` : "",
    ].filter(Boolean).join("\n");

    try {
      const workersai = createWorkersAI({ binding: this.env.AI });
      const start = Date.now();

      const result = streamText({
        model: workersai(this.model as `@cf/${string}`),
        system: systemPrompt,
        messages: [
          ...reversedHistory.map((h) => ({
            role: h.role as "user" | "assistant",
            content: h.content,
          })),
          { role: "user", content: userMessage },
        ],
        maxTokens: 2048,
      });

      let fullResponse = "";
      let tokenCount = 0;

      // Stream each token back to the terminal
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        tokenCount += chunk.length;
        this.send(connection, { type: "token", data: chunk });
      }

      const timeMs = Date.now() - start;

      // Newline after streaming completes
      this.send(connection, { type: "output", data: "" });

      // Save assistant response to conversation history
      await this.sql`
        INSERT INTO conversation (role, content) VALUES ('assistant', ${fullResponse})
      `;

      this.send(connection, {
        type: "task_complete",
        taskId,
        timeMs,
        tokens: tokenCount,
      });

    } catch (err) {
      this.send(connection, {
        type: "error",
        data: `Chat error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  // ─── Dynamic Worker Isolate ───────────────────────────────────────────────
  /**
   * Spawn a SINGLE V8 isolate via env.LOADER.load().
   *
   * The isolate:
   *   - Has NO access to the parent DO's scope, memory, or bindings
   *   - Has NO network access (globalOutbound: null)
   *   - Is completely destroyed after execution
   *   - Can use the Workers AI binding passed explicitly via env
   *
   * https://developers.cloudflare.com/dynamic-workers/
   */
  async runIsolate(connection: WebSocket, task: string): Promise<IsolateResult> {
    const isolateId = "iso-" + Math.random().toString(36).slice(2, 8);
    const start = Date.now();

    this.send(connection, {
      type: "system",
      data: `\x1b[90m[${isolateId}] ↑ Spawning V8 isolate (model: ${this.model})...\x1b[0m`,
    });

    const skills = await this.sql<{ value: string }>`SELECT value FROM memory WHERE key = 'SKILLS'`;
    const memory = await this.sql<{ value: string }>`SELECT value FROM memory WHERE key = 'MEMORY'`;

    const payload: IsolateTask = {
      task,
      skills: skills[0]?.value || "",
      memory: memory[0]?.value || "",
      model: this.model,
    };

    let result: IsolateResult;

    try {
      // ═══════════════════════════════════════════════════════════════════
      // DYNAMIC WORKERS API
      // Boots a fresh V8 isolate with the OPENCLAW_CORE execution engine.
      // The isolate gets the AI binding so it can call Workers AI models.
      // globalOutbound: null = no network access from inside the isolate.
      // ═══════════════════════════════════════════════════════════════════
      const sandbox = await this.env.LOADER.load({
        mainModule: "openclaw-core.js",
        modules: { "openclaw-core.js": OPENCLAW_CORE },
        env: {
          AI: this.env.AI,         // Pass Workers AI binding into isolate
          ISOLATE_ID: isolateId,
        },
        globalOutbound: null,        // Block ALL outbound network from isolate
        timeout: 30_000,             // 30 second max execution time
      });

      const response = await sandbox.getEntrypoint().fetch(
        new Request("http://sandbox/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      );

      result = (await response.json()) as IsolateResult;
      result.isolateId = isolateId;

    } catch (err) {
      result = {
        output: `Isolate failed: ${err instanceof Error ? err.message : String(err)}`,
        isolateId,
        executionTimeMs: Date.now() - start,
        exitCode: 1,
      };
    }

    // Log to persistent execution history
    await this.sql`
      INSERT INTO execution_log (isolate_id, command, output, model, exit_code, execution_ms, tokens_used)
      VALUES (
        ${result.isolateId},
        ${task},
        ${result.output},
        ${this.model},
        ${result.exitCode},
        ${result.executionTimeMs},
        ${result.tokensUsed || 0}
      )
    `;

    const color = result.exitCode === 0 ? "\x1b[0m" : "\x1b[31m";
    this.send(connection, {
      type: result.exitCode === 0 ? "output" : "error",
      data: `${color}${result.output}\x1b[0m`,
      isolateId: result.isolateId,
    });

    this.send(connection, {
      type: "system",
      data: `\x1b[90m[${result.isolateId}] ✓ Destroyed. ${result.executionTimeMs}ms | exit:${result.exitCode} | ${result.tokensUsed ?? 0} tokens\x1b[0m`,
    });

    return result;
  }

  // ─── Parallel Isolates ────────────────────────────────────────────────────
  /**
   * Spawn N V8 isolates SIMULTANEOUSLY using Promise.all().
   * This is the key superpower: run 100s of agents in parallel,
   * each with its own isolated memory heap and no shared state.
   *
   * Cloudflare scales this to tens of millions of concurrent isolates.
   */
  async runParallel(connection: WebSocket, count: number, baseTask: string): Promise<void> {
    // Cap at 50 for safety in development; remove cap in production
    const n = Math.min(count, 50);

    this.send(connection, {
      type: "system",
      data: `\x1b[33m⚡ Spawning ${n} parallel V8 isolates simultaneously...\x1b[0m`,
    });

    const subtasks = Array.from({ length: n }, (_, i) =>
      this.runIsolate(connection, `${baseTask} — subtask ${i + 1} of ${n}`)
    );

    const results = await Promise.all(subtasks);
    const ok = results.filter((r) => r.exitCode === 0).length;

    this.send(connection, {
      type: "system",
      data: `\x1b[32m✓ Parallel run complete: ${ok}/${n} succeeded.\x1b[0m\n\x1b[90m  Total wall time: ${Math.max(...results.map((r) => r.executionTimeMs))}ms (parallel, not sequential)\x1b[0m`,
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private send(ws: WebSocket, msg: TerminalMessage): void {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    } catch {
      // Connection may have closed mid-send
    }
  }

  private sendHelp(connection: WebSocket): void {
    this.send(connection, {
      type: "output",
      data: `\x1b[1m\x1b[32mOpenClaw Commands\x1b[0m

\x1b[33mAI Execution (V8 Isolates — sandboxed, network-isolated):\x1b[0m
  \x1b[36m<any text>\x1b[0m              Run task in a fresh V8 isolate (uses ${this.model})
  \x1b[36mchat <message>\x1b[0m          Multi-turn conversation with memory (streaming)
  \x1b[36mparallel <N> <task>\x1b[0m     Spawn N isolates simultaneously (max 50)
  \x1b[36mmodel <@cf/author/name>\x1b[0m Switch the AI model for this agent

\x1b[33mMemory (Persistent SQLite in Durable Object):\x1b[0m
  \x1b[36mmemory\x1b[0m                  Show all memory files (SKILLS, MEMORY, CONFIG)
  \x1b[36mremember <KEY>: <value>\x1b[0m Update a memory file

\x1b[33mHistory & Audit:\x1b[0m
  \x1b[36mhistory\x1b[0m                 Last 25 isolate executions
  \x1b[36mclear\x1b[0m                   Clear conversation history (memory files kept)

\x1b[33mSystem:\x1b[0m
  \x1b[36mmodels\x1b[0m                  List all Workers AI models
  \x1b[36mwhoami\x1b[0m                  Agent identity and config
  \x1b[36mhelp\x1b[0m                    Show this help

\x1b[90mCurrent model: ${this.model}
Each task boots a fresh V8 isolate in <5ms. Network: DISABLED inside isolates.
Conversations are persisted in SQLite and survive Workers restarts/deploys.\x1b[0m`,
    });
  }

  private sendModelList(connection: WebSocket): void {
    const lines = [
      `\x1b[1m\x1b[32mCloudflare Workers AI — Text Generation Models\x1b[0m`,
      `\x1b[90mAll available via: model <@cf/author/name>\x1b[0m`,
      ``,
      `\x1b[33mFrontier & Latest:\x1b[0m`,
      `  @cf/moonshotai/kimi-k2.5                     256k ctx  function-calling vision reasoning`,
      `  @cf/meta/llama-4-scout-17b-16e-instruct       131k ctx  function-calling vision multimodal`,
      `  @cf/meta/llama-4-maverick-17b-128e-instruct-fp8  131k  function-calling vision`,
      `  @cf/openai/gpt-oss-120b                       128k ctx  function-calling reasoning`,
      `  @cf/nvidia/nemotron-3-120b-a12b               128k ctx  function-calling reasoning`,
      ``,
      `\x1b[33mReasoning:\x1b[0m`,
      `  @cf/deepseek-ai/deepseek-r1-distill-qwen-32b  64k ctx   reasoning (chain-of-thought)`,
      `  @cf/deepseek-ai/deepseek-r1-distill-llama-70b 128k ctx  reasoning`,
      `  @cf/qwen/qwq-32b                               32k ctx   reasoning (math/code)`,
      ``,
      `\x1b[33mProduction Workhorses:\x1b[0m`,
      `  @cf/meta/llama-3.3-70b-instruct-fp8-fast      128k ctx  fast, reliable`,
      `  @cf/mistral/mistral-small-3.1-24b-instruct    128k ctx  function-calling vision`,
      `  @cf/meta/llama-3.1-70b-instruct               128k ctx  function-calling`,
      `  @cf/zai-org/glm-4.7-flash                     131k ctx  multilingual 100+ languages`,
      ``,
      `\x1b[33mCode Specialists:\x1b[0m`,
      `  @cf/qwen/qwen2.5-coder-32b-instruct            32k ctx  code-generation expert`,
      `  @cf/defog/sqlcoder-7b-2                         4k ctx  SQL generation`,
      ``,
      `\x1b[33mFast & Light:\x1b[0m`,
      `  @cf/meta/llama-3.2-3b-instruct                128k ctx  compact`,
      `  @cf/meta/llama-3.2-1b-instruct                128k ctx  ultra-fast`,
      `  @cf/tinyllama/tinyllama-1.1b-chat-v1.0          2k ctx  minimum cost`,
      ``,
      `\x1b[90mSwitch model: model @cf/meta/llama-4-scout-17b-16e-instruct\x1b[0m`,
    ];
    this.send(connection, { type: "output", data: lines.join("\n") });
  }
}
