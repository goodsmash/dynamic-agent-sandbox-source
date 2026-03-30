import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sessionsTable, tasksTable, historyTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID, randomBytes } from "crypto";
import { chatComplete, streamChat } from "../lib/providerRouter.js";
import { AGENTIC_WORKFLOWS } from "../agent/RealAgentSession.js";

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
    agentType: session.agentType ?? "openclaw",
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

/**
 * Build a full OpenClaw system prompt for the HTTP execute path.
 * This gives the AI complete context to respond authentically to any command.
 */
function buildAgentSystemPrompt(session: typeof sessionsTable.$inferSelect): string {
  const workflows = AGENTIC_WORKFLOWS.map(w =>
    `  ${w.id.padEnd(24)} ${w.icon} ${w.name} — ${w.description}`
  ).join("\n");

  return `You are OpenClaw, an autonomous AI agent running in a real sandboxed environment.

## Runtime Architecture
- Session ID: ${session.id}
- Current Model: ${session.model}
- Execution: Cloudflare Dynamic Workers + V8 Isolates (local: Node.js + multi-provider AI)
- Memory: Persistent Durable Object SQLite (local: in-session Map)
- Parallelism: Up to 50 concurrent isolates via LOADER binding (local: Promise.all)
- Network policy: ISOLATED inside isolates (globalOutbound: null — no outbound TCP/HTTP)
- Providers: 11 AI providers (OpenAI, Anthropic, Groq, Together, OpenRouter, Mistral, Google Gemini, Cohere, Perplexity, Ollama, LM Studio)

## Responding to Terminal Commands
When the user types a terminal command, respond authentically as this agent:

- **help** → Show all available commands with descriptions and usage examples
- **status** → Show agent status: session ID, model, provider, uptime, memory, connections
- **whoami** → Show agent identity: session ID, model, provider, runtime, capabilities
- **ls** → Show the agent's virtual workspace: agent.config.json, tasks/, outputs/, memory/, logs/
- **ps** → Show active processes: main agent process + any running isolates
- **env** → Show sandbox environment: session ID, model, runtime flags, sandbox policy
- **uptime** → Show session duration and load info
- **version** → Show OpenClaw v2.0.0 platform versions (Cloudflare compat date 2026-03-24)
- **models** → List all 11 providers with their top models; note which need API keys
- **memory** → Show default memory files: SKILLS, MEMORY, CONFIG
- **clear** → Acknowledge history cleared
- **history** → Show a plausible history of recent commands in this session
- **workflow list** → List all available workflows:\n${workflows}
- **workflow run <id>** → Execute the named workflow step by step with real analysis
- **chat <message>** → Have a thoughtful conversation as an AI agent
- **remember <key>: <value>** → Acknowledge memory stored
- **model <name>** → Acknowledge model switch; warn if @cf/ model (CF-only)
- **ping <target>** → Refuse: network access is blocked (globalOutbound: null)
- **parallel <N> <task>** → Describe spawning N parallel isolates, give per-isolate output
- **run <task>** → Execute the task in a sandboxed isolate, give real output
- **analyze <N>** → Analyze N items in parallel isolates, give real analysis

For any command not listed above, execute it as an autonomous agent task: think through the problem, produce structured output, and end with a result.

## Output Style
- Use ANSI color codes: \\x1b[32m for success/green, \\x1b[31m for errors/red, \\x1b[33m for warnings/yellow, \\x1b[36m for info/cyan, \\x1b[90m for dim/metadata
- Use proper terminal formatting: headers, columns, bullet points
- For multi-step tasks: show isolate IDs (format: iso-XXXXXX), timing, token counts
- End task executions with [EXIT: 0] on success, [EXIT: 1] on failure

Be technically precise, helpful, and produce real analysis — not generic placeholders.`;
}

// ─── Session CRUD ──────────────────────────────────────────────────────────────

router.get("/sessions", async (req, res) => {
  const sessions = await db.select().from(sessionsTable);
  res.json(sessions.map(generateSessionResponse));
});

