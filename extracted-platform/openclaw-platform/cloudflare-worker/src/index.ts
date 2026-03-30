/**
 * OpenClaw Platform — Main Worker Entry Point
 *
 * Architecture:
 *   Browser → Cloudflare Edge → This Worker
 *                                    │
 *                       /agents/*   →  routeAgentRequest() → OpenClawAgent DO
 *                       /api/*      →  Hono router → D1, Stripe, etc.
 *
 * WebSocket URL: wss://your-worker.workers.dev/agents/OpenClawAgent/:sessionId
 * REST API:      https://your-worker.workers.dev/api/*
 *
 * Deployment:
 *   npm run deploy  (or: wrangler deploy)
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { routeAgentRequest } from "agents";
import { OpenClawAgent } from "./agent";
import type { Env, D1User, D1Session } from "./types/index";
import { handleStripeWebhook, createCheckoutSession } from "./billing";
import { DEFAULT_AGENT_MODEL } from "./models";

// Re-export Durable Object class — required by Cloudflare for DO binding
export { OpenClawAgent };

// ─── Hono App (REST API) ─────────────────────────────────────────────────────
const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: "*", // Restrict to your domain in production
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    runtime: "cloudflare-workers",
    compatibilityDate: "2026-03-24",
    features: [
      "durable-objects-sqlite",     // Persistent SQLite per agent instance
      "dynamic-workers-loader",     // V8 isolates spawned on-demand
      "workers-ai-100-plus-models", // AI binding — no external API keys
      "d1-serverless-sqlite",       // User accounts and billing metadata
      "stripe-billing",             // Subscription management
    ],
    defaultModel: DEFAULT_AGENT_MODEL,
    wsEndpoint: "/agents/OpenClawAgent/:sessionId",
  });
});

// ─── Models List ──────────────────────────────────────────────────────────────
app.get("/api/models", async () => {
  const { ALL_MODELS } = await import("./models");
  return Response.json(ALL_MODELS);
});

// ─── Users ────────────────────────────────────────────────────────────────────
app.post("/api/users/register", async (c) => {
  const { id, email } = await c.req.json<{ id: string; email: string }>();
  if (!id || !email) return c.json({ error: "id and email are required" }, 400);

  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO users (id, email, plan, max_agents) VALUES (?, ?, 'free', 1)"
  ).bind(id, email).run();

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE id = ?"
  ).bind(id).first<D1User>();

  return c.json(user);
});

app.get("/api/users/:userId", async (c) => {
  const { userId } = c.req.param();
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE id = ?"
  ).bind(userId).first<D1User>();

  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json(user);
});

// ─── Sessions ─────────────────────────────────────────────────────────────────
app.get("/api/sessions", async (c) => {
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ error: "x-user-id header required" }, 401);

  const sessions = await c.env.DB.prepare(
    "SELECT * FROM agent_sessions WHERE user_id = ? AND status != 'terminated' ORDER BY created_at DESC"
  ).bind(userId).all<D1Session>();

  return c.json(sessions.results);
});

app.post("/api/sessions", async (c) => {
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ error: "x-user-id header required" }, 401);

  // Auto-register user if new
  const user = await c.env.DB.prepare(
    "SELECT plan, max_agents FROM users WHERE id = ?"
  ).bind(userId).first<{ plan: string; max_agents: number }>();

  if (!user) {
    await c.env.DB.prepare(
      "INSERT OR IGNORE INTO users (id, email, plan, max_agents) VALUES (?, ?, 'free', 1)"
    ).bind(userId, `${userId}@openclaw.dev`).run();
  }

  // Enforce plan limits
  const activeSessions = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM agent_sessions WHERE user_id = ? AND status = 'active'"
  ).bind(userId).first<{ count: number }>();

  const maxAgents = user?.max_agents ?? 1;
  if ((activeSessions?.count ?? 0) >= maxAgents && (user?.plan ?? "free") === "free") {
    return c.json(
      {
        error: "plan_limit",
        message: `Free plan allows ${maxAgents} active agent. Upgrade to Pro for unlimited parallel agents.`,
        upgradeUrl: "/api/billing/checkout",
      },
      402
    );
  }

  const { name, model } = await c.req.json<{ name: string; model?: string }>();
  if (!name) return c.json({ error: "name is required" }, 400);

  // Stable session ID from userId + name
  // This is used as the Durable Object instance name
  const sessionId = `${userId}:${name.toLowerCase().replace(/\s+/g, "-")}`;
  const doId = c.env.OpenClawAgent.idFromName(sessionId);

  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO agent_sessions (id, user_id, name, model, status) VALUES (?, ?, ?, ?, 'active')"
  ).bind(doId.toString(), userId, name, model || DEFAULT_AGENT_MODEL).run();

  const session = await c.env.DB.prepare(
    "SELECT * FROM agent_sessions WHERE id = ?"
  ).bind(doId.toString()).first<D1Session>();

  return c.json(
    {
      ...session,
      doId: doId.toString(),
      // WebSocket connection URL for xterm.js
      wsUrl: `/agents/OpenClawAgent/${sessionId}`,
    },
    201
  );
});

app.delete("/api/sessions/:sessionId", async (c) => {
  const { sessionId } = c.req.param();
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ error: "x-user-id header required" }, 401);

  await c.env.DB.prepare(
    "UPDATE agent_sessions SET status = 'terminated' WHERE id = ? AND user_id = ?"
  ).bind(sessionId, userId).run();

  return c.json({ success: true });
});

// ─── Billing ──────────────────────────────────────────────────────────────────
app.post("/api/billing/webhook", async (c) => {
  return handleStripeWebhook(c.req.raw, c.env);
});

app.post("/api/billing/checkout", async (c) => {
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ error: "Authentication required" }, 401);

  const url = await createCheckoutSession(userId, c.env);
  return c.json({ url });
});

// ─── Main Fetch Handler ───────────────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    /**
     * AGENTS route: handles WebSocket upgrades to Durable Objects.
     *
     * routeAgentRequest() from the "agents" npm package:
     *   - Matches /agents/:ClassName/:instanceId
     *   - Looks up env[ClassName] (the DO namespace binding)
     *   - Creates/fetches the DO instance by name
     *   - Upgrades the HTTP request to WebSocket and forwards to the DO
     *
     * WebSocket URL format:
     *   wss://your-worker.workers.dev/agents/OpenClawAgent/user123:my-session
     *
     * The :instanceId becomes the DO idFromName() key, so the same name
     * always routes to the same persistent instance.
     */
    if (url.pathname.startsWith("/agents/")) {
      const agentResponse = await routeAgentRequest(request, env, {
        cors: true,
        onBeforeConnect: (agentClass: string, agentId: string) => {
          console.log(`Agent connecting: ${agentClass}/${agentId}`);
        },
      });
      if (agentResponse) return agentResponse;
    }

    // REST API routes (all /api/* paths)
    return app.fetch(request, env, ctx);
  },
};
