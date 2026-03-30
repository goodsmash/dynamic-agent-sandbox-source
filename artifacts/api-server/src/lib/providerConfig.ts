/**
 * OpenClaw Multi-Provider AI Configuration
 *
 * Every major AI provider with their model prefixes, base URLs,
 * pricing info, and capability flags.
 */

export interface ProviderDef {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  defaultBaseUrl: string;
  needsKey: boolean;
  free?: boolean;
  pricingTier: "free" | "cheap" | "standard" | "premium";
  pricingNote: string;
  modelPrefixes: string[];
  popularModels: string[];
  icon: string;
  color: string;
  sdk?: "anthropic";
  supportsStreaming: boolean;
  docsUrl: string;
}

export const PROVIDER_DEFS: ProviderDef[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-5.2, GPT-5-mini, o3, o4-mini and more. Used via Replit AI Integration proxy — no key needed in local mode.",
    baseUrl: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    defaultBaseUrl: "https://api.openai.com/v1",
    needsKey: false,
    pricingTier: "standard",
    pricingNote: "~$15/1M tokens (GPT-5.2)",
    modelPrefixes: ["gpt-", "o1", "o3", "o4", "text-embedding", "babbage", "davinci"],
    popularModels: ["gpt-5.2", "gpt-5-mini", "o3", "o4-mini", "gpt-4o", "gpt-4o-mini"],
    icon: "◆",
    color: "#10a37f",
    supportsStreaming: true,
    docsUrl: "https://platform.openai.com/docs",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude 3.7 Sonnet, Claude 3.5, Claude Opus 4. Best for long context, coding, and analysis.",
    baseUrl: "https://api.anthropic.com/v1",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    needsKey: true,
    pricingTier: "premium",
    pricingNote: "~$15/1M tokens (Sonnet 3.7)",
    modelPrefixes: ["claude-"],
    popularModels: [
      "claude-opus-4-5",
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
    ],
    icon: "✺",
    color: "#d97706",
    sdk: "anthropic",
    supportsStreaming: true,
    docsUrl: "https://docs.anthropic.com",
  },
  {
    id: "groq",
    name: "Groq",
    description: "Extremely fast inference (700+ tok/s) on Llama, Mixtral, Whisper. Generous free tier. Best for speed.",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    needsKey: true,
    free: true,
    pricingTier: "cheap",
    pricingNote: "~$0.06/1M tokens (Llama 3.1 70B)",
    modelPrefixes: ["groq/", "llama-3.1-70b-versatile", "llama-3.1-8b-instant", "llama3-70b", "llama3-8b", "mixtral-8x7b-32768", "gemma2-9b-it", "whisper-large-v3"],
    popularModels: [
      "llama-3.3-70b-versatile",
      "llama-3.1-70b-versatile",
      "llama-3.1-8b-instant",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
      "deepseek-r1-distill-llama-70b",
      "qwen-qwq-32b",
    ],
    icon: "⚡",
    color: "#f97316",
    supportsStreaming: true,
    docsUrl: "https://console.groq.com/docs",
  },
  {
    id: "together",
    name: "Together AI",
    description: "100+ open-source models (Llama, Qwen, DeepSeek, Mistral, FLUX). Very cheap rates.",
    baseUrl: "https://api.together.xyz/v1",
    defaultBaseUrl: "https://api.together.xyz/v1",
    needsKey: true,
    pricingTier: "cheap",
    pricingNote: "~$0.18/1M tokens (Llama 3.3 70B)",
    modelPrefixes: ["together/", "meta-llama/", "togethercomputer/", "mistralai/", "Qwen/", "deepseek-ai/", "google/gemma"],
    popularModels: [
      "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      "meta-llama/Llama-3.1-8B-Instruct-Turbo",
      "Qwen/Qwen2.5-72B-Instruct-Turbo",
      "deepseek-ai/DeepSeek-R1",
      "mistralai/Mistral-7B-Instruct-v0.3",
      "google/gemma-2-27b-it",
    ],
    icon: "∞",
    color: "#8b5cf6",
    supportsStreaming: true,
    docsUrl: "https://docs.together.ai",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Access 300+ models from all providers (OpenAI, Anthropic, Google, Meta, Mistral...) through one API. Smart routing, cheapest rates.",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    needsKey: true,
    pricingTier: "cheap",
    pricingNote: "Pay per provider — use free models or route to cheapest",
    modelPrefixes: ["openrouter/", "google/gemini-", "microsoft/", "nousresearch/", "01-ai/", "amazon/"],
    popularModels: [
      "openrouter/auto",
      "google/gemini-2.0-flash-exp:free",
      "google/gemini-2.5-pro-preview-03-25",
      "meta-llama/llama-4-scout:free",
      "anthropic/claude-3.5-sonnet",
      "microsoft/phi-4",
      "nousresearch/hermes-3-llama-3.1-405b",
    ],
    icon: "◈",
    color: "#06b6d4",
    supportsStreaming: true,
    docsUrl: "https://openrouter.ai/docs",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    description: "Mistral Large, Mixtral 8x22B, Codestral for code. European AI — GDPR compliant, no training on your data.",
    baseUrl: "https://api.mistral.ai/v1",
    defaultBaseUrl: "https://api.mistral.ai/v1",
    needsKey: true,
    pricingTier: "cheap",
    pricingNote: "~$2/1M tokens (Mistral Large 2)",
    modelPrefixes: ["mistral-", "open-mixtral-", "open-mistral-", "codestral-", "pixtral-"],
    popularModels: [
      "mistral-large-latest",
      "mistral-small-latest",
      "codestral-latest",
      "open-mixtral-8x22b",
      "pixtral-large-latest",
    ],
    icon: "❖",
    color: "#f59e0b",
    supportsStreaming: true,
    docsUrl: "https://docs.mistral.ai",
  },
  {
    id: "google",
    name: "Google Gemini",
    description: "Gemini 2.5 Pro, Flash, and Flash Lite. Huge context windows (up to 2M tokens). Multimodal with vision.",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    needsKey: true,
    free: true,
    pricingTier: "cheap",
    pricingNote: "Free tier available. ~$7/1M tokens (Gemini 2.5 Pro)",
    modelPrefixes: ["gemini-", "models/gemini-"],
    popularModels: [
      "gemini-2.5-pro-preview-03-25",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ],
    icon: "◉",
    color: "#4285f4",
    supportsStreaming: true,
    docsUrl: "https://ai.google.dev/docs",
  },
  {
    id: "cohere",
    name: "Cohere",
    description: "Command R+, Command A. Specialized in RAG, enterprise search, and document analysis. OpenAI-compatible API.",
    baseUrl: "https://api.cohere.ai/compatibility/v1",
    defaultBaseUrl: "https://api.cohere.ai/compatibility/v1",
    needsKey: true,
    pricingTier: "standard",
    pricingNote: "~$2.50/1M tokens (Command R+)",
    modelPrefixes: ["command-", "cohere/"],
    popularModels: [
      "command-a-03-2025",
      "command-r-plus",
      "command-r",
      "command-light",
    ],
    icon: "⌘",
    color: "#0e7d7d",
    supportsStreaming: true,
    docsUrl: "https://docs.cohere.com",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    description: "Sonar models with real-time web search built in. Ask anything about current events, research, live data.",
    baseUrl: "https://api.perplexity.ai",
    defaultBaseUrl: "https://api.perplexity.ai",
    needsKey: true,
    pricingTier: "standard",
    pricingNote: "~$1/1M tokens + $5/1000 search queries",
    modelPrefixes: ["sonar-", "llama-3.1-sonar-", "pplx-"],
    popularModels: [
      "sonar-pro",
      "sonar",
      "sonar-reasoning-pro",
      "sonar-reasoning",
    ],
    icon: "⊙",
    color: "#20b2aa",
    supportsStreaming: true,
    docsUrl: "https://docs.perplexity.ai",
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    description: "Run Llama, Qwen, Phi, Mistral, Gemma, DeepSeek locally. 100% private, free, no API key. Requires Ollama installed.",
    baseUrl: "http://localhost:11434/v1",
    defaultBaseUrl: "http://localhost:11434/v1",
    needsKey: false,
    free: true,
    pricingTier: "free",
    pricingNote: "100% FREE — runs on your hardware",
    modelPrefixes: ["ollama/"],
    popularModels: [
      "ollama/llama3.3",
      "ollama/llama3.1:8b",
      "ollama/qwen2.5:7b",
      "ollama/deepseek-r1:8b",
      "ollama/phi4",
      "ollama/mistral",
      "ollama/gemma3:4b",
      "ollama/codellama:7b",
    ],
    icon: "⬡",
    color: "#22c55e",
    supportsStreaming: true,
    docsUrl: "https://ollama.com/library",
  },
  {
    id: "lmstudio",
    name: "LM Studio (Local)",
    description: "Local models via LM Studio. OpenAI-compatible server with GPU acceleration. Private, offline, free.",
    baseUrl: "http://localhost:1234/v1",
    defaultBaseUrl: "http://localhost:1234/v1",
    needsKey: false,
    free: true,
    pricingTier: "free",
    pricingNote: "100% FREE — runs on your GPU",
    modelPrefixes: ["lmstudio/"],
    popularModels: [
      "lmstudio/any-model",
    ],
    icon: "⬢",
    color: "#a855f7",
    supportsStreaming: true,
    docsUrl: "https://lmstudio.ai/docs",
  },
];

