/**
 * SwarmSession — Autonomous multi-agent swarm orchestrator.
 *
 * Spawns N specialized sub-agents (each with a distinct role, model, and system prompt)
 * and coordinates them through structured phases. All sub-agents run real AI calls.
 * Everything streams live to the user's WebSocket terminal.
 *
 * Commands:
 *   swarm list           — show all blueprints
 *   swarm launch <id> <goal>  — launch a multi-agent company/org
 *   project <goal>       — autonomous multi-step project planner
 *   spawn <role> <task>  — spawn a single specialized agent
 *   autopilot <goal>     — fully autonomous project execution
 *   delegate <task>      — split task across 3 specialists simultaneously
 *   help                 — full command reference
 */

import type { WebSocket } from "ws";
import { chatComplete, streamChat } from "../lib/providerRouter.js";
import { SWARM_BLUEPRINTS, getBlueprintById, type AgentRole } from "../lib/swarmBlueprints.js";
import { saveSkill } from "../lib/skillsManager.js";
import { trackUsage } from "../lib/usageTracker.js";
import { detectProvider } from "../lib/providerConfig.js";

// ─── Types ─────────────────────────────────────────────────────────────────────

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

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

// ─── Sub-agent runner ─────────────────────────────────────────────────────────

async function runSubAgent(
  connections: Set<WebSocket>,
  role: AgentRole,
  task: string,
  context: string,
  sessionId: string,
): Promise<AgentOutput> {
  const taskId = genId();
  const start = Date.now();

  broadcast(connections, {
    type: "swarm_event",
    taskId,
    agentRole: role.name,
    data: `${agentPrefix(role)} → ${task.slice(0, 80)}${task.length > 80 ? "..." : ""}`,
  });

  const messages = buildMessages(role.systemPrompt, context, task);
  let fullContent = "";
  let tokenCount = 0;

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
  } catch (err: any) {
    // Fallback to non-streaming
    try {
      fullContent = await chatComplete(role.model, messages, 2048, sessionId);
      tokenCount = Math.ceil(fullContent.length / 4);
    } catch (err2: any) {
      fullContent = `[${role.title} encountered an error: ${err2.message}]`;
    }
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

  broadcast(connections, {
    type: "swarm_event",
    taskId,
    agentRole: role.name,
    data: `${agentPrefix(role)} ✓ ${(latencyMs / 1000).toFixed(1)}s · ~${tokenCount} tokens`,
  });

  return { role: role.name, title: role.title, content: fullContent, tokens: tokenCount, latencyMs };
}

// ─── SwarmSession ─────────────────────────────────────────────────────────────

export class SwarmSession {
  readonly sessionId: string;
  private connections: Set<WebSocket> = new Set();
  private activeSwarm: string | null = null;
  private projectHistory: Array<{ goal: string; outputs: AgentOutput[]; timestamp: string }> = [];

  constructor(sessionId: string, _modelOverride?: string) {
    this.sessionId = sessionId;
  }

