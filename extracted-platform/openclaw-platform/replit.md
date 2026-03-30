# OpenClaw — AI Agent Sandbox Platform

## Overview

A full-stack AI Agent Sandbox Platform built on Cloudflare's Dynamic Workers architecture.
pnpm workspace monorepo. The Replit app serves as the frontend + Node.js API;
the real production backend lives in `cloudflare-worker/` (deploy separately with Wrangler).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (local dev) / Cloudflare Workers + Hono (production)
- **Database**: PostgreSQL + Drizzle ORM (local) / D1 serverless SQLite (production)
- **Terminal**: @xterm/xterm — real VT100/ANSI terminal emulator
- **WebSocket**: Browser ↔ Cloudflare Worker ↔ Durable Object
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)

## Structure

```text
workspace/
├── artifacts/
│   ├── agent-sandbox/          # React + Vite frontend (xterm.js terminal)
│   └── api-server/             # Express API (local dev / HTTP fallback)
├── cloudflare-worker/          # REAL Cloudflare Workers project (deploy with wrangler)
│   ├── src/
│   │   ├── index.ts            # Orchestrator Worker (Hono router, WS upgrade)
│   │   ├── agent.ts            # OpenClawAgent Durable Object (Agents SDK + SQLite memory)
│   │   ├── billing.ts          # Stripe webhook handler
│   │   └── types/index.ts      # Shared types (Env, TerminalMessage, etc.)
│   ├── migrations/
│   │   └── 0001_initial.sql    # D1 database schema
│   ├── wrangler.jsonc           # Wrangler config (LOADER, DO, D1, AI bindings)
│   ├── package.json
│   └── DEPLOY.md               # Step-by-step deployment guide
├── lib/
│   ├── api-spec/               # OpenAPI spec + Orval codegen config
│   ├── api-client-react/       # Generated React Query hooks
│   ├── api-zod/                # Generated Zod schemas
│   └── db/                     # Drizzle ORM schema + PostgreSQL
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── replit.md
```

## Cloudflare Architecture (Production)

```
Browser (xterm.js)
    │
    ├── REST /api/sessions              → D1 (SQLite, user+session metadata)
    │
    └── WebSocket /api/agent/:id/connect
            │
            ▼
    Orchestrator Worker (Hono)          ← wrangler.jsonc: compatibility_date 2026-03-24
            │
            ├── Durable Object: OpenClawAgent  (@cloudflare/agents SDK)
            │       ├── Internal SQLite: memory, skills, task history
            │       ├── WebSocket handler: terminal I/O
            │       └── Built-in commands: help, memory, history, remember, parallel
            │
            └── env.LOADER.load()      ← Dynamic Workers API (real V8 isolates <5ms)
                    ├── OPENCLAW_CORE — the execution engine (injected as module string)
                    ├── env.AI — Workers AI (Llama/Mistral) or Anthropic via gateway
                    └── globalOutbound: null — network isolation enforced
```

## Key Wrangler Bindings

```jsonc
"worker_loaders": [{ "binding": "LOADER" }]     // Dynamic Workers
"durable_objects": { "bindings": [{ "name": "AGENTS", "class_name": "OpenClawAgent" }] }
"d1_databases": [{ "binding": "DB", "database_name": "openclaw_users" }]
"ai": { "binding": "AI" }
```

## Connecting Frontend to Real Cloudflare

Set this env variable to switch the terminal from HTTP simulation → real WebSocket:

```
VITE_CLOUDFLARE_WORKER_URL=https://openclaw-platform.YOUR-ACCOUNT.workers.dev
```

When set, the xterm.js terminal connects via WebSocket to the real Durable Object.
When unset, it falls back to the local Express backend (HTTP mode).

## Local Development (Replit)

- Frontend: `artifacts/agent-sandbox` — Vite dev server
- API: `artifacts/api-server` — Express on dynamic port via `$PORT`
- Both workflows auto-start

## Deploying to Cloudflare

See `cloudflare-worker/DEPLOY.md` for the full step-by-step guide. Summary:

```bash
cd cloudflare-worker
npm install
npx wrangler login
npx wrangler d1 create openclaw_users
# paste database_id into wrangler.jsonc
npm run d1:migrate
npx wrangler secret put STRIPE_SECRET
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npm run deploy
```

## Database Schema (D1 + PostgreSQL)

### D1 (Cloudflare Production)
- `users` — user accounts, plan (free/pro), Stripe customer ID, agent limits
- `agent_sessions` — session metadata (actual state in DO SQLite)
- `execution_log` — audit log for all isolate executions (billing metering)
- `billing_events` — idempotent Stripe webhook storage

### PostgreSQL (Replit Local Dev)
- `sessions` — Agent sessions (id, name, status, model, plan, taskCount, memoryUsage)
- `tasks` — Parallel isolate tasks (id, sessionId, description, status, isolateId)
- `history` — Command history (id, sessionId, command, output, exitCode, executionTimeMs)

## Agent Features

- **Real xterm.js terminal**: Full VT100/ANSI rendering, `@xterm/xterm`
- **WebSocket I/O**: Real-time bidirectional with Durable Object
- **Persistent Memory**: Agent memory (SKILLS.md, MEMORY.md) in DO SQLite
- **Parallel Isolates**: `parallel <n> <task>` spawns n V8 isolates simultaneously
- **Task History**: All executions logged to DO SQLite + D1
- **Memory Commands**: `memory`, `remember <key>: <value>`, `history`
- **Billing**: Stripe Checkout for Pro upgrades, webhook plan sync
- **HTTP Fallback**: Works without Cloudflare via Express backend
- **Input dedup guard**: xterm.js `onData` deduplicates keydown + input events (prevents doubling in Playwright/paste)

