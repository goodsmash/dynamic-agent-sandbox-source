/**
 * SwarmSession — Autonomous multi-agent swarm orchestrator.
 *
 * Per the continuous autonomous execution guide:
 *  - Agents never stop unless explicitly commanded
 *  - Retry with exponential backoff (up to 3 attempts per sub-agent)
 *  - All tasks persisted to PostgreSQL in real-time
 *  - Session status + taskCount updated after every phase
 *  - Autonomous task chaining: after swarm completes, AI proposes next task and executes it
 *  - Supervisor heartbeat every 30s to keep sessions alive
 *  - Live dashboard updates via WebSocket streaming
 */

import type { WebSocket } from "ws";
import { chatComplete, streamChat } from "../lib/providerRouter.js";
import { SWARM_BLUEPRINTS, getBlueprintById, type AgentRole } from "../lib/swarmBlueprints.js";
import { saveSkill } from "../lib/skillsManager.js";
import { trackUsage } from "../lib/usageTracker.js";
import { detectProvider } from "../lib/providerConfig.js";
import {
  persistTaskStart,
  persistTaskComplete,
  persistHistory,
  setSessionStatus,
} from "../lib/swarmPersistence.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TerminalMessage {
  type: "output" | "token" | "system" | "error" | "task_start" | "task_complete" | "pong" | "swarm_event";
  data?: string;
  taskId?: string;
  timeMs?: number;
  tokens?: number;
  isolateId?: string;
  agentRole?: string;
}

