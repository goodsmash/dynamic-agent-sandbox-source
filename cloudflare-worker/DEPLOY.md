# OpenClaw Platform — Cloudflare Deployment Guide

**Deploy date:** March 2026  
**Runtime:** Cloudflare Workers + Durable Objects + D1 + Dynamic Workers + Workers AI

---

## What You're Deploying

| Component | Cloudflare Service | What It Does |
|-----------|-------------------|--------------|
| HTTP / WebSocket router | Workers | Routes requests to agents and REST API |
| Agent "soul" | Durable Objects (SQLite) | Persistent memory, WebSocket handler, task history |
| Code execution | Dynamic Workers (LOADER) | Spawns isolated V8 instances on-demand (<5ms) |
| AI models | Workers AI (AI binding) | 100+ models — no API keys needed |
| User accounts | D1 (serverless SQLite) | Users, sessions, billing metadata |
| Payments | Stripe | Free → Pro subscription upgrades |

---

## Prerequisites

- Node.js 20+
- A Cloudflare account — [cloudflare.com](https://cloudflare.com) (free tier works)
- A Stripe account — [stripe.com](https://stripe.com) (for billing, optional)

---

## Step-by-Step Deployment

### 1. Install Dependencies

```bash
cd cloudflare-worker
npm install
```

**Key packages (correct npm names):**
```
agents               — Cloudflare Agents SDK (routeAgentRequest, Agent class)
@cloudflare/ai-chat  — AIChatAgent with persistent message history
workers-ai-provider  — AI SDK provider for Workers AI models
ai                   — Vercel AI SDK (streamText, convertToModelMessages)
hono                 — HTTP router for REST API endpoints
stripe               — Stripe billing SDK
```

### 2. Authenticate with Cloudflare

```bash
npx wrangler login
```

Opens a browser window — log in with your Cloudflare account.

### 3. Create the D1 Database

```bash
npx wrangler d1 create openclaw_users
```

**Copy the `database_id` from the output** and paste it into `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "openclaw_users",
    "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  // ← paste here
  }
]
```

### 4. Apply Database Migrations

```bash
# Apply to remote D1
npm run d1:migrate

# Or for local dev
npm run d1:migrate:local
```

### 5. Set Secrets

```bash
# Stripe secret key (Stripe Dashboard → Developers → API Keys → Secret key)
npx wrangler secret put STRIPE_SECRET

# Stripe webhook signing secret (set up in Step 8)
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

> **Workers AI is built-in** — no API key needed. The `"ai": { "binding": "AI", "remote": true }` in wrangler.jsonc
> gives your Worker access to 100+ AI models automatically.

### 6. Deploy

```bash
npm run deploy
```

Output: `https://openclaw-platform.YOUR-ACCOUNT.workers.dev`

### 7. Configure Stripe Webhook (for billing)

In Stripe Dashboard → Developers → Webhooks → Add Endpoint:
- **URL:** `https://openclaw-platform.YOUR-ACCOUNT.workers.dev/api/billing/webhook`
- **Events:** `checkout.session.completed`, `customer.subscription.deleted`

Copy the webhook signing secret and update it:
```bash
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

Update `STRIPE_PRICE_ID` in `src/billing.ts` with your Pro plan price ID.

### 8. Connect Your Frontend

Set the Cloudflare Worker URL in your frontend environment:

```bash
# artifacts/agent-sandbox/.env.local
VITE_CLOUDFLARE_WORKER_URL=https://openclaw-platform.YOUR-ACCOUNT.workers.dev
```

WebSocket connections use:
```
wss://openclaw-platform.YOUR-ACCOUNT.workers.dev/agents/OpenClawAgent/:sessionId
```

REST API uses:
```
https://openclaw-platform.YOUR-ACCOUNT.workers.dev/api/*
```

---

## Local Development

```bash
# Start local dev server with real AI models (--remote flag)
npm run dev

# Or fully local (AI models run locally — slower)
npm run dev:local
```

Wrangler starts at `http://localhost:8787`.

Apply local D1 migrations:
```bash
npm run d1:migrate:local
```

Test Stripe webhooks locally:
```bash
stripe listen --forward-to localhost:8787/api/billing/webhook
```

---

## Architecture

```
Browser (React + xterm.js)
    │
    ├─ GET  /api/health             → Worker health check
    ├─ POST /api/sessions           → Create agent session (D1)
    ├─ GET  /api/models             → List all Workers AI models
    │
    └─ WS   /agents/OpenClawAgent/:sessionId
                │
                ▼
        routeAgentRequest()  ← from "agents" npm package
                │
                ▼
        OpenClawAgent (Durable Object)
                ├─ SQLite: memory, skills, conversation, execution_log
                ├─ WebSocket: streams tokens and output to xterm.js
                │
                └─ env.LOADER.load()  ← Dynamic Workers LOADER binding
                        ├─ Fresh V8 isolate (<5ms cold start)
                        ├─ OPENCLAW_CORE execution engine (injected code)
                        ├─ env.AI binding (Workers AI — 100+ models)
                        └─ globalOutbound: null (network completely blocked)
```

---

## API Reference

### WebSocket Protocol

Connect: `wss://your-worker.workers.dev/agents/OpenClawAgent/:sessionId`

**Browser → Agent:**
```json
{ "type": "input", "data": "your task here" }
{ "type": "ping" }
```

**Agent → Browser:**
```json
{ "type": "output", "data": "..." }
{ "type": "token", "data": "streaming chunk" }
{ "type": "system", "data": "status message" }
{ "type": "error", "data": "...", "exitCode": 1 }
{ "type": "task_start", "taskId": "...", "model": "@cf/..." }
{ "type": "task_complete", "taskId": "...", "timeMs": 250, "tokens": 512 }
{ "type": "pong" }
```

### Terminal Commands

| Command | Description |
|---------|-------------|
| `<text>` | Run as task in a V8 isolate |
| `chat <message>` | Multi-turn conversation (streaming) |
| `parallel <N> <task>` | Spawn N isolates simultaneously |
| `model @cf/author/name` | Switch AI model |
| `memory` | Show all memory files |
| `remember <KEY>: <value>` | Update memory |
| `history` | Last 25 executions |
| `models` | List all Workers AI models |
| `whoami` | Agent identity info |
| `clear` | Clear conversation history |
| `help` | Show help |

---

## Workers AI — Recommended Models for Agents

| Model ID | Context | Capabilities |
|----------|---------|--------------|
| `@cf/moonshotai/kimi-k2.5` | 256k | function-calling, vision, reasoning |
| `@cf/meta/llama-4-scout-17b-16e-instruct` | 131k | function-calling, vision (FREE) |
| `@cf/openai/gpt-oss-120b` | 128k | function-calling, reasoning |
| `@cf/nvidia/nemotron-3-120b-a12b` | 128k | function-calling, reasoning |
| `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` | 64k | reasoning / chain-of-thought |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | 128k | fast, reliable (FREE) |
| `@cf/qwen/qwen2.5-coder-32b-instruct` | 32k | code generation (FREE) |
| `@cf/mistral/mistral-small-3.1-24b-instruct` | 128k | function-calling, vision (FREE) |

Full list: `GET /api/models` or terminal command `models`

---

## Environment Variables

| Secret | How to Set | Description |
|--------|-----------|-------------|
| `STRIPE_SECRET` | `wrangler secret put` | Stripe secret key (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | `wrangler secret put` | Stripe webhook signing secret |

| Variable | Set In | Description |
|----------|--------|-------------|
| `ENVIRONMENT` | `wrangler.jsonc [vars]` | `"production"` or `"development"` |
| `APP_URL` | `wrangler.jsonc [vars]` | Your worker's public URL |

---

## Troubleshooting

**"Cannot find module 'agents'"**  
Run `npm install` inside `cloudflare-worker/`. The package is `agents` (not `@cloudflare/agents`).

**"new_classes is not valid"**  
This config has already been updated to use `new_sqlite_classes` (the correct key for SQLite-backed DOs).

**AI models returning errors locally**  
Ensure `"ai": { "binding": "AI", "remote": true }` is in wrangler.jsonc. The `remote: true` flag uses real Cloudflare AI infrastructure even in local `wrangler dev`.

**WebSocket not connecting**  
The WebSocket path must be `/agents/OpenClawAgent/:sessionId` — not `/api/agent/*`. The `routeAgentRequest()` function handles this path automatically.

**D1 "database not found"**  
Replace `YOUR_D1_DATABASE_ID_HERE` in wrangler.jsonc with the actual ID from `wrangler d1 create`.

**Dynamic Workers LOADER not available**  
Dynamic Workers requires wrangler >= 4.19.0 and compatibility_date >= 2026-03-24. Both are set correctly in this project's wrangler.jsonc.