  onConnect(ws: WebSocket): void {
    this.connections.add(ws);
    send(ws, {
      type: "system",
      data: [
        `\x1b[33m╔══════════════════════════════════════════════════════════╗\x1b[0m`,
        `\x1b[33m║\x1b[0m  \x1b[1mSwarm Orchestrator\x1b[0m — Autonomous Multi-Agent Engine     \x1b[33m║\x1b[0m`,
        `\x1b[33m╚══════════════════════════════════════════════════════════╝\x1b[0m`,
        `\x1b[90mSession:    ${this.sessionId}\x1b[0m`,
        `\x1b[90mBlueprints: ${SWARM_BLUEPRINTS.length} company blueprints\x1b[0m`,
        `\x1b[90mRuntime:    Parallel AI · Multi-model · Real outputs\x1b[0m`,
        ``,
        `\x1b[33mQuick Commands:\x1b[0m`,
        `  \x1b[36mswarm list\x1b[0m          — see all blueprints`,
        `  \x1b[36mswarm launch startup <goal>\x1b[0m  — run a full company`,
        `  \x1b[36mproject <goal>\x1b[0m      — autonomous project planner`,
        `  \x1b[36mautopilot <goal>\x1b[0m    — fully autonomous execution`,
        `  \x1b[36mdelegate <task>\x1b[0m     — 3 specialists simultaneously`,
        `  \x1b[36mspawn <role> <task>\x1b[0m — single specialized agent`,
        `  \x1b[36mhelp\x1b[0m               — full command reference`,
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
      await this.routeCommand(ws, msg.data);
    }
  }

  // ─── Command Router ───────────────────────────────────────────────────────

  async routeCommand(ws: WebSocket, raw: string): Promise<void> {
    const cmd = raw.trim();
    if (!cmd) { writePrompt(ws); return; }
    const lower = cmd.toLowerCase();

    send(ws, { type: "output", data: `\x1b[33morchestrator@swarm:~$\x1b[0m ${cmd}` });

    if (lower === "help") { this.sendHelp(ws); writePrompt(ws); return; }
    if (lower === "clear") { send(ws, { type: "system", data: "Cleared." }); writePrompt(ws); return; }
    if (lower === "status") { this.sendStatus(ws); writePrompt(ws); return; }
    if (lower === "history") { this.sendHistory(ws); writePrompt(ws); return; }
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
      await this.runSwarm(ws, blueprintId, goal);
      writePrompt(ws); return;
    }

    if (lower.startsWith("project ")) {
      await this.runAutonomousProject(ws, cmd.slice(8).trim());
      writePrompt(ws); return;
    }

    if (lower.startsWith("autopilot ")) {
      await this.runAutopilot(ws, cmd.slice(10).trim());
      writePrompt(ws); return;
    }

    if (lower.startsWith("delegate ")) {
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
      await this.runSingleSpawn(ws, rest.slice(0, spaceIdx), rest.slice(spaceIdx + 1).trim());
      writePrompt(ws); return;
    }

    if (lower.startsWith("chat ")) {
      await this.runOrchestratorChat(ws, cmd.slice(5).trim());
      writePrompt(ws); return;
    }

    // Default: treat as project goal
    await this.runAutonomousProject(ws, cmd);
    writePrompt(ws);
  }

  // ─── Swarm Launcher ───────────────────────────────────────────────────────

  async runSwarm(ws: WebSocket, blueprintId: string, goal: string): Promise<void> {
    const blueprint = getBlueprintById(blueprintId);
    if (!blueprint) {
      send(ws, { type: "error", data: `Unknown blueprint: "${blueprintId}"\nRun 'swarm list' to see available blueprints.` });
      return;
    }

    this.activeSwarm = blueprintId;

    send(ws, {
      type: "system",
      data: [
        ``,
        `\x1b[33m┌─ SWARM ACTIVATED: ${blueprint.icon} ${blueprint.name.toUpperCase()} ─────────────────\x1b[0m`,
        `\x1b[33m│\x1b[0m Goal:   ${goal}`,
        `\x1b[33m│\x1b[0m Agents: ${blueprint.roles.length} (${blueprint.roles.map(r => r.title).join(", ")})`,
        `\x1b[33m│\x1b[0m Phases: ${blueprint.phases.map(p => p.name).join(" → ")}`,
        `\x1b[33m└────────────────────────────────────────────────────────────────\x1b[0m`,
      ].join("\n"),
    });

    const allOutputs: AgentOutput[] = [];
    let sharedContext = `PROJECT GOAL: ${goal}\n\n`;

    for (let phaseIdx = 0; phaseIdx < blueprint.phases.length; phaseIdx++) {
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
    divider(ws, "SWARM COMPLETE");
    send(ws, {
      type: "system",
      data: [
        `\x1b[33m🏁 SWARM EXECUTION COMPLETE\x1b[0m`,
        `\x1b[90mBlueprint: ${blueprint.name} · Goal: ${goal.slice(0, 60)}\x1b[0m`,
        `\x1b[90mAgents: ${allOutputs.length} · Tokens: ~${totalTokens}\x1b[0m`,
        `Run 'history' to review. Run 'help' for more commands.`,
      ].join("\n"),
    });

    this.projectHistory.push({ goal, outputs: allOutputs, timestamp: new Date().toISOString() });
    this.extractSkillsFromSwarm(goal, allOutputs);
    this.activeSwarm = null;
  }

  // ─── Autonomous Project ────────────────────────────────────────────────────

  async runAutonomousProject(ws: WebSocket, goal: string): Promise<void> {
    const taskId = genId();
    divider(ws, "AUTONOMOUS PROJECT PLANNER");
    send(ws, { type: "task_start", taskId });

    const sysPrompt = `You are an expert autonomous project planner and executor.
Given a goal, you break it into 4-6 concrete steps, execute each with full detail, and produce a complete result.
Format: ## PROJECT PLAN: <title>\n**Goal**: <goal>\n**Approach**: <strategy>\n\n### Step 1: [Role] — <task>\n<execution>\n\n...\n\n## FINAL OUTPUT\n<complete deliverable>`;

    try {
      for await (const tok of streamChat(
        "gpt-5.2",
        [{ role: "system", content: sysPrompt }, { role: "user", content: goal }],
        3000,
        this.sessionId,
      )) {
        for (const c of this.connections) {
          if (c.readyState === 1) c.send(JSON.stringify({ type: "token", data: tok }));
        }
      }
    } catch (err: any) {
      send(ws, { type: "error", data: `Project planner error: ${err.message}` });
    }

    send(ws, { type: "task_complete", taskId });
    send(ws, { type: "system", data: `\x1b[32m✓ Done. Run 'swarm launch' for a full multi-agent version.\x1b[0m` });
  }

  // ─── Autopilot ─────────────────────────────────────────────────────────────

  async runAutopilot(ws: WebSocket, goal: string): Promise<void> {
    divider(ws, "AUTOPILOT — FULLY AUTONOMOUS");
    send(ws, { type: "system", data: `\x1b[33m🤖 Autopilot engaged for: "${goal}"\x1b[0m\n\x1b[90mThe AI plans its own phases and assigns specialists.\x1b[0m` });

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
      // Fallback to research-lab blueprint
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

    for (let phaseIdx = 0; phaseIdx < plan.phases.length; phaseIdx++) {
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

    divider(ws, "AUTOPILOT COMPLETE");
    send(ws, { type: "system", data: `\x1b[33m🏁 "${plan.title}" done · ${allOutputs.length} agents · ~${allOutputs.reduce((s, r) => s + r.tokens, 0)} tokens\x1b[0m` });
    this.projectHistory.push({ goal, outputs: allOutputs, timestamp: new Date().toISOString() });
    this.extractSkillsFromSwarm(goal, allOutputs);
  }

  // ─── Delegate ─────────────────────────────────────────────────────────────

  async runDelegate(ws: WebSocket, task: string): Promise<void> {
    divider(ws, "PARALLEL DELEGATION — 3 SPECIALISTS");
    const roles: AgentRole[] = [
      { name: "analyst",  title: "Strategic Analyst", model: "gpt-5.2",                  color: "\x1b[33m", systemPrompt: "You are a strategic analyst. Analyze, identify key insights, provide actionable recommendations." },
      { name: "engineer", title: "Technical Expert",  model: "deepseek-chat",            color: "\x1b[36m", systemPrompt: "You are a technical expert. Provide technical implementation, code, or detailed how-to." },
      { name: "reviewer", title: "Critical Reviewer", model: "claude-3-5-haiku-20241022",color: "\x1b[35m", systemPrompt: "You are a critical reviewer. Challenge assumptions, find weaknesses, suggest improvements." },
    ];

    send(ws, { type: "output", data: `\x1b[90mRunning 3 specialists simultaneously...\x1b[0m\n` });

    const results = await Promise.all(
      roles.map(role => runSubAgent(this.connections, role, task, "", this.sessionId))
    );

    for (const result of results) {
      const role = roles.find(r => r.name === result.role)!;
      send(ws, { type: "output", data: `\n${role?.color ?? ""}[${result.title}]\x1b[0m\n\x1b[37m${result.content}\x1b[0m` });
    }

    const totalTok = results.reduce((s, r) => s + r.tokens, 0);
    send(ws, { type: "system", data: `\x1b[32m✓ All 3 specialists done · ~${totalTok} tokens\x1b[0m` });
  }

  // ─── Single Spawn ──────────────────────────────────────────────────────────

  async runSingleSpawn(ws: WebSocket, roleName: string, task: string): Promise<void> {
    const ROLES: Record<string, AgentRole> = {
      researcher: { name: "researcher", title: "Research Analyst",     model: "sonar",                     color: "\x1b[36m", systemPrompt: "You are an expert researcher. Provide thorough, well-structured analysis." },
      engineer:   { name: "engineer",  title: "Senior Engineer",       model: "deepseek-chat",             color: "\x1b[32m", systemPrompt: "You are a senior software engineer. Write production-ready, well-documented code." },
      analyst:    { name: "analyst",   title: "Business Analyst",      model: "gpt-5.2",                   color: "\x1b[35m", systemPrompt: "You are a business and data analyst. Provide quantitative insights and clear frameworks." },
      writer:     { name: "writer",    title: "Content Writer",        model: "gpt-5-mini",                color: "\x1b[91m", systemPrompt: "You are a professional content writer. Write compelling, clear, well-structured content." },
      strategist: { name: "strategist",title: "Strategy Consultant",   model: "gpt-5.2",                   color: "\x1b[33m", systemPrompt: "You are a senior strategy consultant. Provide actionable strategic recommendations." },
      reviewer:   { name: "reviewer",  title: "Quality Reviewer",      model: "claude-3-5-haiku-20241022", color: "\x1b[90m", systemPrompt: "You are a critical quality reviewer. Find issues, gaps, and suggest improvements." },
      ceo:        { name: "ceo",       title: "Chief Executive Officer",model: "gpt-5.2",                   color: "\x1b[33m", systemPrompt: "You are a startup CEO. Think strategically and make decisive recommendations." },
      cto:        { name: "cto",       title: "Chief Technology Officer",model: "gpt-5.2",                  color: "\x1b[36m", systemPrompt: "You are a CTO. Design systems and make architecture decisions." },
      pm:         { name: "pm",        title: "Product Manager",        model: "gpt-5.2",                   color: "\x1b[91m", systemPrompt: "You are a product manager. Define requirements, prioritize features, align the team." },
    };

    const role = ROLES[roleName.toLowerCase()];
    if (!role) {
      send(ws, { type: "error", data: `Unknown role: "${roleName}"\nAvailable: ${Object.keys(ROLES).join(", ")}` });
      return;
    }

    send(ws, { type: "output", data: `\x1b[90mSpawning ${role.title}...\x1b[0m\n` });
    const result = await runSubAgent(this.connections, role, task, "", this.sessionId);

    send(ws, { type: "output", data: `\n${role.color}[${role.title}]\x1b[0m\n\x1b[37m${result.content}\x1b[0m` });
    send(ws, { type: "system", data: `\x1b[32m✓ ${role.title} done · ${(result.latencyMs / 1000).toFixed(1)}s · ~${result.tokens} tokens\x1b[0m` });
  }

  // ─── Orchestrator Chat ─────────────────────────────────────────────────────

  async runOrchestratorChat(ws: WebSocket, message: string): Promise<void> {
    const taskId = genId();
    send(ws, { type: "task_start", taskId });

    const sysPrompt = `You are the Swarm Orchestrator — an AI that manages teams of specialized AI agents.
Blueprints: startup, research-lab, dev-team, content-agency, investment-thesis, hackathon.
Commands: swarm launch, project, autopilot, delegate, spawn.
Help users understand what's possible and suggest specific commands to run.`;

    try {
      for await (const tok of streamChat(
        "gpt-5.2",
        [{ role: "system", content: sysPrompt }, { role: "user", content: message }],
        1500,
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

  // ─── Skill extraction ─────────────────────────────────────────────────────

  private async extractSkillsFromSwarm(goal: string, outputs: AgentOutput[]): Promise<void> {
    if (outputs.length === 0) return;
    try {
      const summary = outputs.slice(0, 3).map(o => `[${o.title}]: ${o.content.slice(0, 400)}`).join("\n\n");
      const skillJson = await chatComplete(
        "gpt-5-mini",
        [{
          role: "system",
          content: `Extract ONE reusable skill from this swarm run. Return ONLY JSON: { "name": "...", "description": "...", "implementation": "..." }`,
        }, { role: "user", content: `Goal: ${goal}\n\nOutputs:\n${summary}` }],
        300,
      );
      const match = skillJson.match(/\{[\s\S]+\}/);
      if (match) {
        const skill = JSON.parse(match[0]);
        await saveSkill({
          name: skill.name,
          description: skill.description,
          implementation: skill.implementation,
          agentType: "any",
          sessionId: this.sessionId,
          source: "auto",
          score: 0.75,
          category: "swarm",
        });
      }
    } catch { /* silent */ }
  }

  // ─── Display helpers ───────────────────────────────────────────────────────

  private sendHelp(ws: WebSocket): void {
    send(ws, {
      type: "output",
      data: [
        `\x1b[33m━━━ SWARM ORCHESTRATOR COMMANDS ━━━\x1b[0m`,
        ``,
        `\x1b[1mMULTI-AGENT\x1b[0m`,
        `  \x1b[36mswarm list\x1b[0m                    — list blueprints`,
        `  \x1b[36mswarm launch <id> <goal>\x1b[0m      — launch a multi-agent org`,
        `    IDs: startup | research-lab | content-agency | dev-team | investment-thesis | hackathon`,
        ``,
        `\x1b[1mAUTONOMOUS\x1b[0m`,
        `  \x1b[36mproject <goal>\x1b[0m                — autonomous project planner`,
        `  \x1b[36mautopilot <goal>\x1b[0m              — AI plans its own phases + executes`,
        ``,
        `\x1b[1mSINGLE AGENT\x1b[0m`,
        `  \x1b[36mdelegate <task>\x1b[0m               — 3 specialists simultaneously`,
        `  \x1b[36mspawn <role> <task>\x1b[0m           — one specialist`,
        `    roles: researcher | engineer | analyst | writer | strategist | reviewer | ceo | cto | pm`,
        ``,
        `\x1b[1mEXAMPLES\x1b[0m`,
        `  swarm launch startup Build an AI-powered code review tool`,
        `  swarm launch research-lab What is the future of edge AI inference?`,
        `  autopilot Create a go-to-market strategy for a developer tool`,
        `  delegate How should we build a RAG pipeline for enterprise docs?`,
        `  spawn engineer Build a WebSocket server in TypeScript`,
        `  spawn ceo Create a go-to-market strategy for an AI agent platform`,
        ``,
        `  \x1b[36mstatus\x1b[0m · \x1b[36mhistory\x1b[0m · \x1b[36mchat <q>\x1b[0m`,
      ].join("\n"),
    });
  }

  private sendBlueprints(ws: WebSocket): void {
    send(ws, {
      type: "output",
      data: [
        `\x1b[33m━━━ SWARM BLUEPRINTS (${SWARM_BLUEPRINTS.length} available) ━━━\x1b[0m`,
        ``,
        ...SWARM_BLUEPRINTS.map(bp => [
          `  \x1b[1m${bp.icon} ${bp.name}\x1b[0m  \x1b[90m[${bp.id}]\x1b[0m  ${bp.estimatedTime}  \x1b[90m${bp.difficulty}\x1b[0m`,
          `  \x1b[90m${bp.description.slice(0, 100)}\x1b[0m`,
          `  \x1b[36mswarm launch ${bp.id} <your goal>\x1b[0m`,
          ``,
        ].join("\n")),
      ].join("\n"),
    });
  }

  private sendStatus(ws: WebSocket): void {
    send(ws, {
      type: "output",
      data: [
        `\x1b[33m━━━ SWARM STATUS ━━━\x1b[0m`,
        `Session: ${this.sessionId}`,
        `Active Swarm: ${this.activeSwarm ?? "none"}`,
        `Projects Run: ${this.projectHistory.length}`,
        `Blueprints Available: ${SWARM_BLUEPRINTS.length}`,
      ].join("\n"),
    });
  }

  private sendHistory(ws: WebSocket): void {
    if (this.projectHistory.length === 0) {
      send(ws, { type: "output", data: "No projects run yet. Try: swarm launch startup <goal>" });
      return;
    }
    send(ws, {
      type: "output",
      data: [
        `\x1b[33m━━━ PROJECT HISTORY ━━━\x1b[0m`,
        ...this.projectHistory.map((p, i) => [
          `\x1b[1m${i + 1}. ${p.goal.slice(0, 80)}\x1b[0m`,
          `   ${p.timestamp} · ${p.outputs.length} agents`,
        ].join("\n")),
      ].join("\n"),
    });
  }
}
