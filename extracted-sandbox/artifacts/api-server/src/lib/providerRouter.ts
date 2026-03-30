/**
 * OpenClaw Universal Provider Router
 *
 * Routes AI calls to the correct provider based on model name.
 * Supports 20+ providers — all OpenAI-compatible except Anthropic.
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@workspace/db";
import { providersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { detectProvider, stripProviderPrefix, PROVIDER_MAP } from "./providerConfig.js";
import { trackUsage } from "./usageTracker.js";

// ─── API Key Cache (TTL: 30s) ─────────────────────────────────────────────────
const keyCache = new Map<string, { key: string | null; url: string | null; ts: number }>();
const KEY_CACHE_TTL_MS = 30_000;

async function getProviderConfig(providerId: string): Promise<{ apiKey: string | null; baseUrl: string | null }> {
  const cached = keyCache.get(providerId);
  if (cached && Date.now() - cached.ts < KEY_CACHE_TTL_MS) {
    return { apiKey: cached.key, baseUrl: cached.url };
  }

  const [row] = await db.select().from(providersTable).where(eq(providersTable.id, providerId)).limit(1);
  const config = { apiKey: row?.apiKey ?? null, baseUrl: row?.baseUrl ?? null };
  keyCache.set(providerId, { key: config.apiKey, url: config.baseUrl, ts: Date.now() });
  return config;
}

export function invalidateProviderCache(providerId: string) {
  keyCache.delete(providerId);
}

// ─── OpenAI-compatible Client Factory ─────────────────────────────────────────
async function makeOpenAIClient(providerId: string): Promise<OpenAI> {
  const def = PROVIDER_MAP[providerId];
  const config = await getProviderConfig(providerId);

  let apiKey: string;
  let baseURL: string;

  if (providerId === "openai") {
    apiKey = config.apiKey ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "replit-ai-proxy";
    baseURL = config.baseUrl ?? process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  } else if (providerId === "cloudflare") {
    // Cloudflare Workers AI — needs CF API Token + Account ID embedded in base URL
    apiKey = config.apiKey ?? process.env.CF_API_TOKEN ?? "no-key";
    const accountId = process.env.CF_ACCOUNT_ID ?? "ACCOUNT_ID";
    const defaultUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`;
    // If the stored baseUrl still has ACCOUNT_ID placeholder, replace with env var
    let storedUrl = config.baseUrl ?? defaultUrl;
    if (storedUrl.includes("ACCOUNT_ID") && accountId !== "ACCOUNT_ID") {
      storedUrl = storedUrl.replace("ACCOUNT_ID", accountId);
    }
    baseURL = storedUrl;
  } else {
    apiKey = config.apiKey ?? "no-key";
    baseURL = config.baseUrl ?? def?.defaultBaseUrl ?? "https://api.openai.com/v1";
  }

  return new OpenAI({ apiKey, baseURL });
}

async function makeAnthropicClient(): Promise<Anthropic> {
  const config = await getProviderConfig("anthropic");
  const apiKey = config.apiKey;
  if (!apiKey) throw new Error("Anthropic API key not configured. Go to Settings → Anthropic to add your key.");
  return new Anthropic({ apiKey });
}

// ─── Providers that use max_tokens instead of max_completion_tokens ────────────
// Most providers support max_tokens (original param). OpenAI >= gpt-4o uses max_completion_tokens.
const MAX_TOKENS_PROVIDERS = new Set([
  "groq", "together", "openrouter", "mistral", "google", "cohere", "perplexity",
  "xai", "deepseek", "cerebras", "fireworks", "sambanova", "deepinfra", "novita",
  "hyperbolic", "ai21", "moonshot", "qwen", "zhipu", "ollama", "lmstudio",
]);

// ─── Chat Message Type ────────────────────────────────────────────────────────
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// ─── Extra headers per provider ───────────────────────────────────────────────
function getExtraHeaders(providerId: string): Record<string, string> {
  if (providerId === "openrouter") {
    return {
      "HTTP-Referer": "https://openclaw.ai",
      "X-Title": "OpenClaw Agent Platform",
    };
  }
  return {};
}

// ─── Qwen3 thinking-mode models that require enable_thinking param ─────────────
// Qwen3 models have thinking mode enabled by default. For non-streaming calls
// we must explicitly disable it, or use streaming (streaming handles it fine).
function isQwen3ThinkingModel(model: string): boolean {
  const m = model.toLowerCase();
  return m.startsWith("qwen3-") || m.startsWith("qwen3.5-") || m.startsWith("qvq-");
}

// ─── Build create params depending on provider ────────────────────────────────
function buildChatParams(
  providerId: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
  streaming = false
) {
  const base = { model, messages } as Record<string, unknown>;
  if (MAX_TOKENS_PROVIDERS.has(providerId)) {
    base["max_tokens"] = maxTokens;
  } else {
    base["max_completion_tokens"] = maxTokens;
  }
  // Qwen3 non-streaming: disable thinking to avoid 400 error
  if (providerId === "qwen" && !streaming && isQwen3ThinkingModel(model)) {
    base["enable_thinking"] = false;
  }
  return base;
}

// ─── Streaming Chat ────────────────────────────────────────────────────────────
/**
 * Streams chat tokens from any provider, yielding text chunks.
 */
