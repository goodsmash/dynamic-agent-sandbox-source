/**
 * OpenClaw Multi-Provider AI Configuration
 *
 * 20+ AI providers — every major LLM API on the planet.
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
  // ── Tier 0: Cloudflare Workers AI — free, global edge, 100+ models ─────────
  {
    id: "cloudflare",
    name: "Cloudflare Workers AI",
    description: "100+ models on Cloudflare's global edge network. Llama 4, Qwen 2.5, DeepSeek R1, Gemma 3. Free tier available. Requires Account ID + API Token.",
    baseUrl: "https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/ai/v1",
    defaultBaseUrl: "https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/ai/v1",
    needsKey: true,
    free: true,
    pricingTier: "free",
    pricingNote: "10K neurons/day free — Workers AI free tier",
    modelPrefixes: ["@cf/"],
    popularModels: [
      "@cf/meta/llama-4-scout-17b-16e-instruct",
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      "@cf/meta/llama-3.1-8b-instruct",
      "@cf/meta/llama-3.2-3b-instruct",
      "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
      "@cf/deepseek-ai/deepseek-r1-distill-llama-70b",
      "@cf/qwen/qwen2.5-72b-instruct",
      "@cf/qwen/qwen2.5-coder-32b-instruct",
      "@cf/google/gemma-3-12b-it",
      "@cf/google/gemma-3-27b-it",
      "@cf/mistral/mistral-7b-instruct-v0.2",
      "@cf/microsoft/phi-2",
    ],
    icon: "☁️",
    color: "#f6821f",
    supportsStreaming: true,
    docsUrl: "https://developers.cloudflare.com/workers-ai/models/",
  },

  // ── Tier 1: Zero-config (Replit proxy) ────────────────────────────────────
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-5.2, GPT-5-mini, o3, o4-mini. Replit AI Integration proxy — no key needed.",
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

  // ── Tier 2: Major commercial providers ────────────────────────────────────
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude 3.7 Sonnet, Claude Opus 4.5. Best for coding, long context, analysis.",
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
    id: "google",
    name: "Google Gemini",
    description: "Gemini 2.5 Pro, Flash. Huge context (2M tokens). Free tier available.",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    needsKey: true,
    free: true,
    pricingTier: "cheap",
    pricingNote: "Free tier. ~$7/1M tokens (Gemini 2.5 Pro)",
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
    id: "xai",
    name: "xAI (Grok)",
    description: "Grok-3, Grok-3-mini, Grok-2-vision. Real-time knowledge, built by xAI.",
    baseUrl: "https://api.x.ai/v1",
    defaultBaseUrl: "https://api.x.ai/v1",
    needsKey: true,
    pricingTier: "standard",
    pricingNote: "~$5/1M tokens (Grok-3-mini)",
    modelPrefixes: ["grok-"],
    popularModels: ["grok-3", "grok-3-mini", "grok-3-mini-fast", "grok-2-vision-1212"],
    icon: "✕",
    color: "#1a1a1a",
    supportsStreaming: true,
    docsUrl: "https://docs.x.ai",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "DeepSeek V3, DeepSeek-R1 Reasoner. State-of-the-art open-weight reasoning. Very cheap.",
    baseUrl: "https://api.deepseek.com/v1",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    needsKey: true,
    pricingTier: "cheap",
    pricingNote: "~$0.27/1M tokens (DeepSeek V3)",
    modelPrefixes: ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"],
    popularModels: ["deepseek-chat", "deepseek-reasoner"],
    icon: "⬡",
    color: "#1d4ed8",
    supportsStreaming: true,
    docsUrl: "https://api-docs.deepseek.com",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    description: "Mistral Large, Codestral, Mixtral 8x22B. European AI, GDPR-compliant.",
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
    id: "cohere",
    name: "Cohere",
    description: "Command A, Command R+. Best for RAG, enterprise search, document analysis.",
    baseUrl: "https://api.cohere.ai/compatibility/v1",
    defaultBaseUrl: "https://api.cohere.ai/compatibility/v1",
    needsKey: true,
    pricingTier: "standard",
    pricingNote: "~$2.50/1M tokens (Command R+)",
    modelPrefixes: ["command-", "cohere/"],
    popularModels: ["command-a-03-2025", "command-r-plus", "command-r", "command-light"],
    icon: "⌘",
    color: "#0e7d7d",
    supportsStreaming: true,
    docsUrl: "https://docs.cohere.com",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    description: "Sonar models with real-time web search. Live data, current events, research.",
    baseUrl: "https://api.perplexity.ai",
    defaultBaseUrl: "https://api.perplexity.ai",
    needsKey: true,
    pricingTier: "standard",
    pricingNote: "~$1/1M tokens + $5/1000 search queries",
    modelPrefixes: ["sonar-", "llama-3.1-sonar-", "pplx-"],
    popularModels: ["sonar-pro", "sonar", "sonar-reasoning-pro", "sonar-reasoning"],
    icon: "⊙",
    color: "#20b2aa",
    supportsStreaming: true,
    docsUrl: "https://docs.perplexity.ai",
  },

  // ── Tier 3: Ultra-fast inference APIs ─────────────────────────────────────
  {
    id: "groq",
    name: "Groq",
    description: "700+ tokens/sec inference. Llama 3.3, Mixtral, DeepSeek-R1, QwQ. Generous free tier.",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    needsKey: true,
    free: true,
    pricingTier: "cheap",
    pricingNote: "~$0.06/1M tokens (Llama 3.1 70B)",
    modelPrefixes: ["groq/", "llama-3.1-70b-versatile", "llama-3.1-8b-instant", "llama3-70b", "llama3-8b", "mixtral-8x7b-32768", "gemma2-9b-it"],
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
    id: "cerebras",
    name: "Cerebras",
    description: "World's fastest LLM inference — 2000+ tok/s on wafer-scale silicon. Llama 3.1/3.3.",
    baseUrl: "https://api.cerebras.ai/v1",
    defaultBaseUrl: "https://api.cerebras.ai/v1",
    needsKey: true,
    free: true,
    pricingTier: "cheap",
    pricingNote: "Free tier generous. ~$0.60/1M tokens",
    modelPrefixes: ["cerebras/"],
    popularModels: ["llama3.3-70b", "llama3.1-70b", "llama3.1-8b"],
    icon: "⬢",
    color: "#dc2626",
    supportsStreaming: true,
    docsUrl: "https://inference-docs.cerebras.ai",
  },
  {
    id: "fireworks",
    name: "Fireworks AI",
    description: "Fast, cheap open model inference. Llama 4, DeepSeek R1, Qwen 2.5, Mixtral, Gemma.",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    defaultBaseUrl: "https://api.fireworks.ai/inference/v1",
    needsKey: true,
    pricingTier: "cheap",
    pricingNote: "~$0.22/1M tokens (Llama 3.3 70B)",
    modelPrefixes: ["accounts/fireworks/models/", "fireworks/"],
    popularModels: [
      "accounts/fireworks/models/llama-v3p3-70b-instruct",
      "accounts/fireworks/models/deepseek-r1",
      "accounts/fireworks/models/qwen2p5-72b-instruct",
      "accounts/fireworks/models/mixtral-8x22b-instruct",
      "accounts/fireworks/models/llama-v3p1-405b-instruct",
    ],
    icon: "🔥",
    color: "#ea580c",
    supportsStreaming: true,
    docsUrl: "https://readme.fireworks.ai",
  },
  {
    id: "sambanova",
    name: "SambaNova",
    description: "Ultra-fast Llama and DeepSeek inference. Free tier. Fastest 405B in the world.",
    baseUrl: "https://fast-api.snova.ai/v1",
    defaultBaseUrl: "https://fast-api.snova.ai/v1",
    needsKey: true,
    free: true,
    pricingTier: "cheap",
    pricingNote: "Free tier. ~$0.60/1M tokens",
    modelPrefixes: ["sambanova/", "Meta-Llama-", "DeepSeek-R1"],
    popularModels: [
      "Meta-Llama-3.3-70B-Instruct",
      "Meta-Llama-3.1-405B-Instruct",
      "DeepSeek-R1",
      "DeepSeek-R1-Distill-Llama-70B",
      "Qwen2.5-72B-Instruct",
    ],
    icon: "◑",
    color: "#7c3aed",
    supportsStreaming: true,
    docsUrl: "https://community.sambanova.ai/t/supported-models",
  },

  // ── Tier 4: OpenRouter and multi-model hubs ────────────────────────────────
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "300+ models from all providers via one API. Smart routing, free models, cheapest rates.",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    needsKey: true,
    pricingTier: "cheap",
    pricingNote: "Pay per provider — free models available",
    modelPrefixes: ["openrouter/", "google/gemini-", "microsoft/", "nousresearch/", "01-ai/", "amazon/"],
    popularModels: [
      "openrouter/auto",
      "google/gemini-2.0-flash-exp:free",
      "google/gemini-2.5-pro-preview-03-25",
      "meta-llama/llama-4-scout:free",
      "anthropic/claude-3.5-sonnet",
      "microsoft/phi-4",
      "x-ai/grok-3-mini-beta",
      "deepseek/deepseek-r1",
    ],
    icon: "◈",
    color: "#06b6d4",
    supportsStreaming: true,
    docsUrl: "https://openrouter.ai/docs",
  },
  {
    id: "together",
    name: "Together AI",
    description: "100+ open-source models. Llama, Qwen, DeepSeek, Mistral, FLUX image gen. Very cheap.",
    baseUrl: "https://api.together.xyz/v1",
    defaultBaseUrl: "https://api.together.xyz/v1",
    needsKey: true,
    pricingTier: "cheap",
    pricingNote: "~$0.18/1M tokens (Llama 3.3 70B)",
    modelPrefixes: ["together/", "meta-llama/", "togethercomputer/", "mistralai/", "Qwen/", "deepseek-ai/", "google/gemma", "nousresearch/"],
    popularModels: [
      "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      "meta-llama/Llama-3.1-8B-Instruct-Turbo",
      "Qwen/Qwen2.5-72B-Instruct-Turbo",
      "deepseek-ai/DeepSeek-R1",
      "mistralai/Mistral-7B-Instruct-v0.3",
    ],
    icon: "∞",
    color: "#8b5cf6",
    supportsStreaming: true,
    docsUrl: "https://docs.together.ai",
  },
  {
    id: "deepinfra",
    name: "DeepInfra",
    description: "Cheap OpenAI-compatible inference. Llama, Mixtral, Qwen, DeepSeek, Phi, Gemma.",
    baseUrl: "https://api.deepinfra.com/v1/openai",
    defaultBaseUrl: "https://api.deepinfra.com/v1/openai",
    needsKey: true,
    pricingTier: "cheap",
    pricingNote: "~$0.07/1M tokens (Llama 3.1 8B)",
    modelPrefixes: ["deepinfra/"],
    popularModels: [
      "deepinfra/meta-llama/Meta-Llama-3.1-70B-Instruct",
      "deepinfra/microsoft/phi-4",
      "deepinfra/Qwen/QwQ-32B",
      "deepinfra/google/gemma-2-27b-it",
      "deepinfra/nvidia/Llama-3.1-Nemotron-70B-Instruct",
    ],
    icon: "⊛",
    color: "#6366f1",
    supportsStreaming: true,
    docsUrl: "https://deepinfra.com/docs",
  },
  {
    id: "novita",
    name: "Novita AI",
    description: "Cheap open model inference. Llama, Qwen, DeepSeek, Mistral. Pay-as-you-go.",
    baseUrl: "https://api.novita.ai/v3/openai",
    defaultBaseUrl: "https://api.novita.ai/v3/openai",
    needsKey: true,
    pricingTier: "cheap",
    pricingNote: "~$0.13/1M tokens (Llama 3.1 70B)",
    modelPrefixes: ["novita/"],
    popularModels: [
      "novita/meta-llama/llama-3.3-70b-instruct",
      "novita/deepseek/deepseek-v3",
      "novita/Qwen/Qwen2.5-72B-Instruct",
      "novita/microsoft/phi-4",
    ],
    icon: "✦",
    color: "#0891b2",
    supportsStreaming: true,
    docsUrl: "https://novita.ai/docs",
  },
  {
    id: "hyperbolic",
    name: "Hyperbolic",
    description: "GPU cloud inference — Llama, DeepSeek, Qwen, Hermes. Good for large models.",
    baseUrl: "https://api.hyperbolic.xyz/v1",
    defaultBaseUrl: "https://api.hyperbolic.xyz/v1",
    needsKey: true,
    pricingTier: "cheap",
    pricingNote: "~$0.40/1M tokens (Llama 70B)",
    modelPrefixes: ["hyperbolic/"],
    popularModels: [
      "hyperbolic/meta-llama/Llama-3.3-70B-Instruct",
      "hyperbolic/deepseek-ai/DeepSeek-R1",
      "hyperbolic/Qwen/QwQ-32B",
      "hyperbolic/NovaSky-Berkeley/Sky-T1-32B-Preview",
    ],
    icon: "∿",
    color: "#0284c7",
    supportsStreaming: true,
    docsUrl: "https://docs.hyperbolic.xyz",
  },

  // ── Tier 5: Specialized / Regional ────────────────────────────────────────
  {
    id: "ai21",
    name: "AI21 Labs",
    description: "Jamba 1.5 — SSM + Transformer hybrid. 256K context, very fast, great at long docs.",
    baseUrl: "https://api.ai21.com/studio/v1",
    defaultBaseUrl: "https://api.ai21.com/studio/v1",
    needsKey: true,
    pricingTier: "standard",
    pricingNote: "~$2/1M tokens (Jamba 1.5 Large)",
    modelPrefixes: ["jamba-"],
    popularModels: ["jamba-1.5-large", "jamba-1.5-mini"],
    icon: "Ⅱ",
    color: "#0f766e",
    supportsStreaming: true,
    docsUrl: "https://docs.ai21.com",
  },
  {
    id: "moonshot",
    name: "Moonshot AI (Kimi)",
    description: "Kimi models — long context (128K), excellent for Chinese and English. Fast API.",
    baseUrl: "https://api.moonshot.cn/v1",
    defaultBaseUrl: "https://api.moonshot.cn/v1",
    needsKey: true,
    pricingTier: "cheap",
    pricingNote: "~$1/1M tokens (moonshot-v1-32k)",
    modelPrefixes: ["moonshot-", "kimi-"],
    popularModels: ["moonshot-v1-128k", "moonshot-v1-32k", "moonshot-v1-8k"],
    icon: "☽",
    color: "#6d28d9",
    supportsStreaming: true,
    docsUrl: "https://platform.moonshot.cn/docs",
  },
  {
    id: "qwen",
    name: "Qwen / Alibaba Cloud",
    description: "90+ free-quota models: Qwen3, Qwen3-Coder, QwQ reasoning, QvQ vision, Qwen-VL, Qwen-Omni. Via Alibaba Cloud Model Studio international endpoint.",
    baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    defaultBaseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    needsKey: true,
    free: true,
    pricingTier: "free",
    pricingNote: "1M tokens free quota per model. 90+ models with free tier. Get key at modelstudio.console.alibabacloud.com",
    modelPrefixes: ["qwen-", "qwq-", "qvq-", "qwen2.", "qwen3"],
    popularModels: [
      // ── Smart defaults (best free general models) ──
      "qwen-max",
      "qwen-plus",
      "qwen-turbo",
      "qwen-flash",
      // ── Qwen3 series (latest) ──
      "qwen3-235b-a22b",
      "qwen3-235b-a22b-thinking-2507",
      "qwen3-30b-a3b",
      "qwen3-14b",
      "qwen3-8b",
      "qwen3-4b",
      "qwen3-1.7b",
      "qwen3-0.6b",
      // ── Qwen3.5 series ──
      "qwen3.5-397b-a17b",
      "qwen3.5-122b-a10b",
      "qwen3.5-plus",
      "qwen3.5-27b",
      "qwen3.5-35b-a3b",
      "qwen3.5-flash",
      // ── Qwen3-Coder (coding agents) ──
      "qwen3-coder-480b-a35b-instruct",
      "qwen3-coder-next",
      "qwen3-coder-plus",
      "qwen3-coder-flash",
      "qwen3-coder-30b-a3b-instruct",
      // ── Reasoning models ──
      "qwq-plus",
      "qvq-max",
      "qvq-max-latest",
      "qwen3-235b-a22b-thinking-2507",
      "qwen3-30b-a3b-thinking-2507",
      "qwen3-next-80b-a3b-thinking",
      // ── Vision language models ──
      "qwen-vl-max",
      "qwen-vl-max-latest",
      "qwen-vl-plus",
      "qwen-vl-plus-latest",
      "qwen-vl-ocr",
      "qwen2.5-vl-72b-instruct",
      "qwen2.5-vl-32b-instruct",
      "qwen2.5-vl-7b-instruct",
      "qwen2.5-vl-3b-instruct",
      "qwen3-vl-235b-a22b-instruct",
      "qwen3-vl-235b-a22b-thinking",
      "qwen3-vl-30b-a3b-instruct",
      "qwen3-vl-30b-a3b-thinking",
      "qwen3-vl-plus",
      "qwen3-vl-flash",
      "qwen3-vl-8b-instruct",
      "qwen3-vl-8b-thinking",
      // ── Qwen2.5 base models ──
      "qwen2.5-72b-instruct",
      "qwen2.5-32b-instruct",
      "qwen2.5-14b-instruct",
      "qwen2.5-7b-instruct",
      "qwen2.5-7b-instruct-1m",
      "qwen2.5-14b-instruct-1m",
      // ── Translation models ──
      "qwen-mt-plus",
      "qwen-mt-turbo",
      "qwen-mt-flash",
      "qwen-mt-lite",
      // ── Long context ──
      "qwen-max-2025-01-25",
      "qwen-plus-latest",
      "qwen-turbo-latest",
    ],
    icon: "千",
    color: "#b45309",
    supportsStreaming: true,
    docsUrl: "https://www.alibabacloud.com/help/en/model-studio",
  },
  {
    id: "zhipu",
    name: "Zhipu AI (GLM)",
    description: "GLM-4, GLM-4-Flash. Bilingual Chinese/English. GLM-4 rivals GPT-4 on benchmarks.",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    defaultBaseUrl: "https://open.bigmodel.cn/api/paas/v4",
    needsKey: true,
    pricingTier: "cheap",
    pricingNote: "~$0.20/1M tokens (GLM-4-Flash)",
    modelPrefixes: ["glm-"],
    popularModels: ["glm-4-plus", "glm-4-flash", "glm-4-air", "glm-4-long"],
    icon: "智",
    color: "#0369a1",
    supportsStreaming: true,
    docsUrl: "https://open.bigmodel.cn/dev/api",
  },

  // ── Tier 6: Local inference ────────────────────────────────────────────────
  {
    id: "ollama",
    name: "Ollama (Local)",
    description: "Run Llama, Qwen, Phi, Mistral, Gemma, DeepSeek locally. 100% private, free.",
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
    description: "Local models via LM Studio. OpenAI-compatible server with GPU acceleration. Private.",
    baseUrl: "http://localhost:1234/v1",
    defaultBaseUrl: "http://localhost:1234/v1",
    needsKey: false,
    free: true,
    pricingTier: "free",
    pricingNote: "100% FREE — runs on your GPU",
    modelPrefixes: ["lmstudio/"],
    popularModels: ["lmstudio/any-model"],
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

  // Cloudflare Workers AI
  if (m.startsWith("@cf/")) return "cloudflare";

  // Explicit prefixes (provider/...)
  if (m.startsWith("ollama/")) return "ollama";
  if (m.startsWith("lmstudio/")) return "lmstudio";
  if (m.startsWith("groq/")) return "groq";
  if (m.startsWith("together/")) return "together";
  if (m.startsWith("openrouter/")) return "openrouter";
  if (m.startsWith("cerebras/")) return "cerebras";
  if (m.startsWith("fireworks/") || m.startsWith("accounts/fireworks/")) return "fireworks";
  if (m.startsWith("sambanova/")) return "sambanova";
  if (m.startsWith("deepinfra/")) return "deepinfra";
  if (m.startsWith("novita/")) return "novita";
  if (m.startsWith("hyperbolic/")) return "hyperbolic";

  // OpenAI
  if (m.startsWith("gpt-") || m.startsWith("o1") || m.startsWith("o3") || m.startsWith("o4") || m.startsWith("text-embedding") || m.startsWith("babbage") || m.startsWith("davinci")) return "openai";

  // Anthropic
  if (m.startsWith("claude-")) return "anthropic";

  // Google Gemini
  if (m.startsWith("gemini-") || m.startsWith("models/gemini-")) return "google";

  // xAI Grok
  if (m.startsWith("grok-")) return "xai";

  // DeepSeek direct API
  if (m === "deepseek-chat" || m === "deepseek-coder" || m === "deepseek-reasoner") return "deepseek";

  // Groq known models (no prefix)
  if (["llama-3.1-70b-versatile","llama-3.1-8b-instant","llama3-70b-8192","llama3-8b-8192","mixtral-8x7b-32768","gemma2-9b-it","llama-3.3-70b-versatile","deepseek-r1-distill-llama-70b","qwen-qwq-32b","whisper-large-v3"].includes(m)) return "groq";

  // Perplexity
  if (m.startsWith("sonar-") || m.startsWith("pplx-") || m.startsWith("llama-3.1-sonar")) return "perplexity";

  // Mistral
  if (m.startsWith("mistral-") || m.startsWith("open-mixtral") || m.startsWith("open-mistral") || m.startsWith("codestral") || m.startsWith("pixtral")) return "mistral";

  // Cohere
  if (m.startsWith("command-") || m.startsWith("cohere/")) return "cohere";

  // AI21
  if (m.startsWith("jamba-")) return "ai21";

  // Moonshot
  if (m.startsWith("moonshot-") || m.startsWith("kimi-")) return "moonshot";

  // Qwen / Alibaba Cloud — all model families (must check before SambaNova/Together)
  if (
    m.startsWith("qwen-max") || m.startsWith("qwen-plus") || m.startsWith("qwen-plus-") ||
    m.startsWith("qwen-turbo") || m.startsWith("qwen-flash") || m.startsWith("qwen-long") ||
    m.startsWith("qwq-") || m.startsWith("qvq-") ||
    m.startsWith("qwen2.5-vl") || m.startsWith("qwen2.5-") ||
    m.startsWith("qwen3-") || m.startsWith("qwen3.5-") ||
    m.startsWith("qwen-vl") || m.startsWith("qwen-mt-") ||
    m.startsWith("qwen-omni") || m.startsWith("qwen-flash-") ||
    m.startsWith("qwen-plus-character") || m.startsWith("qwen-flash-character") ||
    m.startsWith("qwen3-vl") || m.startsWith("qwen3-coder") || m.startsWith("qwen3-asr") ||
    m.startsWith("qwen3-tts") || m.startsWith("qwen3-omni") || m.startsWith("qwen-image")
  ) return "qwen";

  // Zhipu GLM
  if (m.startsWith("glm-")) return "zhipu";

  // Cerebras native models (no prefix)
  if (m === "llama3.3-70b" || m === "llama3.1-70b" || m === "llama3.1-8b") return "cerebras";

  // SambaNova native models (qwen2.5- removed — those go to qwen above)
  if (m.startsWith("meta-llama-") || m === "deepseek-r1" || (m.startsWith("meta-llama/") && !m.includes("-turbo"))) return "sambanova";

  // Together AI
  if (m.startsWith("meta-llama/") || m.startsWith("togethercomputer/") || m.startsWith("mistralai/") || m.startsWith("qwen/") || m.startsWith("deepseek-ai/") || m.startsWith("google/gemma") || m.startsWith("nousresearch/")) return "together";

  // OpenRouter catch-all for org/model format
  if (m.startsWith("google/gemini-") || m.startsWith("microsoft/") || m.startsWith("01-ai/") || m.startsWith("amazon/") || m.startsWith("x-ai/") || m.startsWith("anthropic/")) return "openrouter";

  // Generic org/model → OpenRouter
  if (m.includes("/") && !m.startsWith("@")) {
    return "openrouter";
  }

  return "openai";
}

/**
 * Strip provider prefix from model name (e.g., "ollama/llama3.1:8b" → "llama3.1:8b")
 */
