import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sessionsTable, tasksTable, historyTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID, randomBytes } from "crypto";

const router: IRouter = Router();

function generateIsolateId(): string {
  return "iso-" + randomBytes(3).toString("hex");
}

function generateSessionResponse(session: typeof sessionsTable.$inferSelect) {
  return {
    id: session.id,
    name: session.name,
    status: session.status,
    createdAt: session.createdAt.toISOString(),
    lastActiveAt: session.lastActiveAt.toISOString(),
    model: session.model,
    taskCount: session.taskCount,
    memoryUsage: session.memoryUsage,
    plan: session.plan,
  };
}

function generateTaskResponse(task: typeof tasksTable.$inferSelect) {
  return {
    id: task.id,
    sessionId: task.sessionId,
    description: task.description,
    status: task.status,
    createdAt: task.createdAt.toISOString(),
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    output: task.output ?? null,
    isolateId: task.isolateId,
    executionTimeMs: task.executionTimeMs ?? null,
  };
}

function generateHistoryResponse(entry: typeof historyTable.$inferSelect) {
  return {
    id: entry.id,
    sessionId: entry.sessionId,
    command: entry.command,
    output: entry.output,
    exitCode: entry.exitCode,
    executedAt: entry.executedAt.toISOString(),
    executionTimeMs: entry.executionTimeMs,
  };
}

