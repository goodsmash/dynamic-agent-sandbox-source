/**
 * Cloudflare Workers AI — Frontend Model Catalog
 *
 * These are the REAL model IDs for use with the Workers AI binding.
 * Source: https://developers.cloudflare.com/workers-ai/models/
 *
 * In the terminal, switch models with:
 *   model @cf/meta/llama-4-scout-17b-16e-instruct
 */

export interface WorkersAIModel {
  id: string;
  name: string;
  author: string;
  group: string;
  contextK: number;
  tags: string[];
  recommended?: boolean;
}

export const WORKERS_AI_MODELS: WorkersAIModel[] = [
  // ── Frontier ──────────────────────────────────────────────────────────────
  {
    id: "@cf/moonshotai/kimi-k2.5",
    name: "Kimi K2.5",
    author: "Moonshot AI",
    group: "Frontier",
    contextK: 256,
    tags: ["function-calling", "vision", "reasoning"],
    recommended: true,
  },
  {
    id: "@cf/meta/llama-4-scout-17b-16e-instruct",
    name: "Llama 4 Scout 17B",
    author: "Meta",
    group: "Frontier",
    contextK: 131,
    tags: ["function-calling", "vision", "free"],
    recommended: true,
  },
  {
    id: "@cf/meta/llama-4-maverick-17b-128e-instruct-fp8",
    name: "Llama 4 Maverick 17B",
    author: "Meta",
    group: "Frontier",
    contextK: 131,
    tags: ["function-calling", "vision"],
  },
  {
    id: "@cf/openai/gpt-oss-120b",
    name: "GPT OSS 120B",
    author: "OpenAI",
    group: "Frontier",
    contextK: 128,
    tags: ["function-calling", "reasoning"],
    recommended: true,
  },
  {
    id: "@cf/openai/gpt-oss-20b",
    name: "GPT OSS 20B",
    author: "OpenAI",
    group: "Frontier",
    contextK: 128,
    tags: ["function-calling", "reasoning"],
  },
  {
    id: "@cf/nvidia/nemotron-3-120b-a12b",
    name: "Nemotron 3 Super 120B",
    author: "NVIDIA",
    group: "Frontier",
    contextK: 128,
    tags: ["function-calling", "reasoning"],
    recommended: true,
  },

  // ── Reasoning ─────────────────────────────────────────────────────────────
  {
    id: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
    name: "DeepSeek R1 Distill Qwen 32B",
    author: "DeepSeek",
    group: "Reasoning",
    contextK: 64,
    tags: ["reasoning", "free"],
    recommended: true,
  },
  {
    id: "@cf/deepseek-ai/deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1 Distill Llama 70B",
    author: "DeepSeek",
    group: "Reasoning",
    contextK: 128,
    tags: ["reasoning"],
  },
  {
    id: "@cf/qwen/qwq-32b",
    name: "QwQ 32B",
    author: "Qwen",
    group: "Reasoning",
    contextK: 32,
    tags: ["reasoning", "free"],
  },

  // ── Production ────────────────────────────────────────────────────────────
  {
    id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    name: "Llama 3.3 70B (Fast)",
    author: "Meta",
    group: "Production",
    contextK: 128,
    tags: ["streaming", "free"],
    recommended: true,
  },
  {
    id: "@cf/zai-org/glm-4.7-flash",
    name: "GLM 4.7 Flash",
    author: "Zhipu AI",
    group: "Production",
    contextK: 131,
    tags: ["function-calling", "multilingual", "free"],
  },
  {
    id: "@cf/mistral/mistral-small-3.1-24b-instruct",
    name: "Mistral Small 3.1 24B",
    author: "MistralAI",
    group: "Production",
    contextK: 128,
    tags: ["function-calling", "vision", "free"],
  },
  {
    id: "@cf/meta/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B",
    author: "Meta",
    group: "Production",
    contextK: 128,
    tags: ["function-calling", "free"],
  },
  {
    id: "@cf/meta/llama-3.1-8b-instruct-fast",
    name: "Llama 3.1 8B (Fast)",
    author: "Meta",
    group: "Production",
    contextK: 128,
    tags: ["streaming", "free"],
  },
  {
    id: "@cf/google/gemma-3-27b-it",
    name: "Gemma 3 27B",
    author: "Google",
    group: "Production",
    contextK: 128,
    tags: ["vision", "multilingual", "free"],
  },
  {
    id: "@cf/google/gemma-3-12b-it",
    name: "Gemma 3 12B",
    author: "Google",
    group: "Production",
    contextK: 128,
    tags: ["vision", "multilingual", "free"],
  },
  {
    id: "@cf/qwen/qwen2.5-72b-instruct",
    name: "Qwen 2.5 72B",
    author: "Qwen",
    group: "Production",
    contextK: 128,
    tags: ["function-calling", "multilingual"],
  },

  // ── Code ──────────────────────────────────────────────────────────────────
  {
    id: "@cf/qwen/qwen2.5-coder-32b-instruct",
    name: "Qwen 2.5 Coder 32B",
    author: "Qwen",
    group: "Code",
    contextK: 32,
    tags: ["code", "function-calling", "free"],
    recommended: true,
  },
  {
    id: "@cf/defog/sqlcoder-7b-2",
    name: "SQLCoder 7B",
    author: "Defog",
    group: "Code",
    contextK: 4,
    tags: ["code", "sql", "free"],
  },

  // ── Compact ───────────────────────────────────────────────────────────────
  {
    id: "@cf/meta/llama-3.2-3b-instruct",
    name: "Llama 3.2 3B",
    author: "Meta",
    group: "Compact",
    contextK: 128,
    tags: ["free"],
  },
  {
    id: "@cf/meta/llama-3.2-1b-instruct",
    name: "Llama 3.2 1B",
    author: "Meta",
    group: "Compact",
    contextK: 128,
    tags: ["free"],
  },
  {
    id: "@cf/microsoft/phi-2",
    name: "Phi-2 2.7B",
    author: "Microsoft",
    group: "Compact",
    contextK: 2,
    tags: ["free"],
  },
  {
    id: "@cf/tinyllama/tinyllama-1.1b-chat-v1.0",
    name: "TinyLlama 1.1B",
    author: "TinyLlama",
    group: "Compact",
    contextK: 2,
    tags: ["free"],
  },

  // ── Specialized ───────────────────────────────────────────────────────────
  {
    id: "@cf/ibm/granite-3-8b-instruct",
    name: "Granite 3 8B",
    author: "IBM",
    group: "Specialized",
    contextK: 8,
    tags: ["function-calling", "free"],
  },
  {
    id: "@cf/nousresearch/hermes-2-pro-mistral-7b",
    name: "Hermes 2 Pro Mistral 7B",
    author: "NousResearch",
    group: "Specialized",
    contextK: 4,
    tags: ["function-calling", "free"],
  },
  {
    id: "@cf/deepseek-ai/deepseek-math-7b-instruct",
    name: "DeepSeek Math 7B",
    author: "DeepSeek",
    group: "Specialized",
    contextK: 4,
    tags: ["math", "free"],
  },
  {
    id: "@cf/aisingapore/seallm-7b-v2.5",
    name: "SeaLLM 7B v2.5",
    author: "AI Singapore",
    group: "Specialized",
    contextK: 8,
    tags: ["multilingual", "free"],
  },
  {
    id: "@cf/mistral/mistral-7b-instruct-v0.2-lora",
    name: "Mistral 7B v0.2 (LoRA)",
    author: "MistralAI",
    group: "Specialized",
    contextK: 32,
    tags: ["lora", "free"],
  },
  {
    id: "@cf/thebloke/discolm-german-7b-v1-awq",
    name: "DiscoLM German 7B",
    author: "TheBloke",
    group: "Specialized",
    contextK: 4,
    tags: ["multilingual", "german", "free"],
  },
  {
    id: "@cf/openchat/openchat-3.5-0106",
    name: "OpenChat 3.5",
    author: "OpenChat",
    group: "Specialized",
    contextK: 8,
    tags: ["free"],
  },
  {
    id: "@cf/nexusflow/starling-lm-7b-beta",
    name: "Starling LM 7B Beta",
    author: "Nexusflow",
    group: "Specialized",
    contextK: 8,
    tags: ["free"],
  },
  {
    id: "@cf/google/gemma-2-9b-it",
    name: "Gemma 2 9B",
    author: "Google",
    group: "Specialized",
    contextK: 8,
    tags: ["free"],
  },
  {
    id: "@cf/tiiuae/falcon-7b-instruct",
    name: "Falcon 7B Instruct",
    author: "TII UAE",
    group: "Specialized",
    contextK: 2,
    tags: ["free"],
  },
  {
    id: "@cf/meta/llama-2-7b-chat-fp16",
    name: "Llama 2 7B Chat",
    author: "Meta",
    group: "Specialized",
    contextK: 4,
    tags: ["free"],
  },
];