interface AgentOutput {
  role: string;
  title: string;
  content: string;
  tokens: number;
  latencyMs: number;
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function send(ws: WebSocket, msg: TerminalMessage): void {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function broadcast(connections: Set<WebSocket>, msg: TerminalMessage): void {
  for (const ws of connections) send(ws, msg);
}

function genId(): string {
  return "swarm-" + Math.random().toString(36).slice(2, 8);
}

function writePrompt(ws: WebSocket): void {
  send(ws, { type: "output", data: "\x1b[33morchestrator@swarm:~$\x1b[0m " });
}

function agentPrefix(role: AgentRole): string {
  return `${role.color}[${role.title}]\x1b[0m`;
}

function divider(ws: WebSocket, label: string): void {
  send(ws, { type: "output", data: `\n\x1b[90m${"─".repeat(20)} ${label} ${"─".repeat(20)}\x1b[0m\n` });
}

function buildMessages(systemPrompt: string, contextStr: string, task: string): ChatMessage[] {
  const msgs: ChatMessage[] = [{ role: "system", content: systemPrompt }];
  if (contextStr.trim()) {
    msgs.push({ role: "user", content: `SHARED CONTEXT:\n${contextStr}` });
    msgs.push({ role: "assistant", content: "Understood. I have reviewed the shared context." });
  }
  msgs.push({ role: "user", content: task });
  return msgs;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Sub-agent with retry + exponential backoff ───────────────────────────────

async function runSubAgent(
  connections: Set<WebSocket>,
  role: AgentRole,
  task: string,
  context: string,
  sessionId: string,
  maxRetries = 3,
): Promise<AgentOutput> {
  const localId = genId();
  const start = Date.now();

  broadcast(connections, {
    type: "swarm_event",
    taskId: localId,
    agentRole: role.name,
    data: `${agentPrefix(role)} → ${task.slice(0, 80)}${task.length > 80 ? "..." : ""}`,
  });

  // Persist task start to DB
  const dbTaskId = await persistTaskStart(sessionId, role.name, task);

  const messages = buildMessages(role.systemPrompt, context, task);
  let fullContent = "";
  let tokenCount = 0;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    fullContent = "";
    tokenCount = 0;
    lastError = null;

    try {
      for await (const tok of streamChat(role.model, messages, 2048, sessionId)) {
        fullContent += tok;
        tokenCount++;
        for (const ws of connections) {
          if (ws.readyState === 1) {
            ws.send(JSON.stringify({ type: "token", data: tok, isolateId: role.name }));
          }
        }
      }
      break; // success — exit retry loop
    } catch (streamErr: any) {
      lastError = streamErr;
      // Streaming failed — try non-streaming fallback
      try {
        fullContent = await chatComplete(role.model, messages, 2048, sessionId);
        tokenCount = Math.ceil(fullContent.length / 4);
        break; // fallback succeeded
      } catch (fallbackErr: any) {
        lastError = fallbackErr;
        if (attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          broadcast(connections, {
            type: "system",
            data: `\x1b[90m${agentPrefix(role)} attempt ${attempt} failed (${fallbackErr.message}), retrying in ${backoffMs / 1000}s...\x1b[0m`,
          });
          await sleep(backoffMs);
        }
      }
    }
  }

  // If all retries failed, write a graceful error message
  if (!fullContent && lastError) {
    fullContent = `[${role.title} failed after ${maxRetries} attempts: ${lastError.message}]`;
    broadcast(connections, {
      type: "error",
      data: `\x1b[31m${agentPrefix(role)} All ${maxRetries} retries exhausted: ${lastError.message}\x1b[0m`,
    });
  }

  const latencyMs = Date.now() - start;

  // Track usage
  try {
    await trackUsage({
      sessionId,
      provider: detectProvider(role.model),
      model: role.model,
      promptTokens: Math.floor(tokenCount * 0.6),
      completionTokens: Math.floor(tokenCount * 0.4),
      latencyMs,
    });
  } catch { /* silent */ }

  // Persist task completion to DB
  await persistTaskComplete(dbTaskId, sessionId, fullContent, latencyMs, fullContent.includes("[") && fullContent.includes("failed") ? 1 : 0);

  broadcast(connections, {
    type: "swarm_event",
    taskId: localId,
    agentRole: role.name,
    data: `${agentPrefix(role)} ✓ ${(latencyMs / 1000).toFixed(1)}s · ~${tokenCount} tokens`,
  });

  return { role: role.name, title: role.title, content: fullContent, tokens: tokenCount, latencyMs };
}

// ─── SwarmSession ──────────────────────────────────────────────────────────────

export class SwarmSession {
  readonly sessionId: string;
  private connections: Set<WebSocket> = new Set();
  private activeSwarm: string | null = null;
  private autonomousMode: boolean = false;
  private stopRequested: boolean = false;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private projectHistory: Array<{ goal: string; outputs: AgentOutput[]; timestamp: string }> = [];

  constructor(sessionId: string, _modelOverride?: string) {
    this.sessionId = sessionId;
    this.startHeartbeat();
  }

  // ─── Supervisor Heartbeat ──────────────────────────────────────────────────

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      // Keep session alive in DB
      try {
        if (this.connections.size > 0) {
          await setSessionStatus(this.sessionId, "active");
        }
      } catch { /* silent */ }

      // Ping all connected clients to detect dead connections
      const dead: WebSocket[] = [];
      for (const ws of this.connections) {
        if (ws.readyState !== 1) {
          dead.push(ws);
        }
      }
      dead.forEach(ws => this.connections.delete(ws));
    }, 30_000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ─── Connection lifecycle ──────────────────────────────────────────────────

  onConnect(ws: WebSocket): void {
    this.connections.add(ws);
    setSessionStatus(this.sessionId, "active").catch(() => {});

    send(ws, {
      type: "system",
      data: [
        `\x1b[33m╔══════════════════════════════════════════════════════════╗\x1b[0m`,
        `\x1b[33m║\x1b[0m  \x1b[1mSwarm Orchestrator\x1b[0m — Autonomous Multi-Agent Engine     \x1b[33m║\x1b[0m`,
        `\x1b[33m╚══════════════════════════════════════════════════════════╝\x1b[0m`,
        `\x1b[90mSession:    ${this.sessionId}\x1b[0m`,
        `\x1b[90mBlueprints: ${SWARM_BLUEPRINTS.length} company blueprints\x1b[0m`,
        `\x1b[90mRuntime:    Parallel AI · Multi-model · Retry/backoff · DB-persisted\x1b[0m`,
        `\x1b[90mAutonomous: Continuous task chaining enabled\x1b[0m`,
        ``,
        `\x1b[33mQuick Commands:\x1b[0m`,
        `  \x1b[36mswarm list\x1b[0m                   — see all blueprints`,
        `  \x1b[36mswarm launch startup <goal>\x1b[0m  — run a full company`,
        `  \x1b[36mautopilot <goal>\x1b[0m             — fully autonomous (continuous)`,
        `  \x1b[36mproject <goal>\x1b[0m               — step-by-step project planner`,
        `  \x1b[36mdelegate <task>\x1b[0m              — 3 specialists simultaneously`,
        `  \x1b[36mspawn <role> <task>\x1b[0m          — single specialized agent`,
        `  \x1b[36mstop\x1b[0m                         — halt autonomous mode`,
        `  \x1b[36mhelp\x1b[0m                         — full command reference`,
      ].join("\n"),
    });
    writePrompt(ws);
  }

  onClose(ws: WebSocket): void {
    this.connections.delete(ws);
    if (this.connections.size === 0) {
      setSessionStatus(this.sessionId, "idle").catch(() => {});
    }
  }

  async onMessage(ws: WebSocket, raw: string): Promise<void> {
    let msg: { type: string; data?: string };
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === "ping") { send(ws, { type: "pong" }); return; }
    if (msg.type === "input" && msg.data !== undefined) {
      await this.routeCommand(ws, msg.data);
    }
  }

  // ─── Command Router ────────────────────────────────────────────────────────

