# OpenClaw AI Agent Sandbox Platform
## Complete Reference Manual · v2.0.0

> A fully autonomous, multi-agent AI execution platform with 24 providers, 300+ models, 4 agent personalities, 6 swarm blueprints, AutoResearch loop, per-token billing, 54 workflows, and 28 built-in skills. Deployable to Cloudflare Workers for true edge-native AI execution.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Architecture](#2-architecture)
3. [Agent Types & Personalities](#3-agent-types--personalities)
4. [Agent Commands Reference](#4-agent-commands-reference)
5. [Autopilot Mode — Long-Running Autonomous Agents](#5-autopilot-mode)
6. [Parallel Execution & Isolates](#6-parallel-execution--isolates)
7. [Workflow Library (54 Workflows)](#7-workflow-library)
8. [Swarm System](#8-swarm-system)
9. [AutoResearch Loop](#9-autoresearch-loop)
10. [Skills System](#10-skills-system)
11. [AI Providers (24 Providers)](#11-ai-providers)
12. [Model Catalog (300+ Models)](#12-model-catalog)
13. [WebSocket Protocol](#13-websocket-protocol)
14. [REST API Reference](#14-rest-api-reference)
15. [Database Schema](#15-database-schema)
16. [Frontend Pages](#16-frontend-pages)
17. [Session Management](#17-session-management)
18. [Work Output & Downloads](#18-work-output--downloads)
19. [Usage Tracking & Billing](#19-usage-tracking--billing)
20. [Pricing Tiers](#20-pricing-tiers)
21. [Cloudflare Workers Deployment](#21-cloudflare-workers-deployment)
22. [Configuration Reference](#22-configuration-reference)
23. [Security Model](#23-security-model)
24. [Skills Catalog (28 Built-in Skills)](#24-skills-catalog)
25. [Swarm Blueprints (6 Blueprints)](#25-swarm-blueprints)
26. [Research & Experimentation](#26-research--experimentation)
27. [Provider Configuration Guide](#27-provider-configuration-guide)
28. [Advanced Usage Patterns](#28-advanced-usage-patterns)
29. [Troubleshooting Guide](#29-troubleshooting-guide)
30. [Development & Contributing](#30-development--contributing)

---

## 1. Platform Overview

OpenClaw is a fully autonomous AI agent sandbox platform built for developers, researchers, and AI operators who need serious computational capability. Unlike simple chatbot interfaces, OpenClaw provides:

### Core Capabilities

**True Parallel Execution**
OpenClaw runs real concurrent AI calls using `Promise.all()`. When you issue `parallel 10 analyze this codebase`, all 10 AI model calls launch simultaneously at t=0. No queuing. No sequential fallbacks. Real wall-time speedup of up to 10×.

**Multiple Agent Personalities**
Four distinct agents with different optimization targets, behaviors, and model defaults:
- **Scout** (OpenClaw): Full-featured, mission-focused, parallel-capable
- **Flash** (NanoClaw): Ultra-fast, speed-optimized, concise
- **Nexus** (NemoClaw): Deep reasoning, chain-of-thought, long-form analysis
- **Swarm** (SwarmClaw): Multi-agent orchestrator that spawns teams of 4–8 specialized AI workers

**Autopilot Mode**
Any agent can be set to run autonomously towards a goal indefinitely. It executes tasks every 60 seconds, builds on previous work, saves artifacts, and persists everything to the database. Type `autopilot <your goal>` and let it run.

**AutoResearch Loop**
Inspired by the karpathy/autoresearch framework. An autonomous loop that:
1. Proposes a hypothesis
2. Implements it concretely
3. Evaluates on a 0.0–1.0 quality scale
4. Decides: keep (improvement) or discard (regression)
5. Extracts and saves successful patterns as skills
6. Iterates until stopped or max_iterations reached

**24 AI Providers**
One platform connects to OpenAI, Anthropic, Groq, Together AI, OpenRouter, Google Gemini, Cohere, Mistral, Perplexity, Fireworks, DeepSeek, xAI, Qwen, Aleph Alpha, AI21 Labs, Cloudflare Workers AI, Ollama (local), and 7 more. All accessible from a single WebSocket interface.

**Skills That Persist and Grow**
Agents learn from experience. Every successful AutoResearch experiment extracts a skill. Manual skills can be created with `skill learn`. All 28 built-in skills plus learned skills are injected into every task automatically.

**Download Your Work**
Every command, every output, every artifact is saved to the database. Download the complete session as a formatted Markdown file with one click — including all commands, outputs, timing, and tasks.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        User Interface (React)                        │
│  Dashboard · Sessions · Swarm · Research · Skills · Workflows       │
└──────────────────────┬──────────────────────────────────────────────┘
                       │ WebSocket + REST API
┌──────────────────────▼──────────────────────────────────────────────┐
│                     API Server (Express + ws)                        │
│                                                                      │
│  ┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────────┐ │
│  │  Scout      │ │  Flash   │ │  Nexus   │ │  Swarm              │ │
│  │  (OpenClaw) │ │ (Nano)   │ │ (Nemo)   │ │  (Orchestrator)     │ │
│  │             │ │          │ │          │ │  4–8 agents/swarm   │ │
│  │  Autopilot  │ │  Fast    │ │ Thinking │ │  Blueprints × 6     │ │
│  │  Parallel   │ │  Mode    │ │  Mode    │ │  Retry+Backoff      │ │
│  └──────┬──────┘ └────┬─────┘ └────┬─────┘ └──────────┬──────────┘ │
│         └─────────────┴────────────┴────────────────────┘            │
│                              │                                       │
│  ┌───────────────────────────▼─────────────────────────────────────┐ │
│  │                   Provider Router                               │ │
│  │  Detects model prefix · Routes to correct provider · Fallback  │ │
│  └───────────────────────────┬─────────────────────────────────────┘ │
│                              │                                       │
│  ┌───────────────────────────▼─────────────────────────────────────┐ │
│  │                   24 AI Providers                               │ │
│  │  OpenAI · Anthropic · Groq · Together · OpenRouter · Gemini   │ │
│  │  Cohere · Mistral · Perplexity · Fireworks · DeepSeek · xAI   │ │
│  │  Qwen · Cloudflare Workers AI · Ollama + 9 more               │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                         PostgreSQL Database                          │
│  sessions · tasks · history · usage · providers · skills            │
│  research_runs · research_experiments                               │
└──────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + Vite + TypeScript | SPA interface |
| Routing | Wouter | Lightweight client-side routing |
| Styling | Tailwind CSS + Framer Motion | Dark theme + animations |
| Terminal | @xterm/xterm | Real terminal emulator in browser |
| Backend | Node.js + Express | REST API server |
| WebSockets | ws library | Real-time agent communication |
| Database | PostgreSQL + Drizzle ORM | Persistent data storage |
| AI Client | OpenAI SDK (multi-compat) | All provider API calls |
| Build | esbuild (via build.mjs) | Fast TypeScript→JS compilation |
| Deployment | Cloudflare Workers | Edge-native execution target |

### File Structure

```
openclaw/
├── artifacts/
│   ├── agent-sandbox/          # React frontend
│   │   └── src/
│   │       ├── pages/          # 14 pages
│   │       ├── components/     # Terminal, RightPanel, AppLayout
│   │       ├── hooks/          # useAgentWebSocket
│   │       └── lib/            # models.ts, utils.ts
│   ├── api-server/             # Express backend
│   │   └── src/
│   │       ├── agent/          # 4 agent types + ResearchLoop
│   │       │   ├── RealAgentSession.ts   # Scout (OpenClaw)
│   │       │   ├── NanoClawSession.ts    # Flash
│   │       │   ├── NemoClawSession.ts    # Nexus
│   │       │   ├── SwarmSession.ts       # Swarm
│   │       │   ├── ResearchLoop.ts       # AutoResearch engine
│   │       │   └── wsServer.ts           # WebSocket multiplexer
│   │       ├── lib/
│   │       │   ├── providerRouter.ts     # AI provider routing
│   │       │   ├── providerConfig.ts     # 24 provider definitions
│   │       │   ├── skillsManager.ts      # Skills CRUD + injection
│   │       │   ├── swarmBlueprints.ts    # 6 swarm blueprints
│   │       │   ├── swarmPersistence.ts   # DB helpers
│   │       │   ├── workflows.ts          # 54 workflow definitions
│   │       │   ├── builtinSkills.ts      # 28 built-in skills seed
│   │       │   ├── liveModels.ts         # Live model fetching
│   │       │   └── usageTracker.ts       # Token billing
│   │       └── routes/
│   │           ├── sessions.ts           # Session CRUD + export
│   │           ├── research.ts           # Research loop control
│   │           ├── skills.ts             # Skills CRUD
│   │           ├── usage.ts              # Billing/usage
│   │           └── providers.ts          # Provider management
│   └── mockup-sandbox/         # Component preview server
├── lib/
│   ├── db/                     # Drizzle schema + migrations
│   └── api-client-react/       # Generated React hooks
├── cloudflare-worker/          # CF Workers deployment target
└── scripts/                    # Utility scripts
```

---

## 3. Agent Types & Personalities

### 3.1 Scout — OpenClaw Agent

**Personality:** Precise. Mission-focused. Multi-threaded.

Scout is the flagship OpenClaw agent. It is designed for complete, complex AI workloads that require parallel execution, memory management, workflow orchestration, and long-running autonomous operation.

**Default Model:** `gpt-5.2`
**Max Parallel Isolates:** 20
**Terminal Prompt:** `agent@openclaw:~$` (green)
**WebSocket Route:** `/api/agents/OpenClawAgent/:sessionId`

**Capabilities:**
- Full parallel execution (up to 20 concurrent AI calls)
- Complete workflow library (54 workflows)
- Autopilot mode (indefinite autonomous operation)
- Persistent memory (in-session + DB)
- Skills injection from database
- Work artifact collection
- Custom model switching mid-session
- Conversation history for multi-turn tasks

**Personality Traits:**
- Responds with precise, structured output
- Always uses bullet points and headers for clarity
- Cites specific numbers, timings, and metrics
- Ends complex tasks with `[EXIT: 0]` or `[EXIT: 1]`
- Builds on previous context automatically
- In autopilot, summarizes each iteration with `[SUMMARY: ...]`

**Banner Message:**
```
╔══════════════════════════════════════════════════════════════╗
║  Scout — OpenClaw Autonomous Agent                          ║
║  Precise · Mission-focused · Parallel multi-threaded        ║
╚══════════════════════════════════════════════════════════════╝

  Session:   <uuid>
  Model:     gpt-5.2
  Provider:  OpenAI
  Skills:    28 loaded (auto-injected into every task)
  Isolates:  Up to 20 parallel (Promise.all · true concurrency)
  Providers: OpenAI · Anthropic · Groq · Together · OpenRouter · Gemini + 18 more

Mission: I execute AI workloads autonomously. I run tasks, spawn parallel isolates,
         execute workflows, learn skills, and can run on autopilot indefinitely.

→ Quick start: Type any task | workflow list | autopilot <goal> | parallel 5 <task>
  Type help for all 54 commands and workflows.
```

---

### 3.2 Flash — NanoClaw Agent

**Personality:** Fast. Lightweight. Concise.

Flash is optimized for speed and low cost. It uses the smallest capable model by default (gpt-5-mini) and caps token output at 1024. Perfect for quick Q&A, code snippets, data extraction, and high-volume tasks where speed matters more than depth.

**Default Model:** `gpt-5-mini`
**Max Parallel Isolates:** 10
**Max Tokens Per Call:** 1024
**Terminal Prompt:** `nano@openclaw:~$` (cyan)
**WebSocket Route:** `/api/agents/NanoClawAgent/:sessionId`

**Capabilities:**
- Ultra-fast response times (typically 1–3 seconds)
- Low-cost operation
- Parallel execution (up to 10 concurrent)
- Workflow support
- Skills injection
- Optimized for batch processing

**Best For:**
- Quick factual questions
- Code snippet generation
- Text transformation (format, extract, summarize)
- High-volume parallelism (10 tasks simultaneously)
- Cost-sensitive workloads

---

### 3.3 Nexus — NemoClaw Agent

**Personality:** Thoughtful. Deep. Multi-perspective.

Nexus is designed for complex, multi-perspective reasoning that requires sustained chain-of-thought. It uses more capable models and doesn't truncate reasoning. Best for architecture decisions, research synthesis, long-form analysis, and tasks that require considering many trade-offs simultaneously.

**Default Model:** `o4-mini` (reasoning model)
**Thinking Mode:** Chain-of-thought enabled by default
**Max Parallel Isolates:** 5
**Max Tokens Per Call:** 8192
**Terminal Prompt:** `nemo@openclaw:~$` (purple)
**WebSocket Route:** `/api/agents/NemoClawAgent/:sessionId`

**Capabilities:**
- Extended chain-of-thought reasoning
- Long-form output (up to 8192 tokens)
- Complex multi-step analysis
- Architecture and design decisions
- Research synthesis
- Adversarial thinking (considers multiple perspectives simultaneously)

**Thinking Mode:**
When enabled, Nexus explicitly shows its reasoning process:
```
[THINKING] First, let me consider the core trade-offs...
[ANALYZING] Option A has advantages in...
[EVALUATING] However, Option B would...
[CONCLUSION] Based on multi-factor analysis...
```

---

### 3.4 Swarm — SwarmClaw Orchestrator

**Personality:** Strategic. Orchestrating. Parallel teams.

Swarm doesn't execute tasks itself — it orchestrates teams of 4–8 specialized AI agents, each with a distinct role and model. Each agent in the swarm receives the shared context from all other agents, enabling emergent collective intelligence.

**Terminal Prompt:** `orchestrator@swarm:~$` (yellow)
**WebSocket Route:** `/api/agents/SwarmClawAgent/:sessionId`
**Max Sub-agents Per Swarm:** 8
**Retry Strategy:** Exponential backoff (1s, 2s, 4s) × 3 attempts

**Swarm Execution Model:**
```
Goal → Blueprint Selection → Agent Team Creation → Parallel Execution
                                                        ↓
                                              Context Accumulation
                                                        ↓
                                            Sequential Refinement
                                                        ↓
                                         Skill Extraction (auto-learn)
                                                        ↓
                                              Final Report + Persist
```

**Built-in Blueprints:**
1. `hackathon` — Rapid product development team
2. `content-agency` — Full content production pipeline
3. `security-audit` — Multi-angle security analysis
4. `data-pipeline` — Data engineering and analytics
5. `startup-launch` — Go-to-market planning team
6. `debate` — Adversarial multi-perspective analysis

---

## 4. Agent Commands Reference

### 4.1 Scout Commands (Complete)

```bash
# ── Basic Tasks ──────────────────────────────────────────────────────
<any text>                     # Execute as AI task (single isolate)
chat <message>                 # Streaming conversation with history

# ── Parallel Execution ────────────────────────────────────────────────
parallel <N> <task>            # Spawn N concurrent AI calls simultaneously
                               # Example: parallel 10 analyze this function
                               # Max: 20 parallel isolates

# ── Autopilot Mode ────────────────────────────────────────────────────
autopilot <goal>               # Start autonomous mode towards a goal
                               # Runs every 60s, builds on previous work
                               # Example: autopilot build a REST API design doc
autopilot status               # Show current goal, iterations, artifacts
stop                           # Stop autopilot mode
artifacts                      # List all work outputs this session

# ── Workflows ─────────────────────────────────────────────────────────
workflow list                  # Browse all 54 workflows by category
workflow run <id>              # Execute a named workflow
                               # Example: workflow run code-reviewer

# ── Skills ───────────────────────────────────────────────────────────
skills                         # List all 28+ skills loaded from DB
skill learn <name>: <desc>     # Create a skill manually
skill delete <id>              # Remove a skill by ID

# ── Memory ───────────────────────────────────────────────────────────
memory                         # Show all memory files
remember <KEY>: <value>        # Persist a value to agent memory
                               # Example: remember PROJECT: openclaw api redesign

# ── Model Control ─────────────────────────────────────────────────────
model <name>                   # Switch AI model
                               # Examples:
                               #   model claude-3-7-sonnet-20250219
                               #   model groq/llama-3.3-70b-versatile
                               #   model gemini/gemini-2.0-flash
                               #   model @cf/meta/llama-4-scout-17b-16e-instruct
models                         # Browse all 24 providers and their models

# ── History & Info ────────────────────────────────────────────────────
history                        # Show recent conversation turns
clear                          # Clear conversation and reset context
status                         # Show session info and stats
whoami                         # Show full agent identity card
ps                             # Show active isolate processes
ls                             # List virtual filesystem
env                            # Show environment/config variables
version                        # Show agent version
uptime                         # Show session uptime
ping <host>                    # Always blocked (sandbox policy)
help                           # Full command reference
```

### 4.2 Flash Commands

Flash supports a subset of Scout commands, optimized for speed:

```bash
<any text>                     # Ultra-fast AI task
parallel <N> <task>            # Fast parallel (max 10)
workflow run <id>              # Workflow execution
skills                         # List loaded skills
memory                         # Show memory
remember <KEY>: <value>        # Set memory
model <name>                   # Switch model
history                        # Recent turns
clear                          # Clear history
help                           # Command reference
whoami                         # Identity card
status                         # Session status
```

### 4.3 Nexus Commands

Nexus commands with deep reasoning:

```bash
<any text>                     # Deep reasoning task
parallel <N> <task>            # Reasoning parallel (max 5)
think <topic>                  # Explicit chain-of-thought on a topic
workflow run <id>              # Deep workflow execution
skills                         # List skills
memory / remember              # Memory management
thinking on/off                # Toggle thinking mode display
model <name>                   # Switch model
history / clear                # History management
status / whoami / help         # Info commands
```

### 4.4 Swarm Commands

```bash
# ── Launch Commands ───────────────────────────────────────────────────
swarm launch <blueprint> <goal>    # Launch a swarm from blueprint
                                   # Example: swarm launch hackathon Build a todo app
swarm custom <agent1,agent2> <goal> # Custom agent team
swarm autonomous <interval> <goal>  # Scheduled recurring swarm

# ── Control ───────────────────────────────────────────────────────────
swarm stop                         # Stop autonomous mode
swarm status                       # Show active swarm info
swarm history                      # List past swarm runs

# ── Blueprint Browser ─────────────────────────────────────────────────
blueprints                         # List all 6 swarm blueprints
blueprint info <name>              # Detailed blueprint info

# ── Info ─────────────────────────────────────────────────────────────
status / whoami / help             # Standard info commands
```

---

## 5. Autopilot Mode

Autopilot is Scout's autonomous long-running execution mode. It enables agents to work on a goal continuously without any human input, accumulating work artifacts over time.

### How Autopilot Works

1. **Activation:** `autopilot <your goal here>`
2. **First Iteration:** Runs immediately, producing the first work artifact
3. **Subsequent Iterations:** Every 60 seconds, the agent:
   - Loads the last 10 skills from the database
   - Reviews the last 3 work artifacts as context
   - Generates new concrete output building on previous work
   - Saves the output as a new artifact
   - Persists to the history table with timing
   - Increments the session task count
4. **Summary Extraction:** Each iteration must end with `[SUMMARY: one line]` which is extracted and used as the artifact title
5. **Stopping:** Type `stop` at any time

### Autopilot System Prompt

Each autopilot iteration receives:
```
You are Scout, an autonomous OpenClaw AI agent working on an extended goal.
You MUST make meaningful, concrete progress each iteration.
Be specific, structured, and actionable. Write code, plans, or analyses that are COMPLETE artifacts.
End every response with a [SUMMARY: one line describing what you produced this iteration].

## Goal
{goal}

## Iteration
{n} — build on previous work, don't repeat it.

## Previous Work (last 3 iterations)
[Iteration n-3] {title}: {excerpt}...
[Iteration n-2] {title}: {excerpt}...
[Iteration n-1] {title}: {excerpt}...

## Agent Skills Available
{injected skills from database}

## Memory
{agent memory contents}
```

### Viewing Progress

```bash
autopilot status    # Shows: running, goal, iteration count, artifact count, next run time
artifacts           # Lists all work produced: title, timestamp, content excerpt
```

### Downloading Work

Click the **"DOWNLOAD WORK"** button in the session header to get a full Markdown export containing:
- Session metadata
- Complete command history with timing and exit codes
- All task records
- Timestamps for everything

---

## 6. Parallel Execution & Isolates

### What Are Isolates?

In production (Cloudflare Workers), isolates are real V8 JavaScript runtimes spawned on demand. Each isolate:
- Has its own memory space
- Runs concurrently in true parallelism
- Is destroyed after the task completes
- Has no network access (globalOutbound: null)

In the Node.js development environment, isolates are simulated with `Promise.all()` — all AI API calls launch simultaneously at t=0, achieving real wall-time parallelism.

### Parallel Command Syntax

```bash
parallel <N> <task>
```

**Examples:**

```bash
# Spawn 5 isolates analyzing the same task from different angles
parallel 5 analyze the security implications of JWT authentication

# 10 isolates running simultaneously — all finish in ~same time as 1
parallel 10 write a unit test for a binary search function

# 3 isolates for moderate parallelism
parallel 3 explain the CAP theorem from different perspectives

# Maximum parallelism (Scout: 20, Flash: 10, Nexus: 5)
parallel 20 generate creative marketing taglines for an AI product
```

### Wall Time Speedup

With `parallel N task`:
- **Sequential:** N × (avg task time) = N × ~3s = 30s for N=10
- **Parallel:** ~max(task times) ≈ 3–5s regardless of N
- **Speedup:** ~0.7× wall time vs sequential (overhead from API routing)

The agent always reports:
```
⚡ Spawning 10 parallel isolates simultaneously...
  All 10 AI calls launch at t=0 (Promise.all — true concurrent execution)

[iso-abc123] → Task (subtask 1 of 10)
[iso-def456] → Task (subtask 2 of 10)
...
✓ Parallel run complete: 10/10 succeeded
  Wall time: 4231ms | ~0.7x faster than sequential
  Success rate: 100%
```

### Subtask Assignment

Each isolate in a parallel run receives a slightly different focus from a rotating list:
1. Security and vulnerabilities
2. Performance and optimization
3. Code quality and maintainability
4. Edge cases and error handling
5. Testing and validation
6. Documentation and clarity
7. Scalability and architecture
8. Dependencies and integrations
9. Data flow and state management
10. User experience and accessibility

This ensures diverse, complementary outputs from parallel runs.

---

## 7. Workflow Library

OpenClaw includes 54 pre-built agentic workflows organized into categories. Each workflow is a multi-step AI pipeline where each step's output feeds into the next.

### Workflow Categories

| Category | Count | Description |
|----------|-------|-------------|
| Code | 12 | Code review, debugging, refactoring, generation |
| Analysis | 8 | Data analysis, architecture review, performance |
| Writing | 7 | Documentation, blog posts, technical writing |
| Research | 6 | Web research, competitive analysis, literature review |
| Planning | 6 | Sprint planning, roadmapping, project scoping |
| Security | 5 | Vulnerability scanning, threat modeling, audit |
| DevOps | 4 | CI/CD, deployment, infrastructure review |
| ML/AI | 3 | Model selection, prompt optimization, evaluation |
| Business | 3 | Product strategy, go-to-market, competitive analysis |

### Running a Workflow

```bash
workflow list                    # Browse all 54 workflows
workflow run code-reviewer       # Run the code review workflow
workflow run security-audit      # Run security audit workflow
```

### Example Workflow: Code Reviewer

```
ID: code-reviewer
Name: 🔍 Code Review
Category: Code
Difficulty: intermediate
Estimated Time: 3–5 min

Steps:
1. Static Analysis     — Review code structure, patterns, anti-patterns
2. Security Scan       — Identify security vulnerabilities
3. Performance Review  — Analyze bottlenecks and optimization opportunities
4. Test Coverage       — Evaluate test strategy and coverage gaps
5. Documentation Check — Assess documentation quality
6. Summary Report      — Synthesize findings with prioritized recommendations
```

### Workflow Structure

Each workflow is defined as:
```typescript
{
  id: "code-reviewer",
  name: "Code Review",
  icon: "🔍",
  category: "Code",
  description: "Multi-angle code review with security, performance, and quality analysis",
  difficulty: "intermediate",
  model: "gpt-5.2",           // Override model for this workflow
  estimatedTime: "3-5 min",
  steps: [
    {
      description: "Static analysis and code structure review",
      parallelIsolates: 1,     // How many isolates to spawn for this step
      maxTokens: 2048,
    },
    ...
  ]
}
```

---

## 8. Swarm System

### Overview

The swarm system coordinates multiple specialized AI agents working together on a shared goal. Unlike parallel execution (same task, N copies), swarms have agents with distinct roles, different models, and sequential/parallel coordination.

### Swarm Execution Flow

```
1. User: swarm launch hackathon Build a task management API
2. Orchestrator: Selects hackathon blueprint (5 agents)
3. Phase 1 — Parallel: All agents read the goal simultaneously
4. Each agent runs with its own system prompt + shared context
5. Phase 2 — Context accumulation: All outputs merged into shared context
6. Phase 3 — Sequential refinement: Later agents build on earlier outputs
7. Final: Skills extracted from successful agent outputs
8. Result persisted to DB with full task history
```

### Agent Role System

Each agent in a swarm has:
- **name:** e.g., "architect", "security-engineer"
- **title:** Display title in terminal
- **model:** Can be different from other agents
- **color:** ANSI escape code for terminal coloring
- **systemPrompt:** Unique instructions and persona

### Sub-agent Output Format

```
────────────────────── [ARCHITECT] ──────────────────────
[Architect] → Analyze the system architecture requirements...

[Full streaming output appears here in real-time]

✓ [ARCHITECT] complete — 2341 tokens · 8.2s
```

### Retry & Fault Tolerance

Each sub-agent has 3 attempts with exponential backoff:
- Attempt 1: Try streaming
- Attempt 1 failure: Try non-streaming fallback
- Attempt 2: After 1s delay
- Attempt 3: After 2s delay
- All fail: Write graceful error message, continue with other agents

---

## 9. AutoResearch Loop

### Concept

AutoResearch is an autonomous AI experimentation framework. Instead of running a single AI query, AutoResearch runs a continuous improvement loop:

```
HYPOTHESIS → IMPLEMENT → EVALUATE → DECIDE → ITERATE
```

This is inspired by the scientific method and the karpathy/autoresearch framework. Each "experiment" is a concrete attempt to improve a solution, scored on a 0.0–1.0 quality scale.

### Starting a Research Run

Via the UI (`/research`):
1. Enter your research goal
2. Select a model (any of 300+ models)
3. Set max iterations (1–20)
4. Click "Start Research"
5. Watch experiments run in real-time via Server-Sent Events

Via the API:
```bash
POST /api/research/start
{
  "goal": "Find the best system prompt for code generation that minimizes bugs",
  "model": "gpt-5.2",
  "maxIterations": 10
}
```

### Experiment Structure

Each iteration:
```json
{
  "hypothesis": "Adding explicit constraints reduces hallucinations by 30%",
  "implementation": "Actual code, prompt, or approach to test",
  "expected_improvement": "Reduce bug rate from 15% to <5%",
  "confidence": 0.7
}
```

Evaluation response:
```json
{
  "score": 0.82,
  "decision": "keep",
  "reasoning": "This approach significantly improves...",
  "key_strengths": ["Specific", "Measurable"],
  "key_weaknesses": ["Increases prompt length"],
  "next_direction": "Try combining this with few-shot examples"
}
```

### Decision Logic

| Score Range | Decision | Meaning |
|-------------|----------|---------|
| > prev score + 0.05 | keep | Clear improvement |
| ≤ prev score + 0.05 AND ≥ prev score - 0.05 | inconclusive | Marginal result |
| < prev score - 0.05 | discard | Regression |

### Skill Extraction

When an experiment scores ≥ 0.65:
- The implementation is automatically saved as a skill
- Available to all agents immediately
- Score is preserved as the skill's quality score
- Source is marked as "auto" (learned from research)

### Real-time Events (SSE Stream)

```
data: {"type":"run_start","runId":"abc","goal":"...","model":"gpt-5.2"}
data: {"type":"iteration_start","runId":"abc","iteration":1,"hypothesis":"..."}
data: {"type":"implementing","runId":"abc","iteration":1,"text":"..."}
data: {"type":"evaluating","runId":"abc","iteration":1}
data: {"type":"experiment_done","runId":"abc","score":0.72,"decision":"keep","reasoning":"..."}
data: {"type":"skill_learned","runId":"abc","skillName":"...","score":0.72}
data: {"type":"run_complete","runId":"abc","totalIterations":5,"bestScore":0.85}
```

---

## 10. Skills System

### What Are Skills?

Skills are persistent knowledge units that are injected into agent prompts automatically. They represent learned patterns, successful implementations, and reusable strategies that improve agent performance over time.

### Skill Properties

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique identifier |
| name | string | Machine-friendly name (snake_case) |
| description | string | What the skill does |
| implementation | text | The actual implementation/approach |
| category | string | One of 10 categories |
| agentType | string | Which agent type (or "any") |
| source | enum | "builtin", "research", "manual" |
| score | float | Quality score 0.0–1.0 |
| usageCount | integer | How many times used |
| lastUsedAt | timestamp | Last usage time |

### Skill Categories

1. **research** — Web research, information gathering
2. **prompting** — Prompt engineering patterns
3. **architecture** — System design patterns
4. **coding** — Code generation and review patterns
5. **evaluation** — Scoring and evaluation frameworks
6. **planning** — Task decomposition and planning
7. **reasoning** — Chain-of-thought patterns
8. **general** — General-purpose utility skills
9. **analysis** — Data and text analysis
10. **writing** — Content creation patterns

### Creating Skills

**From AutoResearch (automatic):**
Any experiment scoring ≥ 0.65 is automatically extracted and saved.

**Manual creation:**
```bash
# In agent terminal
skill learn web_scraping: Use BeautifulSoup for HTML parsing, requests for HTTP, handle rate limiting with time.sleep(1) between requests

# Via REST API
POST /api/skills
{
  "name": "web_scraping",
  "description": "Web scraping approach",
  "implementation": "Use BeautifulSoup...",
  "category": "coding",
  "agentType": "any",
  "source": "manual",
  "score": 0.8
}
```

**Via Skills UI (/skills):**
Click "+ Add Skill" and fill in the form.

### Skill Injection

Before every AI task, the system:
1. Loads up to 10 highest-scoring skills from the database
2. Formats them into a skills prompt section
3. Injects them into the system prompt

```
## Agent Skills (loaded from knowledge base)
• web_research (research · 95%): Search the web, extract content from URLs...
• prompt_engineering (prompting · 93%): Craft optimized prompts...
• parallel_fan_out (architecture · 93%): Split complex task into N subtasks...
```

This means every task automatically benefits from accumulated knowledge.

---

## 11. AI Providers

OpenClaw connects to 24 AI providers. Each provider is identified by a prefix pattern in the model name.

### Provider Detection Rules

```typescript
// Automatic provider routing:
"claude-*"          → Anthropic
"groq/*" or "llama-*" (fast) → Groq
"gemini/*"          → Google Gemini
"cohere/*" or "command-*" → Cohere
"mistral/*"         → Mistral
"perplexity/*"      → Perplexity
"fireworks/*"       → Fireworks AI
"together/*"        → Together AI
"deepseek/*" or "deepseek-chat" → DeepSeek
"grok-*" or "xai/*" → xAI
"qwen/*" or "qwen-" → Qwen/DashScope
"openrouter/*"      → OpenRouter
"@cf/*"             → Cloudflare Workers AI
"ollama/*"          → Ollama (local)
"gpt-*" / "o1-*" / "o3-*" → OpenAI (default)
```

### Provider Table

| # | Provider | ID | Models | Free? | Notes |
|---|---------|-----|--------|-------|-------|
| 1 | OpenAI | openai | GPT-5.2, GPT-5-mini, GPT-4o, o1, o3 | No | Default provider |
| 2 | Anthropic | anthropic | Claude 3.7, Claude 3.5, Claude 3 | No | Best for writing |
| 3 | Groq | groq | Llama 3.3 70B, Llama 3.1, Mixtral | Generous free | Fastest inference |
| 4 | Together AI | together | 100+ open models | Pay-per-token | Largest OSS catalog |
| 5 | OpenRouter | openrouter | 200+ models | Via sub-providers | Smart routing |
| 6 | Google Gemini | gemini | Gemini 2.0 Flash, Pro, Ultra | Free tier | Best multimodal |
| 7 | Cohere | cohere | Command R+, Command R | Generous free | Best for RAG |
| 8 | Mistral | mistral | Mistral Large, Small, 7B | Free tier | European AI |
| 9 | Perplexity | perplexity | Llama 3.1 Sonar | Search+AI | Web search built in |
| 10 | Fireworks AI | fireworks | Llama 3.1 405B, FireFunction | Fast + cheap | Function calling |
| 11 | DeepSeek | deepseek | DeepSeek-V3, DeepSeek-R1 | Cheap | Best reasoning value |
| 12 | xAI | xai | Grok-2, Grok-beta | No | Twitter/X AI |
| 13 | Qwen/DashScope | qwen | Qwen-Max, Qwen-Plus, Qwen-Turbo | Cheap | Alibaba Cloud |
| 14 | Cloudflare Workers AI | cloudflare | 30+ models (free on CF) | Free on CF | Edge AI |
| 15 | Ollama | ollama | Any local model | Free | Requires local setup |
| 16 | Aleph Alpha | aleph-alpha | Luminous Supreme | No | European, GDPR |
| 17 | AI21 Labs | ai21 | Jamba 1.5, Jurassic | No | Long context |
| 18 | Hugging Face | huggingface | 100K+ OSS models | Free tier | Research models |
| 19 | Replicate | replicate | Image+text models | Pay-per-run | Any OSS model |
| 20 | AWS Bedrock | bedrock | Claude, Titan, Llama | Pay-per-token | Enterprise |
| 21 | Azure OpenAI | azure | All OpenAI models | Enterprise | HIPAA compliant |
| 22 | Vertex AI | vertex | Gemini, PaLM2 | Enterprise | Google Cloud |
| 23 | NVIDIA NIM | nvidia | Nemotron, Llama, Mistral | API | GPU-optimized |
| 24 | Cerebras | cerebras | Llama 3.1 70B | Fast | Wafer-scale chips |

---

## 12. Model Catalog

### Workers AI Models (Cloudflare — Free on CF)

**Frontier Group**
- `@cf/moonshotai/kimi-k2.5` — 256K context, vision, function calling
- `@cf/meta/llama-4-scout-17b-16e-instruct` — 131K context, vision, free
- `@cf/meta/llama-4-maverick-17b-128e-instruct-fp8` — 131K, vision
- `@cf/openai/gpt-oss-120b` — 128K, function calling, reasoning
- `@cf/openai/gpt-oss-20b` — 128K, function calling
- `@cf/nvidia/nemotron-3-120b-a12b` — 128K, function calling, reasoning

**Reasoning Group**
- `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` — 64K, reasoning, free
- `@cf/deepseek-ai/deepseek-r1-distill-llama-70b` — 128K, reasoning
- `@cf/qwen/qwq-32b` — 32K, reasoning, free

**Production Group**
- `@cf/meta/llama-3.3-70b-instruct-fp8-fast` — 128K, streaming, free, RECOMMENDED
- `@cf/zai-org/glm-4.7-flash` — 131K, function calling, multilingual
- `@cf/mistral/mistral-small-3.1-24b-instruct` — 128K, vision, function calling
- `@cf/meta/llama-3.1-70b-instruct` — 128K, function calling
- `@cf/google/gemma-3-27b-it` — 128K, vision, multilingual
- `@cf/qwen/qwen2.5-72b-instruct` — 128K, function calling, multilingual

**Code Group**
- `@cf/qwen/qwen2.5-coder-32b-instruct` — 32K, code, RECOMMENDED
- `@cf/defog/sqlcoder-7b-2` — 4K, SQL generation

**Compact Group (Ultra-fast)**
- `@cf/meta/llama-3.2-3b-instruct` — 128K, free
- `@cf/meta/llama-3.2-1b-instruct` — 128K, free
- `@cf/microsoft/phi-2` — 2K, free
- `@cf/tinyllama/tinyllama-1.1b-chat-v1.0` — 2K, free

### OpenAI Models

| Model | Context | Notes |
|-------|---------|-------|
| gpt-5.2 | 256K | Latest, best overall |
| gpt-5-mini | 128K | Fast and cheap |
| gpt-4o | 128K | Multimodal |
| gpt-4o-mini | 128K | Budget GPT-4 |
| o4-mini | 200K | Reasoning (fast) |
| o3 | 200K | Extended reasoning |
| o3-mini | 200K | Reasoning (budget) |
| o1 | 200K | Advanced reasoning |
| o1-mini | 128K | Reasoning budget |

### Anthropic Models

| Model | Context | Notes |
|-------|---------|-------|
| claude-3-7-sonnet-20250219 | 200K | Latest, best reasoning |
| claude-3-5-sonnet-20241022 | 200K | Best for writing |
| claude-3-5-haiku-20241022 | 200K | Fastest Claude |
| claude-3-opus-20240229 | 200K | Most capable |

### Groq Models (Fastest Inference)

| Model | Context | Speed |
|-------|---------|-------|
| llama-3.3-70b-versatile | 128K | 480 tok/s |
| llama-3.1-70b-versatile | 128K | 380 tok/s |
| mixtral-8x7b-32768 | 32K | 500 tok/s |
| gemma2-9b-it | 8K | 600 tok/s |
| llama-3.1-8b-instant | 128K | 800 tok/s |

### DeepSeek Models (Best Value)

| Model | Context | Cost |
|-------|---------|------|
| deepseek-chat (V3) | 64K | $0.14/M tokens |
| deepseek-reasoner (R1) | 64K | $0.55/M tokens |

---

## 13. WebSocket Protocol

### Connection

```javascript
// Connect to an agent
const ws = new WebSocket(`ws://localhost:8080/api/agents/OpenClawAgent/${sessionId}`);

// Agent types:
// OpenClawAgent   → Scout  (full-featured)
// NanoClawAgent   → Flash  (ultra-fast)
// NemoClawAgent   → Nexus  (deep reasoning)
// SwarmClawAgent  → Swarm  (orchestrator)
```

### Message Types

**Client → Server:**
```typescript
// Send a command
{ type: "input", data: "analyze this function for bugs" }

// Keepalive
{ type: "ping" }
```

**Server → Client:**
```typescript
// Pong response
{ type: "pong" }

// Terminal output (text, ANSI codes)
{ type: "output", data: "\x1b[32m[result]\x1b[0m output text..." }

// System message (status updates, banners)
{ type: "system", data: "✓ Connected to Scout agent" }

// Streaming AI token (real-time)
{ type: "token", data: "partial", isolateId?: "iso-abc123" }

// Error
{ type: "error", data: "Error message" }

// Task lifecycle
{ type: "task_start", taskId: "task-123" }
{ type: "task_complete", taskId: "task-123", timeMs: 3421, tokens: 512 }

// Swarm events
{ type: "swarm_event", taskId: "task-123", agentRole: "architect", data: "..." }
```

### Connection Lifecycle

1. `ws.on('open')` — Connection established
2. Server sends banner (welcome message + prompt)
3. Client sends `{ type: "input", data: "..." }` 
4. Server sends tokens via `{ type: "token" }` (streaming)
5. Server sends final output via `{ type: "output" }`
6. Server sends prompt via `{ type: "output", data: "agent@openclaw:~$ " }`
7. Client can send `{ type: "ping" }` every 30s for keepalive
8. `ws.on('close')` — Session goes idle in DB

---

## 14. REST API Reference

### Sessions

```
GET    /api/sessions                    List all sessions
POST   /api/sessions                    Create a new session
GET    /api/sessions/:id                Get session details
DELETE /api/sessions/:id                Terminate session
GET    /api/sessions/:id/history        Get command history (persisted)
GET    /api/sessions/:id/export         Export full session as Markdown ↓
GET    /api/sessions/:id/tasks          List tasks for session
POST   /api/sessions/:id/tasks          Create a task
GET    /api/sessions/:id/tasks/:taskId  Get task details
POST   /api/sessions/:id/execute        Execute a command (HTTP fallback)
```

### Research

```
POST   /api/research/start              Start a research loop
POST   /api/research/:runId/stop        Stop a running loop
POST   /api/research/:runId/pause       Pause execution
POST   /api/research/:runId/resume      Resume from pause
GET    /api/research/runs               List all past runs
GET    /api/research/runs/:runId        Get run details + experiments
GET    /api/research/stream/:runId      SSE stream for real-time events
```

### Skills

```
GET    /api/skills                      List all skills
POST   /api/skills                      Create a skill
DELETE /api/skills/:id                  Delete a skill
GET    /api/skills/stats                Skill statistics
```

### Usage & Billing

```
GET    /api/usage/totals                Global usage totals
GET    /api/usage/by-provider           Usage broken down by provider
GET    /api/usage/by-session/:id        Usage for specific session
```

### Providers

```
GET    /api/providers                   List all 24 providers + config status
PUT    /api/providers/:id               Update provider API key
GET    /api/providers/:id/models        Fetch live model list from provider
GET    /api/providers/:id/test          Test provider connectivity
```

### Admin

```
GET    /api/admin/stats                 System-wide statistics
GET    /api/admin/health                Full health check (all systems)
```

---

## 15. Database Schema

### sessions

```sql
CREATE TABLE sessions (
  id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR NOT NULL,
  agent_type  VARCHAR DEFAULT 'openclaw',  -- openclaw|nanoclaw|nemoclaw|swarmclaw
  model       VARCHAR,
  status      VARCHAR DEFAULT 'active',    -- active|idle|terminated
  task_count  INTEGER DEFAULT 0,
  last_active_at TIMESTAMP,
  created_at  TIMESTAMP DEFAULT now()
);
```

### history

```sql
CREATE TABLE history (
  id                SERIAL PRIMARY KEY,
  session_id        VARCHAR REFERENCES sessions(id),
  command           TEXT NOT NULL,
  output            TEXT,
  exit_code         INTEGER DEFAULT 0,
  execution_time_ms FLOAT,
  executed_at       TIMESTAMP DEFAULT now()
);
```

### tasks

```sql
CREATE TABLE tasks (
  id          SERIAL PRIMARY KEY,
  session_id  VARCHAR REFERENCES sessions(id),
  description TEXT NOT NULL,
  agent_role  VARCHAR,
  status      VARCHAR DEFAULT 'pending',  -- pending|running|completed|failed
  result      TEXT,
  error       TEXT,
  retries     INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP
);
```

### skills

```sql
CREATE TABLE skills (
  id            VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR NOT NULL,
  description   TEXT,
  implementation TEXT,
  category      VARCHAR,
  agent_type    VARCHAR DEFAULT 'any',
  source        VARCHAR DEFAULT 'manual',  -- manual|research|auto|builtin
  score         FLOAT DEFAULT 0.7,
  usage_count   INTEGER DEFAULT 0,
  last_used_at  TIMESTAMP,
  created_at    TIMESTAMP DEFAULT now()
);
```

### usage

```sql
CREATE TABLE usage (
  id             SERIAL PRIMARY KEY,
  session_id     VARCHAR REFERENCES sessions(id),
  provider_id    VARCHAR,
  model          VARCHAR,
  prompt_tokens  INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens   INTEGER DEFAULT 0,
  cost_usd       FLOAT DEFAULT 0,
  created_at     TIMESTAMP DEFAULT now()
);
```

### providers

```sql
CREATE TABLE providers (
  id         VARCHAR PRIMARY KEY,
  name       VARCHAR NOT NULL,
  api_key    VARCHAR,
  base_url   VARCHAR,
  is_active  BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
```

### research_runs

```sql
CREATE TABLE research_runs (
  id              VARCHAR PRIMARY KEY,
  goal            TEXT NOT NULL,
  model           VARCHAR,
  status          VARCHAR DEFAULT 'running',
  best_score      FLOAT,
  best_iteration  INTEGER,
  total_iterations INTEGER DEFAULT 0,
  skills_learned  INTEGER DEFAULT 0,
  session_id      VARCHAR,
  started_at      TIMESTAMP DEFAULT now(),
  completed_at    TIMESTAMP
);
```

### research_experiments

```sql
CREATE TABLE research_experiments (
  id           SERIAL PRIMARY KEY,
  run_id       VARCHAR REFERENCES research_runs(id),
  iteration    INTEGER,
  hypothesis   TEXT,
  implementation TEXT,
  score        FLOAT,
  decision     VARCHAR,  -- keep|discard|inconclusive
  reasoning    TEXT,
  created_at   TIMESTAMP DEFAULT now()
);
```

---

## 16. Frontend Pages

### Dashboard (`/`)

The main landing page showing:
- **Hero section:** "Execute AI Workloads At the Edge" with animated Matrix background
- **Action buttons:** NEW_SESSION, WORKFLOW LIBRARY, READ_DOCS
- **Live Agent Grid:** Real-time view of all sessions with task counts, success rates, last active time
- **Counter bar:** Total tasks completed + API calls across all sessions

**Session cards show:**
- Agent type badge (Scout/Flash/Nexus/Swarm) with color coding
- TASKS count (from DB)
- SUCCESS rate
- LAST active timestamp
- Model used

### Session View (`/session/:id`)

The agent terminal interface:
- **Top bar:** Session name + ID + agent type badge + agent trait description
- **Personality strip:** Agent tagline + model + uptime
- **HISTORY button:** Toggle command history drawer (shows all past commands, timing, exit codes)
- **DOWNLOAD WORK button:** Exports full session as Markdown file
- **TERMINATE button:** Ends the session
- **Terminal:** Full xterm.js terminal with real WebSocket connection
- **Right panel:** Session stats + task pool manager

### Skills Library (`/skills`)

App-store style skills marketplace:
- **Header stats:** Total, Built-in, Auto-learned, Manual, Categories, Avg Score
- **Category filter tabs:** ALL + 10 category tabs with icons
- **Search bar:** Filter by name/description
- **3-column card grid:** Each card shows icon, name, Built-in/Manual badge, description, score bar, usage count, date, Launch button
- **Detail side panel:** Full implementation, performance, launch button
- **Add Skill modal:** Create manual skills from UI

### Swarm Agents (`/swarm`)

Swarm blueprint browser and launcher:
- 6 blueprint cards with descriptions, agent counts, estimated times
- Custom goal input
- "LAUNCH SWARM" button → creates session → navigates to terminal with auto-launch command
- Example goals for each blueprint

### AutoExperiment (`/research`)

Research loop interface:
- Goal input with 6 example goals
- Model selector (all MULTI_PROVIDER_MODELS)
- Max iterations slider (1–20)
- Real-time experiment visualization
- Score progression chart
- Decision badges (KEEP / DISCARD / INCONCLUSIVE)
- Learned skills display
- Past runs history

### Workflow Library (`/workflows`)

Browse and understand all 54 workflows:
- Category tabs
- Workflow cards with steps preview
- "Run Workflow" → opens session with pre-filled command

### Token Usage (`/usage`)

Per-provider, per-session usage analytics:
- Total tokens, cost estimate, API calls
- By-provider breakdown with model details
- Usage over time

### AI Providers (`/providers`)

Provider management:
- All 24 providers with status (configured/unconfigured)
- API key setup
- Live model fetching
- Connection testing

### Plans & Pricing (`/pricing`)

Three tiers:
- **Lite** — $0/mo — Community access, shared rate limits
- **Pro** — $49/mo — Full API access, priority routing
- **Max** — $199/mo — Unlimited, dedicated workers, enterprise

### Documentation (`/docs`)

Full in-app documentation with:
- Getting started guide
- Command reference
- Workflow catalogue
- Provider setup guides

### CF Deploy (`/deploy`)

Cloudflare Workers deployment:
- Deploy to CF with one click
- Account ID and token configuration
- Deployment status tracking

### Admin Panel (`/admin`)

System monitoring:
- Total sessions, tasks, providers live, total tokens
- System health (API Server, WebSocket, Database, AI Router, AutoResearch, Swarm Engine)
- Agent distribution chart
- Session list with detailed stats

### Settings (`/settings`)

User configuration:
- API key management per provider
- Default model selection
- Theme preferences

---

## 17. Session Management

### Creating Sessions

Via UI (Dashboard → NEW_SESSION):
1. Modal appears asking for session name and agent type
2. On submit: `POST /api/sessions` with `{ name, agentType, model }`
3. Navigate to `/session/:id`
4. WebSocket connects to `ws://host/api/agents/{AgentRoute}/{id}`

Via API:
```bash
curl -X POST http://localhost:8080/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-analysis",
    "agentType": "openclaw",
    "model": "gpt-5.2"
  }'
```

Response:
```json
{
  "id": "uuid-here",
  "name": "my-analysis",
  "agentType": "openclaw",
  "model": "gpt-5.2",
  "status": "active",
  "taskCount": 0,
  "createdAt": "2026-03-27T...",
  "lastActiveAt": "2026-03-27T..."
}
```

### Session Lifecycle

```
created → active (WS connected) → idle (WS disconnected) → active (WS reconnected)
                                        ↓
                                   terminated (DELETE /api/sessions/:id)
```

### Session Persistence

Every session persists:
- All commands and outputs to `history` table
- All tasks to `tasks` table
- All usage to `usage` table
- Task count and last active time to `sessions` table

Sessions survive server restarts. Reconnecting a WebSocket to an existing session ID restores the session object (but not the terminal screen — xterm.js doesn't persist visual state).

### Auto-Launch

Sessions can be auto-launched with commands via URL parameters:
```
/session/:id?swarm=hackathon&goal=Build+a+note-taking+app
  → Sends: swarm launch hackathon Build a note-taking app

/session/:id?autopilot=Create+a+REST+API+design
  → Sends: autopilot Create a REST API design
```

---

## 18. Work Output & Downloads

### In-Terminal Artifacts

View all work produced in a session:
```bash
artifacts        # List all artifacts with title, timestamp, content preview
```

### Download Session Work

Click **"DOWNLOAD WORK"** in the session header (or **"Download All as Markdown"** in the History drawer).

The download is a complete Markdown file containing:

```markdown
# OpenClaw Session Export

## Session Info
- **Name:** my-analysis
- **Agent:** Scout (OpenClaw Agent)
- **Session ID:** uuid-here
- **Model:** gpt-5.2
- **Created:** 2026-03-27T08:00:00Z
- **Tasks Completed:** 12

---

## Command History (31 entries)

### parallel 5 analyze this API design
**Time:** 2026-03-27T08:15:23Z | **Exit:** 0 | **Duration:** 4231ms

```
[iso-abc123] Analysis 1:
  - The API lacks proper error handling...
  - Rate limiting should be implemented...
[EXIT: 0]
```

### autopilot-3: Build a REST API design doc
**Time:** 2026-03-27T08:20:00Z | **Exit:** 0 | **Duration:** 12500ms

```
# REST API Design Document — Iteration 3

## Authentication Endpoints
...
```

---

## Tasks (9)

- ✅ **analyze this API design** — completed (architect)
- ✅ **generate API documentation** — completed (architect)
- ❌ **deploy to production** — failed (deploy)

---
*Exported from OpenClaw AI Agent Sandbox — 2026-03-27T08:30:00Z*
```

### API Export Endpoint

```bash
GET /api/sessions/:id/export
# Returns: Content-Type: text/markdown
# Filename: openclaw-{session-name}-{session-id-8chars}.md
```

---

## 19. Usage Tracking & Billing

### Token Counting

Every AI call tracks:
- Prompt tokens (input)
- Completion tokens (output)
- Total tokens
- Estimated cost in USD

### Cost Estimation

```typescript
// Cost per million tokens (approximate):
const COST_PER_M = {
  "gpt-5.2":        { input: 2.50, output: 10.00 },
  "gpt-5-mini":     { input: 0.15, output: 0.60 },
  "gpt-4o":         { input: 2.50, output: 10.00 },
  "claude-3-7-sonnet": { input: 3.00, output: 15.00 },
  "groq/*":         { input: 0.05, output: 0.08 },  // Approx
  "@cf/*":          { input: 0, output: 0 },          // Free on CF
};
```

### Usage API

```bash
GET /api/usage/totals
# Response:
{
  "totalTokens": 64611,
  "totalCostUsd": 0.1338,
  "totalCalls": 111,
  "activeSessions": 29
}

GET /api/usage/by-provider
# Response: [{provider, tokens, cost, calls}, ...]
```

---

## 20. Pricing Tiers

### Lite — Free

- Up to 5 concurrent sessions
- 100,000 tokens/month
- Access to 10 providers
- Community rate limits
- No API key management
- Basic workflow library (20 workflows)

### Pro — $49/month

- Unlimited concurrent sessions
- 10,000,000 tokens/month
- All 24 providers
- Priority routing
- Full workflow library (54 workflows)
- AutoResearch (up to 20 iterations)
- Skills marketplace
- Session export/download
- API access

### Max — $199/month

- Everything in Pro
- Unlimited tokens
- Dedicated Cloudflare Workers
- Custom swarm blueprints
- SLA 99.9% uptime
- Real-time usage dashboard
- Enterprise support
- Custom integrations
- White-label option

---

## 21. Cloudflare Workers Deployment

### Prerequisites

1. A Cloudflare account
2. Workers Paid plan ($5/month) for Durable Objects
3. `CLOUDFLARE_ACCOUNT_ID` from the Cloudflare dashboard
4. `CLOUDFLARE_API_TOKEN` with Workers:Edit, D1:Edit permissions

### Architecture on Cloudflare

On Cloudflare, the system uses real Cloudflare primitives:

```
User ─→ Cloudflare Worker (Edge) ─→ Durable Object (per session)
                                          ↓
                               Workers AI (free inference)
                                          ↓
                               Workers KV (session storage)
                                          ↓
                               D1 (SQLite database at edge)
```

### Key Differences (CF vs Node.js)

| Feature | Node.js (Dev) | Cloudflare (Prod) |
|---------|---------------|-------------------|
| Parallel | Promise.all() | Real V8 isolates |
| AI | External API | Workers AI (free) |
| Database | PostgreSQL | D1 (SQLite at edge) |
| Storage | None | KV + R2 |
| Scaling | Single process | Infinite auto-scale |
| Latency | API round-trip | ~50ms edge |

### Deploy Steps

1. Go to `/deploy` in the UI
2. Enter your Cloudflare Account ID and API Token
3. Click "Deploy to Cloudflare Workers"
4. The system builds and deploys the Worker automatically
5. Your OpenClaw instance runs globally at the edge

### Manual Deploy

```bash
cd cloudflare-worker
npx wrangler publish

# Or with environment:
CLOUDFLARE_ACCOUNT_ID=xxx CLOUDFLARE_API_TOKEN=yyy npx wrangler publish
```

---

## 22. Configuration Reference

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/openclaw

# AI Provider Keys (any combination)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
TOGETHER_API_KEY=...
OPENROUTER_API_KEY=sk-or-...
GEMINI_API_KEY=...
COHERE_API_KEY=...
MISTRAL_API_KEY=...
PERPLEXITY_API_KEY=pplx-...
FIREWORKS_API_KEY=fw_...
DEEPSEEK_API_KEY=...
XAI_API_KEY=xai-...
QWEN_API_KEY=sk-...
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=cfut_...

# Server
PORT=8080
NODE_ENV=development
```

### Provider Configuration via UI

Go to `/settings` to configure API keys via the UI. Keys are stored in the `providers` database table.

### Agent Default Models

```typescript
// In RealAgentSession.ts
const DEFAULT_MODEL = "gpt-5.2";    // Scout default

// In NanoClawSession.ts
const NANO_DEFAULT_MODEL = "gpt-5-mini";  // Flash default

// In NemoClawSession.ts
const NEMO_DEFAULT_MODEL = "o4-mini";     // Nexus default
```

---

## 23. Security Model

### Sandbox Isolation

**Network:** Inside all isolates, `globalOutbound` is set to `null`. No outbound connections are possible from within a task execution. This prevents:
- Data exfiltration
- Prompt injection attacks that try to make callbacks
- SSRF attacks

**Memory:** Each session has its own in-memory Map. Sessions cannot access each other's memory.

**Database:** All queries are parameterized via Drizzle ORM. No raw SQL interpolation.

### API Authentication

The current implementation is designed for single-tenant / trusted use. For multi-tenant production:
1. Add Bearer token authentication to all API endpoints
2. Add session ownership checks (userId foreign key)
3. Add rate limiting per API key

### Cloudflare Security

On Cloudflare Workers:
- Each Durable Object is cryptographically isolated
- Network access from DO is via `fetch()` only (no raw TCP)
- Workers are sandboxed by V8 at the OS level
- mTLS via Cloudflare for all inbound connections

---

## 24. Skills Catalog

All 28 built-in skills are seeded on first startup. Here is the complete catalog:

### Research (3 skills)

| Name | Score | Description |
|------|-------|-------------|
| web_research | 95% | Search the web, extract content from URLs, and synthesize findings into structured reports |
| competitive_analysis | 88% | Analyze competitors: features, pricing, positioning, weaknesses |
| literature_review | 87% | Synthesize research papers and technical documents |

### Prompting (3 skills)

| Name | Score | Description |
|------|-------|-------------|
| prompt_engineering | 93% | Craft optimized prompts with system instructions, few-shot examples, and constraints |
| chain_of_thought | 91% | Break down complex reasoning into explicit step-by-step thought chains |
| few_shot_learning | 89% | Design effective few-shot examples for task-specific performance |

### Architecture (4 skills)

| Name | Score | Description |
|------|-------|-------------|
| parallel_fan_out | 93% | Split complex task into N independent subtasks and execute simultaneously |
| system_design | 90% | Design scalable system architectures with components and trade-offs |
| workflow_automation | 91% | Design and execute multi-step automated workflows |
| smart_model_selection | 92% | Automatically select the optimal AI model based on task type |

### Coding (4 skills)

| Name | Score | Description |
|------|-------|-------------|
| code_generation | 92% | Generate, analyze, refactor, and debug code in any programming language |
| code_review | 91% | Review code for bugs, security issues, performance problems |
| test_generation | 88% | Generate comprehensive test suites (unit, integration, e2e) |
| api_design | 87% | Design RESTful and GraphQL APIs with clear contracts |

### Reasoning (3 skills)

| Name | Score | Description |
|------|-------|-------------|
| task_decomposition | 90% | Break complex goals into actionable subtasks with dependencies |
| hypothesis_testing | 86% | Propose and evaluate hypotheses systematically |
| decision_analysis | 85% | Analyze decisions with multi-criteria frameworks |

### Planning (3 skills)

| Name | Score | Description |
|------|-------|-------------|
| sprint_planning | 88% | Plan agile sprints with story points and priority |
| project_scoping | 87% | Define project scope, milestones, and resource requirements |
| risk_assessment | 85% | Identify and prioritize risks with mitigation strategies |

### Evaluation (2 skills)

| Name | Score | Description |
|------|-------|-------------|
| quality_scoring | 89% | Score outputs on a 0-1 scale with detailed rubrics |
| benchmark_design | 86% | Design evaluation benchmarks for AI systems |

### Writing (2 skills)

| Name | Score | Description |
|------|-------|-------------|
| technical_writing | 88% | Write clear, structured technical documentation |
| content_creation | 85% | Create engaging content for various audiences |

### Analysis (2 skills)

| Name | Score | Description |
|------|-------|-------------|
| data_analysis | 90% | Analyze datasets, find patterns, generate insights |
| root_cause_analysis | 87% | Systematic root cause analysis with 5 Whys and fishbone |

### General (2 skills)

| Name | Score | Description |
|------|-------|-------------|
| summarization | 89% | Condense long documents into key points |
| translation | 84% | Translate between languages maintaining tone and context |

---

## 25. Swarm Blueprints

### Blueprint 1: Hackathon Team

```
Blueprint: hackathon
Agents: 5
Typical Runtime: 30–60 seconds
Best For: Rapid product/feature development
```

**Agents:**
1. **Product Architect** (gpt-5.2) — System design and technical architecture
2. **UI/UX Designer** (claude-3-5-sonnet) — Interface design and user experience
3. **Backend Engineer** (gpt-5.2) — API design, data modeling, backend implementation
4. **Security Analyst** (gpt-5.2) — Security review and vulnerability assessment
5. **Tech Lead** (gpt-5.2) — Integration, tech decisions, MVP scope

**Use Cases:**
- Building MVP specs in minutes
- Technical architecture decisions
- Product design sprints
- Feature brainstorming

---

### Blueprint 2: Content Agency

```
Blueprint: content-agency
Agents: 4
Typical Runtime: 45–90 seconds
Best For: Content production pipeline
```

**Agents:**
1. **Content Strategist** — Audience analysis, messaging framework, content pillars
2. **Creative Director** — Visual identity, tone, brand voice
3. **Copywriter** — Headline, body copy, calls-to-action
4. **SEO Specialist** — Keywords, metadata, search optimization

**Use Cases:**
- Blog post outlines → full drafts
- Marketing campaign copy
- Product landing page content
- Email sequences

---

### Blueprint 3: Security Audit

```
Blueprint: security-audit
Agents: 5
Typical Runtime: 60–120 seconds
Best For: Security analysis and threat modeling
```

**Agents:**
1. **Penetration Tester** — Attack vectors and exploit analysis
2. **Security Architect** — Architecture-level security review
3. **Compliance Analyst** — Regulatory compliance (GDPR, SOC2, HIPAA)
4. **DevSecOps Engineer** — CI/CD security, dependency vulnerabilities
5. **Incident Responder** — Incident response playbooks

---

### Blueprint 4: Data Pipeline

```
Blueprint: data-pipeline
Agents: 4
Typical Runtime: 45–90 seconds
Best For: Data engineering and analytics
```

**Agents:**
1. **Data Engineer** — Pipeline architecture, ETL design, Kafka/Airflow
2. **Data Analyst** — Analytics requirements, KPI definition, dashboards
3. **ML Engineer** — Feature engineering, model integration, MLOps
4. **Data Quality Analyst** — Data validation, cleaning strategies, monitoring

---

### Blueprint 5: Startup Launch

```
Blueprint: startup-launch
Agents: 5
Typical Runtime: 60–120 seconds
Best For: Go-to-market planning
```

**Agents:**
1. **Growth Strategist** — Customer acquisition, channels, growth loops
2. **Product Manager** — Feature prioritization, roadmap, user research
3. **Marketing Director** — Brand positioning, messaging, campaigns
4. **Investor Relations** — Pitch deck structure, metrics, fundraising narrative
5. **Operations Lead** — Team structure, processes, tools

---

### Blueprint 6: Debate

```
Blueprint: debate
Agents: 4
Typical Runtime: 30–60 seconds
Best For: Multi-perspective adversarial analysis
```

**Agents:**
1. **Advocate** — Strongest case FOR the proposition
2. **Critic** — Strongest case AGAINST the proposition
3. **Devil's Advocate** — Extreme positions and edge cases
4. **Synthesis** — Balanced conclusion weighing all perspectives

---

## 26. Research & Experimentation

### Designing Good Research Goals

**Effective goals are:**
- Specific and measurable: "Reduce hallucination rate by 30%" vs "improve quality"
- Bounded: "For code generation tasks" vs "for all tasks"
- Actionable: Can actually be tested in an experiment
- Has a clear evaluation metric

**Example goals that work well:**
```
"Find the optimal system prompt structure for SQL generation that minimizes syntax errors"
"Design the best few-shot examples for extracting structured data from unstructured text"
"Optimize a code review prompt to catch both bugs and style issues without false positives"
"Find the chain-of-thought pattern that best solves multi-step math word problems"
"Design an agent loop that minimizes redundant API calls while maintaining output quality"
```

### Interpreting Results

**Score progression patterns:**

- **Consistent improvement** (score increases each iteration): Good goal, algorithm is working well
- **Plateau** (score stagnates at ~0.75): Try changing model or direction
- **Oscillation** (keep/discard alternating): Goal may be ambiguous or under-constrained
- **Rapid improvement then plateau** (reaches 0.85 in 3 iterations): Goal was well-defined, you found a good solution

**Decision interpretation:**

| Decision | Next Action |
|----------|------------|
| KEEP (many) | Continue same direction with refinements |
| DISCARD (many) | Change hypothesis direction entirely |
| INCONCLUSIVE (many) | Evaluation criteria may need refinement |

### Using Research Results

After a successful run:
1. Best implementation is saved in the research_experiments table
2. Skills extracted (score ≥ 0.65) appear in /skills
3. All agents automatically use these skills in future tasks
4. Export the run data via the UI for your own records

---

## 27. Provider Configuration Guide

### OpenAI

```
API Key format: sk-...
Base URL: https://api.openai.com/v1
Models: gpt-5.2, gpt-5-mini, gpt-4o, o4-mini, o3-mini, o1
Best for: Default workloads, highest quality
```

To configure: Settings → OpenAI → Enter API key

### Anthropic

```
API Key format: sk-ant-api03-...
Models: claude-3-7-sonnet-20250219, claude-3-5-haiku-20241022
Best for: Writing, nuanced analysis, long documents
```

Note: Anthropic uses a different API format. The provider router handles this automatically.

### Groq

```
API Key format: gsk_...
Base URL: https://api.groq.com/openai/v1
Models: llama-3.3-70b-versatile, mixtral-8x7b-32768
Best for: Fastest inference (480+ tok/s), cost-sensitive workloads
```

### Cloudflare Workers AI

```
Account ID: From Cloudflare dashboard → Right sidebar
API Token: Workers AI:Read permission
Models: @cf/meta/llama-4-scout-17b-16e-instruct, @cf/qwen/qwen2.5-coder-32b-instruct
Best for: Free inference at the edge (when deployed to CF)
```

Note: Workers AI models run free when called from within a Cloudflare Worker. Outside CF, they route to OpenAI fallback.

### Qwen (DashScope)

```
API Key format: sk-...
Base URL: https://dashscope-intl.aliyuncs.com/compatible-mode/v1
Models: qwen-max, qwen-plus, qwen-turbo, qwen2.5-72b-instruct
Best for: Cost-effective, multilingual, coding tasks
```

### OpenRouter (Access All Models via One Key)

```
API Key format: sk-or-...
Base URL: https://openrouter.ai/api/v1
Models: Any model from any provider via openrouter/{model}
Best for: Accessing models without individual API keys
```

---

## 28. Advanced Usage Patterns

### Pattern 1: Research → Skills → Better Tasks

```
1. Go to /research
2. Start a research loop: "Optimize prompt for X"
3. Wait for 5+ iterations
4. Top skills are automatically extracted
5. Return to session terminal
6. Run the same task — it now uses the learned skills
7. Compare output quality
```

### Pattern 2: Parallel Research

Run multiple research goals simultaneously:
```bash
# Open 3 browser tabs, each with /research
# Start 3 different research loops
# They run independently, all extracted skills are shared
```

### Pattern 3: Swarm + Autopilot Chain

```
1. Launch a swarm to create an initial architecture: swarm launch hackathon Build X
2. Copy the architecture output
3. Open a Scout session
4. Start autopilot: autopilot Implement the architecture from [paste]
5. Let it run for 30+ minutes, building iteratively
6. Download work when complete
```

### Pattern 4: Multi-Provider Comparison

```bash
# In 4 different Scout sessions with different models:
parallel 5 analyze the trade-offs of microservices vs monolith

# Session 1: model gpt-5.2
# Session 2: model claude-3-7-sonnet-20250219
# Session 3: model gemini/gemini-2.0-flash
# Session 4: model deepseek/deepseek-chat

# Compare outputs from all 4
```

### Pattern 5: High-Volume Batch Processing

```bash
# Flash agent (ultra-fast) with max parallelism
# For 100 items, split into 10 batches of 10
parallel 10 extract key entities from: [batch 1 text]
parallel 10 extract key entities from: [batch 2 text]
# ... repeat
```

### Pattern 6: Swarm-Assisted Autopilot

```bash
# First, get strategic direction from swarm:
swarm launch startup-launch Build an AI coding assistant product

# Then use autopilot to execute the strategy:
autopilot Following the startup launch plan produced: implement the GTM strategy step by step
```

---

## 29. Troubleshooting Guide

### Common Issues

**"Failed to resolve import react-router-dom"**
- Cause: The project uses `wouter` for routing, not react-router-dom
- Fix: Change import to `import { useLocation } from "wouter"` and use `const [, navigate] = useLocation()`

**"WebSocket connection failed"**
- Cause: API server not running, or wrong URL
- Check: Ensure `artifacts/api-server: API Server` workflow is running
- Check: WebSocket URL should be `ws://localhost:8080/api/agents/...`

**"Session not found" on connect**
- Cause: Session ID doesn't exist in database
- Fix: Create a new session via POST /api/sessions first

**"No API keys configured"**
- Cause: Provider API keys not set
- Fix: Go to `/settings` and add at least one API key (Groq has generous free tier)
- Alternative: Groq API key is free at console.groq.com

**"Swarm failed: all agents failed"**
- Cause: Model quota exceeded or API key invalid
- Check: Admin panel → Providers Live shows provider status
- Fix: Configure a working provider API key

**"AutoResearch stuck on iteration 1"**
- Cause: Model response not in expected JSON format
- Fix: Try a different model (gpt-5.2 or claude-3-7-sonnet have best JSON compliance)

**Tasks show "pending" and never complete**
- Cause: This is expected for manually created tasks (they require manual dispatch)
- Note: Tasks created via swarm agents auto-complete; manually created tasks are queue items

**Vite import errors (build fails)**
- Cause: Using packages not installed in the workspace
- Fix: Check pnpm-workspace.yaml and ensure the package is in the correct artifact's package.json

### Performance Tips

- **Use Flash (NanoClaw)** for quick tasks — 3× faster than Scout for simple queries
- **Use parallel for independent subtasks** — 10× throughput vs sequential
- **Use Groq models** for maximum speed (480+ tokens/second)
- **Use @cf/ models** when deployed to Cloudflare — truly free inference
- **Cap parallel at 10** for cost-sensitive workloads
- **Use autopilot** for tasks that take > 30 minutes — it persists between reconnects

---

## 30. Development & Contributing

### Local Development Setup

```bash
# Clone and install
git clone https://github.com/openclaw/openclaw
cd openclaw
pnpm install

# Set up database
DATABASE_URL=postgresql://localhost:5432/openclaw pnpm run db:push

# Seed built-in skills
curl -X POST http://localhost:8080/api/skills/seed

# Start development servers
pnpm run dev   # Starts all services
```

### Adding a New Provider

1. Add provider definition to `artifacts/api-server/src/lib/providerConfig.ts`
2. Add routing logic to `artifacts/api-server/src/lib/providerRouter.ts`
3. Add API key support to the `providers` table
4. Test with: `model provider/model-name` in Scout terminal

### Adding a New Workflow

1. Add workflow definition to `artifacts/api-server/src/lib/workflows.ts`
2. Follow the `AGENTIC_WORKFLOWS` array structure
3. Test with: `workflow run your-new-workflow-id`

### Adding a New Skill

1. Add to `artifacts/api-server/src/lib/builtinSkills.ts`
2. Re-seed: `DELETE FROM skills WHERE source = 'builtin'; POST /api/skills/seed`

### Adding a Swarm Blueprint

1. Add to `artifacts/api-server/src/lib/swarmBlueprints.ts`
2. Test with: `swarm launch your-blueprint test goal`

### WebSocket Agent Tests

```bash
# Test Scout
node -e "
const ws = new (require('./node_modules/ws'))('ws://localhost:8080/api/agents/OpenClawAgent/test-123');
ws.on('open', () => ws.send(JSON.stringify({type:'input',data:'List 3 Python tips'})));
ws.on('message', d => { const m=JSON.parse(d); if(m.type==='output') console.log(m.data); });
"
```

### Building for Production

```bash
# Build API server
cd artifacts/api-server
pnpm run build    # Runs esbuild via build.mjs

# Build frontend
cd artifacts/agent-sandbox
pnpm run build    # Runs vite build

# Deploy to Cloudflare
cd cloudflare-worker
npx wrangler publish
```

---

## Appendix: Quick Reference Card

```
╔══════════════════════════════════════════════════════════════════╗
║              OPENCLAW QUICK REFERENCE v2.0.0                    ║
╠══════════════════════════════════════════════════════════════════╣
║  AGENTS:  Scout (green) · Flash (cyan) · Nexus (purple) · Swarm ║
║  ROUTES:  /OpenClawAgent /NanoClawAgent /NemoClawAgent /Swarm   ║
╠══════════════════════════════════════════════════════════════════╣
║  KEY COMMANDS:                                                   ║
║  parallel N <task>      — N concurrent AI calls                 ║
║  autopilot <goal>       — Autonomous mode (60s intervals)       ║
║  stop                   — Stop autopilot                        ║
║  artifacts              — View all work produced                ║
║  workflow run <id>      — Run a workflow (54 available)         ║
║  swarm launch <bp> <g>  — Launch multi-agent swarm             ║
║  skill learn <n>: <d>   — Create a skill                       ║
║  model <name>           — Switch AI model                       ║
║  remember <KEY>: <val>  — Persist to memory                    ║
╠══════════════════════════════════════════════════════════════════╣
║  PROVIDERS: 24 total · OpenAI default · Groq fastest           ║
║  MODELS:    300+ · @cf/* free on Cloudflare                     ║
║  SKILLS:    28 built-in + auto-learned from research            ║
║  WORKFLOWS: 54 total · Code·Analysis·Writing·Research·Security  ║
║  SWARMS:    hackathon·content-agency·security-audit·            ║
║             data-pipeline·startup-launch·debate                 ║
╠══════════════════════════════════════════════════════════════════╣
║  PAGES: / · /session/:id · /swarm · /research · /skills        ║
║         /workflows · /usage · /providers · /admin · /pricing   ║
║  EXPORT: Click "DOWNLOAD WORK" in session header               ║
╚══════════════════════════════════════════════════════════════════╝
```

---

*OpenClaw AI Agent Sandbox Platform v2.0.0*
*Built for developers who need real autonomous AI execution.*
*24 providers · 300+ models · 4 agent types · 6 swarm blueprints*
*54 workflows · 28 skills · AutoResearch · Autopilot · Edge-ready*

*GitHub: https://github.com/openclaw/openclaw*
