/**
 * OpenClaw AI — Complete Multi-Provider Model Catalog
 *
 * 20+ providers · 200+ models
 * Every major LLM available in one place.
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
  { id: "@cf/moonshotai/kimi-k2.5", name: "Kimi K2.5", author: "Moonshot AI", group: "Frontier", contextK: 256, tags: ["function-calling", "vision", "reasoning"], recommended: true },
  { id: "@cf/meta/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B", author: "Meta", group: "Frontier", contextK: 131, tags: ["function-calling", "vision", "free"], recommended: true },
  { id: "@cf/meta/llama-4-maverick-17b-128e-instruct-fp8", name: "Llama 4 Maverick 17B", author: "Meta", group: "Frontier", contextK: 131, tags: ["function-calling", "vision"] },
  { id: "@cf/openai/gpt-oss-120b", name: "GPT OSS 120B", author: "OpenAI", group: "Frontier", contextK: 128, tags: ["function-calling", "reasoning"], recommended: true },
  { id: "@cf/openai/gpt-oss-20b", name: "GPT OSS 20B", author: "OpenAI", group: "Frontier", contextK: 128, tags: ["function-calling", "reasoning"] },
  { id: "@cf/nvidia/nemotron-3-120b-a12b", name: "Nemotron 3 Super 120B", author: "NVIDIA", group: "Frontier", contextK: 128, tags: ["function-calling", "reasoning"], recommended: true },
  // ── Reasoning ─────────────────────────────────────────────────────────────
  { id: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", name: "DeepSeek R1 Distill Qwen 32B", author: "DeepSeek", group: "Reasoning", contextK: 64, tags: ["reasoning", "free"], recommended: true },
  { id: "@cf/deepseek-ai/deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Distill Llama 70B", author: "DeepSeek", group: "Reasoning", contextK: 128, tags: ["reasoning"] },
  { id: "@cf/qwen/qwq-32b", name: "QwQ 32B", author: "Qwen", group: "Reasoning", contextK: 32, tags: ["reasoning", "free"] },
  // ── Production ────────────────────────────────────────────────────────────
  { id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", name: "Llama 3.3 70B (Fast)", author: "Meta", group: "Production", contextK: 128, tags: ["streaming", "free"], recommended: true },
  { id: "@cf/zai-org/glm-4.7-flash", name: "GLM 4.7 Flash", author: "Zhipu AI", group: "Production", contextK: 131, tags: ["function-calling", "multilingual", "free"] },
  { id: "@cf/mistral/mistral-small-3.1-24b-instruct", name: "Mistral Small 3.1 24B", author: "MistralAI", group: "Production", contextK: 128, tags: ["function-calling", "vision", "free"] },
  { id: "@cf/meta/llama-3.1-70b-instruct", name: "Llama 3.1 70B", author: "Meta", group: "Production", contextK: 128, tags: ["function-calling", "free"] },
  { id: "@cf/meta/llama-3.1-8b-instruct-fast", name: "Llama 3.1 8B (Fast)", author: "Meta", group: "Production", contextK: 128, tags: ["streaming", "free"] },
  { id: "@cf/google/gemma-3-27b-it", name: "Gemma 3 27B", author: "Google", group: "Production", contextK: 128, tags: ["vision", "multilingual", "free"] },
  { id: "@cf/google/gemma-3-12b-it", name: "Gemma 3 12B", author: "Google", group: "Production", contextK: 128, tags: ["vision", "multilingual", "free"] },
  { id: "@cf/qwen/qwen2.5-72b-instruct", name: "Qwen 2.5 72B", author: "Qwen", group: "Production", contextK: 128, tags: ["function-calling", "multilingual"] },
  // ── Code ──────────────────────────────────────────────────────────────────
  { id: "@cf/qwen/qwen2.5-coder-32b-instruct", name: "Qwen 2.5 Coder 32B", author: "Qwen", group: "Code", contextK: 32, tags: ["code", "function-calling", "free"], recommended: true },
  { id: "@cf/defog/sqlcoder-7b-2", name: "SQLCoder 7B", author: "Defog", group: "Code", contextK: 4, tags: ["code", "sql", "free"] },
  // ── Compact ───────────────────────────────────────────────────────────────
  { id: "@cf/meta/llama-3.2-3b-instruct", name: "Llama 3.2 3B", author: "Meta", group: "Compact", contextK: 128, tags: ["free"] },
  { id: "@cf/meta/llama-3.2-1b-instruct", name: "Llama 3.2 1B", author: "Meta", group: "Compact", contextK: 128, tags: ["free"] },
  { id: "@cf/microsoft/phi-2", name: "Phi-2 2.7B", author: "Microsoft", group: "Compact", contextK: 2, tags: ["free"] },
  { id: "@cf/tinyllama/tinyllama-1.1b-chat-v1.0", name: "TinyLlama 1.1B", author: "TinyLlama", group: "Compact", contextK: 2, tags: ["free"] },
  // ── Specialized ───────────────────────────────────────────────────────────
  { id: "@cf/ibm/granite-3-8b-instruct", name: "Granite 3 8B", author: "IBM", group: "Specialized", contextK: 8, tags: ["function-calling", "free"] },
  { id: "@cf/nousresearch/hermes-2-pro-mistral-7b", name: "Hermes 2 Pro Mistral 7B", author: "NousResearch", group: "Specialized", contextK: 4, tags: ["function-calling", "free"] },
  { id: "@cf/deepseek-ai/deepseek-math-7b-instruct", name: "DeepSeek Math 7B", author: "DeepSeek", group: "Specialized", contextK: 4, tags: ["math", "free"] },
  { id: "@cf/aisingapore/seallm-7b-v2.5", name: "SeaLLM 7B v2.5", author: "AI Singapore", group: "Specialized", contextK: 8, tags: ["multilingual", "free"] },
  { id: "@cf/mistral/mistral-7b-instruct-v0.2-lora", name: "Mistral 7B v0.2 (LoRA)", author: "MistralAI", group: "Specialized", contextK: 32, tags: ["lora", "free"] },
  { id: "@cf/openchat/openchat-3.5-0106", name: "OpenChat 3.5", author: "OpenChat", group: "Specialized", contextK: 8, tags: ["free"] },
  { id: "@cf/google/gemma-2-9b-it", name: "Gemma 2 9B", author: "Google", group: "Specialized", contextK: 8, tags: ["free"] },
  { id: "@cf/tiiuae/falcon-7b-instruct", name: "Falcon 7B Instruct", author: "TII UAE", group: "Specialized", contextK: 2, tags: ["free"] },
  { id: "@cf/meta/llama-2-7b-chat-fp16", name: "Llama 2 7B Chat", author: "Meta", group: "Specialized", contextK: 4, tags: ["free"] },
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

  // ══════════════════════════════════════════════════════════════════════════
  // TIER 1: Zero-config (Replit proxy — no API key required)
  // ══════════════════════════════════════════════════════════════════════════

  { id: "gpt-5.2",      name: "GPT-5.2",      provider: "OpenAI", group: "OpenAI (no key)", tags: ["recommended"] },
  { id: "gpt-5-mini",   name: "GPT-5-mini",   provider: "OpenAI", group: "OpenAI (no key)", tags: ["fast", "cheap"] },
  { id: "o3",           name: "o3",            provider: "OpenAI", group: "OpenAI (no key)", tags: ["reasoning"] },
  { id: "o4-mini",      name: "o4-mini",       provider: "OpenAI", group: "OpenAI (no key)", tags: ["reasoning", "fast"] },
  { id: "gpt-4o",       name: "GPT-4o",        provider: "OpenAI", group: "OpenAI (no key)", tags: ["vision"] },
  { id: "gpt-4o-mini",  name: "GPT-4o-mini",   provider: "OpenAI", group: "OpenAI (no key)", tags: ["cheap", "fast"] },
  { id: "gpt-4-turbo",  name: "GPT-4 Turbo",   provider: "OpenAI", group: "OpenAI (no key)", tags: [] },

  // ══════════════════════════════════════════════════════════════════════════
  // TIER 2: Major Commercial Providers
  // ══════════════════════════════════════════════════════════════════════════

  // Anthropic
  { id: "claude-opus-4-5",              name: "Claude Opus 4.5",      provider: "Anthropic", group: "Anthropic (key required)", tags: ["best", "200k"] },
  { id: "claude-3-7-sonnet-20250219",   name: "Claude 3.7 Sonnet",    provider: "Anthropic", group: "Anthropic (key required)", tags: ["recommended"] },
  { id: "claude-3-5-sonnet-20241022",   name: "Claude 3.5 Sonnet",    provider: "Anthropic", group: "Anthropic (key required)", tags: [] },
  { id: "claude-3-5-haiku-20241022",    name: "Claude 3.5 Haiku",     provider: "Anthropic", group: "Anthropic (key required)", tags: ["fast", "cheap"] },
  { id: "claude-3-opus-20240229",       name: "Claude 3 Opus",        provider: "Anthropic", group: "Anthropic (key required)", tags: [] },

  // Google Gemini
  { id: "gemini-2.5-pro-preview-03-25", name: "Gemini 2.5 Pro",       provider: "Google", group: "Google Gemini (key required)", tags: ["best", "1M ctx"] },
  { id: "gemini-2.0-flash",             name: "Gemini 2.0 Flash",     provider: "Google", group: "Google Gemini (key required)", tags: ["fast", "cheap"] },
  { id: "gemini-2.0-flash-lite",        name: "Gemini 2.0 Flash Lite",provider: "Google", group: "Google Gemini (key required)", tags: ["ultra-fast", "cheap"] },
  { id: "gemini-1.5-pro",               name: "Gemini 1.5 Pro",       provider: "Google", group: "Google Gemini (key required)", tags: ["2M ctx"] },
  { id: "gemini-1.5-flash",             name: "Gemini 1.5 Flash",     provider: "Google", group: "Google Gemini (key required)", tags: ["fast", "cheap"] },
  { id: "gemini-1.5-flash-8b",          name: "Gemini 1.5 Flash 8B",  provider: "Google", group: "Google Gemini (key required)", tags: ["ultra-fast"] },

  // xAI Grok
  { id: "grok-3",              name: "Grok 3",           provider: "xAI", group: "xAI Grok (key required)", tags: ["best", "131k"] },
  { id: "grok-3-mini",         name: "Grok 3 Mini",      provider: "xAI", group: "xAI Grok (key required)", tags: ["fast", "cheap", "reasoning"] },
  { id: "grok-3-mini-fast",    name: "Grok 3 Mini Fast", provider: "xAI", group: "xAI Grok (key required)", tags: ["ultra-fast"] },
  { id: "grok-2-vision-1212",  name: "Grok 2 Vision",    provider: "xAI", group: "xAI Grok (key required)", tags: ["vision"] },
  { id: "grok-2-1212",         name: "Grok 2",           provider: "xAI", group: "xAI Grok (key required)", tags: [] },

  // DeepSeek Direct API
  { id: "deepseek-chat",      name: "DeepSeek V3 (Chat)",     provider: "DeepSeek", group: "DeepSeek (key required)", tags: ["recommended", "cheap"] },
  { id: "deepseek-reasoner",  name: "DeepSeek R1 (Reasoner)", provider: "DeepSeek", group: "DeepSeek (key required)", tags: ["reasoning", "cheap"] },

  // Mistral AI
  { id: "mistral-large-latest",   name: "Mistral Large",   provider: "Mistral", group: "Mistral AI (key required)", tags: [] },
  { id: "mistral-medium-latest",  name: "Mistral Medium",  provider: "Mistral", group: "Mistral AI (key required)", tags: [] },
  { id: "mistral-small-latest",   name: "Mistral Small",   provider: "Mistral", group: "Mistral AI (key required)", tags: ["cheap"] },
  { id: "codestral-latest",       name: "Codestral",       provider: "Mistral", group: "Mistral AI (key required)", tags: ["code"] },
  { id: "open-mixtral-8x22b",     name: "Mixtral 8x22B",   provider: "Mistral", group: "Mistral AI (key required)", tags: [] },
  { id: "pixtral-large-latest",   name: "Pixtral Large",   provider: "Mistral", group: "Mistral AI (key required)", tags: ["vision"] },
  { id: "mistral-nemo",           name: "Mistral Nemo",    provider: "Mistral", group: "Mistral AI (key required)", tags: ["cheap"] },

  // Cohere
  { id: "command-a-03-2025", name: "Command A",   provider: "Cohere", group: "Cohere (key required)", tags: [] },
  { id: "command-r-plus",    name: "Command R+",  provider: "Cohere", group: "Cohere (key required)", tags: ["rag"] },
  { id: "command-r",         name: "Command R",   provider: "Cohere", group: "Cohere (key required)", tags: ["cheap", "rag"] },
  { id: "command-light",     name: "Command Light", provider: "Cohere", group: "Cohere (key required)", tags: ["cheap"] },

  // Perplexity (search-enabled)
  { id: "sonar-pro",          name: "Sonar Pro (web search)",    provider: "Perplexity", group: "Perplexity (key required)", tags: ["search"] },
  { id: "sonar",              name: "Sonar (web search)",        provider: "Perplexity", group: "Perplexity (key required)", tags: ["search", "cheap"] },
  { id: "sonar-reasoning-pro",name: "Sonar Reasoning Pro",      provider: "Perplexity", group: "Perplexity (key required)", tags: ["search", "reasoning"] },
  { id: "sonar-reasoning",    name: "Sonar Reasoning",          provider: "Perplexity", group: "Perplexity (key required)", tags: ["search", "cheap"] },

  // ══════════════════════════════════════════════════════════════════════════
  // TIER 3: Ultra-Fast Inference APIs
  // ══════════════════════════════════════════════════════════════════════════

  // Groq — 700+ tok/s
  { id: "llama-3.3-70b-versatile",         name: "Llama 3.3 70B",           provider: "Groq", group: "Groq — Ultra Fast (key required)", tags: ["free", "fast", "recommended"] },
  { id: "llama-3.1-8b-instant",            name: "Llama 3.1 8B Instant",    provider: "Groq", group: "Groq — Ultra Fast (key required)", tags: ["free", "ultra-fast"] },
  { id: "deepseek-r1-distill-llama-70b",   name: "DeepSeek R1 Llama 70B",   provider: "Groq", group: "Groq — Ultra Fast (key required)", tags: ["free", "reasoning"] },
  { id: "qwen-qwq-32b",                    name: "Qwen QwQ 32B",             provider: "Groq", group: "Groq — Ultra Fast (key required)", tags: ["free", "reasoning"] },
  { id: "mixtral-8x7b-32768",              name: "Mixtral 8x7B",             provider: "Groq", group: "Groq — Ultra Fast (key required)", tags: ["free"] },
  { id: "gemma2-9b-it",                    name: "Gemma 2 9B",               provider: "Groq", group: "Groq — Ultra Fast (key required)", tags: ["free"] },
  { id: "llama-3.1-70b-versatile",         name: "Llama 3.1 70B",           provider: "Groq", group: "Groq — Ultra Fast (key required)", tags: ["free"] },
  { id: "llama3-70b-8192",                 name: "Llama 3 70B",              provider: "Groq", group: "Groq — Ultra Fast (key required)", tags: ["free"] },

  // Cerebras — 2000+ tok/s wafer-scale silicon
  { id: "llama3.3-70b",  name: "Llama 3.3 70B",  provider: "Cerebras", group: "Cerebras — World's Fastest (key required)", tags: ["ultra-fast", "free"] },
  { id: "llama3.1-70b",  name: "Llama 3.1 70B",  provider: "Cerebras", group: "Cerebras — World's Fastest (key required)", tags: ["ultra-fast", "free"] },
  { id: "llama3.1-8b",   name: "Llama 3.1 8B",   provider: "Cerebras", group: "Cerebras — World's Fastest (key required)", tags: ["ultra-fast", "free"] },

  // SambaNova — fastest 405B
  { id: "Meta-Llama-3.3-70B-Instruct",    name: "Llama 3.3 70B",    provider: "SambaNova", group: "SambaNova — Fast Inference (key required)", tags: ["fast"] },
  { id: "Meta-Llama-3.1-405B-Instruct",   name: "Llama 3.1 405B",   provider: "SambaNova", group: "SambaNova — Fast Inference (key required)", tags: ["best", "fast"] },
  { id: "DeepSeek-R1",                    name: "DeepSeek R1",      provider: "SambaNova", group: "SambaNova — Fast Inference (key required)", tags: ["reasoning"] },
  { id: "DeepSeek-R1-Distill-Llama-70B",  name: "DeepSeek R1 Llama 70B", provider: "SambaNova", group: "SambaNova — Fast Inference (key required)", tags: ["reasoning", "fast"] },
  { id: "Qwen2.5-72B-Instruct",           name: "Qwen 2.5 72B",     provider: "SambaNova", group: "SambaNova — Fast Inference (key required)", tags: [] },

  // Fireworks AI
  { id: "accounts/fireworks/models/llama-v3p3-70b-instruct",   name: "Llama 3.3 70B",   provider: "Fireworks", group: "Fireworks AI (key required)", tags: ["fast", "cheap"] },
  { id: "accounts/fireworks/models/deepseek-r1",               name: "DeepSeek R1",     provider: "Fireworks", group: "Fireworks AI (key required)", tags: ["reasoning"] },
  { id: "accounts/fireworks/models/qwen2p5-72b-instruct",      name: "Qwen 2.5 72B",    provider: "Fireworks", group: "Fireworks AI (key required)", tags: ["cheap"] },
  { id: "accounts/fireworks/models/mixtral-8x22b-instruct",    name: "Mixtral 8x22B",   provider: "Fireworks", group: "Fireworks AI (key required)", tags: [] },
  { id: "accounts/fireworks/models/llama-v3p1-405b-instruct",  name: "Llama 3.1 405B",  provider: "Fireworks", group: "Fireworks AI (key required)", tags: ["best"] },
  { id: "accounts/fireworks/models/phi-4",                     name: "Phi 4",           provider: "Fireworks", group: "Fireworks AI (key required)", tags: ["cheap"] },

  // ══════════════════════════════════════════════════════════════════════════
  // TIER 4: OpenRouter & Multi-Model Hubs
  // ══════════════════════════════════════════════════════════════════════════

  // OpenRouter — 300+ models via one API
  { id: "openrouter/auto",                          name: "Auto Router (best value)",      provider: "OpenRouter", group: "OpenRouter — 300+ Models (key required)", tags: ["smart"] },
  { id: "google/gemini-2.0-flash-exp:free",         name: "Gemini 2.0 Flash (free)",       provider: "OpenRouter", group: "OpenRouter — 300+ Models (key required)", tags: ["free"] },
  { id: "google/gemini-2.5-pro-preview-03-25",      name: "Gemini 2.5 Pro",                provider: "OpenRouter", group: "OpenRouter — 300+ Models (key required)", tags: ["best"] },
  { id: "meta-llama/llama-4-scout:free",            name: "Llama 4 Scout (free)",          provider: "OpenRouter", group: "OpenRouter — 300+ Models (key required)", tags: ["free"] },
  { id: "meta-llama/llama-4-maverick",              name: "Llama 4 Maverick",              provider: "OpenRouter", group: "OpenRouter — 300+ Models (key required)", tags: [] },
  { id: "anthropic/claude-3.5-sonnet",              name: "Claude 3.5 Sonnet",             provider: "OpenRouter", group: "OpenRouter — 300+ Models (key required)", tags: [] },
  { id: "anthropic/claude-3.7-sonnet",              name: "Claude 3.7 Sonnet",             provider: "OpenRouter", group: "OpenRouter — 300+ Models (key required)", tags: [] },
  { id: "x-ai/grok-3-mini-beta",                   name: "Grok 3 Mini Beta",              provider: "OpenRouter", group: "OpenRouter — 300+ Models (key required)", tags: ["reasoning"] },
  { id: "deepseek/deepseek-r1",                     name: "DeepSeek R1 (free)",            provider: "OpenRouter", group: "OpenRouter — 300+ Models (key required)", tags: ["free", "reasoning"] },
  { id: "deepseek/deepseek-chat-v3-0324:free",      name: "DeepSeek V3 (free)",            provider: "OpenRouter", group: "OpenRouter — 300+ Models (key required)", tags: ["free"] },
  { id: "microsoft/phi-4",                          name: "Phi 4",                         provider: "OpenRouter", group: "OpenRouter — 300+ Models (key required)", tags: ["cheap"] },
  { id: "microsoft/phi-4-reasoning",               name: "Phi 4 Reasoning",               provider: "OpenRouter", group: "OpenRouter — 300+ Models (key required)", tags: ["reasoning"] },
  { id: "qwen/qwq-32b",                            name: "Qwen QwQ 32B",                  provider: "OpenRouter", group: "OpenRouter — 300+ Models (key required)", tags: ["reasoning"] },
  { id: "mistralai/mistral-large",                 name: "Mistral Large",                 provider: "OpenRouter", group: "OpenRouter — 300+ Models (key required)", tags: [] },
  { id: "nousresearch/hermes-3-llama-3.1-405b",   name: "Hermes 3 405B",                 provider: "OpenRouter", group: "OpenRouter — 300+ Models (key required)", tags: [] },

  // Together AI
  { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo",  name: "Llama 3.3 70B Turbo",    provider: "Together", group: "Together AI (key required)", tags: ["cheap"] },
  { id: "meta-llama/Llama-3.1-8B-Instruct-Turbo",   name: "Llama 3.1 8B Turbo",     provider: "Together", group: "Together AI (key required)", tags: ["cheap", "fast"] },
  { id: "meta-llama/Llama-3.1-405B-Instruct-Turbo", name: "Llama 3.1 405B Turbo",   provider: "Together", group: "Together AI (key required)", tags: ["best"] },
  { id: "Qwen/Qwen2.5-72B-Instruct-Turbo",          name: "Qwen 2.5 72B Turbo",      provider: "Together", group: "Together AI (key required)", tags: ["cheap"] },
  { id: "Qwen/QwQ-32B-Preview",                     name: "Qwen QwQ 32B",            provider: "Together", group: "Together AI (key required)", tags: ["reasoning"] },
  { id: "deepseek-ai/DeepSeek-R1",                  name: "DeepSeek R1",             provider: "Together", group: "Together AI (key required)", tags: ["reasoning"] },
  { id: "deepseek-ai/DeepSeek-V3",                  name: "DeepSeek V3",             provider: "Together", group: "Together AI (key required)", tags: [] },
  { id: "mistralai/Mixtral-8x22B-Instruct-v0.1",   name: "Mixtral 8x22B",           provider: "Together", group: "Together AI (key required)", tags: [] },
  { id: "google/gemma-2-27b-it",                    name: "Gemma 2 27B",             provider: "Together", group: "Together AI (key required)", tags: ["cheap"] },
  { id: "nousresearch/hermes-3-llama-3.1-405b-fp8", name: "Hermes 3 405B",          provider: "Together", group: "Together AI (key required)", tags: [] },

  // DeepInfra
  { id: "deepinfra/meta-llama/Meta-Llama-3.1-70B-Instruct",    name: "Llama 3.1 70B",      provider: "DeepInfra", group: "DeepInfra (key required)", tags: ["cheap"] },
  { id: "deepinfra/microsoft/phi-4",                            name: "Phi 4",              provider: "DeepInfra", group: "DeepInfra (key required)", tags: ["cheap"] },
  { id: "deepinfra/Qwen/QwQ-32B",                               name: "QwQ 32B",            provider: "DeepInfra", group: "DeepInfra (key required)", tags: ["reasoning"] },
  { id: "deepinfra/google/gemma-2-27b-it",                      name: "Gemma 2 27B",        provider: "DeepInfra", group: "DeepInfra (key required)", tags: [] },
  { id: "deepinfra/nvidia/Llama-3.1-Nemotron-70B-Instruct",    name: "Nemotron 70B",       provider: "DeepInfra", group: "DeepInfra (key required)", tags: [] },
  { id: "deepinfra/deepseek-ai/DeepSeek-R1",                   name: "DeepSeek R1",        provider: "DeepInfra", group: "DeepInfra (key required)", tags: ["reasoning", "cheap"] },
  { id: "deepinfra/mistralai/Mixtral-8x22B-Instruct-v0.1",     name: "Mixtral 8x22B",      provider: "DeepInfra", group: "DeepInfra (key required)", tags: [] },

  // Novita AI
  { id: "novita/meta-llama/llama-3.3-70b-instruct",  name: "Llama 3.3 70B",   provider: "Novita", group: "Novita AI (key required)", tags: ["cheap"] },
  { id: "novita/deepseek/deepseek-v3",               name: "DeepSeek V3",     provider: "Novita", group: "Novita AI (key required)", tags: ["cheap"] },
  { id: "novita/Qwen/Qwen2.5-72B-Instruct",          name: "Qwen 2.5 72B",   provider: "Novita", group: "Novita AI (key required)", tags: ["cheap"] },
  { id: "novita/microsoft/phi-4",                    name: "Phi 4",           provider: "Novita", group: "Novita AI (key required)", tags: ["cheap"] },

  // Hyperbolic
  { id: "hyperbolic/meta-llama/Llama-3.3-70B-Instruct", name: "Llama 3.3 70B",   provider: "Hyperbolic", group: "Hyperbolic (key required)", tags: [] },
  { id: "hyperbolic/deepseek-ai/DeepSeek-R1",           name: "DeepSeek R1",     provider: "Hyperbolic", group: "Hyperbolic (key required)", tags: ["reasoning"] },
  { id: "hyperbolic/Qwen/QwQ-32B",                      name: "Qwen QwQ 32B",    provider: "Hyperbolic", group: "Hyperbolic (key required)", tags: ["reasoning"] },
  { id: "hyperbolic/NovaSky-Berkeley/Sky-T1-32B-Preview", name: "Sky-T1 32B",   provider: "Hyperbolic", group: "Hyperbolic (key required)", tags: ["reasoning"] },

  // ══════════════════════════════════════════════════════════════════════════
  // TIER 5: Specialized & Regional Providers
  // ══════════════════════════════════════════════════════════════════════════

  // AI21 Labs — Jamba SSM hybrid
  { id: "jamba-1.5-large", name: "Jamba 1.5 Large (256K ctx)", provider: "AI21", group: "AI21 Labs (key required)", tags: ["256k"] },
  { id: "jamba-1.5-mini",  name: "Jamba 1.5 Mini",             provider: "AI21", group: "AI21 Labs (key required)", tags: ["cheap", "fast"] },

  // Moonshot (Kimi) — long context
  { id: "moonshot-v1-128k", name: "Kimi v1 128K", provider: "Moonshot", group: "Moonshot / Kimi (key required)", tags: ["128k"] },
  { id: "moonshot-v1-32k",  name: "Kimi v1 32K",  provider: "Moonshot", group: "Moonshot / Kimi (key required)", tags: [] },
  { id: "moonshot-v1-8k",   name: "Kimi v1 8K",   provider: "Moonshot", group: "Moonshot / Kimi (key required)", tags: ["cheap"] },

  // Qwen via Alibaba Cloud DashScope
  { id: "qwen-max",   name: "Qwen Max",   provider: "Qwen", group: "Qwen / Alibaba (key required)", tags: ["best"] },
  { id: "qwen-plus",  name: "Qwen Plus",  provider: "Qwen", group: "Qwen / Alibaba (key required)", tags: [] },
  { id: "qwen-turbo", name: "Qwen Turbo", provider: "Qwen", group: "Qwen / Alibaba (key required)", tags: ["cheap", "fast"] },
  { id: "qwen-long",  name: "Qwen Long",  provider: "Qwen", group: "Qwen / Alibaba (key required)", tags: ["long-ctx"] },

  // Zhipu AI (GLM)
  { id: "glm-4-plus",  name: "GLM-4 Plus",  provider: "Zhipu", group: "Zhipu AI / GLM (key required)", tags: ["best"] },
  { id: "glm-4-flash", name: "GLM-4 Flash", provider: "Zhipu", group: "Zhipu AI / GLM (key required)", tags: ["free", "fast"] },
  { id: "glm-4-air",   name: "GLM-4 Air",   provider: "Zhipu", group: "Zhipu AI / GLM (key required)", tags: ["cheap"] },
  { id: "glm-4-long",  name: "GLM-4 Long",  provider: "Zhipu", group: "Zhipu AI / GLM (key required)", tags: ["128k"] },

  // ══════════════════════════════════════════════════════════════════════════
  // TIER 6: Local Inference (100% Free, Private)
  // ══════════════════════════════════════════════════════════════════════════

  // Ollama
  { id: "ollama/llama3.3",       name: "Llama 3.3 (Local)",       provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local"] },
  { id: "ollama/llama3.1:70b",   name: "Llama 3.1 70B (Local)",   provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local"] },
  { id: "ollama/llama3.1:8b",    name: "Llama 3.1 8B (Local)",    provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local"] },
  { id: "ollama/qwen2.5:72b",    name: "Qwen 2.5 72B (Local)",    provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local"] },
  { id: "ollama/qwen2.5:7b",     name: "Qwen 2.5 7B (Local)",     provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local"] },
  { id: "ollama/deepseek-r1:70b",name: "DeepSeek R1 70B (Local)", provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local", "reasoning"] },
  { id: "ollama/deepseek-r1:8b", name: "DeepSeek R1 8B (Local)",  provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local", "reasoning"] },
  { id: "ollama/phi4",           name: "Phi 4 (Local)",            provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local"] },
  { id: "ollama/mistral",        name: "Mistral 7B (Local)",       provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local"] },
  { id: "ollama/gemma3:12b",     name: "Gemma 3 12B (Local)",      provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local"] },
  { id: "ollama/gemma3:4b",      name: "Gemma 3 4B (Local)",       provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local"] },
  { id: "ollama/codellama:7b",   name: "CodeLlama 7B (Local)",     provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local", "code"] },
  { id: "ollama/starcoder2:7b",  name: "StarCoder2 7B (Local)",    provider: "Ollama", group: "Ollama (local, free)", tags: ["free", "local", "code"] },

  // LM Studio
  { id: "lmstudio/any-model", name: "Any Model (LM Studio)", provider: "LM Studio", group: "LM Studio (local, free)", tags: ["free", "local"] },

  // ══════════════════════════════════════════════════════════════════════════
  // TIER 7: Cloudflare Workers AI (for CF deploy)
  // ══════════════════════════════════════════════════════════════════════════

  { id: "@cf/meta/llama-4-scout-17b-16e-instruct",    name: "Llama 4 Scout 17B",     provider: "Cloudflare", group: "Workers AI (CF deploy)", tags: ["free", "vision"] },
  { id: "@cf/moonshotai/kimi-k2.5",                   name: "Kimi K2.5",             provider: "Cloudflare", group: "Workers AI (CF deploy)", tags: ["256k", "reasoning"] },
  { id: "@cf/openai/gpt-oss-120b",                    name: "GPT OSS 120B",          provider: "Cloudflare", group: "Workers AI (CF deploy)", tags: ["reasoning"] },
  { id: "@cf/nvidia/nemotron-3-120b-a12b",            name: "Nemotron 3 Super 120B", provider: "Cloudflare", group: "Workers AI (CF deploy)", tags: ["reasoning"] },
  { id: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", name: "DeepSeek R1 32B",   provider: "Cloudflare", group: "Workers AI (CF deploy)", tags: ["free", "reasoning"] },
  { id: "@cf/qwen/qwen2.5-coder-32b-instruct",        name: "Qwen 2.5 Coder 32B",   provider: "Cloudflare", group: "Workers AI (CF deploy)", tags: ["free", "code"] },
  { id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",   name: "Llama 3.3 70B (Fast)", provider: "Cloudflare", group: "Workers AI (CF deploy)", tags: ["free"] },
  { id: "@cf/google/gemma-3-27b-it",                  name: "Gemma 3 27B",          provider: "Cloudflare", group: "Workers AI (CF deploy)", tags: ["free", "vision"] },
];

export const MULTI_PROVIDER_GROUPS = [...new Set(MULTI_PROVIDER_MODELS.map((m) => m.group))];