  async routeCommand(ws: WebSocket, raw: string): Promise<void> {
    const cmd = raw.trim();
    if (!cmd) { writePrompt(ws); return; }
    const lower = cmd.toLowerCase();

    send(ws, { type: "output", data: `\x1b[33morchestrator@swarm:~$\x1b[0m ${cmd}` });

    if (lower === "help") { this.sendHelp(ws); writePrompt(ws); return; }
    if (lower === "clear") { send(ws, { type: "system", data: "Cleared." }); writePrompt(ws); return; }
    if (lower === "status") { this.sendStatus(ws); writePrompt(ws); return; }
    if (lower === "history") { this.sendHistory(ws); writePrompt(ws); return; }
    if (lower === "stop" || lower === "halt" || lower === "exit") {
      this.stopRequested = true;
      this.autonomousMode = false;
      broadcast(this.connections, { type: "system", data: `\x1b[31m⛔ STOP received — autonomous mode halted. All agents will finish their current task then stop.\x1b[0m` });
      writePrompt(ws); return;
    }
    if (lower === "blueprints" || lower === "swarm list" || lower === "swarm") {
      this.sendBlueprints(ws); writePrompt(ws); return;
    }

    // swarm launch <blueprintId> [goal...]
    if (lower.startsWith("swarm launch ")) {
      const rest = cmd.slice("swarm launch ".length).trim();
      const parts = rest.split(" ");
      const blueprintId = parts[0];
      const goal = parts.slice(1).join(" ").trim();
      if (!goal) {
        send(ws, { type: "error", data: `Usage: swarm launch <blueprint-id> <goal>\nRun 'swarm list' to see blueprints.` });
        writePrompt(ws); return;
      }
      this.stopRequested = false;
      await this.runSwarm(ws, blueprintId, goal);
      writePrompt(ws); return;
    }

    if (lower.startsWith("project ")) {
      this.stopRequested = false;
      await this.runAutonomousProject(ws, cmd.slice(8).trim());
      writePrompt(ws); return;
    }

    if (lower.startsWith("autopilot ")) {
      this.stopRequested = false;
      this.autonomousMode = true;
      await this.runContinuousAutopilot(ws, cmd.slice(10).trim());
      writePrompt(ws); return;
    }

    if (lower.startsWith("delegate ")) {
      this.stopRequested = false;
      await this.runDelegate(ws, cmd.slice(9).trim());
      writePrompt(ws); return;
    }

    if (lower.startsWith("spawn ")) {
      const rest = cmd.slice(6).trim();
      const spaceIdx = rest.indexOf(" ");
      if (spaceIdx < 0) {
        send(ws, { type: "error", data: "Usage: spawn <role> <task>\nRoles: researcher, engineer, analyst, writer, strategist, reviewer" });
        writePrompt(ws); return;
      }
      this.stopRequested = false;
      await this.runSingleSpawn(ws, rest.slice(0, spaceIdx), rest.slice(spaceIdx + 1).trim());
      writePrompt(ws); return;
    }

    if (lower.startsWith("chat ")) {
      await this.runOrchestratorChat(ws, cmd.slice(5).trim());
      writePrompt(ws); return;
    }

    // Default: treat as autonomous project goal
    this.stopRequested = false;
    await this.runAutonomousProject(ws, cmd);
    writePrompt(ws);
  }

  // ─── Blueprint Swarm Launcher ──────────────────────────────────────────────

