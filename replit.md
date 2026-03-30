# OpenClaw — AI Agent Sandbox Platform

## Overview
OpenClaw is a full-stack AI Agent Sandbox Platform designed for building and managing AI agents. It leverages Cloudflare's Dynamic Workers architecture and is structured as a pnpm workspace monorepo. The platform provides a robust environment for AI agent development, supporting various agent types, multi-agent orchestrations, and 300+ AI models from 24 providers. It includes real-time terminal interaction via WebSocket, persistent agent memory, parallel execution of AI tasks, autonomous research loops, swarm company blueprints, and comprehensive token usage tracking with per-token billing.

## System Architecture

### Core Technologies
- **Monorepo Management**: pnpm workspaces
- **Backend**: Node.js with Express 5, WebSocket agent server
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- **Database**: PostgreSQL with Drizzle ORM
- **Terminal Emulation**: @xterm/xterm for VT100/ANSI terminal
- **Real-time Communication**: Native WebSocket (ws library)
- **Data Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API Client Generation**: Orval from OpenAPI spec

### Configured Providers (LIVE)
- **Cloudflare Workers AI**: Token `cfut_...259a`, Account ID `85c2f8db5bf4ee74ce27103f4081d812`. Working models: Llama 4 Scout, Llama 3.3 70B, Llama 3.1 8B, DeepSeek R1 32B, Phi-2
- **Alibaba Cloud (Qwen)**: Key `sk-d9da...4bc`, Endpoint `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`. 90+ free-quota models including qwen-max, qwen3-coder-plus, qwq-plus, qwen-vl-max
- **OpenAI**: Via Replit AI proxy, always-on. GPT-4o-mini, GPT-5.2
- **LM Studio**: Configured for local models (offline unless LM Studio running)

### Smart Model Auto-Selection
`smartSelectModel()` in `providerConfig.ts` routes tasks to optimal models:
- Coding → qwen3-coder-plus
- Reasoning → qwq-plus
- Vision → qwen-vl-max
- Translation → qwen-mt-plus
- Long context → qwen2.5-14b-instruct-1m
- General → qwen-max

### Important Technical Notes
- **Qwen3 thinking models**: Must pass `enable_thinking: false` in non-streaming calls; streaming works without it
- **Qwen international endpoint**: Must use `dashscope-intl.aliyuncs.com` (not `dashscope.aliyuncs.com`)
- **API key cache TTL**: 30 seconds — restart or wait after provider config changes
- **Provider ID for Alibaba**: Stored as `qwen` in DB (not `alibaba`)
- **qvq-max excluded from auto-routing**: Requires WebSocket API, not standard HTTP

### UI/UX and Features
- **Dashboard** (`/`): Hero section, stats cards, New Session flow, Live Agent Grid with StatusRing animations (10s auto-refresh, sorted by most recent)
- **Quick Setup** (`/setup`): Step-by-step provider configuration with visual guides for Cloudflare token creation
- **Terminal Session** (`/session/:id`): Interactive xterm.js terminal with WebSocket I/O, ANSI colors, per-agent task panels
- **Workflow Library** (`/workflows`): 54 workflows across 10 categories
- **Swarm Orchestrator** (`/swarm`): 6 company blueprints (AI Startup, Research Lab, Dev Team, Content Agency, Investment Firm, Hackathon Team)
- **AI Providers** (`/settings`): 24 provider catalog with configuration, testing, and model browsing
- **Token Usage** (`/usage`): Real-time billing dashboard with cost/provider/model breakdown, 7-day trend chart, audit log with search/provider filters and CSV export
- **Admin Panel** (`/admin`): System health (6 services), session management, agent distribution, quick actions
- **Documentation** (`/docs`): Quick start, terminal commands, AI models, deployment, REST API reference
- **AutoExperiment** (`/research`): Autonomous research loop with scoring
- **Learned Skills** (`/skills`): 24 built-in skills with agent/category filters, auto-seeded on startup
- **CF Deploy** (`/deploy`): Cloudflare deployment guide
- **Plans & Pricing** (`/pricing`): Lite ($16/mo), Pro ($33/mo), Max ($66/mo) with yearly toggle, 3 environment options

### Agent Types
- **Scout** (OpenClaw): Full-featured agent with tools, memory, skills
- **Flash** (NanoClaw): Ultra-fast lightweight agent
- **Nexus** (NemoClaw): Deep reasoning agent
- **Swarm** (SwarmClaw): Multi-agent orchestrator spawning sub-agents

### API Endpoints
- `GET /api/health` — Server health with uptime
- `GET /api/healthz` — Simple health check
- `GET /api/debug` — Full system metrics (DB counts, memory, service status; cached 10s; disabled in production)
- `GET /api/sessions` — List all sessions
- `POST /api/sessions` — Create new session
- `GET /api/providers` — List all 24 providers with status
- `PUT /api/providers/:id` — Save/update provider API key
- `POST /api/providers/:id/test` — Test provider connection
- `GET /api/workflows` — 54 workflow definitions
- `GET /api/skills` — Learned agent skills
- `GET /api/usage/totals` — Aggregate usage stats
- `GET /api/usage/today` — Today's usage
- `GET /api/usage/by-day` — Daily breakdown
- `GET /api/usage/by-model` — Per-model breakdown
- `GET /api/usage/summary` — Usage summary
- `GET /api/usage/recent` — Recent API calls
- `GET /api/research/runs` — Research experiment runs
- WebSocket: `ws://localhost:8080/api/agents/{AgentType}/{sessionId}`

### Database Schema (PostgreSQL)
- `sessions`: Agent session details (id, name, status, model, plan, taskCount, memoryUsage)
- `tasks`: Parallel isolate tasks (id, sessionId, description, status, isolateId)
- `history`: Command history (id, sessionId, command, output, exitCode, executionTimeMs)
- `usage`: Per-call token tracking (provider, model, tokens, cost, latency)
- `providers`: Provider API keys and configuration (id, name, api_key, base_url, enabled)
- `skills`: Learned agent skills
- `research_runs`: Research run metadata (goal, model, status, iterations, best score)
- `research_experiments`: Iteration details (hypothesis, implementation, evaluation, score, decision)

## Key Files
- `artifacts/api-server/src/lib/providerConfig.ts` — Provider definitions, model detection, smart selection
- `artifacts/api-server/src/lib/providerRouter.ts` — AI API routing, streaming, usage tracking
- `artifacts/api-server/src/agent/wsServer.ts` — WebSocket server with 4 agent type routes
- `artifacts/api-server/src/agent/RealAgentSession.ts` — Core agent logic, command parsing, AI execution
- `artifacts/api-server/src/agent/SwarmSession.ts` — Multi-agent swarm orchestration
- `artifacts/api-server/src/agent/ResearchLoop.ts` — Autonomous research loop
- `artifacts/agent-sandbox/src/pages/Setup.tsx` — Provider setup UI with visual guides
- `artifacts/agent-sandbox/src/components/layout/Sidebar.tsx` — Navigation with session management
- `artifacts/agent-sandbox/src/App.tsx` — Frontend routing (13 pages)
- `artifacts/agent-sandbox/src/pages/Pricing.tsx` — Plans & Pricing page (Lite/Pro/Max)
- `artifacts/api-server/src/lib/builtinSkills.ts` — 24 built-in skills auto-seeded on startup