export async function* streamChat(
  model: string,
  messages: ChatMessage[],
  maxTokens = 4096,
  sessionId?: string
): AsyncGenerator<string> {
  const providerId = detectProvider(model);
  const cleanModel = stripProviderPrefix(model);
  const start = Date.now();
  let promptTokens = 0;
  let completionTokens = 0;
  let totalOutput = "";

  // ── Anthropic (native SDK) ────────────────────────────────────────────────
  if (providerId === "anthropic") {
    const client = await makeAnthropicClient();
    const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
    const userMessages = messages.filter((m) => m.role !== "system").map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const stream = await client.messages.create({
      model: cleanModel,
      max_tokens: maxTokens,
      system: systemMsg,
      messages: userMessages,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        totalOutput += event.delta.text;
        yield event.delta.text;
      }
      if (event.type === "message_delta" && (event as any).usage) {
        completionTokens = (event as any).usage.output_tokens ?? 0;
      }
      if (event.type === "message_start" && (event as any).message?.usage) {
        promptTokens = (event as any).message.usage.input_tokens ?? 0;
      }
    }

    if (promptTokens === 0) promptTokens = Math.ceil(messages.reduce((a, m) => a + m.content.length, 0) / 4);
    if (completionTokens === 0) completionTokens = Math.ceil(totalOutput.length / 4);
    await trackUsage({ sessionId, provider: "anthropic", model: cleanModel, promptTokens, completionTokens, latencyMs: Date.now() - start });
    return;
  }

  // ── All other providers: OpenAI-compatible ────────────────────────────────
  const client = await makeOpenAIClient(providerId);
  const extraHeaders = getExtraHeaders(providerId);

  const params = {
    ...buildChatParams(providerId, cleanModel, messages, maxTokens, true),
    stream: true,
    stream_options: { include_usage: true },
  } as any;

  try {
    const stream = await client.chat.completions.create(params, extraHeaders ? { headers: extraHeaders } : undefined);

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        totalOutput += text;
        yield text;
      }
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens ?? 0;
        completionTokens = chunk.usage.completion_tokens ?? 0;
      }
    }
  } catch (err: any) {
    throw new Error(`[${providerId}] ${err?.message ?? String(err)}`);
  }

  if (promptTokens === 0) promptTokens = Math.ceil(messages.reduce((a, m) => a + m.content.length, 0) / 4);
  if (completionTokens === 0) completionTokens = Math.ceil(totalOutput.length / 4);
  await trackUsage({ sessionId, provider: providerId, model: cleanModel, promptTokens, completionTokens, latencyMs: Date.now() - start });
}

/**
 * Non-streaming chat completion from any provider. Returns full response text.
 */
export async function chatComplete(
  model: string,
  messages: ChatMessage[],
  maxTokens = 2048,
  sessionId?: string
): Promise<string> {
  const providerId = detectProvider(model);
  const cleanModel = stripProviderPrefix(model);
  const start = Date.now();

  // ── Anthropic ─────────────────────────────────────────────────────────────
  if (providerId === "anthropic") {
    const client = await makeAnthropicClient();
    const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
    const userMessages = messages.filter((m) => m.role !== "system").map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const resp = await client.messages.create({
      model: cleanModel,
      max_tokens: maxTokens,
      system: systemMsg,
      messages: userMessages,
    });

    await trackUsage({
      sessionId,
      provider: "anthropic",
      model: cleanModel,
      promptTokens: resp.usage?.input_tokens ?? 0,
      completionTokens: resp.usage?.output_tokens ?? 0,
      latencyMs: Date.now() - start,
    });

    return resp.content[0]?.type === "text" ? resp.content[0].text : "[No response]";
  }

  // ── OpenAI-compatible ─────────────────────────────────────────────────────
  const client = await makeOpenAIClient(providerId);
  const extraHeaders = getExtraHeaders(providerId);

  const params = buildChatParams(providerId, cleanModel, messages, maxTokens) as any;
  const resp = await client.chat.completions.create(params, extraHeaders ? { headers: extraHeaders } : undefined);

  await trackUsage({
    sessionId,
    provider: providerId,
    model: cleanModel,
    promptTokens: resp.usage?.prompt_tokens ?? 0,
    completionTokens: resp.usage?.completion_tokens ?? 0,
    latencyMs: Date.now() - start,
  });

  return resp.choices[0]?.message?.content ?? "[No response]";
}

/**
 * Test connectivity to a provider by sending a minimal request.
 */
export async function testProvider(
  providerId: string,
  testModel?: string
): Promise<{ ok: boolean; model: string; latencyMs: number; error?: string }> {
  const def = PROVIDER_MAP[providerId];
  if (!def) return { ok: false, model: "", latencyMs: 0, error: "Unknown provider" };

  const model = testModel ?? def.popularModels[0] ?? "gpt-4o-mini";
  const start = Date.now();

  try {
    await chatComplete(model, [{ role: "user", content: "Reply with just: ok" }], 8);
    return { ok: true, model, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, model, latencyMs: Date.now() - start, error: err instanceof Error ? err.message : String(err) };
  }
}
