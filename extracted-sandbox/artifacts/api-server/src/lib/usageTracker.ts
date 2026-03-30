/**
 * Token Usage Tracker
 * Records AI token usage per call with cost estimation.
 * Covers all 23 providers.
 */

import { db } from "@workspace/db";
import { usageTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

// Pricing per 1M tokens (input/output) in USD
const PRICING: Record<string, { input: number; output: number }> = {
  // ── OpenAI ─────────────────────────────────────────────────────────────────
  "gpt-5.2":        { input: 3,    output: 12   },
  "gpt-5-mini":     { input: 0.20, output: 0.80 },
  "gpt-4o":         { input: 2.5,  output: 10   },
  "gpt-4o-mini":    { input: 0.15, output: 0.60 },
  "gpt-4-turbo":    { input: 10,   output: 30   },
  "o3":             { input: 10,   output: 40   },
  "o4-mini":        { input: 1.1,  output: 4.4  },

  // ── Anthropic ──────────────────────────────────────────────────────────────
  "claude-opus-4-5":             { input: 15,  output: 75  },
  "claude-3-7-sonnet-20250219":  { input: 3,   output: 15  },
  "claude-3-5-sonnet-20241022":  { input: 3,   output: 15  },
  "claude-3-5-haiku-20241022":   { input: 0.8, output: 4   },
  "claude-3-opus-20240229":      { input: 15,  output: 75  },

  // ── Google Gemini ──────────────────────────────────────────────────────────
  "gemini-2.5-pro-preview-03-25": { input: 1.25,  output: 10   },
  "gemini-2.0-flash":             { input: 0.10,  output: 0.40 },
  "gemini-2.0-flash-lite":        { input: 0.075, output: 0.30 },
  "gemini-1.5-pro":               { input: 1.25,  output: 5    },
  "gemini-1.5-flash":             { input: 0.075, output: 0.30 },
  "gemini-1.5-flash-8b":          { input: 0.0375,output: 0.15 },

  // ── xAI (Grok) ────────────────────────────────────────────────────────────
  "grok-3":           { input: 3,    output: 15  },
  "grok-3-mini":      { input: 0.30, output: 0.50},
  "grok-3-mini-fast": { input: 0.15, output: 0.25},
  "grok-2-vision-1212":{ input: 2,   output: 10  },
  "grok-2-1212":      { input: 2,    output: 10  },

  // ── DeepSeek Direct ────────────────────────────────────────────────────────
  "deepseek-chat":     { input: 0.27, output: 1.10 },
  "deepseek-reasoner": { input: 0.55, output: 2.19 },

  // ── Mistral ────────────────────────────────────────────────────────────────
  "mistral-large-latest":  { input: 2,    output: 6    },
  "mistral-medium-latest": { input: 0.40, output: 2    },
  "mistral-small-latest":  { input: 0.10, output: 0.30 },
  "codestral-latest":      { input: 0.20, output: 0.60 },
  "open-mixtral-8x22b":    { input: 2,    output: 6    },
  "pixtral-large-latest":  { input: 2,    output: 6    },
  "mistral-nemo":          { input: 0.15, output: 0.15 },

  // ── Cohere ─────────────────────────────────────────────────────────────────
  "command-a-03-2025": { input: 2.5, output: 10  },
  "command-r-plus":    { input: 2.5, output: 10  },
  "command-r":         { input: 0.15,output: 0.60},
  "command-light":     { input: 0.10,output: 0.40},

  // ── Perplexity ─────────────────────────────────────────────────────────────
  "sonar-pro":          { input: 3,  output: 15 },
  "sonar":              { input: 1,  output: 1  },
  "sonar-reasoning-pro":{ input: 3,  output: 15 },
  "sonar-reasoning":    { input: 1,  output: 5  },

  // ── Groq ───────────────────────────────────────────────────────────────────
  "llama-3.3-70b-versatile":       { input: 0.59,  output: 0.79 },
  "llama-3.1-70b-versatile":       { input: 0.59,  output: 0.79 },
  "llama-3.1-8b-instant":          { input: 0.05,  output: 0.08 },
  "llama3-70b-8192":               { input: 0.59,  output: 0.79 },
  "mixtral-8x7b-32768":            { input: 0.24,  output: 0.24 },
  "gemma2-9b-it":                  { input: 0.20,  output: 0.20 },
  "deepseek-r1-distill-llama-70b": { input: 0.75,  output: 0.99 },
  "qwen-qwq-32b":                  { input: 0.29,  output: 0.39 },

  // ── Cerebras ───────────────────────────────────────────────────────────────
  "llama3.3-70b": { input: 0.60, output: 0.60 },
  "llama3.1-70b": { input: 0.60, output: 0.60 },
  "llama3.1-8b":  { input: 0.10, output: 0.10 },

  // ── SambaNova ──────────────────────────────────────────────────────────────
  "Meta-Llama-3.3-70B-Instruct":    { input: 0.60, output: 0.60 },
  "Meta-Llama-3.1-405B-Instruct":   { input: 1.33, output: 1.33 },
  "DeepSeek-R1":                    { input: 1.20, output: 1.20 },
  "DeepSeek-R1-Distill-Llama-70B":  { input: 0.70, output: 0.70 },
  "Qwen2.5-72B-Instruct":           { input: 0.60, output: 0.60 },

  // ── Fireworks AI ───────────────────────────────────────────────────────────
  "accounts/fireworks/models/llama-v3p3-70b-instruct":  { input: 0.22, output: 0.22 },
  "accounts/fireworks/models/deepseek-r1":              { input: 3,    output: 8    },
  "accounts/fireworks/models/qwen2p5-72b-instruct":     { input: 0.22, output: 0.22 },
  "accounts/fireworks/models/mixtral-8x22b-instruct":   { input: 0.90, output: 0.90 },
  "accounts/fireworks/models/llama-v3p1-405b-instruct": { input: 3,    output: 3    },

  // ── DeepInfra ──────────────────────────────────────────────────────────────
  "meta-llama/Meta-Llama-3.1-70B-Instruct": { input: 0.52, output: 0.75 },
  "microsoft/phi-4":                         { input: 0.07, output: 0.14 },
  "Qwen/QwQ-32B":                           { input: 0.15, output: 0.20 },
  "deepseek-ai/DeepSeek-R1":               { input: 2.19, output: 2.19 },

  // ── Novita AI ──────────────────────────────────────────────────────────────
  "meta-llama/llama-3.3-70b-instruct": { input: 0.13, output: 0.13 },
  "deepseek/deepseek-v3":             { input: 0.30, output: 0.30 },

  // ── AI21 Labs ──────────────────────────────────────────────────────────────
  "jamba-1.5-large": { input: 2,    output: 8    },
  "jamba-1.5-mini":  { input: 0.20, output: 0.40 },

  // ── Moonshot (Kimi) ────────────────────────────────────────────────────────
  "moonshot-v1-128k": { input: 1.0, output: 3.0 },
  "moonshot-v1-32k":  { input: 0.5, output: 1.5 },
  "moonshot-v1-8k":   { input: 0.1, output: 0.3 },

  // ── Qwen / Alibaba ─────────────────────────────────────────────────────────
  "qwen-max":   { input: 0.40, output: 1.20 },
  "qwen-plus":  { input: 0.30, output: 1.20 },
  "qwen-turbo": { input: 0.05, output: 0.20 },
  "qwen-long":  { input: 0.07, output: 0.28 },

  // ── Zhipu AI (GLM) ─────────────────────────────────────────────────────────
  "glm-4-plus":  { input: 0.14, output: 0.14 },
  "glm-4-flash": { input: 0.01, output: 0.01 },
  "glm-4-air":   { input: 0.03, output: 0.03 },
  "glm-4-long":  { input: 0.03, output: 0.03 },

  // ── Cloudflare Workers AI (fixed price, estimated) ──────────────────────────
  "@cf/meta/llama-4-scout-17b-16e-instruct": { input: 0, output: 0 },
  "@cf/moonshotai/kimi-k2.5":               { input: 0, output: 0 },
  "@cf/openai/gpt-oss-120b":                { input: 0, output: 0 },
  "@cf/nvidia/nemotron-3-120b-a12b":        { input: 0, output: 0 },
  "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b": { input: 0, output: 0 },
  "@cf/qwen/qwen2.5-coder-32b-instruct":    { input: 0, output: 0 },
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast": { input: 0, output: 0 },

  // ── Together AI ────────────────────────────────────────────────────────────
  "meta-llama/Llama-3.3-70B-Instruct-Turbo":  { input: 0.18, output: 0.18 },
  "meta-llama/Llama-3.1-8B-Instruct-Turbo":   { input: 0.02, output: 0.02 },
  "meta-llama/Llama-3.1-405B-Instruct-Turbo": { input: 3.50, output: 3.50 },
  "Qwen/Qwen2.5-72B-Instruct-Turbo":          { input: 0.12, output: 0.12 },
  "deepseek-ai/DeepSeek-R1-together":         { input: 3.00, output: 7.00 },
  "deepseek-ai/DeepSeek-V3":                  { input: 0.30, output: 0.30 },

  // ── OpenRouter (approximate pass-through) ──────────────────────────────────
  "openrouter/auto":                        { input: 0, output: 0 },
  "google/gemini-2.0-flash-exp:free":       { input: 0, output: 0 },
  "google/gemini-2.5-pro-preview-03-25":    { input: 1.25, output: 10  },
  "meta-llama/llama-4-scout:free":          { input: 0, output: 0 },
  "deepseek/deepseek-r1":                   { input: 0, output: 0 },
  "x-ai/grok-3-mini-beta":                  { input: 0.30, output: 0.50 },
  "anthropic/claude-3.5-sonnet":            { input: 3, output: 15 },
};

function estimateCost(model: string, promptTokens: number, completionTokens: number): number | null {
  const cleanModel = model.replace(/^(ollama|lmstudio|groq|openrouter|together|cerebras|fireworks|sambanova|deepinfra|novita|hyperbolic)\//, "");
  const pricing = PRICING[cleanModel] ?? PRICING[model];
  if (!pricing) return null;
  if (pricing.input === 0 && pricing.output === 0) return 0;
  return ((promptTokens * pricing.input) + (completionTokens * pricing.output)) / 1_000_000;
}

export async function trackUsage(params: {
  sessionId?: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs?: number;
}) {
  const total = params.promptTokens + params.completionTokens;
  const cost = estimateCost(params.model, params.promptTokens, params.completionTokens);

  try {
    await db.insert(usageTable).values({
      sessionId: params.sessionId ?? null,
      provider: params.provider,
      model: params.model,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      totalTokens: total,
      latencyMs: params.latencyMs ?? null,
      estimatedCostUsd: cost ?? null,
    });
  } catch (err) {
    console.error("[UsageTracker] Failed to record usage:", err);
  }
}

export async function getUsageSummary() {
  const rows = await db.execute(sql`
    SELECT
      provider,
      COUNT(*)::int AS calls,
      SUM(total_tokens)::bigint AS total_tokens,
      SUM(prompt_tokens)::bigint AS prompt_tokens,
      SUM(completion_tokens)::bigint AS completion_tokens,
      ROUND(SUM(estimated_cost_usd)::numeric, 6) AS total_cost_usd,
      AVG(latency_ms)::int AS avg_latency_ms
    FROM usage
    GROUP BY provider
    ORDER BY total_tokens DESC
  `);
  return rows.rows;
}

export async function getUsageSummaryByModel() {
  const rows = await db.execute(sql`
    SELECT
      model,
      provider,
      COUNT(*)::int AS calls,
      SUM(total_tokens)::bigint AS total_tokens,
      SUM(prompt_tokens)::bigint AS prompt_tokens,
      SUM(completion_tokens)::bigint AS completion_tokens,
      ROUND(SUM(estimated_cost_usd)::numeric, 6) AS total_cost_usd,
      AVG(latency_ms)::int AS avg_latency_ms
    FROM usage
    GROUP BY model, provider
    ORDER BY total_tokens DESC
    LIMIT 50
  `);
  return rows.rows;
}

export async function getUsageSummaryByDay(days = 7) {
  const rows = await db.execute(sql`
    SELECT
      DATE(created_at) AS day,
      COUNT(*)::int AS calls,
      SUM(total_tokens)::bigint AS total_tokens,
      ROUND(SUM(estimated_cost_usd)::numeric, 4) AS total_cost_usd
    FROM usage
    WHERE created_at >= NOW() - INTERVAL '${sql.raw(String(days))} days'
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  `);
  return rows.rows;
}

export async function getUsageTotals() {
  const row = await db.execute(sql`
    SELECT
      COUNT(*)::int AS total_calls,
      SUM(total_tokens)::bigint AS total_tokens,
      SUM(prompt_tokens)::bigint AS total_prompt_tokens,
      SUM(completion_tokens)::bigint AS total_completion_tokens,
      ROUND(SUM(estimated_cost_usd)::numeric, 4) AS total_cost_usd,
      AVG(latency_ms)::int AS avg_latency_ms,
      COUNT(DISTINCT provider) AS providers_used,
      COUNT(DISTINCT model) AS models_used,
      COUNT(DISTINCT session_id) AS sessions
    FROM usage
  `);
  return row.rows[0];
}

export async function getUsageTotalsToday() {
  const row = await db.execute(sql`
    SELECT
      COUNT(*)::int AS calls,
      SUM(total_tokens)::bigint AS total_tokens,
      ROUND(SUM(estimated_cost_usd)::numeric, 4) AS cost_usd
    FROM usage
    WHERE created_at >= CURRENT_DATE
  `);
  return row.rows[0];
}

export async function getUsageBySession(sessionId: string) {
  const rows = await db.execute(sql`
    SELECT
      model,
      provider,
      COUNT(*)::int AS calls,
      SUM(total_tokens)::bigint AS total_tokens,
      ROUND(SUM(estimated_cost_usd)::numeric, 6) AS total_cost_usd,
      AVG(latency_ms)::int AS avg_latency_ms
    FROM usage
    WHERE session_id = ${sessionId}
    GROUP BY model, provider
    ORDER BY total_tokens DESC
  `);
  return rows.rows;
}

export async function getRecentUsage(limit = 50) {
  const rows = await db.execute(sql`
    SELECT id, session_id, provider, model, prompt_tokens, completion_tokens, total_tokens,
           estimated_cost_usd, latency_ms, created_at
    FROM usage
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);
  return rows.rows;
}