export function stripProviderPrefix(model: string): string {
  return model.replace(/^(ollama|lmstudio|groq|together|openrouter|cerebras|fireworks|sambanova|deepinfra|novita|hyperbolic)\//, "");
}

/**
 * Smart model selection — picks the best FREE model for a given task type.
 * Used by agents to auto-route when the user doesn't specify a model.
 *
 * taskType: "code" | "reason" | "vision" | "translate" | "fast" | "general" | "long"
 * preferQwen: if true (Qwen key configured), prioritise Alibaba free tier models
 */
export function smartSelectModel(
  taskType: "code" | "reason" | "vision" | "translate" | "fast" | "general" | "long",
  availableProviders: Set<string>
): string {
  const hasQwen = availableProviders.has("qwen");
  const hasCF = availableProviders.has("cloudflare");
  const hasOpenAI = availableProviders.has("openai");

  switch (taskType) {
    case "code":
      if (hasQwen) return "qwen3-coder-plus";           // 480B-equiv free tier
      if (hasCF) return "@cf/qwen/qwen2.5-coder-32b-instruct";
      if (hasOpenAI) return "gpt-4o-mini";
      return "gpt-4o-mini";

    case "reason":
      if (hasQwen) return "qwq-plus";                   // QwQ reasoning free tier
      if (hasCF) return "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b";
      if (hasOpenAI) return "gpt-4o-mini";
      return "gpt-4o-mini";

    case "vision":
      if (hasQwen) return "qwen-vl-max";               // Best vision free tier (standard HTTP)
      if (hasCF) return "@cf/meta/llama-3.2-11b-vision-instruct";
      if (hasOpenAI) return "gpt-4o";
      return "gpt-4o-mini";

    case "translate":
      if (hasQwen) return "qwen-mt-plus";              // Dedicated translation model
      if (hasOpenAI) return "gpt-4o-mini";
      return "gpt-4o-mini";

    case "fast":
      if (hasQwen) return "qwen-flash";                // Fastest free tier
      if (hasCF) return "@cf/meta/llama-3.2-3b-instruct";
      if (hasOpenAI) return "gpt-4o-mini";
      return "gpt-4o-mini";

    case "long":
      if (hasQwen) return "qwen2.5-14b-instruct-1m";  // 1M context window free
      if (hasOpenAI) return "gpt-4o-mini";
      return "gpt-4o-mini";

    case "general":
    default:
      if (hasQwen) return "qwen-max";                  // Best general free model
      if (hasCF) return "@cf/meta/llama-4-scout-17b-16e-instruct";
      if (hasOpenAI) return "gpt-4o-mini";
      return "gpt-4o-mini";
  }
}

/** Qwen model categories for UI display and agent routing */
export const QWEN_MODEL_CATEGORIES = {
  chat: {
    label: "Chat & General",
    icon: "💬",
    models: ["qwen-max", "qwen-plus", "qwen-turbo", "qwen-flash", "qwen3-235b-a22b", "qwen3-32b", "qwen3-14b", "qwen3-8b", "qwen3.5-plus", "qwen3.5-flash"],
  },
  code: {
    label: "Coding Agents",
    icon: "💻",
    models: ["qwen3-coder-480b-a35b-instruct", "qwen3-coder-next", "qwen3-coder-plus", "qwen3-coder-flash", "qwen3-coder-30b-a3b-instruct"],
  },
  reason: {
    label: "Reasoning & Math",
    icon: "🧠",
    models: ["qwq-plus", "qvq-max", "qvq-max-latest", "qwen3-235b-a22b-thinking-2507", "qwen3-30b-a3b-thinking-2507", "qwen3-next-80b-a3b-thinking"],
  },
  vision: {
    label: "Vision & Multimodal",
    icon: "👁",
    models: ["qwen-vl-max", "qwen-vl-plus", "qwen-vl-ocr", "qwen2.5-vl-72b-instruct", "qwen3-vl-235b-a22b-instruct", "qwen3-vl-plus", "qwen3-vl-flash"],
  },
  translate: {
    label: "Translation",
    icon: "🌐",
    models: ["qwen-mt-plus", "qwen-mt-turbo", "qwen-mt-flash", "qwen-mt-lite"],
  },
  long: {
    label: "Long Context (1M tokens)",
    icon: "📄",
    models: ["qwen2.5-7b-instruct-1m", "qwen2.5-14b-instruct-1m"],
  },
} as const;