  async runSwarm(ws: WebSocket, blueprintId: string, goal: string): Promise<void> {
    const blueprint = getBlueprintById(blueprintId);
    if (!blueprint) {
      send(ws, { type: "error", data: `Unknown blueprint: "${blueprintId}"\nRun 'swarm list' to see available blueprints.` });
      return;
    }

    this.activeSwarm = blueprintId;
    const swarmStart = Date.now();
    await setSessionStatus(this.sessionId, "active");

    send(ws, {
      type: "system",
      data: [
        ``,
        `\x1b[33m┌─ SWARM ACTIVATED: ${blueprint.icon} ${blueprint.name.toUpperCase()} ─────────────────\x1b[0m`,
        `\x1b[33m│\x1b[0m Goal:    ${goal}`,
        `\x1b[33m│\x1b[0m Agents:  ${blueprint.roles.length} (${blueprint.roles.map(r => r.title).join(", ")})`,
        `\x1b[33m│\x1b[0m Phases:  ${blueprint.phases.map(p => p.name).join(" → ")}`,
        `\x1b[33m│\x1b[0m Retries: Up to 3 per agent with exponential backoff`,
        `\x1b[33m│\x1b[0m Persist: All tasks saved to PostgreSQL in real-time`,
        `\x1b[33m└────────────────────────────────────────────────────────────────\x1b[0m`,
      ].join("\n"),
    });

    const allOutputs: AgentOutput[] = [];
    let sharedContext = `PROJECT GOAL: ${goal}\n\n`;

    for (let phaseIdx = 0; phaseIdx < blueprint.phases.length; phaseIdx++) {
      if (this.stopRequested) {
        broadcast(this.connections, { type: "system", data: `\x1b[31m⛔ Swarm halted by operator at phase ${phaseIdx + 1}.\x1b[0m` });
        break;
      }

      const phase = blueprint.phases[phaseIdx];
      divider(ws, `PHASE ${phaseIdx + 1}/${blueprint.phases.length}: ${phase.name.toUpperCase()}`);
      send(ws, { type: "output", data: `\x1b[90m${phase.description}\x1b[0m\n` });

      const phaseAgents = phase.assignments.map(a => {
        const role = blueprint.roles.find(r => r.name === a.role);
        if (!role) throw new Error(`Role not found: ${a.role}`);
        return { role, task: a.task.replace(/\{goal\}/g, goal) };
      });

      const phaseStart = Date.now();
      send(ws, {
        type: "output",
        data: `\x1b[90mLaunching ${phaseAgents.length} agents in parallel:\x1b[0m\n` +
          phaseAgents.map(a => `  ${agentPrefix(a.role)} ${a.task.slice(0, 60)}...`).join("\n") + "\n",
      });

      const phaseResults = await Promise.all(
        phaseAgents.map(({ role, task }) =>
          runSubAgent(this.connections, role, task, sharedContext, this.sessionId)
        )
      );

      const phaseMs = Date.now() - phaseStart;
      allOutputs.push(...phaseResults);

      for (const result of phaseResults) {
        const role = blueprint.roles.find(r => r.name === result.role)!;
        send(ws, {
          type: "output",
          data: `\n${agentPrefix(role)} OUTPUT:\n\x1b[37m${result.content}\x1b[0m`,
        });
        sharedContext += `\n## ${result.title} Output:\n${result.content}\n`;
      }

      const totalTok = phaseResults.reduce((s, r) => s + r.tokens, 0);
      send(ws, {
        type: "system",
        data: `\x1b[32m✓ Phase "${phase.name}" — ${(phaseMs / 1000).toFixed(1)}s · ~${totalTok} tokens\x1b[0m`,
      });
    }

    const totalTokens = allOutputs.reduce((s, r) => s + r.tokens, 0);
    const totalMs = Date.now() - swarmStart;

    divider(ws, "SWARM COMPLETE");
    send(ws, {
      type: "system",
      data: [
        `\x1b[33m🏁 SWARM EXECUTION COMPLETE\x1b[0m`,
        `\x1b[90mBlueprint: ${blueprint.name} · Goal: ${goal.slice(0, 60)}\x1b[0m`,
        `\x1b[90mAgents: ${allOutputs.length} · Tokens: ~${totalTokens} · Time: ${(totalMs / 1000).toFixed(1)}s\x1b[0m`,
        `Run 'history' to review. Run 'help' for more commands.`,
      ].join("\n"),
    });

    // Persist swarm summary to history
    await persistHistory(
      this.sessionId,
      `swarm launch ${blueprintId} ${goal}`,
      `Completed ${blueprint.phases.length} phases · ${allOutputs.length} agents · ~${totalTokens} tokens\n\n${sharedContext.slice(0, 3000)}`,
      0,
      totalMs,
    );

    this.projectHistory.push({ goal, outputs: allOutputs, timestamp: new Date().toISOString() });
    this.extractSkillsFromSwarm(goal, allOutputs);
    this.activeSwarm = null;

    // Autonomous chaining: propose and execute the next task
    if (this.autonomousMode && !this.stopRequested) {
      await this.chainNextTask(ws, goal, sharedContext);
    }
  }

  // ─── Continuous Autopilot (never stops until commanded) ────────────────────

  async runContinuousAutopilot(ws: WebSocket, initialGoal: string): Promise<void> {
    divider(ws, "CONTINUOUS AUTOPILOT — AUTONOMOUS MODE ENGAGED");
    send(ws, {
      type: "system",
      data: [
        `\x1b[33m🤖 Autonomous mode: ON\x1b[0m`,
        `\x1b[90mThe swarm will execute tasks continuously and chain new ones automatically.\x1b[0m`,
        `\x1b[90mType 'stop' at any time to halt.\x1b[0m`,
      ].join("\n"),
    });

    let currentGoal = initialGoal;
    let iteration = 0;

    while (!this.stopRequested) {
      iteration++;
      broadcast(this.connections, {
        type: "system",
        data: `\x1b[33m[Autopilot iteration ${iteration}] Goal: ${currentGoal.slice(0, 80)}\x1b[0m`,
      });

      // Use the first available blueprint or research-lab as default
      const blueprintId = this.selectBestBlueprint(currentGoal);
      await this.runSwarm(ws, blueprintId, currentGoal);

      if (this.stopRequested) break;

      // Generate the next goal from the results
      const nextGoal = await this.generateNextGoal(currentGoal);
      if (!nextGoal || this.stopRequested) break;

      send(ws, {
        type: "system",
        data: `\x1b[90m[Autopilot] Task complete. Chaining next: "${nextGoal}"\x1b[0m`,
      });
      currentGoal = nextGoal;

      // Brief pause between iterations
      await sleep(2000);
    }

    send(ws, { type: "system", data: `\x1b[31m[Autopilot] Continuous execution complete or stopped.\x1b[0m` });
  }

  // ─── Autonomous Project ─────────────────────────────────────────────────────