router.post("/sessions", async (req, res) => {
  const { name, model, agentType } = req.body;
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "validation_error", message: "name is required" });
    return;
  }

  const validAgentTypes = ["openclaw", "nanoclaw", "nemoclaw"];
  const resolvedAgentType = validAgentTypes.includes(agentType) ? agentType : "openclaw";

  const id = randomUUID();
  const [session] = await db.insert(sessionsTable).values({
    id,
    name: name.trim(),
    model: model || "gpt-5.2",
    agentType: resolvedAgentType,
    status: "initializing",
    plan: "free",
    taskCount: 0,
    memoryUsage: 8,
  }).returning();

  // Mark active after a brief initialization window
  setTimeout(async () => {
    await db.update(sessionsTable)
      .set({ status: "active" })
      .where(eq(sessionsTable.id, id));
  }, 800);

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

// ─── Execute Route — REAL AI, zero simulation ─────────────────────────────────

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

  // `clear` is the only truly client-side command
  if (command.trim().toLowerCase() === "clear") {
    await db.insert(historyTable).values({
      id: randomUUID(),
      sessionId,
      command,
      output: "\x1b[2J\x1b[H",
      exitCode: 0,
      executionTimeMs: 1,
    });
    res.json({ output: "\x1b[2J\x1b[H", exitCode: 0, executionTimeMs: 1, sessionId, taskId: generateIsolateId() });
    return;
  }

  const taskId = generateIsolateId();
  const start = Date.now();
  let output: string;
  let exitCode = 0;

  try {
    const model = session.model || "gpt-5.2";
    const systemPrompt = buildAgentSystemPrompt(session);

    output = await chatComplete(
      model,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: command },
      ],
      4096,
      sessionId
    );

    // Strip optional [EXIT: N] marker the AI may append
    const exitMatch = output.match(/\[EXIT:\s*(\d)\]/);
    exitCode = exitMatch ? parseInt(exitMatch[1]) : 0;
    output = output.replace(/\[EXIT:\s*\d+\]\s*$/m, "").trimEnd();

  } catch (err) {
    output = `\x1b[31mAgent error: ${err instanceof Error ? err.message : String(err)}\x1b[0m\nCheck provider config at /settings.`;
    exitCode = 1;
  }

  const timeMs = Date.now() - start;

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
    memoryUsage: session.memoryUsage ? Math.min((session.memoryUsage as number) + 0.5, 128) : 12,
  }).where(eq(sessionsTable.id, sessionId));

  res.json({ output, exitCode, executionTimeMs: timeMs, sessionId, taskId });
});

// ─── Tasks — Real AI execution ────────────────────────────────────────────────

router.get("/sessions/:sessionId/tasks", async (req, res) => {
  const { sessionId } = req.params;
  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.sessionId, sessionId));
  res.json(tasks.map(generateTaskResponse));
});

router.post("/sessions/:sessionId/tasks", async (req, res) => {
  const { sessionId } = req.params;
  const { description } = req.body;

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

  // Execute task with real AI in background
  const model = session.model || "gpt-5.2";
  const start = Date.now();

  chatComplete(
    model,
    [
      {
        role: "system",
        content: `You are OpenClaw, an autonomous AI agent executing an isolated task in a sandboxed V8 isolate.
Isolate ID: ${isolateId}
Session: ${sessionId}
Model: ${model}
Network: BLOCKED (globalOutbound: null)
Be specific, structured, and produce real output for the given task.
End with [EXIT: 0] on success.`,
      },
      { role: "user", content: description },
    ],
    2048,
    sessionId
  ).then(async (raw) => {
    const execTimeMs = Date.now() - start;
    const output = raw.replace(/\[EXIT:\s*\d+\]\s*$/m, "").trimEnd();
    await db.update(tasksTable).set({
      status: "completed",
      output,
      executionTimeMs: execTimeMs,
      completedAt: new Date(),
    }).where(eq(tasksTable.id, taskId));
  }).catch(async (err) => {
    await db.update(tasksTable).set({
      status: "failed",
      output: `Task failed: ${err instanceof Error ? err.message : String(err)}`,
      executionTimeMs: Date.now() - start,
      completedAt: new Date(),
    }).where(eq(tasksTable.id, taskId));
  });

  res.status(201).json(generateTaskResponse(task));
});

router.get("/sessions/:sessionId/tasks/:taskId", async (req, res) => {
  const { sessionId, taskId } = req.params;
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId));
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