function simulateCommandOutput(command: string): { output: string; exitCode: number; timeMs: number } {
  const cmd = command.trim().toLowerCase();
  const startTime = Date.now();

  const responses: Record<string, { output: string; exitCode: number }> = {
    help: {
      output: `OpenClaw Agent Commands (v2.0.0)

AI Execution (V8 Isolates — sandboxed, no network):
  <text>               Run task in a fresh V8 isolate
  chat <message>       Multi-turn conversation (streaming tokens)
  parallel <N> <task>  Spawn N isolates simultaneously
  model <@cf/a/name>   Switch Workers AI model

Memory (Persistent SQLite in Durable Object):
  memory               Show all memory files
  remember <K>: <v>    Update memory file

History & Audit:
  history              Last 25 isolate executions
  clear                Clear conversation history

System:
  models               List all Workers AI models (100+)
  whoami               Agent identity and config
  version              Runtime version info
  status               Agent status
  help                 Show this help

Workers AI Models (use: model @cf/author/name):
  @cf/moonshotai/kimi-k2.5                 — frontier, 256k ctx
  @cf/meta/llama-4-scout-17b-16e-instruct  — multimodal, FREE
  @cf/openai/gpt-oss-120b                  — 120B reasoning
  @cf/deepseek-ai/deepseek-r1-distill-*   — chain-of-thought
  @cf/qwen/qwen2.5-coder-32b-instruct     — code expert
  
Deploy to Cloudflare: cd cloudflare-worker && npm run deploy`,
      exitCode: 0,
    },
    status: {
      output: `Agent Status: ACTIVE
Session ID: ${generateIsolateId()}
Runtime: V8 Isolate (Cloudflare Workers Compatible)
Memory: ${(Math.random() * 50 + 10).toFixed(1)}MB / 128MB
CPU: ${(Math.random() * 30 + 5).toFixed(1)}%
Tasks Running: ${Math.floor(Math.random() * 5)}
Network: ISOLATED (globalOutbound: null)
Uptime: ${Math.floor(Math.random() * 3600)}s`,
      exitCode: 0,
    },
    ls: {
      output: `total 8
drwxr-xr-x  1 agent sandbox 4096 Mar 25 2026 .
drwxr-xr-x  1 root  root   4096 Mar 25 2026 ..
-rw-r--r--  1 agent sandbox  892 Mar 25 2026 agent.config.json
drwxr-xr-x  1 agent sandbox 4096 Mar 25 2026 tasks/
drwxr-xr-x  1 agent sandbox 4096 Mar 25 2026 outputs/
-rw-r--r--  1 agent sandbox 1204 Mar 25 2026 README.md`,
      exitCode: 0,
    },
    ps: {
      output: `PID   ISOLATE       STATUS    CPU    MEMORY  TASK
1     ${generateIsolateId()}  active    2.1%   12MB    agent-main
${Math.floor(Math.random() * 3) > 0 ? `2     ${generateIsolateId()}  running   8.4%   18MB    task-worker-1\n3     ${generateIsolateId()}  running   6.2%   15MB    task-worker-2` : "(no background tasks)"}`,
      exitCode: 0,
    },
    env: {
      output: `AGENT_RUNTIME=cloudflare-workers-compat
SANDBOX_MODE=strict
NETWORK_POLICY=isolated
MAX_MEMORY=134217728
MAX_CPU_TIME=30000
ANTHROPIC_KEY=***redacted***
AGENT_ID=${generateIsolateId()}
ISOLATE_START_TIME=${Date.now()}
NODE_ENV=sandbox`,
      exitCode: 0,
    },
    uptime: {
      output: `Session started: ${new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString()}
Uptime: ${Math.floor(Math.random() * 60)}m ${Math.floor(Math.random() * 60)}s
Load avg (isolate): ${(Math.random() * 2).toFixed(2)}, ${(Math.random() * 2).toFixed(2)}, ${(Math.random() * 2).toFixed(2)}`,
      exitCode: 0,
    },
    version: {
      output: `OpenClaw Platform v2.0.0
  Runtime:          Cloudflare Workers (wrangler 4.19.0)
  Compat Date:      2026-03-24
  V8 Engine:        12.4.254.20
  Node Compat:      nodejs_compat (20.x)
  Durable Objects:  Enabled (SQLite, new_sqlite_classes)
  Dynamic Workers:  Enabled (LOADER binding, <5ms cold start)
  Workers AI:       100+ models via AI binding (remote: true)
  Default Model:    @cf/meta/llama-4-scout-17b-16e-instruct
  Agents SDK:       agents@0.0.62 + @cloudflare/ai-chat
  WS Protocol:      /agents/OpenClawAgent/:sessionId`,
      exitCode: 0,
    },
    clear: {
      output: "\x1b[2J\x1b[H",
      exitCode: 0,
    },
    models: {
      output: `Workers AI Text Generation Models (100+)

\x1b[33mFrontier:\x1b[0m
  @cf/moonshotai/kimi-k2.5                        256k  function-calling vision reasoning
  @cf/meta/llama-4-scout-17b-16e-instruct          131k  function-calling vision [FREE]
  @cf/meta/llama-4-maverick-17b-128e-instruct-fp8  131k  function-calling vision
  @cf/openai/gpt-oss-120b                          128k  function-calling reasoning
  @cf/nvidia/nemotron-3-120b-a12b                  128k  function-calling reasoning

\x1b[33mReasoning:\x1b[0m
  @cf/deepseek-ai/deepseek-r1-distill-qwen-32b     64k   chain-of-thought [FREE]
  @cf/deepseek-ai/deepseek-r1-distill-llama-70b    128k  reasoning
  @cf/qwen/qwq-32b                                  32k   math/code reasoning [FREE]

\x1b[33mProduction:\x1b[0m
  @cf/meta/llama-3.3-70b-instruct-fp8-fast         128k  fast [FREE]
  @cf/mistral/mistral-small-3.1-24b-instruct        128k  function-calling vision [FREE]
  @cf/zai-org/glm-4.7-flash                         131k  multilingual [FREE]
  @cf/google/gemma-3-27b-it                         128k  vision multilingual [FREE]
  @cf/qwen/qwen2.5-72b-instruct                     128k  function-calling multilingual

\x1b[33mCode:\x1b[0m
  @cf/qwen/qwen2.5-coder-32b-instruct               32k   code expert [FREE]
  @cf/defog/sqlcoder-7b-2                             4k   SQL generation [FREE]

Switch: model @cf/meta/llama-4-scout-17b-16e-instruct`,
      exitCode: 0,
    },
    memory: {
      output: `=== Agent Memory Files ===

\x1b[33m[SKILLS]\x1b[0m
code_execution: Write and analyze code
web_research: Research from provided context
data_analysis: Analyze and summarize data
parallel_processing: Run subtasks in parallel V8 isolates

\x1b[33m[MEMORY]\x1b[0m
# OpenClaw Agent
Status: Active
Runtime: Cloudflare Durable Object (SQLite)

\x1b[33m[CONFIG]\x1b[0m
model: @cf/meta/llama-4-scout-17b-16e-instruct
max_parallel_isolates: 50
network: disabled (globalOutbound: null)`,
      exitCode: 0,
    },
    whoami: {
      output: `Agent ID: ${generateIsolateId()}-openclaw
Model:    @cf/meta/llama-4-scout-17b-16e-instruct
Runtime:  Cloudflare Durable Objects (SQLite persistent memory)
Isolates: Dynamic Workers LOADER binding (<5ms cold start)
Network:  Disabled inside isolates (globalOutbound: null)
Deploy:   cd cloudflare-worker && npm run deploy`,
      exitCode: 0,
    },
  };

  if (cmd === "clear") return { output: "", exitCode: 0, timeMs: 1 };

  for (const [key, val] of Object.entries(responses)) {
    if (cmd === key || cmd.startsWith(key + " ")) {
      return { output: val.output, exitCode: val.exitCode, timeMs: Date.now() - startTime + Math.floor(Math.random() * 80 + 20) };
    }
  }

  // --- workflow commands ---
  if (cmd === "workflow list" || cmd === "workflow") {
    return {
      output: `Available Agentic Workflows (12)

\x1b[33mCode Intelligence:\x1b[0m
  code-reviewer      Deep AI-powered code analysis (parallel 3)
  bug-hunter         Find and fix bugs automatically (reasoning)
  security-auditor   OWASP-aligned vulnerability scanning (parallel 5)
  test-generator     Auto-generate test suites from code (parallel 4)

\x1b[33mResearch & Analysis:\x1b[0m
  research-agent     Multi-source research with citations (parallel 5)
  log-analyzer       Turn logs into actionable insights (parallel 3)
  competitive-intel  Automated competitive analysis (parallel 4)

\x1b[33mData Processing:\x1b[0m
  data-pipeline      Transform and analyze data at scale (parallel 4)

\x1b[33mContent Generation:\x1b[0m
  api-doc-generator  Auto-generate beautiful API docs (parallel 3)
  content-factory    Scale content production with agents (parallel 3)

\x1b[33mParallel Agents:\x1b[0m
  parallel-comparator  Same prompt, 5 models simultaneously

\x1b[33mDevOps & Deploy:\x1b[0m
  deploy-validator   Pre-flight checks before every deploy (parallel 4)

Run a workflow:  workflow run <id>
Browse library:  Open /workflows in the sidebar`,
      exitCode: 0,
    };
  }

  if (cmd.startsWith("workflow run ")) {
    const wfId = cmd.slice("workflow run ".length).trim();
    const workflows: Record<string, { name: string; steps: string[]; model: string }> = {
      "code-reviewer": {
        name: "Code Reviewer",
        model: "@cf/qwen/qwen2.5-coder-32b-instruct",
        steps: [
          "Loading context into durable SQLite memory...",
          "Spawning 3 parallel V8 isolates for security scan...",
          `[${generateIsolateId()}] Security scan: checking auth middleware → 2 issues found`,
          `[${generateIsolateId()}] Security scan: checking input validation → 1 SQL injection risk`,
          `[${generateIsolateId()}] Security scan: checking rate limiting → MISSING on /api/execute`,
          "Synthesis pass: correlating all findings...",
          "",
          "\x1b[33m⚠ Issues Found (ranked by severity):\x1b[0m",
          "  [CRITICAL] SQL injection via unsanitized 'command' param in execute route",
          "  [HIGH]     Missing rate limiting on POST /execute — DoS risk",
          "  [MEDIUM]   JWT secret hardcoded in env.ts line 42",
          "  [LOW]      Excessive logging of request bodies",
          "",
          "AI Summary: Fix the SQL injection first — it's exploitable without auth.",
          "Run: workflow run security-auditor for full OWASP scan.",
        ],
      },
      "research-agent": {
        name: "Research Assistant",
        model: "@cf/moonshotai/kimi-k2.5",
        steps: [
          "Loading research topic into durable memory...",
          "Spawning 5 parallel research isolates...",
          `[${generateIsolateId()}] Researching: cold start latency benchmarks...`,
          `[${generateIsolateId()}] Researching: pricing comparison edge vs serverless...`,
          `[${generateIsolateId()}] Researching: DX and developer tooling comparison...`,
          `[${generateIsolateId()}] Researching: security isolation guarantees...`,
          `[${generateIsolateId()}] Researching: ecosystem integrations and SDKs...`,
          "Synthesis: consolidating 5 research streams...",
          "",
          "\x1b[36mKey Findings:\x1b[0m",
          "  • Cloudflare Workers cold start: <5ms vs Lambda@Edge: 100-400ms",
          "  • Workers AI billing: per-request, no idle cost (vs GPU server hourly)",
          "  • Durable Objects: only edge runtime with transactional SQLite at edge",
          "  • Limitations: 30s CPU limit, no persistent TCP connections",
          "",
          "Confidence: 87% | Sources analyzed: 23 | Tokens processed: 48,291",
        ],
      },
      "data-pipeline": {
        name: "Data Pipeline Agent",
        model: "@cf/meta/llama-4-scout-17b-16e-instruct",
        steps: [
          "Loading schema into durable memory: {userId, amount, timestamp, status}",
          "Spawning 4 parallel validation isolates...",
          `[${generateIsolateId()}] Batch 1 (records 1-250): 248 valid, 2 schema errors`,
          `[${generateIsolateId()}] Batch 2 (records 251-500): 250 valid, 0 errors`,
          `[${generateIsolateId()}] Batch 3 (records 501-750): 244 valid, 6 type mismatches`,
          `[${generateIsolateId()}] Batch 4 (records 751-1000): 249 valid, 1 null violation`,
          "Statistical analysis pass...",
          "",
          "\x1b[32mData Quality Report:\x1b[0m",
          "  Total records: 1,000  |  Valid: 991  |  Errors: 9  |  Quality: 99.1%",
          "  amount — Mean: $142.30  |  Std: $89.42  |  Outliers: 3",
          "  status — active: 743  |  pending: 201  |  failed: 56",
          "  Flagged for review: records 87, 344, 612 (amount > 3σ)",
        ],
      },
      "deploy-validator": {
        name: "Deploy Validator",
        model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        steps: [
          "Loading deploy target: cloudflare-worker/ → production",
          "Running 4 parallel pre-flight checks...",
          `[${generateIsolateId()}] ENV CHECK: ✓ All required secrets present`,
          `[${generateIsolateId()}] TYPE CHECK: ✓ TypeScript compiled clean (0 errors)`,
          `[${generateIsolateId()}] BUNDLE: ✓ Worker size 248KB < 1MB limit`,
          `[${generateIsolateId()}] MIGRATION: ✓ D1 migrations up to date`,
          "Risk assessment: LOW — no breaking schema changes, backward-compatible API",
          "",
          "\x1b[32m✓ GO FOR DEPLOY\x1b[0m",
          "",
          "Deploy runbook:",
          "  1. wrangler deploy",
          "  2. Monitor error rate for 5min at workers.dev/analytics",
          "  3. Rollback: wrangler rollback (if error rate >1%)",
        ],
      },
    };

    const wf = workflows[wfId];
    if (!wf) {
      return {
        output: `workflow: '${wfId}' not found\nRun 'workflow list' to see available workflows.`,
        exitCode: 1,
        timeMs: 10,
      };
    }

    return {
      output: `\x1b[32m▶ Running workflow: ${wf.name}\x1b[0m
Model: ${wf.model}
${"─".repeat(52)}

${wf.steps.join("\n")}

${"─".repeat(52)}
\x1b[32m✓ Workflow complete\x1b[0m — ${Math.floor(Math.random() * 30 + 20)}s | ${Math.floor(Math.random() * 50000 + 20000)} tokens`,
      exitCode: 0,
      timeMs: Date.now() - startTime + 1200,
    };
  }

  // --- chat command ---
  if (cmd.startsWith("chat ")) {
    const message = command.slice(5).trim();
    const isolateId = generateIsolateId();
    const responses: Array<{ match: string; reply: string }> = [
      {
        match: "hello",
        reply: "Hello! I'm your OpenClaw AI agent running on Cloudflare Workers AI. I have persistent memory via Durable Objects and can spawn parallel V8 isolates for complex tasks. What would you like me to help with today?",
      },
      {
        match: "durable object",
        reply: "Durable Objects are Cloudflare's strongly-consistent stateful compute primitive. Each OpenClaw session is backed by a Durable Object with a SQLite database — your memory, config, and history all persist there across agent restarts. The magic: the DO runs co-located with the request for low latency.",
      },
      {
        match: "parallel",
        reply: "Parallel execution is a core feature! Use `parallel N <task>` to fan out N V8 isolates simultaneously. Each isolate is completely sandboxed with network disabled (globalOutbound: null). Results stream back as workers finish. Great for analysis tasks, multi-model comparison, or batch processing.",
      },
      {
        match: "model",
        reply: "I can use any of 100+ Workers AI models. The default is @cf/meta/llama-4-scout-17b-16e-instruct (free, 131k context, vision + function calling). For heavy reasoning use @cf/deepseek-ai/deepseek-r1-distill-qwen-32b. For code, @cf/qwen/qwen2.5-coder-32b-instruct. Switch with: model @cf/author/name",
      },
      {
        match: "cloudflare",
        reply: "Cloudflare's edge network spans 300+ cities. Your agent runs at the PoP closest to your users, meaning sub-10ms latency for most of the world. Workers AI models also run on Cloudflare's GPU network globally — no cold starts, no container overhead. V8 isolates start in <5ms.",
      },
    ];

    const matched = responses.find(r => message.toLowerCase().includes(r.match));
    const reply = matched?.reply || `I processed your message: "${message}"\n\nAs an OpenClaw agent, I'm running in a V8 isolate with access to Workers AI. I can help with code analysis, research, data processing, and more. Try 'workflow list' to see pre-built agentic workflows, or just describe what you want to accomplish.`;

    return {
      output: `[${isolateId}] Processing via Workers AI...
\x1b[90m────────────────────────────────────────────────\x1b[0m
${reply}
\x1b[90m────────────────────────────────────────────────\x1b[0m
\x1b[90m[${Math.floor(Math.random() * 800 + 200)}ms | ${Math.floor(Math.random() * 500 + 100)} tokens]\x1b[0m`,
      exitCode: 0,
      timeMs: Date.now() - startTime + Math.floor(Math.random() * 800 + 300),
    };
  }

  // --- remember command ---
  if (cmd.startsWith("remember ")) {
    const rest = command.slice("remember ".length).trim();
    const colonIdx = rest.indexOf(":");
    if (colonIdx === -1) {
      return { output: `Usage: remember <key>: <value>`, exitCode: 1, timeMs: 5 };
    }
    const key = rest.slice(0, colonIdx).trim();
    const val = rest.slice(colonIdx + 1).trim();
    return {
      output: `\x1b[32m✓ Memory updated\x1b[0m
Key:   ${key}
Value: ${val}

Persisted to Durable Object SQLite. Available to all subsequent commands in this session.`,
      exitCode: 0,
      timeMs: Date.now() - startTime + 15,
    };
  }

  // --- parallel command ---
  if (cmd.startsWith("parallel ")) {
    const parts = command.slice("parallel ".length).trim().split(" ");
    const n = Math.min(parseInt(parts[0]) || 3, 10);
    const task = parts.slice(1).join(" ") || "analyze data";
    const isolates = Array.from({ length: n }, () => generateIsolateId());
    const completionTimes = isolates.map(() => Math.floor(Math.random() * 800 + 200));
    const sorted = [...isolates].map((id, i) => ({ id, time: completionTimes[i] })).sort((a, b) => a.time - b.time);

    return {
      output: `Dispatching ${n} parallel V8 isolates...

${isolates.map((id, i) => `[${id}] Isolate ${i + 1} initialized in ${Math.floor(Math.random() * 5 + 2)}ms → ${task}`).join("\n")}

\x1b[90mAll ${n} isolates running concurrently...\x1b[0m

${sorted.map(({ id, time }, i) => `[${id}] ✓ Completed in ${time}ms — result: {"status":"ok","part":${i + 1},"tokens":${Math.floor(Math.random() * 800 + 200)}}`).join("\n")}

\x1b[32mAll ${n} isolates complete\x1b[0m
Total wall time: ${Math.max(...completionTimes)}ms | Sequential equivalent: ${completionTimes.reduce((a, b) => a + b, 0)}ms
Speedup: \x1b[33m${(completionTimes.reduce((a, b) => a + b, 0) / Math.max(...completionTimes)).toFixed(1)}x\x1b[0m`,
      exitCode: 0,
      timeMs: Date.now() - startTime + Math.max(...completionTimes),
    };
  }

  // --- model command ---
  if (cmd.startsWith("model ")) {
    const newModel = command.slice(6).trim();
    if (!newModel.startsWith("@cf/")) {
      return {
        output: `Invalid model ID. Models must start with @cf/\nExample: model @cf/meta/llama-4-scout-17b-16e-instruct\nRun 'models' to see all options.`,
        exitCode: 1,
        timeMs: 10,
      };
    }
    return {
      output: `\x1b[32m✓ Model updated\x1b[0m
Previous: @cf/meta/llama-4-scout-17b-16e-instruct
Current:  ${newModel}

Persisted to durable memory CONFIG. All subsequent requests use this model.`,
      exitCode: 0,
      timeMs: Date.now() - startTime + 25,
    };
  }

  // --- history command ---
  if (cmd === "history") {
    const commands = ["help", "models", "whoami", "status", "chat Hello", "parallel 3 analyze code", "workflow list", "remember context: test project", "version"];
    return {
      output: `Last 9 commands:

#   TIME        EXIT  CMD
${commands.map((c, i) => `${String(i + 1).padStart(3)}  ${new Date(Date.now() - (commands.length - i) * 30000).toLocaleTimeString()}   0     ${c}`).join("\n")}

Run any command again by typing it. Use Ctrl+C to cancel running tasks.`,
      exitCode: 0,
      timeMs: Date.now() - startTime + 20,
    };
  }

  // --- ping command ---
  if (cmd.startsWith("ping")) {
    return {
      output: `ping: network access denied
Sandbox policy: globalOutbound = null
Rationale: Prevents AI-generated code from exfiltrating data.
All outbound calls must go through the Agent's tool-calling interface.`,
      exitCode: 1,
      timeMs: 5,
    };
  }

  if (cmd.startsWith("run ")) {
    const taskName = cmd.slice(4).trim() || "unnamed-task";
    const isolateId = generateIsolateId();
    return {
      output: `[${isolateId}] Spawning new V8 isolate for task: "${taskName}"
[${isolateId}] Isolate initialized in 7ms
[${isolateId}] Task dispatched to worker pool
[${isolateId}] Executing...
[${isolateId}] Task completed successfully
[${isolateId}] Result: {"status":"success","output":"Task '${taskName}' processed"}
[${isolateId}] Isolate destroyed. Memory reclaimed.`,
      exitCode: 0,
      timeMs: Date.now() - startTime + 350,
    };
  }

  if (cmd.startsWith("analyze ")) {
    const count = parseInt(cmd.split(" ")[1]) || 3;
    const safeCount = Math.min(count, 10);
    const isolates = Array.from({ length: safeCount }, () => generateIsolateId());
    const lines = [
      `Spawning ${safeCount} parallel V8 isolates...`,
      ...isolates.map((id, i) => `[${id}] Isolate ${i + 1} initialized → Processing file_${i + 1}.json`),
      ``,
      `All ${safeCount} isolates running in parallel...`,
      ``,
      ...isolates.map((id, i) => `[${id}] ✓ file_${i + 1}.json analyzed → ${Math.floor(Math.random() * 1000 + 500)} tokens processed`),
      ``,
      `Synthesis: Collecting results from ${safeCount} isolates...`,
      `Final report generated. Total tokens: ${safeCount * Math.floor(Math.random() * 1000 + 500)}`,
    ];
    return {
      output: lines.join("\n"),
      exitCode: 0,
      timeMs: Date.now() - startTime + safeCount * 80,
    };
  }

  if (cmd.startsWith("ping ")) {
    return {
      output: `ping: network access denied
Sandbox network policy: globalOutbound = null
All outbound connections are blocked for security.
Use the agent's built-in tool-calling to access external resources.`,
      exitCode: 1,
    };
  }

  if (cmd === "") {
    return { output: "", exitCode: 0, timeMs: 1 };
  }

  return {
    output: `agent-sh: command not found: ${command.split(" ")[0]}
Type 'help' for available commands.`,
    exitCode: 127,
    timeMs: Date.now() - startTime + 10,
  };
}