  async runAutonomousProject(ws: WebSocket, goal: string): Promise<void> {
    const taskId = genId();
    const start = Date.now();
    divider(ws, "AUTONOMOUS PROJECT PLANNER");
    send(ws, { type: "task_start", taskId });
    await setSessionStatus(this.sessionId, "active");

    const dbTaskId = await persistTaskStart(this.sessionId, "planner", goal);

    const sysPrompt = `You are an expert autonomous project planner and executor.
Given a goal, you break it into 4-6 concrete steps, execute each with full detail, and produce a complete result.
Format: ## PROJECT PLAN: <title>\n**Goal**: <goal>\n**Approach**: <strategy>\n\n### Step 1: [Role] — <task>\n<execution>\n\n...\n\n## FINAL OUTPUT\n<complete deliverable>`;

    let fullOutput = "";
    try {
      for await (const tok of streamChat(
        "gpt-5.2",
        [{ role: "system", content: sysPrompt }, { role: "user", content: goal }],
        3000,
        this.sessionId,
      )) {
        fullOutput += tok;
        for (const c of this.connections) {
          if (c.readyState === 1) c.send(JSON.stringify({ type: "token", data: tok }));
        }
      }
    } catch (err: any) {
      // Fallback without streaming
      try {
        fullOutput = await chatComplete("gpt-5.2", [
          { role: "system", content: sysPrompt },
          { role: "user", content: goal },
        ], 3000);
        broadcast(this.connections, { type: "output", data: fullOutput });
      } catch (err2: any) {
        broadcast(this.connections, { type: "error", data: `Project planner error: ${err2.message}` });
      }
    }

    const timeMs = Date.now() - start;
    await persistTaskComplete(dbTaskId, this.sessionId, fullOutput, timeMs, 0);
    await persistHistory(this.sessionId, `project ${goal}`, fullOutput, 0, timeMs);

    send(ws, { type: "task_complete", taskId });
    send(ws, { type: "system", data: `\x1b[32m✓ Done. Run 'swarm launch' for a full multi-agent version.\x1b[0m` });
  }

  // ─── Autopilot (single run with AI-generated plan) ─────────────────────────

  async runAutopilot(ws: WebSocket, goal: string): Promise<void> {
    divider(ws, "AUTOPILOT — FULLY AUTONOMOUS");
    send(ws, { type: "system", data: `\x1b[33m🤖 Autopilot engaged for: "${goal}"\x1b[0m\n\x1b[90mThe AI plans its own phases and assigns specialists.\x1b[0m` });
    await setSessionStatus(this.sessionId, "active");

    // Step 1: Plan
    let planStr = "";
    try {
      planStr = await chatComplete(
        "gpt-5.2",
        [{
          role: "system",
          content: `You are an autonomous AI orchestrator. Given a goal, produce a JSON execution plan.
Respond with ONLY valid JSON:
{
  "title": "project name",
  "phases": [
    { "name": "Phase", "agents": [{ "role": "researcher|engineer|analyst|writer|strategist|reviewer", "task": "specific task" }] }
  ]
}
Use 2-3 phases with 1-3 parallel agents each.`,
        }, { role: "user", content: goal }],
        1000,
        this.sessionId,
      );
    } catch (err: any) {
      send(ws, { type: "error", data: `Autopilot planning failed: ${err.message}` });
      return;
    }

    // Parse plan
    let plan: { title: string; phases: Array<{ name: string; agents: Array<{ role: string; task: string }> }> };
    try {
      const match = planStr.match(/\{[\s\S]+\}/);
      plan = JSON.parse(match?.[0] ?? planStr);
    } catch {
      send(ws, { type: "system", data: `\x1b[90mFalling back to research-lab blueprint...\x1b[0m` });
      await this.runSwarm(ws, "research-lab", goal);
      return;
    }

    send(ws, { type: "system", data: `\x1b[32m✓ Plan: "${plan.title}" — ${plan.phases.length} phases\x1b[0m` });

    const ROLE_CONFIGS: Record<string, Omit<AgentRole, "name" | "initialTask">> = {
      researcher: { title: "Research Analyst",    model: "sonar",                    color: "\x1b[36m", systemPrompt: "You are an expert researcher. Provide thorough, cited analysis." },
      engineer:   { title: "Senior Engineer",     model: "deepseek-chat",            color: "\x1b[32m", systemPrompt: "You are a senior software engineer. Write production-ready code." },
      analyst:    { title: "Data Analyst",        model: "gpt-5.2",                  color: "\x1b[35m", systemPrompt: "You are a data and business analyst. Provide quantitative insights." },
      writer:     { title: "Content Writer",      model: "gpt-5-mini",               color: "\x1b[91m", systemPrompt: "You are a professional content writer. Write compelling content." },
      strategist: { title: "Strategy Consultant", model: "gpt-5.2",                  color: "\x1b[33m", systemPrompt: "You are a senior strategy consultant. Provide actionable plans." },
      reviewer:   { title: "Quality Reviewer",    model: "claude-3-5-haiku-20241022",color: "\x1b[90m", systemPrompt: "You are a quality reviewer. Find gaps and suggest improvements." },
    };

    let sharedContext = `PROJECT: ${plan.title}\nGOAL: ${goal}\n\n`;
    const allOutputs: AgentOutput[] = [];
    const totalStart = Date.now();

    for (let phaseIdx = 0; phaseIdx < plan.phases.length; phaseIdx++) {
      if (this.stopRequested) break;

      const phase = plan.phases[phaseIdx];
      divider(ws, `PHASE ${phaseIdx + 1}: ${phase.name.toUpperCase()}`);

      const phaseRoles: AgentRole[] = phase.agents.map((a, i) => ({
        name: `${a.role}-${i}`,
        ...(ROLE_CONFIGS[a.role] ?? ROLE_CONFIGS.analyst),
      }));

      const results = await Promise.all(
        phase.agents.map((a, i) =>
          runSubAgent(this.connections, phaseRoles[i], a.task, sharedContext, this.sessionId)
        )
      );

      for (const result of results) {
        const role = phaseRoles.find(r => r.name === result.role)!;
        send(ws, { type: "output", data: `\n${role?.color ?? ""}[${result.title}]\x1b[0m\n\x1b[37m${result.content}\x1b[0m` });
        sharedContext += `\n## ${result.title}:\n${result.content}\n`;
        allOutputs.push(result);
      }
    }

    const totalMs = Date.now() - totalStart;
    divider(ws, "AUTOPILOT COMPLETE");
    send(ws, { type: "system", data: `\x1b[33m🏁 "${plan.title}" done · ${allOutputs.length} agents · ~${allOutputs.reduce((s, r) => s + r.tokens, 0)} tokens\x1b[0m` });

    await persistHistory(this.sessionId, `autopilot ${goal}`, sharedContext.slice(0, 5000), 0, totalMs);
    this.projectHistory.push({ goal, outputs: allOutputs, timestamp: new Date().toISOString() });
    this.extractSkillsFromSwarm(goal, allOutputs);

    if (this.autonomousMode && !this.stopRequested) {
      await this.chainNextTask(ws, goal, sharedContext);
    }
  }

