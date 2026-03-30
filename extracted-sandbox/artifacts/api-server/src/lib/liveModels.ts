/**
 * Live Model Fetcher — real API calls to each provider's /models endpoint.
 * Falls back to static list on error.
 */

import OpenAI from "openai";
import { db } from "@workspace/db";
import { providersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { PROVIDER_MAP } from "./providerConfig.js";

const modelCache = new Map<string, { models: string[]; ts: number }>();
const MODEL_CACHE_TTL = 5 * 60_000; // 5 minutes

async function getApiKey(providerId: string): Promise<string | null> {
  const [row] = await db.select().from(providersTable).where(eq(providersTable.id, providerId)).limit(1);
  return row?.apiKey ?? null;
}

export async function fetchLiveModels(providerId: string): Promise<{
  provider: string;
  models: Array<{ id: string; name: string; context?: number; owned_by?: string }>;
  source: "live" | "cache" | "static";
  error?: string;
}> {
  const def = PROVIDER_MAP[providerId];
  if (!def) {
    return { provider: providerId, models: [], source: "static", error: "Unknown provider" };
  }

  // Check cache
  const cached = modelCache.get(providerId);
  if (cached && Date.now() - cached.ts < MODEL_CACHE_TTL) {
    return {
      provider: providerId,
      models: cached.models.map((id) => ({ id, name: id })),
      source: "cache",
    };
  }

  try {
    let models: Array<{ id: string; name: string; context?: number; owned_by?: string }> = [];

    if (providerId === "openai") {
      const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "replit-ai-proxy";
      const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? "https://api.openai.com/v1";
      const client = new OpenAI({ apiKey, baseURL });
      const resp = await client.models.list();
      models = resp.data
        .filter((m) => m.id.startsWith("gpt-") || m.id.startsWith("o") || m.id.startsWith("text-"))
        .sort((a, b) => b.created - a.created)
        .slice(0, 30)
        .map((m) => ({ id: m.id, name: m.id, owned_by: m.owned_by }));
    } else if (providerId === "groq") {
      const apiKey = await getApiKey("groq");
      if (!apiKey) throw new Error("No Groq API key configured");
      const client = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
      const resp = await client.models.list();
      models = resp.data
        .filter((m) => !m.id.includes("whisper") && !m.id.includes("playai"))
        .map((m) => ({ id: m.id, name: m.id, owned_by: (m as any).owned_by ?? "" }));
    } else if (providerId === "openrouter") {
      const apiKey = await getApiKey("openrouter");
      if (!apiKey) throw new Error("No OpenRouter API key configured");
      const resp = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json() as { data: Array<{ id: string; name: string; context_length?: number }> };
      models = data.data.map((m) => ({
        id: m.id,
        name: m.name ?? m.id,
        context: m.context_length,
      }));
    } else if (providerId === "together") {
      const apiKey = await getApiKey("together");
      if (!apiKey) throw new Error("No Together API key configured");
      const resp = await fetch("https://api.together.xyz/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json() as Array<{ id: string; display_name?: string; context_length?: number; type?: string }>;
      models = data
        .filter((m) => m.type === "chat" || m.type === "language")
        .map((m) => ({ id: m.id, name: m.display_name ?? m.id, context: m.context_length }));
    } else if (providerId === "mistral") {
      const apiKey = await getApiKey("mistral");
      if (!apiKey) throw new Error("No Mistral API key configured");
      const resp = await fetch("https://api.mistral.ai/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json() as { data: Array<{ id: string; owned_by?: string }> };
      models = data.data.map((m) => ({ id: m.id, name: m.id, owned_by: m.owned_by }));
    } else if (providerId === "google") {
      const apiKey = await getApiKey("google");
      if (!apiKey) throw new Error("No Google API key configured");
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json() as { models: Array<{ name: string; displayName?: string; inputTokenLimit?: number; supportedGenerationMethods?: string[] }> };
      models = data.models
        .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m) => ({
          id: m.name.replace("models/", ""),
          name: m.displayName ?? m.name,
          context: m.inputTokenLimit,
        }));
    } else if (providerId === "cohere") {
      const apiKey = await getApiKey("cohere");
      if (!apiKey) throw new Error("No Cohere API key configured");
      const resp = await fetch("https://api.cohere.com/v2/models?page_size=30", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json() as { models: Array<{ name: string; context_length?: number }> };
      models = data.models.map((m) => ({ id: m.name, name: m.name, context: m.context_length }));
    } else if (providerId === "perplexity") {
      // Perplexity doesn't have a public /models endpoint, use static list
      models = def.popularModels.map((id) => ({ id, name: id }));
    } else if (providerId === "ollama") {
      const apiKey = await getApiKey("ollama");
      const baseURL = (await db.select().from(providersTable).where(eq(providersTable.id, "ollama")).limit(1))[0]?.baseUrl
        ?? "http://localhost:11434";
      const resp = await fetch(`${baseURL}/api/tags`);
      if (!resp.ok) throw new Error(`Ollama not reachable at ${baseURL}`);
      const data = await resp.json() as { models: Array<{ name: string; size?: number }> };
      models = data.models.map((m) => ({ id: `ollama/${m.name}`, name: m.name }));
    } else if (providerId === "lmstudio") {
      const baseURL = (await db.select().from(providersTable).where(eq(providersTable.id, "lmstudio")).limit(1))[0]?.baseUrl
        ?? "http://localhost:1234";
      const client = new OpenAI({ apiKey: "lm-studio", baseURL: `${baseURL}/v1` });
      const resp = await client.models.list();
      models = resp.data.map((m) => ({ id: `lmstudio/${m.id}`, name: m.id }));
    } else if (providerId === "anthropic") {
      // Anthropic doesn't have a public /models endpoint, return static
      models = def.popularModels.map((id) => ({ id, name: id }));
    } else {
      models = def.popularModels.map((id) => ({ id, name: id }));
    }

    // Cache results
    modelCache.set(providerId, { models: models.map((m) => m.id), ts: Date.now() });

    return { provider: providerId, models, source: "live" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Return static fallback
    const staticModels = def.popularModels.map((id) => ({ id, name: id }));
    return { provider: providerId, models: staticModels, source: "static", error: msg };
  }
}

export function invalidateLiveModelCache(providerId: string) {
  modelCache.delete(providerId);
}