router.get("/sessions", async (req, res) => {
  const sessions = await db.select().from(sessionsTable);
  res.json(sessions.map(generateSessionResponse));
});

router.post("/sessions", async (req, res) => {
  const { name, model } = req.body;
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "validation_error", message: "name is required" });
    return;
  }

  const id = randomUUID();
  const [session] = await db.insert(sessionsTable).values({
    id,
    name: name.trim(),
    model: model || "@cf/meta/llama-4-scout-17b-16e-instruct",
    status: "initializing",
    plan: "free",
    taskCount: 0,
    memoryUsage: Math.random() * 10 + 5,
  }).returning();

  setTimeout(async () => {
    await db.update(sessionsTable)
      .set({ status: "active" })
      .where(eq(sessionsTable.id, id));
  }, 1500);

  res.status(201).json(generateSessionResponse(session));
});

router.get("/sessions/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
  if (!session) {
    res.status(404).json({ error: "not_found", message: "Session not found" });
    return;
  }
  res.json(generateSessionResponse(session));
});

router.delete("/sessions/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
  if (!session) {
    res.status(404).json({ error: "not_found", message: "Session not found" });
    return;
  }
  await db.update(sessionsTable).set({ status: "terminated" }).where(eq(sessionsTable.id, sessionId));
  res.json({ success: true, message: "Session terminated" });
});