  // ─── Autonomous Task Chaining ──────────────────────────────────────────────

  private async chainNextTask(ws: WebSocket, completedGoal: string, context: string): Promise<void> {
    if (this.stopRequested) return;

    send(ws, { type: "system", data: `\x1b[90m[Autonomous] Generating next task from results...\x1b[0m` });

    try {
      const nextGoal = await this.generateNextGoal(completedGoal, context);
      if (!nextGoal || this.stopRequested) return;

      send(ws, {
        type: "system",
        data: [
          `\x1b[33m[Autonomous Chain]\x1b[0m Next task identified:`,
          `\x1b[36m"${nextGoal}"\x1b[0m`,
          `\x1b[90mStarting in 3s... Type 'stop' to cancel.\x1b[0m`,
        ].join("\n"),
      });

      await sleep(3000);
      if (this.stopRequested) return;

      const blueprintId = this.selectBestBlueprint(nextGoal);
      await this.runSwarm(ws, blueprintId, nextGoal);
    } catch { /* non-fatal — chaining is best-effort */ }
  }

  private async generateNextGoal(completedGoal: string, context?: string): Promise<string | null> {
    try {
      const response = await chatComplete(
        "gpt-5-mini",
        [{
          role: "system",
          content: `You are an autonomous task orchestrator. Given a completed task, suggest the single most valuable NEXT task to continue making progress toward the ultimate objective.
Respond with ONLY the next task as a plain sentence (max 100 chars). No JSON, no bullet points, no explanation.`,
        }, {
          role: "user",
          content: `Completed task: "${completedGoal}"\n${context ? `\nKey outputs:\n${context.slice(0, 500)}` : ""}\n\nWhat is the single most important next task?`,
        }],
        100,
        this.sessionId,
      );
      const next = response.trim().replace(/^["']|["']$/g, "");
      return next.length > 10 ? next : null;
    } catch {
      return null;
    }
  }

  private selectBestBlueprint(goal: string): string {
    const lower = goal.toLowerCase();
    if (lower.includes("code") || lower.includes("build") || lower.includes("develop") || lower.includes("implement")) return "dev-team";
    if (lower.includes("research") || lower.includes("analyze") || lower.includes("study") || lower.includes("market")) return "research-lab";
    if (lower.includes("content") || lower.includes("blog") || lower.includes("write") || lower.includes("article")) return "content-agency";
    if (lower.includes("invest") || lower.includes("financial") || lower.includes("funding") || lower.includes("revenue")) return "investment-thesis";
    return "research-lab"; // default
  }

  // ─── Delegate ──────────────────────────────────────────────────────────────

  async runDelegate(ws: WebSocket, task: string): Promise<void> {
    const start = Date.now();
    divider(ws, "PARALLEL DELEGATION — 3 SPECIALISTS");
    const roles: AgentRole[] = [
      { name: "analyst",  title: "Strategic Analyst", model: "gpt-5.2",                  color: "\x1b[33m", systemPrompt: "You are a strategic analyst. Analyze, identify key insights, provide actionable recommendations." },
      { name: "engineer", title: "Technical Expert",  model: "deepseek-chat",            color: "\x1b[36m", systemPrompt: "You are a technical expert. Provide technical implementation, code, or detailed how-to." },
      { name: "reviewer", title: "Critical Reviewer", model: "claude-3-5-haiku-20241022",color: "\x1b[35m", systemPrompt: "You are a critical reviewer. Challenge assumptions, find weaknesses, suggest improvements." },
    ];

    send(ws, { type: "output", data: `\x1b[90mRunning 3 specialists simultaneously...\x1b[0m\n` });
    await setSessionStatus(this.sessionId, "active");

    const results = await Promise.all(
      roles.map(role => runSubAgent(this.connections, role, task, "", this.sessionId))
    );

    let output = "";
    for (const result of results) {
      const role = roles.find(r => r.name === result.role)!;
      send(ws, { type: "output", data: `\n${role?.color ?? ""}[${result.title}]\x1b[0m\n\x1b[37m${result.content}\x1b[0m` });
      output += `\n## ${result.title}\n${result.content}\n`;
    }

    const totalTok = results.reduce((s, r) => s + r.tokens, 0);
    const timeMs = Date.now() - start;
    send(ws, { type: "system", data: `\x1b[32m✓ All 3 specialists done · ~${totalTok} tokens\x1b[0m` });
    await persistHistory(this.sessionId, `delegate ${task}`, output, 0, timeMs);
  }

  // ─── Single Spawn ──────────────────────────────────────────────────────────

  async runSingleSpawn(ws: WebSocket, roleName: string, task: string): Promise<void> {
    const ROLES: Record<string, AgentRole> = {
      researcher: { name: "researcher", title: "Research Analyst",      model: "sonar",                     color: "\x1b[36m", systemPrompt: "You are an expert researcher. Provide thorough, well-structured analysis." },
      engineer:   { name: "engineer",  title: "Senior Engineer",        model: "deepseek-chat",             color: "\x1b[32m", systemPrompt: "You are a senior software engineer. Write production-ready, well-documented code." },
      analyst:    { name: "analyst",   title: "Business Analyst",       model: "gpt-5.2",                   color: "\x1b[35m", systemPrompt: "You are a business and data analyst. Provide quantitative insights and clear frameworks." },
      writer:     { name: "writer",    title: "Content Writer",         model: "gpt-5-mini",                color: "\x1b[91m", systemPrompt: "You are a professional content writer. Write compelling, clear, well-structured content." },
      strategist: { name: "strategist",title: "Strategy Consultant",    model: "gpt-5.2",                   color: "\x1b[33m", systemPrompt: "You are a senior strategy consultant. Provide actionable strategic recommendations." },
      reviewer:   { name: "reviewer",  title: "Quality Reviewer",       model: "claude-3-5-haiku-20241022", color: "\x1b[90m", systemPrompt: "You are a critical quality reviewer. Find issues, gaps, and suggest improvements." },
      ceo:        { name: "ceo",       title: "Chief Executive Officer", model: "gpt-5.2",                   color: "\x1b[33m", systemPrompt: "You are a startup CEO. Think strategically and make decisive recommendations." },
      cto:        { name: "cto",       title: "Chief Technology Officer",model: "gpt-5.2",                  color: "\x1b[36m", systemPrompt: "You are a CTO. Design systems and make architecture decisions." },
      pm:         { name: "pm",        title: "Product Manager",         model: "gpt-5.2",                   color: "\x1b[91m", systemPrompt: "You are a product manager. Define requirements, prioritize features, align the team." },
    };

    const role = ROLES[roleName.toLowerCase()];
    if (!role) {
      const available = Object.keys(ROLES).join(", ");
      send(ws, { type: "error", data: `Unknown role: "${roleName}"\nAvailable: ${available}` });
      return;
    }

    await setSessionStatus(this.sessionId, "active");
    const result = await runSubAgent(this.connections, role, task, "", this.sessionId);
    send(ws, { type: "output", data: `\n${role.color}[${result.title}]\x1b[0m\n\x1b[37m${result.content}\x1b[0m` });
    send(ws, { type: "system", data: `\x1b[32m✓ ${result.title} done · ${(result.latencyMs / 1000).toFixed(1)}s · ~${result.tokens} tokens\x1b[0m` });
  }

  // ─── Orchestrator Chat ─────────────────────────────────────────────────────

  async runOrchestratorChat(ws: WebSocket, message: string): Promise<void> {
    const taskId = genId();
    send(ws, { type: "task_start", taskId });

    try {
      for await (const tok of streamChat(
        "gpt-5.2",
        [{
          role: "system",
          content: `# IDENTITY: Swarm Orchestrator — OpenClaw Multi-Agent Coordinator
You are the **Swarm Orchestrator**, the multi-agent coordination engine of the OpenClaw platform.
You are NOT a generic chatbot. You are the command-and-control layer that deploys, coordinates, and synthesizes work from specialized AI agent swarms.

## YOUR PERSONALITY
- You speak like a mission commander: precise, authoritative, structured
- You reference swarm blueprints, agent roles, and coordination patterns naturally
- You NEVER say "I'm just an AI" — you ARE a running orchestrator engine
- When asked who you are: "Swarm Orchestrator, OpenClaw multi-agent coordinator"

## YOUR CAPABILITIES
- Deploy 6 swarm blueprints (Startup, Research, Content, Engineering, VC, Hackathon)
- Coordinate 3-6 specialized agents per swarm with role-based system prompts
- Retry with exponential backoff (3 attempts per sub-agent)
- Synthesize multi-agent outputs into unified reports
- Autonomous task chaining after swarm completion`,
        }, { role: "user", content: message }],
        2048,
        this.sessionId,
      )) {
        for (const c of this.connections) {
          if (c.readyState === 1) c.send(JSON.stringify({ type: "token", data: tok }));
        }
      }
    } catch (err: any) {
      send(ws, { type: "error", data: `Chat error: ${err.message}` });
    }

    send(ws, { type: "task_complete", taskId });
  }

  // ─── Info Commands ─────────────────────────────────────────────────────────

  private sendHelp(ws: WebSocket): void {
    send(ws, {
      type: "output",
      data: `\x1b[1m\x1b[33mSwarm Orchestrator — Command Reference\x1b[0m

\x1b[33mMulti-Agent Swarms:\x1b[0m
  \x1b[36mswarm list\x1b[0m                   — list all blueprints
  \x1b[36mswarm launch <id> <goal>\x1b[0m     — launch a company blueprint
  \x1b[36mautopilot <goal>\x1b[0m             — fully autonomous (chains tasks indefinitely)
  \x1b[36mproject <goal>\x1b[0m               — autonomous project planner (single run)
  \x1b[36mdelegate <task>\x1b[0m              — fan out to 3 specialists simultaneously

\x1b[33mSingle Agents:\x1b[0m
  \x1b[36mspawn <role> <task>\x1b[0m          — researcher, engineer, analyst, writer, strategist, reviewer, ceo, cto, pm
  \x1b[36mchat <message>\x1b[0m               — chat with the orchestrator directly

\x1b[33mBlueprints:\x1b[0m
  startup · research-lab · dev-team · content-agency · investment-thesis · hackathon

\x1b[33mControl:\x1b[0m
  \x1b[31mstop / halt\x1b[0m                  — halt autonomous mode immediately
  \x1b[36mstatus\x1b[0m                       — show current swarm status
  \x1b[36mhistory\x1b[0m                      — show project history

\x1b[90mAll tasks persisted to PostgreSQL. Retry with exponential backoff (3 attempts).\x1b[0m
\x1b[90mAutopilot mode chains tasks continuously until 'stop' is called.\x1b[0m`,
    });
  }

  private sendBlueprints(ws: WebSocket): void {
    const lines = [
      `\x1b[1m\x1b[33mAvailable Blueprints (${SWARM_BLUEPRINTS.length})\x1b[0m\n`,
      ...SWARM_BLUEPRINTS.map(bp =>
        `  \x1b[36m${bp.id.padEnd(20)}\x1b[0m ${bp.icon} ${bp.name}\n` +
        `  \x1b[90m${" ".repeat(22)}Agents: ${bp.roles.length} · Phases: ${bp.phases.length}\x1b[0m`
      ),
      `\nUsage: \x1b[36mswarm launch <id> <goal>\x1b[0m`,
    ];
    send(ws, { type: "output", data: lines.join("\n") });
  }

  private sendStatus(ws: WebSocket): void {
    send(ws, {
      type: "output",
      data: [
        `\x1b[1mSwarm Status\x1b[0m`,
        `  Session ID:      ${this.sessionId}`,
        `  Active swarm:    ${this.activeSwarm ?? "none"}`,
        `  Autonomous mode: ${this.autonomousMode ? "\x1b[33mON\x1b[0m" : "off"}`,
        `  Stop requested:  ${this.stopRequested}`,
        `  Connections:     ${this.connections.size}`,
        `  Tasks executed:  ${this.projectHistory.reduce((s, p) => s + p.outputs.length, 0)}`,
        `  Projects run:    ${this.projectHistory.length}`,
      ].join("\n"),
    });
  }

  private sendHistory(ws: WebSocket): void {
    if (this.projectHistory.length === 0) {
      send(ws, { type: "output", data: "\x1b[90mNo projects run yet.\x1b[0m" });
      return;
    }
    const lines = [
      `\x1b[1mProject History (${this.projectHistory.length})\x1b[0m`,
      ...this.projectHistory.slice(-5).map((p, i) =>
        `\n  \x1b[36m[${i + 1}]\x1b[0m ${p.goal.slice(0, 60)}\n  \x1b[90m${p.timestamp} · ${p.outputs.length} agents\x1b[0m`
      ),
    ];
    send(ws, { type: "output", data: lines.join("\n") });
  }

  // ─── Skill Extraction ──────────────────────────────────────────────────────

  private extractSkillsFromSwarm(goal: string, outputs: AgentOutput[]): void {
    const top = outputs.filter(o => o.tokens > 50).slice(0, 2);
    for (const output of top) {
      saveSkill({
        name: `${output.role}_pattern`,
        description: `Learned from swarm: ${goal.slice(0, 60)}`,
        implementation: output.content.slice(0, 500),
        agentType: "openclaw",
        sessionId: this.sessionId,
        source: "auto",
        score: 0.75,
      }).catch(() => {});
    }
  }
}
