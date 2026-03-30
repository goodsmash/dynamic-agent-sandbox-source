# OpenClaw — AI Agent Sandbox Platform

> **Production-grade multi-provider AI agent sandbox** with a real xterm.js terminal, 11 AI provider integrations, live token cost tracking, autonomous AutoResearch loop, and a Cloudflare Dynamic Workers backend ready to deploy.

---

## Table of Contents

1. [What Is This?](#what-is-this)
2. [Architecture Overview](#architecture-overview)
3. [Features](#features)
4. [Project Structure](#project-structure)
5. [Tech Stack](#tech-stack)
6. [AI Providers (11 total)](#ai-providers-11-total)
7. [Database Schema](#database-schema)
8. [API Reference](#api-reference)
9. [Pages & UI](#pages--ui)
10. [AutoResearch Loop](#autoresearch-loop)
11. [Token Usage & Cost Tracking](#token-usage--cost-tracking)
12. [Local Development Setup](#local-development-setup)
13. [Deploying to Cloudflare](#deploying-to-cloudflare)
14. [Environment Variables](#environment-variables)
15. [Cloudflare Wrangler Bindings](#cloudflare-wrangler-bindings)
16. [Workflow Templates](#workflow-templates)

---

## What Is This?

OpenClaw is a full-stack AI agent sandbox platform. It lets you:

- **Run AI agents interactively** through a real VT100/ANSI terminal (xterm.js) connected via WebSocket
- **Switch between 11 AI providers** (OpenAI, Anthropic, Groq, Together, OpenRouter, Mistral, Google Gemini, Cohere, Perplexity, Ollama, LM Studio) and 300+ models at runtime
- **Track every token and dollar** spent per provider, per session, in real time
- **Run autonomous AI research experiments** using an AutoResearch loop inspired by karpathy/autoresearch — propose → implement → evaluate → keep/discard → iterate
- **Deploy to Cloudflare** using Dynamic Workers (V8 isolates loaded at runtime) and Durable Objects for persistent agent memory

It works in two modes:
- **Local mode** — Express API + PostgreSQL + WebSocket agent server (this Replit project)
- **Production mode** — Cloudflare Workers + Durable Objects + D1 serverless SQLite + Dynamic Workers LOADER API

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser (React + Vite)                        │
│  xterm.js terminal · Settings · Research · Workflows · Docs      │
└────────────────────┬────────────────────┬────────────────────────┘
                     │ REST /api/*         │ WebSocket /ws
                     ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│               Express API Server (Local Dev)                     │
│                                                                  │
│  /api/sessions    — CRUD agent sessions                          │
│  /api/providers   — 11 AI provider configs + live models         │
│  /api/usage       — Token tracking & cost analytics              │
│  /api/research    — AutoResearch loop + SSE streaming            │
│  /ws              — WebSocket agent terminal server              │
│                                                                  │
│  ProviderRouter → detectProvider() → stripPrefix()               │
│  → Anthropic SDK  or  OpenAI SDK (custom baseURL)                │
│  → usageTracker → PostgreSQL usage table                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PostgreSQL (Replit DB)                          │
│  sessions · providers · usage · research_runs · research_experiments │
└─────────────────────────────────────────────────────────────────┘

──── PRODUCTION PATH ────────────────────────────────────────────

Browser (xterm.js)
    │
    ├── REST /api/sessions          → D1 (SQLite, user+session metadata)
    │
    └── WebSocket /api/agent/:id/connect
            │
            ▼
    Cloudflare Orchestrator Worker (Hono)
            │
            ├── Durable Object: OpenClawAgent  (Cloudflare Agents SDK)
            │       ├── Internal SQLite: memory, skills, task history
            │       ├── WebSocket handler: real-time terminal I/O
            │       └── Commands: help, memory, history, remember, parallel
            │
            └── env.LOADER.load()      ← Dynamic Workers API (<5ms cold start)
                    ├── OPENCLAW_CORE — execution engine (V8 isolate)
                    ├── env.AI — Workers AI (Llama/Mistral) or AI Gateway
                    └── globalOutbound: null — network isolation enforced
```

---

## Features

### Core Platform
- **Real xterm.js terminal** — Full VT100/ANSI rendering, paste support, resize handling
- **WebSocket I/O** — Real-time bidirectional communication with agent backend
- **Persistent Memory** — Agent memory (SKILLS.md, MEMORY.md) stored in Durable Object SQLite
- **Parallel Isolates** — `parallel <n> <task>` spawns N V8 isolates simultaneously
- **Session Management** — Create, list, pause, resume, terminate agent sessions
- **Plan Enforcement** — Free/Pro plan limits on concurrent sessions

### Multi-Provider AI (11 providers, 300+ models)
- Route any model to the right provider automatically by name prefix
- Add API keys per provider via the Settings UI — stored in PostgreSQL
- Live model fetching from each provider's real `/models` API (5-minute cache)
- Force-refresh models per card in Settings
- OpenAI always active via Replit AI proxy (no key needed)

### Token Usage & Cost Tracking
- Every AI call tracked: provider, model, prompt tokens, completion tokens, latency
- Cost estimation using per-provider pricing tables
- Aggregate view by provider in Settings → Token Usage & Cost Tracking section
- Session-scoped usage drill-down
- Recent call log with model, tokens, cost, latency per row

### AutoResearch Loop (karpathy-inspired)
- Describe a research goal, pick a model, set iteration count
- Each iteration: AI proposes a hypothesis → implements it → evaluates results → scores 0-1
- Keep/discard decision per experiment; best score tracked across iterations
- Live SSE event stream shows real-time log output during run
- Past runs persisted to database; score progression chart in UI
- Pause / resume / abort controls

### Cloudflare Production
- Dynamic Workers LOADER API — real V8 isolates loaded at runtime (<5ms)
- Durable Objects for per-agent persistent state
- D1 serverless SQLite for users/sessions/billing
- Stripe billing integration (webhook + Checkout)
- Zero cold-start architecture

---

## Project Structure

```
workspace/
├── artifacts/
│   ├── agent-sandbox/                  # React + Vite frontend
│   │   ├── src/
│   │   │   ├── App.tsx                 # Wouter router, all routes
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx       # Hero, stats, workflow cards
│   │   │   │   ├── SessionView.tsx     # xterm.js terminal session
│   │   │   │   ├── Workflows.tsx       # Searchable workflow library
│   │   │   │   ├── Research.tsx        # AutoResearch loop UI
│   │   │   │   ├── Settings.tsx        # AI provider management + usage stats
│   │   │   │   └── Docs.tsx            # Full platform documentation
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── AppLayout.tsx   # Shell: sidebar + main content
│   │   │   │   │   └── Sidebar.tsx     # Nav, model picker (300+ models), isolates
│   │   │   │   ├── Terminal.tsx        # Terminal wrapper component
│   │   │   │   ├── XTerminal.tsx       # xterm.js + WebSocket integration
│   │   │   │   ├── RightPanel.tsx      # Session right panel (tasks, memory)
│   │   │   │   └── ui/                 # shadcn/ui component library (50+ components)
│   │   │   ├── hooks/
│   │   │   │   ├── use-agent-websocket.ts   # WS connection lifecycle hook
│   │   │   │   └── use-terminal-state.ts    # Terminal state management
│   │   │   └── lib/
│   │   │       ├── models.ts           # MULTI_PROVIDER_MODELS, MULTI_PROVIDER_GROUPS
│   │   │       └── workflows.ts        # 12 agentic workflow templates
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── api-server/                     # Express 5 API + WebSocket server
│   │   ├── src/
│   │   │   ├── app.ts                  # Express app, CORS, middleware
│   │   │   ├── index.ts                # Server entry, HTTP + WS upgrade
│   │   │   ├── agent/
│   │   │   │   ├── RealAgentSession.ts # Agent session lifecycle management
│   │   │   │   ├── ResearchLoop.ts     # AutoResearch engine (EventEmitter SSE)
│   │   │   │   └── wsServer.ts         # WebSocket server (agent terminal I/O)
│   │   │   ├── lib/
│   │   │   │   ├── providerConfig.ts   # 11 provider definitions + PRICING table
│   │   │   │   ├── providerRouter.ts   # detectProvider(), stripPrefix(), callProvider()
│   │   │   │   ├── liveModels.ts       # Real live model fetching (5-min cache)
│   │   │   │   ├── usageTracker.ts     # Token tracking + cost estimation
│   │   │   │   ├── workflows.ts        # Workflow definitions
│   │   │   │   └── logger.ts           # Structured logger
│   │   │   └── routes/
│   │   │       ├── index.ts            # Route registration
│   │   │       ├── health.ts           # GET /api/health
│   │   │       ├── sessions.ts         # Session CRUD + execute + history
│   │   │       ├── providers.ts        # Provider CRUD + live models
│   │   │       ├── usage.ts            # Token usage analytics
│   │   │       └── research.ts         # AutoResearch CRUD + SSE stream
│   │   └── package.json
│   │
│   └── mockup-sandbox/                 # Vite component preview server (UI prototyping)
│
├── cloudflare-worker/                  # Production Cloudflare Workers project
│   ├── src/
│   │   ├── index.ts                    # Orchestrator Worker (Hono router, WS upgrade)
│   │   ├── agent.ts                    # OpenClawAgent Durable Object
│   │   ├── billing.ts                  # Stripe webhook handler
│   │   ├── models.ts                   # Cloudflare AI model registry
│   │   └── types/index.ts              # Shared types (Env, TerminalMessage, etc.)
│   ├── migrations/
│   │   └── 0001_initial.sql            # D1 schema (users, agent_sessions, billing)
│   ├── wrangler.jsonc                  # Wrangler config (LOADER, DO, D1, AI bindings)
│   ├── DEPLOY.md                       # Step-by-step Cloudflare deployment guide
│   └── package.json
│
├── lib/
│   ├── db/                             # Drizzle ORM + PostgreSQL
│   │   ├── src/
│   │   │   └── schema/
│   │   │       ├── sessions.ts         # sessions + tasks + history tables
│   │   │       ├── providers.ts        # providers table (api keys, config)
│   │   │       ├── usage.ts            # usage table (token tracking per call)
│   │   │       └── research.ts         # research_runs + research_experiments tables
│   │   └── drizzle.config.ts
│   │
│   ├── api-spec/                       # OpenAPI spec (openapi.yaml) + Orval codegen
│   ├── api-client-react/               # Generated React Query hooks
│   └── api-zod/                        # Generated Zod schemas
│
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── replit.md                           # Architecture reference
└── README.md                           # This file
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Frontend build | Vite 6 |
| Routing | Wouter |
| UI components | shadcn/ui + Tailwind CSS v4 |
| Animations | Framer Motion |
| Terminal | @xterm/xterm (VT100/ANSI) |
| Charts | Recharts |
| API client | TanStack Query v5 |
| Backend framework | Express 5 |
| WebSocket | ws (Node.js) |
| Database (local) | PostgreSQL + Drizzle ORM |
| Database (production) | Cloudflare D1 (SQLite) |
| AI SDK (Anthropic) | @anthropic-ai/sdk |
| AI SDK (all others) | openai (OpenAI-compat SDK) |
| Package manager | pnpm workspaces |
| TypeScript | 5.9 |
| Node.js | 24 |
| Production runtime | Cloudflare Workers + Durable Objects |
| Production isolates | Cloudflare Dynamic Workers (LOADER API) |
| Payments | Stripe Checkout + Webhooks |
| Schema validation | Zod v4 |
| API codegen | Orval |

---

## AI Providers (11 total)

| Provider | ID | Auth Method | Key Features |
|---|---|---|---|
| **OpenAI** | `openai` | Replit AI proxy (automatic) | GPT-5.2, GPT-5-mini, o3, o4-mini — no key needed |
| **Anthropic** | `anthropic` | API key | Claude 3.7 Sonnet, Claude 3.5 Haiku — native SDK |
| **Groq** | `groq` | API key | ~700 tok/s inference, free tier at console.groq.com |
| **Together AI** | `together` | API key | Open-source models: Llama, Mistral, Qwen |
| **OpenRouter** | `openrouter` | API key | 300+ models via single API, free tier available |
| **Mistral** | `mistral` | API key | Mistral Large 2, Small 3, Nemo |
| **Google Gemini** | `google` | API key | Gemini 2.5 Pro/Flash, 2M token context |
| **Cohere** | `cohere` | API key | Command-R+, enterprise RAG |
| **Perplexity** | `perplexity` | API key | Search-augmented generation |
| **Ollama** | `ollama` | None (local) | 100% local at localhost:11434 |
| **LM Studio** | `lmstudio` | None (local) | Local OpenAI-compatible at localhost:1234 |

### How Provider Routing Works

```typescript
// Model name → provider mapping
"gpt-5.2"            → openai
"claude-3-7-sonnet"  → anthropic
"groq/llama-3.1-70b" → groq  (prefix stripped before API call)
"openrouter/..."     → openrouter
"ollama/llama3"      → ollama
```

`providerRouter.ts` exports:
- `detectProvider(model)` — returns provider ID from model name
- `stripProviderPrefix(model)` — removes `groq/`, `ollama/` etc. before sending to API
- `callProvider(messages, model, options)` — routes to correct SDK, emits token usage

---

## Database Schema

### PostgreSQL (Local Dev)

#### `sessions`
| Column | Type | Description |
|---|---|---|
| id | varchar(36) PK | Session UUID |
| name | varchar(255) | Display name |
| status | varchar(50) | active / paused / terminated |
| model | varchar(100) | Current AI model |
| plan | varchar(20) | free / pro |
| task_count | integer | Total tasks run |
| memory_usage | integer | Memory bytes used |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

#### `providers`
| Column | Type | Description |
|---|---|---|
| id | varchar(50) PK | Provider slug (e.g. "groq") |
| api_key | text | Encrypted API key |
| base_url | text | Custom base URL override |
| is_enabled | boolean | Active flag |
| config | jsonb | Extra config (headers, etc.) |
| updated_at | timestamp | Last update |

#### `usage`
| Column | Type | Description |
|---|---|---|
| id | serial PK | Auto-increment |
| session_id | varchar(36) | FK → sessions |
| provider | varchar(50) | Provider ID |
| model | varchar(100) | Model used |
| prompt_tokens | integer | Input token count |
| completion_tokens | integer | Output token count |
| total_tokens | integer | prompt + completion |
| estimated_cost_usd | numeric(10,6) | Cost estimate |
| latency_ms | integer | API call latency |
| created_at | timestamp | Call timestamp |

#### `research_runs`
| Column | Type | Description |
|---|---|---|
| id | varchar(36) PK | Run UUID |
| goal | text | Research objective |
| model | varchar(100) | Model driving the loop |
| status | varchar(20) | running / paused / completed / aborted |
| iteration_count | integer | Completed iterations |
| max_iterations | integer | User-configured limit |
| best_score | numeric(4,3) | Best 0-1 score so far |
| created_at | timestamp | Start time |
| updated_at | timestamp | Last update |

#### `research_experiments`
| Column | Type | Description |
|---|---|---|
| id | varchar(36) PK | Experiment UUID |
| run_id | varchar(36) FK | Parent research run |
| iteration | integer | Iteration number (1-based) |
| hypothesis | text | Proposed approach |
| implementation | text | Implementation details |
| evaluation | text | Evaluation rationale |
| score | numeric(4,3) | Quality score 0.0–1.0 |
| decision | varchar(10) | keep / discard |
| created_at | timestamp | Experiment timestamp |

### D1 (Cloudflare Production)
- `users` — Accounts, plan, Stripe customer ID, agent limits
- `agent_sessions` — Session metadata (state lives in DO SQLite)
- `execution_log` — Audit trail for all isolate executions
- `billing_events` — Idempotent Stripe webhook storage

---

## API Reference

### Health
```
GET  /api/health
```

### Sessions
```
GET    /api/sessions              List all sessions
POST   /api/sessions              Create session  { name, model, plan }
GET    /api/sessions/:id          Session detail
DELETE /api/sessions/:id          Terminate session
POST   /api/sessions/:id/execute  Execute command  { command }
GET    /api/sessions/:id/history  Command history
GET    /api/sessions/:id/tasks    Task list
```

### Providers
```
GET    /api/providers                       List all providers
GET    /api/providers/:id                   Single provider
PUT    /api/providers/:id                   Set API key / base URL  { apiKey, baseUrl }
DELETE /api/providers/:id                   Remove API key / disable
GET    /api/providers/:id/models/live       Fetch live models from provider API
POST   /api/providers/:id/models/refresh    Force invalidate live model cache
```

### Usage / Analytics
```
GET  /api/usage/summary           Aggregated cost+tokens by provider
GET  /api/usage/recent?limit=50   Most recent API calls
GET  /api/usage/session/:id       Per-session usage breakdown
```

### AutoResearch
```
POST  /api/research/run                Start new run  { goal, model, maxIterations }
GET   /api/research/runs               List all past runs
GET   /api/research/:id                Run detail + experiments array
POST  /api/research/:id/pause          Pause a running loop
POST  /api/research/:id/resume         Resume paused loop
POST  /api/research/:id/abort          Abort loop
GET   /api/research/:id/stream         SSE live event stream (EventSource)
```

#### SSE Event Types (AutoResearch stream)
| Event | Data |
|---|---|
| `start` | `{ runId, goal, model, maxIterations }` |
| `iteration` | `{ iteration, hypothesis }` |
| `implement` | `{ iteration, implementation }` |
| `evaluate` | `{ iteration, score, decision, evaluation }` |
| `complete` | `{ runId, iterations, bestScore }` |
| `error` | `{ message }` |
| `paused` | `{ iteration }` |
| `aborted` | `{ runId }` |

### Cloudflare (Production Only)
```
POST  /api/agent/:id/connect     WebSocket terminal (Durable Object)
POST  /api/billing/checkout      Create Stripe Checkout session
POST  /api/billing/webhook       Stripe webhook receiver
```

---

## Pages & UI

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Hero, stats grid (100+ models, 50 isolates, <5ms, 12 workflows), workflow cards, deploy CTA |
| `/session/:id` | Terminal Session | xterm.js terminal with real-time WebSocket, task panel, memory viewer |
| `/workflows` | Workflow Library | 12 agentic templates, search + filter by category, "Import & Run", expandable steps |
| `/research` | AutoResearch | Goal input, model selector, iterations slider, live log, score chart, past runs |
| `/settings` | AI Providers | 11 provider cards with API key management, live model refresh, token usage tracker |
| `/docs` | Documentation | Full platform guide: terminal commands, models, memory, deploy, REST API reference |

### Sidebar Model Picker
- 300+ models grouped by provider
- Tags: FAST, VISION, CODE, SEARCH, LOCAL, REASONING
- Filter by provider group
- Shows model context window info

---

## AutoResearch Loop

Inspired by [karpathy/autoresearch](https://github.com/karpathy/autoresearch) — AI agents running experiments autonomously.

### How it works

```
User: "Find the best prompt strategy for code generation"
         │
         ▼
    ResearchLoop.start()
         │
    ┌────┴───────────────────────────────────────┐
    │  ITERATION 1                                │
    │  1. Propose hypothesis (AI call)            │
    │     "Zero-shot with chain-of-thought..."    │
    │  2. Implement experiment (AI call)           │
    │     "Use: Let's think step by step..."      │
    │  3. Evaluate results (AI call)              │
    │     Scores 0.0 – 1.0                        │
    │  4. Decision: score ≥ 0.6 → KEEP            │
    │              score < 0.6 → DISCARD          │
    │  5. Emit SSE events → browser live log      │
    └────┬───────────────────────────────────────┘
         │  repeat up to maxIterations
         ▼
    Complete: best score, best implementation saved
```

### Usage from the UI
1. Go to `/research` (AUTOEXPERIMENT in sidebar)
2. Enter a research goal or click a suggestion chip
3. Choose model (any of 300+)
4. Set iterations (1–20, ~20s/iter)
5. Click **RUN AUTOEXPERIMENT**
6. Watch the live log stream — each hypothesis, evaluation, and score appears in real time
7. Score chart updates after each iteration
8. Past runs accessible from **PAST RUNS (N)** button

### Usage via API
```bash
# Start a run
curl -X POST http://localhost:8080/api/research/run \
  -H "Content-Type: application/json" \
  -d '{"goal":"Optimize RAG retrieval strategy","model":"gpt-4o","maxIterations":5}'
# → {"runId":"abc123","message":"Research loop started",...}

# Stream events
curl -N http://localhost:8080/api/research/abc123/stream
# → data: {"event":"iteration","iteration":1,"hypothesis":"..."}
# → data: {"event":"evaluate","score":0.82,"decision":"keep"}

# Get results
curl http://localhost:8080/api/research/abc123
```

---

## Token Usage & Cost Tracking

Every call through `providerRouter.callProvider()` automatically records:

```typescript
await usageTracker.record({
  sessionId,
  provider,
  model,
  promptTokens,
  completionTokens,
  latencyMs,
  // cost estimated from PRICING table in providerConfig.ts
});
```

### Pricing Table (per 1M tokens, input/output)
| Provider | Input | Output |
|---|---|---|
| OpenAI GPT-4o | $2.50 | $10.00 |
| OpenAI GPT-4o-mini | $0.15 | $0.60 |
| Anthropic Claude 3.5 Sonnet | $3.00 | $15.00 |
| Groq Llama 3.1 70B | $0.59 | $0.79 |
| Together Llama 3.1 405B | $3.50 | $3.50 |
| Mistral Large | $2.00 | $6.00 |
| Google Gemini 1.5 Pro | $3.50 | $10.50 |
| Cohere Command R+ | $3.00 | $15.00 |
| Ollama / LM Studio | $0.00 | $0.00 |

View live in Settings → **Token Usage & Cost Tracking** (collapsible panel, auto-refreshes).

---

## Local Development Setup

### Prerequisites
- Node.js 24+
- pnpm 9+
- PostgreSQL database

### 1. Install dependencies
```bash
pnpm install
```

### 2. Configure database
Set the `DATABASE_URL` environment variable:
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### 3. Push database schema
```bash
pnpm --filter @workspace/db run db:push
```

This creates all tables:
- `sessions`, `tasks`, `history`
- `providers`
- `usage`
- `research_runs`, `research_experiments`

### 4. Start development servers
```bash
# Start both API server and frontend simultaneously
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/agent-sandbox run dev
```

Or use the Replit workflow buttons (auto-configured).

### 5. Open the app
The frontend runs at the `PORT` env variable (set by Replit automatically).
The API server runs on a separate `PORT`.

---

## Deploying to Cloudflare

See `cloudflare-worker/DEPLOY.md` for the complete step-by-step guide.

### Quick summary

```bash
cd cloudflare-worker

# Install dependencies
npm install

# Authenticate with Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create openclaw_users
# Copy the database_id into wrangler.jsonc under [[d1_databases]]

# Run schema migration
npm run d1:migrate

# Set secrets
npx wrangler secret put STRIPE_SECRET
npx wrangler secret put STRIPE_WEBHOOK_SECRET

# Deploy
npm run deploy
```

### Connect frontend to Cloudflare
Set this in your frontend environment:
```
VITE_CLOUDFLARE_WORKER_URL=https://openclaw-platform.YOUR-ACCOUNT.workers.dev
```

When set, xterm.js connects via WebSocket to the real Durable Object.
When unset, it falls back to the local Express backend.

---

## Environment Variables

### API Server
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | Auto | Server port (set by Replit) |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Auto | Replit AI proxy base URL |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Auto | Replit AI proxy key |

### Frontend
| Variable | Optional | Description |
|---|---|---|
| `VITE_API_URL` | No | API server base URL |
| `VITE_WS_URL` | No | WebSocket server URL |
| `VITE_CLOUDFLARE_WORKER_URL` | Optional | Cloudflare Worker URL (enables production mode) |

### Cloudflare Worker (Wrangler secrets)
| Secret | Description |
|---|---|
| `STRIPE_SECRET` | Stripe secret key for billing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

---

## Cloudflare Wrangler Bindings

```jsonc
// wrangler.jsonc
{
  "worker_loaders": [{ "binding": "LOADER" }],          // Dynamic Workers API
  "durable_objects": {
    "bindings": [{
      "name": "AGENTS",
      "class_name": "OpenClawAgent"
    }]
  },
  "d1_databases": [{
    "binding": "DB",
    "database_name": "openclaw_users",
    "database_id": "YOUR_DATABASE_ID"
  }],
  "ai": { "binding": "AI" }                             // Workers AI
}
```

---

## Workflow Templates

12 production-ready agentic workflows built into the platform:

| Category | Workflows |
|---|---|
| **Code Intelligence** | Code Reviewer, Bug Hunter, Test Generator, API Doc Generator |
| **Research & Analysis** | Research Assistant, Competitive Intelligence |
| **Data Processing** | Data Pipeline Builder, Log Analyzer |
| **Content Generation** | Content Factory |
| **Parallel Agents** | Parallel Model Comparator |
| **DevOps & Deploy** | Deploy Validator, Security Auditor |

Each workflow includes:
- Description and use case
- Step-by-step breakdown
- "Import & Run" button (creates a pre-configured session)
- Estimated completion time and model recommendation

---

## Built-In Terminal Commands (Agent Session)

| Command | Description |
|---|---|
| `help` | Show all available commands |
| `memory` | View agent persistent memory |
| `remember <key>: <value>` | Store a value in agent memory |
| `history` | Show command history |
| `parallel <n> <task>` | Run task across N parallel isolates |
| `model <name>` | Switch AI model mid-session |
| `clear` | Clear terminal |

---

## License

MIT — built with OpenClaw AI Agent Platform.