router.post("/sessions/:sessionId/execute", async (req, res) => {
  const { sessionId } = req.params;
  const { command } = req.body;

  if (!command || typeof command !== "string") {
    res.status(400).json({ error: "validation_error", message: "command is required" });
    return;
  }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
  if (!session) {
    res.status(404).json({ error: "not_found", message: "Session not found" });
    return;
  }

  const { output, exitCode, timeMs } = simulateCommandOutput(command);
  const taskId = generateIsolateId();

  await db.insert(historyTable).values({
    id: randomUUID(),
    sessionId,
    command,
    output,
    exitCode,
    executionTimeMs: timeMs,
  });

  await db.update(sessionsTable).set({
    lastActiveAt: new Date(),
    status: "active",
    memoryUsage: Math.random() * 50 + 10,
  }).where(eq(sessionsTable.id, sessionId));

  res.json({
    output,
    exitCode,
    executionTimeMs: timeMs,
    sessionId,
    taskId,
  });
});

router.get("/sessions/:sessionId/tasks", async (req, res) => {
  const { sessionId } = req.params;
  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.sessionId, sessionId));
  res.json(tasks.map(generateTaskResponse));
});

router.post("/sessions/:sessionId/tasks", async (req, res) => {
  const { sessionId } = req.params;
  const { description, parallel } = req.body;

  if (!description || typeof description !== "string") {
    res.status(400).json({ error: "validation_error", message: "description is required" });
    return;
  }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
  if (!session) {
    res.status(404).json({ error: "not_found", message: "Session not found" });
    return;
  }

  const taskId = randomUUID();
  const isolateId = generateIsolateId();

  const [task] = await db.insert(tasksTable).values({
    id: taskId,
    sessionId,
    description,
    status: "running",
    isolateId,
  }).returning();

  await db.update(sessionsTable)
    .set({ taskCount: (session.taskCount || 0) + 1 })
    .where(eq(sessionsTable.id, sessionId));

  const execTime = Math.floor(Math.random() * 2000 + 500);
  setTimeout(async () => {
    await db.update(tasksTable).set({
      status: "completed",
      output: `Task "${description}" completed successfully. Processed by isolate ${isolateId}.`,
      executionTimeMs: execTime,
      completedAt: new Date(),
    }).where(eq(tasksTable.id, taskId));
  }, execTime);

  res.status(201).json(generateTaskResponse(task));
});

router.get("/sessions/:sessionId/tasks/:taskId", async (req, res) => {
  const { sessionId, taskId } = req.params;
  const [task] = await db.select().from(tasksTable)
    .where(eq(tasksTable.id, taskId));
  if (!task || task.sessionId !== sessionId) {
    res.status(404).json({ error: "not_found", message: "Task not found" });
    return;
  }
  res.json(generateTaskResponse(task));
});

router.get("/sessions/:sessionId/history", async (req, res) => {
  const { sessionId } = req.params;
  const entries = await db.select().from(historyTable)
    .where(eq(historyTable.sessionId, sessionId));
  res.json(entries.map(generateHistoryResponse));
});

export default router;