export const PROVIDER_MAP = Object.fromEntries(
  PROVIDER_DEFS.map((p) => [p.id, p])
) as Record<string, ProviderDef>;

/**
 * Detect which provider a model name belongs to.
 */
export function detectProvider(model: string): string {
  const m = model.toLowerCase();

  if (m.startsWith("@cf/")) return "cloudflare";
  if (m.startsWith("gpt-") || m.startsWith("o1") || m.startsWith("o3") || m.startsWith("o4") || m.startsWith("text-embedding") || m.startsWith("babbage") || m.startsWith("davinci")) return "openai";
  if (m.startsWith("claude-")) return "anthropic";
  if (m.startsWith("gemini-") || m.startsWith("models/gemini-")) return "google";
  if (m.startsWith("groq/") || ["llama-3.1-70b-versatile","llama-3.1-8b-instant","llama3-70b-8192","llama3-8b-8192","mixtral-8x7b-32768","gemma2-9b-it","llama-3.3-70b-versatile","deepseek-r1-distill-llama-70b","qwen-qwq-32b","whisper-large-v3"].includes(m)) return "groq";
  if (m.startsWith("sonar-") || m.startsWith("pplx-") || m.startsWith("llama-3.1-sonar")) return "perplexity";
  if (m.startsWith("mistral-") || m.startsWith("open-mixtral") || m.startsWith("open-mistral") || m.startsWith("codestral") || m.startsWith("pixtral")) return "mistral";
  if (m.startsWith("command-") || m.startsWith("cohere/")) return "cohere";
  if (m.startsWith("ollama/")) return "ollama";
  if (m.startsWith("lmstudio/")) return "lmstudio";
  if (m.startsWith("together/") || m.startsWith("meta-llama/") || m.startsWith("togethercomputer/") || m.startsWith("mistralai/") || m.startsWith("qwen/") || m.startsWith("deepseek-ai/") || m.startsWith("google/gemma") || m.startsWith("nousresearch/")) return "together";
  if (m.startsWith("openrouter/") || m.startsWith("google/gemini-") || m.startsWith("microsoft/") || m.startsWith("01-ai/") || m.startsWith("amazon/")) return "openrouter";
  if (m.includes("/") && !m.startsWith("@")) {
    // org/model format not caught above — route through OpenRouter
    return "openrouter";
  }

  return "openai";
}

/**
 * Strip provider prefix from model name (e.g., "ollama/llama3.1:8b" → "llama3.1:8b")
 */
export function stripProviderPrefix(model: string): string {
  return model.replace(/^(ollama|lmstudio|groq|together|openrouter)\//, "");
}
