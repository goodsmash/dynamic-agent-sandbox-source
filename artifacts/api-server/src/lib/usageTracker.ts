/**
 * Token Usage Tracker
 * Records AI token usage per call with cost estimation.
 */

import { db } from "@workspace/db";
import { usageTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

// Pricing per 1M tokens (input/output) in USD
const PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-5.2": { input: 3, output: 12 },
  "gpt-5-mini": { input: 0.2, output: 0.8 },
  "o3": { input: 10, output: 40 },
  "o4-mini": { input: 1.1, output: 4.4 },
  // Anthropic
  "claude-opus-4-5": { input: 15, output: 75 },
  "claude-3-7-sonnet-20250219": { input: 3, output: 15 },
  "claude-3-5-sonnet-20241022": { input: 3, output: 15 },
  "claude-3-5-haiku-20241022": { input: 0.8, output: 4 },
  "claude-opus-4-0": { input: 15, output: 75 },
  // Groq
  "llama-3.3-70b-versatile": { input: 0.59, output: 0.79 },
  "llama-3.1-8b-instant": { input: 0.05, output: 0.08 },
  "mixtral-8x7b-32768": { input: 0.24, output: 0.24 },
  "gemma2-9b-it": { input: 0.2, output: 0.2 },
  // Mistral
  "mistral-large-latest": { input: 2, output: 6 },
  "mistral-small-latest": { input: 0.1, output: 0.3 },
  "codestral-latest": { input: 0.2, output: 0.6 },
  // Google
  "gemini-2.5-pro-preview-03-25": { input: 1.25, output: 10 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "gemini-2.0-flash-lite": { input: 0.075, output: 0.3 },
  "gemini-1.5-pro": { input: 1.25, output: 5 },
  // Cohere
  "command-a-03-2025": { input: 2.5, output: 10 },
  "command-r-plus": { input: 2.5, output: 10 },
  "command-r": { input: 0.15, output: 0.6 },
  // Perplexity
  "sonar-pro": { input: 3, output: 15 },
  "sonar": { input: 1, output: 1 },
};

function estimateCost(model: string, promptTokens: number, completionTokens: number): number | null {
  // Strip provider prefixes
  const cleanModel = model.replace(/^(ollama|groq|openrouter|together|lmstudio)\//, "");
  const pricing = PRICING[cleanModel] ?? PRICING[model];
  if (!pricing) return null;
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
      SUM(estimated_cost_usd)::numeric AS total_cost_usd,
      AVG(latency_ms)::int AS avg_latency_ms
    FROM usage
    GROUP BY provider
    ORDER BY total_tokens DESC
  `);
  return rows.rows;
}

export async function getUsageBySession(sessionId: string) {
  const rows = await db.execute(sql`
    SELECT
      model,
      provider,
      COUNT(*)::int AS calls,
      SUM(total_tokens)::bigint AS total_tokens,
      SUM(estimated_cost_usd)::numeric AS total_cost_usd
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