## Pages

- `/` — Dashboard: hero, stats grid (100+ models, 50 isolates, <5ms, 12 workflows), featured workflow cards, deploy CTA
- `/session/:id` — Terminal session with xterm.js and command execution
- `/workflows` — Agentic Workflow Library: searchable/filterable grid, 12 templates, "Import & Run", steps expand
- `/docs` — Full platform guide: Quick Start, Terminal Commands, Workers AI Models, Durable Memory, Deploy to Cloudflare, REST API

## Workflow Templates (src/lib/workflows.ts)

12 production-ready agentic workflows across 6 categories:
- **Code Intelligence**: Code Reviewer, Bug Hunter, Test Generator, API Doc Generator
- **Research & Analysis**: Research Assistant, Competitive Intel
- **Data Processing**: Data Pipeline, Log Analyzer
- **Content Generation**: Content Factory
- **Parallel Agents**: Parallel Comparator
- **DevOps & Deploy**: Deploy Validator, Security Auditor

## API Endpoints (Express / Cloudflare)

- `GET /api/health` — Health check
- `GET /api/sessions` — List user sessions
- `POST /api/sessions` — Create session (enforces plan limits)
- `GET /api/sessions/:id` — Session details
- `DELETE /api/sessions/:id` — Terminate session
- `POST /api/sessions/:id/execute` — Execute command (HTTP mode)
- `GET /api/sessions/:id/history` — Command history
- `GET /api/sessions/:id/tasks` — Task list
- `POST /api/agent/:id/connect` — WebSocket terminal (Cloudflare)
- `POST /api/billing/webhook` — Stripe webhook
- `POST /api/billing/checkout` — Create checkout session

## Multi-Provider AI System (Local Mode)

### Providers (11 total)
`providerConfig.ts` — canonical provider registry with metadata, pricing, base URLs, auth headers.

| Provider | Auth | Notes |
|---|---|---|
| OpenAI | Replit AI proxy (no key needed) | GPT-5.2, GPT-5-mini, o3, o4-mini |
| Anthropic | API key via DB | Native `@anthropic-ai/sdk` |
| Groq | API key via DB | ~700 tok/s, free tier |
| Together AI | API key via DB | Open-source models |
| OpenRouter | API key via DB | 300+ providers, needs HTTP-Referer header |
| Mistral | API key via DB | Mistral large/small/nemo |
| Google Gemini | API key via DB | 2M context, flash/pro |
| Cohere | API key via DB | Command-R+ |
| Perplexity | API key via DB | Search-augmented |
| Ollama | localhost:11434 | 100% local, no key |
| LM Studio | localhost:1234 | Local OpenAI-compat |

### Key files
- `artifacts/api-server/src/lib/providerConfig.ts` — Provider definitions + PRICING table
- `artifacts/api-server/src/lib/providerRouter.ts` — Routes model → provider, strips prefixes, handles auth
- `artifacts/api-server/src/lib/liveModels.ts` — Real live model fetching from each provider API (5min cache)
- `artifacts/api-server/src/lib/usageTracker.ts` — Token usage + cost tracking per call
- `artifacts/api-server/src/routes/providers.ts` — CRUD for providers + `/models/live` + `/models/refresh`
- `artifacts/api-server/src/routes/usage.ts` — Usage analytics endpoints
- `artifacts/agent-sandbox/src/lib/models.ts` — `MULTI_PROVIDER_MODELS` / `MULTI_PROVIDER_GROUPS` (50+ curated)

### Provider API Endpoints
- `GET /api/providers` — List all providers with config status
- `GET /api/providers/:id` — Single provider
- `PUT /api/providers/:id` — Set API key, base URL
- `DELETE /api/providers/:id` — Remove API key
- `GET /api/providers/:id/models/live` — Live model fetch from real provider API
- `POST /api/providers/:id/models/refresh` — Force refresh live model cache

### Usage API Endpoints
- `GET /api/usage/summary` — Aggregated token/cost breakdown by provider
- `GET /api/usage/recent` — Last N calls (default 50)
- `GET /api/usage/session/:id` — Usage for a session

## AutoResearch Loop (karpathy/autoresearch-inspired)

Autonomous AI experiment loop: propose → implement → evaluate → keep/discard → iterate.

### Key files
- `artifacts/api-server/src/agent/ResearchLoop.ts` — Core loop engine (EventEmitter SSE)
- `artifacts/api-server/src/routes/research.ts` — REST endpoints + SSE streaming
- `artifacts/agent-sandbox/src/pages/Research.tsx` — UI with live log + score chart
- `lib/db/src/schema/research.ts` — DB tables: `research_runs`, `research_experiments`

### Research API Endpoints
- `POST /api/research/run` — Start a new research run
- `GET /api/research/runs` — List all past runs
- `GET /api/research/:id` — Run detail + all experiments
- `POST /api/research/:id/pause` — Pause a running loop
- `POST /api/research/:id/resume` — Resume paused loop
- `POST /api/research/:id/abort` — Abort loop
- `GET /api/research/:id/stream` — SSE live event stream

### DB Tables (PostgreSQL)
- `usage` — Per-call token tracking (provider, model, prompt/completion tokens, cost, latency)
- `research_runs` — Run metadata (goal, model, status, iteration count, best score)
- `research_experiments` — Each iteration (hypothesis, implementation, eval result, score, decision)