export const MODEL_GROUPS = [...new Set(WORKERS_AI_MODELS.map((m) => m.group))];

export const DEFAULT_MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";

export function getModelById(id: string): WorkersAIModel | undefined {
  return WORKERS_AI_MODELS.find((m) => m.id === id);
}

export function getModelDisplayName(id: string): string {
  const model = getModelById(id);
  return model ? `${model.name} (${model.author})` : id;
}

// ─── Multi-Provider Model Catalog ────────────────────────────────────────────
export interface MultiProviderModel {
  id: string;
  name: string;
  provider: string;
  group: string;
  tags: string[];
}

export const MULTI_PROVIDER_MODELS: MultiProviderModel[] = [
  // ── OpenAI (via Replit proxy — no key) ──────────────────────────────────────
  { id: "gpt-5.2", name: "GPT-5.2", provider: "OpenAI", group: "OpenAI (no key)", tags: ["recommended"] },
  { id: "gpt-5-mini", name: "GPT-5-mini", provider: "OpenAI", group: "OpenAI (no key)", tags: ["fast", "cheap"] },
  { id: "o3", name: "o3", provider: "OpenAI", group: "OpenAI (no key)", tags: ["reasoning"] },
  { id: "o4-mini", name: "o4-mini", provider: "OpenAI", group: "OpenAI (no key)", tags: ["reasoning", "fast"] },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", group: "OpenAI (no key)", tags: ["vision"] },

  // ── Anthropic ────────────────────────────────────────────────────────────────
  { id: "claude-opus-4-5", name: "Claude Opus 4.5", provider: "Anthropic", group: "Anthropic (key required)", tags: ["best"] },
  { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", provider: "Anthropic", group: "Anthropic (key required)", tags: ["recommended"] },
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: "Anthropic", group: "Anthropic (key required)", tags: [] },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", provider: "Anthropic", group: "Anthropic (key required)", tags: ["fast", "cheap"] },

  // ── Groq (free tier) ─────────────────────────────────────────────────────────
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "Groq", group: "Groq (free tier)", tags: ["free", "fast"] },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", provider: "Groq", group: "Groq (free tier)", tags: ["free", "ultra-fast"] },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", provider: "Groq", group: "Groq (free tier)", tags: ["free"] },
  { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Llama 70B", provider: "Groq", group: "Groq (free tier)", tags: ["free", "reasoning"] },
  { id: "qwen-qwq-32b", name: "Qwen QwQ 32B", provider: "Groq", group: "Groq (free tier)", tags: ["free", "reasoning"] },
  { id: "gemma2-9b-it", name: "Gemma 2 9B", provider: "Groq", group: "Groq (free tier)", tags: ["free"] },

  // ── Together AI ──────────────────────────────────────────────────────────────
  { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", name: "Llama 3.3 70B Turbo", provider: "Together", group: "Together AI (key required)", tags: ["cheap"] },
  { id: "meta-llama/Llama-3.1-8B-Instruct-Turbo", name: "Llama 3.1 8B Turbo", provider: "Together", group: "Together AI (key required)", tags: ["cheap", "fast"] },
  { id: "Qwen/Qwen2.5-72B-Instruct-Turbo", name: "Qwen 2.5 72B Turbo", provider: "Together", group: "Together AI (key required)", tags: ["cheap"] },
  { id: "deepseek-ai/DeepSeek-R1", name: "DeepSeek R1", provider: "Together", group: "Together AI (key required)", tags: ["reasoning"] },
  { id: "google/gemma-2-27b-it", name: "Gemma 2 27B", provider: "Together", group: "Together AI (key required)", tags: ["cheap"] },

  // ── OpenRouter (300+ models) ─────────────────────────────────────────────────
  { id: "openrouter/auto", name: "Auto Router", provider: "OpenRouter", group: "OpenRouter (key required)", tags: ["smart"] },
  { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash", provider: "OpenRouter", group: "OpenRouter (key required)", tags: ["free"] },
  { id: "meta-llama/llama-4-scout:free", name: "Llama 4 Scout", provider: "OpenRouter", group: "OpenRouter (key required)", tags: ["free"] },
  { id: "google/gemini-2.5-pro-preview-03-25", name: "Gemini 2.5 Pro", provider: "OpenRouter", group: "OpenRouter (key required)", tags: ["best"] },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "OpenRouter", group: "OpenRouter (key required)", tags: [] },
  { id: "microsoft/phi-4", name: "Phi 4", provider: "OpenRouter", group: "OpenRouter (key required)", tags: ["cheap"] },

  // ── Mistral ──────────────────────────────────────────────────────────────────
  { id: "mistral-large-latest", name: "Mistral Large", provider: "Mistral", group: "Mistral AI (key required)", tags: [] },
  { id: "mistral-small-latest", name: "Mistral Small", provider: "Mistral", group: "Mistral AI (key required)", tags: ["cheap"] },
  { id: "codestral-latest", name: "Codestral", provider: "Mistral", group: "Mistral AI (key required)", tags: ["code"] },
  { id: "open-mixtral-8x22b", name: "Mixtral 8x22B", provider: "Mistral", group: "Mistral AI (key required)", tags: [] },

  // ── Google Gemini ─────────────────────────────────────────────────────────────
  { id: "gemini-2.5-pro-preview-03-25", name: "Gemini 2.5 Pro", provider: "Google", group: "Google Gemini (key required)", tags: ["best"] },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google", group: "Google Gemini (key required)", tags: ["fast", "cheap"] },
  { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite", provider: "Google", group: "Google Gemini (key required)", tags: ["ultra-fast", "cheap"] },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google", group: "Google Gemini (key required)", tags: ["2M ctx"] },

  // ── Perplexity (search-enabled) ───────────────────────────────────────────────
  { id: "sonar-pro", name: "Sonar Pro (search)", provider: "Perplexity", group: "Perplexity (key required)", tags: ["search"] },
  { id: "sonar", name: "Sonar (search)", provider: "Perplexity", group: "Perplexity (key required)", tags: ["search", "cheap"] },
  { id: "sonar-reasoning-pro", name: "Sonar Reasoning Pro", provider: "Perplexity", group: "Perplexity (key required)", tags: ["search", "reasoning"] },

  // ── Cohere ───────────────────────────────────────────────────────────────────
  { id: "command-a-03-2025", name: "Command A", provider: "Cohere", group: "Cohere (key required)", tags: [] },
  { id: "command-r-plus", name: "Command R+", provider: "Cohere", group: "Cohere (key required)", tags: ["rag"] },
  { id: "command-r", name: "Command R", provider: "Cohere", group: "Cohere (key required)", tags: ["cheap", "rag"] },

  // ── Ollama (local, free) ──────────────────────────────────────────────────────
  { id: "ollama/llama3.3", name: "Llama 3.3 (Local)", provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local"] },
  { id: "ollama/qwen2.5:7b", name: "Qwen 2.5 7B (Local)", provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local"] },
  { id: "ollama/deepseek-r1:8b", name: "DeepSeek R1 8B (Local)", provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local", "reasoning"] },
  { id: "ollama/phi4", name: "Phi 4 (Local)", provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local"] },
  { id: "ollama/mistral", name: "Mistral 7B (Local)", provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local"] },
  { id: "ollama/gemma3:4b", name: "Gemma 3 4B (Local)", provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local"] },
  { id: "ollama/codellama:7b", name: "CodeLlama 7B (Local)", provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local", "code"] },

  // ── LM Studio ────────────────────────────────────────────────────────────────
  { id: "lmstudio/any-model", name: "Any Model (LM Studio)", provider: "LM Studio", group: "LM Studio (local, free)", tags: ["free", "local"] },

  // ── Cloudflare Workers AI ─────────────────────────────────────────────────────
  { id: "@cf/meta/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B", provider: "Cloudflare", group: "Workers AI (CF deploy)", tags: ["free", "vision"] },
  { id: "@cf/moonshotai/kimi-k2.5", name: "Kimi K2.5", provider: "Cloudflare", group: "Workers AI (CF deploy)", tags: ["256k", "reasoning"] },
  { id: "@cf/openai/gpt-oss-120b", name: "GPT OSS 120B", provider: "Cloudflare", group: "Workers AI (CF deploy)", tags: ["reasoning"] },
  { id: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", name: "DeepSeek R1 32B", provider: "Cloudflare", group: "Workers AI (CF deploy)", tags: ["free", "reasoning"] },
  { id: "@cf/qwen/qwen2.5-coder-32b-instruct", name: "Qwen 2.5 Coder 32B", provider: "Cloudflare", group: "Workers AI (CF deploy)", tags: ["free", "code"] },
];

export const MULTI_PROVIDER_GROUPS = [...new Set(MULTI_PROVIDER_MODELS.map((m) => m.group))];

