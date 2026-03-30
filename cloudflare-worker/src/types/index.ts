/**
 * Cloudflare Workers environment bindings for OpenClaw Platform.
 * Run: wrangler types  (to auto-regenerate from wrangler.jsonc)
 */
export interface Env {
  // Workers AI — 100+ models, no external API keys needed
  AI: Ai;

  // Durable Object namespaces — three agent classes, each with SQLite storage
  // MUST match class names for routeAgentRequest() to route correctly
  OpenClawAgent: DurableObjectNamespace;   // Full-featured, 4096 tok, 20 parallel
  NanoClawAgent: DurableObjectNamespace;   // Ultra-fast, 1024 tok, 10 parallel
  NemoClawAgent: DurableObjectNamespace;   // Deep reasoning, 16384 tok, 5 parallel

  // D1 serverless SQLite — user accounts, sessions, billing metadata
  DB: D1Database;

  // Dynamic Workers Loader — spawns fresh V8 isolates on-demand (<5ms cold start)
  LOADER: WorkerLoader;

  // Secrets (set with: wrangler secret put <NAME>)
  STRIPE_SECRET: string;
  STRIPE_WEBHOOK_SECRET: string;
  ANTHROPIC_API_KEY?: string;

  // Vars from wrangler.jsonc [vars]
  ENVIRONMENT: string;
  APP_URL: string;
}

// ─── Dynamic Workers API ─────────────────────────────────────────────────────
// https://developers.cloudflare.com/dynamic-workers/
export interface WorkerLoader {
  load(options: WorkerLoaderOptions): Promise<WorkerInstance>;
}

export interface WorkerLoaderOptions {
  mainModule: string;
  modules: Record<string, string>;
  env?: Record<string, unknown>;
  // null = fully block all outbound network (recommended for untrusted code)
  globalOutbound?: null | string;
  timeout?: number;
}

export interface WorkerInstance {
  getEntrypoint(): { fetch: (req: Request) => Promise<Response> };
}

// ─── D1 Row Types ─────────────────────────────────────────────────────────────
export interface D1User {
  id: string;
  email: string;
  stripe_customer_id: string | null;
  plan: "free" | "pro";
  max_agents: number;
  created_at: string;
  updated_at: string;
}

export interface D1Session {
  id: string;
  user_id: string;
  name: string;
  model: string;
  status: "active" | "idle" | "terminated";
  created_at: string;
  last_active_at: string;
}

// ─── WebSocket Protocol ───────────────────────────────────────────────────────
// Messages between browser (xterm.js) and the Durable Object agent.
export type TerminalMessage =
  | { type: "input"; data: string }
  | { type: "output"; data: string; isolateId?: string }
  | { type: "token"; data: string }            // Streaming AI response chunk
  | { type: "error"; data: string; exitCode?: number }
  | { type: "system"; data: string }
  | { type: "task_start"; taskId: string; model: string }
  | { type: "task_complete"; taskId: string; timeMs: number; tokens?: number }
  | { type: "ping" }
  | { type: "pong" };

// ─── Dynamic Worker Isolate Contract ─────────────────────────────────────────
export interface IsolateTask {
  task: string;
  skills: string;
  memory: string;
  model: string;
  anthropicKey?: string;
}

export interface IsolateResult {
  output: string;
  isolateId: string;
  executionTimeMs: number;
  tokensUsed?: number;
  exitCode: 0 | 1;
}
