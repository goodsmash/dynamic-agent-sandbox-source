/**
 * OpenClaw — Complete Cloudflare Workers AI Model Catalog
 *
 * Source: https://developers.cloudflare.com/workers-ai/models/
 * Last updated: March 2026
 *
 * All models are available via the AI binding:
 *   const result = await env.AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", { messages });
 *
 * Or via the AI SDK with workers-ai-provider:
 *   const workersai = createWorkersAI({ binding: env.AI });
 *   const result = streamText({ model: workersai("@cf/meta/llama-4-scout-17b-16e-instruct"), ... });
 */

export interface WorkersAIModel {
  id: string;                   // The @cf/ model ID used in API calls
  name: string;                 // Human-readable display name
  author: string;               // Organization that made the model
  task: WorkersAITask;          // Primary task type
  contextWindow?: number;       // Max tokens in context
  capabilities: ModelCapability[];
  description: string;
  recommended?: boolean;        // Recommended for agent use
  free?: boolean;               // Available on free tier
}

export type WorkersAITask =
  | "text-generation"
  | "text-to-image"
  | "text-embeddings"
  | "automatic-speech-recognition"
  | "translation"
  | "text-classification"
  | "image-classification"
  | "image-to-text"
  | "summarization"
  | "speech-synthesis";

export type ModelCapability =
  | "reasoning"
  | "function-calling"
  | "vision"
  | "streaming"
  | "batch"
  | "lora"
  | "code"
  | "multilingual"
  | "partner";

// ─────────────────────────────────────────────────────────────────────────────
// TEXT GENERATION — the full verified list
// ─────────────────────────────────────────────────────────────────────────────
export const TEXT_GENERATION_MODELS: WorkersAIModel[] = [
  // ── Frontier / Latest ────────────────────────────────────────────────────
  {
    id: "@cf/moonshotai/kimi-k2.5",
    name: "Kimi K2.5",
    author: "Moonshot AI",
    task: "text-generation",
    contextWindow: 256_000,
    capabilities: ["reasoning", "function-calling", "vision", "batch"],
    description: "Frontier-scale model with 256k context, multi-turn tool calling, vision, and agentic workloads.",
    recommended: true,
    free: false,
  },
  {
    id: "@cf/meta/llama-4-scout-17b-16e-instruct",
    name: "Llama 4 Scout 17B",
    author: "Meta",
    task: "text-generation",
    contextWindow: 131_000,
    capabilities: ["function-calling", "vision", "batch"],
    description: "Meta's natively multimodal MoE model. 17B params, 16 experts. Excels at text+image understanding.",
    recommended: true,
    free: true,
  },
  {
    id: "@cf/meta/llama-4-maverick-17b-128e-instruct-fp8",
    name: "Llama 4 Maverick 17B",
    author: "Meta",
    task: "text-generation",
    contextWindow: 131_000,
    capabilities: ["function-calling", "vision"],
    description: "Meta's Llama 4 Maverick — 128-expert MoE for high-quality reasoning and instruction following.",
    recommended: true,
    free: false,
  },
  {
    id: "@cf/openai/gpt-oss-120b",
    name: "GPT OSS 120B",
    author: "OpenAI",
    task: "text-generation",
    contextWindow: 128_000,
    capabilities: ["function-calling", "reasoning"],
    description: "OpenAI's open-weight 120B model. Designed for production, general-purpose high-reasoning use-cases.",
    recommended: true,
    free: false,
  },
  {
    id: "@cf/openai/gpt-oss-20b",
    name: "GPT OSS 20B",
    author: "OpenAI",
    task: "text-generation",
    contextWindow: 128_000,
    capabilities: ["function-calling", "reasoning"],
    description: "OpenAI's open-weight 20B model for fast reasoning and general-purpose tasks.",
    free: false,
  },
  {
    id: "@cf/nvidia/nemotron-3-120b-a12b",
    name: "Nemotron 3 Super 120B",
    author: "NVIDIA",
    task: "text-generation",
    contextWindow: 128_000,
    capabilities: ["function-calling", "reasoning"],
    description: "NVIDIA's hybrid MoE model. Leading accuracy for multi-agent and specialized agentic AI.",
    recommended: true,
    free: false,
  },

  // ── Reasoning Models ─────────────────────────────────────────────────────
  {
    id: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
    name: "DeepSeek R1 Distill Qwen 32B",
    author: "DeepSeek",
    task: "text-generation",
    contextWindow: 64_000,
    capabilities: ["reasoning"],
    description: "Distilled reasoning model based on Qwen 32B. Excels at math, logic, and step-by-step problems.",
    recommended: true,
    free: true,
  },
  {
    id: "@cf/deepseek-ai/deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1 Distill Llama 70B",
    author: "DeepSeek",
    task: "text-generation",
    contextWindow: 128_000,
    capabilities: ["reasoning"],
    description: "Distilled 70B reasoning model based on Llama. Superior at complex chain-of-thought tasks.",
    free: false,
  },
  {
    id: "@cf/qwen/qwq-32b",
    name: "QwQ 32B",
    author: "Qwen",
    task: "text-generation",
    contextWindow: 32_000,
    capabilities: ["reasoning"],
    description: "Qwen's dedicated reasoning model. Competitive with o1-mini on math and code benchmarks.",
    free: true,
  },

  // ── Production Workhorses ────────────────────────────────────────────────
  {
    id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    name: "Llama 3.3 70B (Fast)",
    author: "Meta",
    task: "text-generation",
    contextWindow: 128_000,
    capabilities: ["streaming"],
    description: "Meta's Llama 3.3 70B in FP8, optimized for speed. Best speed/quality balance for production.",
    recommended: true,
    free: true,
  },
  {
    id: "@cf/zai-org/glm-4.7-flash",
    name: "GLM 4.7 Flash",
    author: "Zhipu AI",
    task: "text-generation",
    contextWindow: 131_000,
    capabilities: ["function-calling", "reasoning", "multilingual"],
    description: "Fast, efficient multilingual model. Optimized for dialogue, instruction-following across 100+ languages.",
    free: true,
  },
  {
    id: "@cf/mistral/mistral-small-3.1-24b-instruct",
    name: "Mistral Small 3.1 24B",
    author: "MistralAI",
    task: "text-generation",
    contextWindow: 128_000,
    capabilities: ["function-calling", "vision", "multilingual"],
    description: "MistralAI's efficient 24B model with function calling and vision support.",
    recommended: true,
    free: true,
  },
  {
    id: "@cf/meta/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B",
    author: "Meta",
    task: "text-generation",
    contextWindow: 128_000,
    capabilities: ["function-calling"],
    description: "Meta's Llama 3.1 70B instruction-tuned. Strong at following complex instructions.",
    free: true,
  },
  {
    id: "@cf/meta/llama-3.1-8b-instruct-fast",
    name: "Llama 3.1 8B (Fast)",
    author: "Meta",
    task: "text-generation",
    contextWindow: 128_000,
    capabilities: ["streaming"],
    description: "Llama 3.1 8B optimized for low-latency inference. Great for high-throughput tasks.",
    free: true,
  },
  {
    id: "@cf/meta/llama-3-8b-instruct",
    name: "Llama 3 8B",
    author: "Meta",
    task: "text-generation",
    contextWindow: 8_000,
    capabilities: [],
    description: "Meta's original Llama 3 8B instruction-tuned model. Reliable general-purpose assistant.",
    free: true,
  },
  {
    id: "@cf/meta/llama-3.2-3b-instruct",
    name: "Llama 3.2 3B",
    author: "Meta",
    task: "text-generation",
    contextWindow: 128_000,
    capabilities: [],
    description: "Compact 3B model from Meta. Ideal for fast, low-cost inference on simple tasks.",
    free: true,
  },
  {
    id: "@cf/meta/llama-3.2-1b-instruct",
    name: "Llama 3.2 1B",
    author: "Meta",
    task: "text-generation",
    contextWindow: 128_000,
    capabilities: [],
    description: "Smallest Llama model — ultra-fast, perfect for simple classification and short generations.",
    free: true,
  },

  // ── Specialized ──────────────────────────────────────────────────────────
  {
    id: "@cf/qwen/qwen2.5-coder-32b-instruct",
    name: "Qwen 2.5 Coder 32B",
    author: "Qwen",
    task: "text-generation",
    contextWindow: 32_000,
    capabilities: ["code", "function-calling"],
    description: "State-of-the-art code generation. Excels at coding tasks, debugging, and code explanation.",
    recommended: true,
    free: true,
  },
  {
    id: "@cf/defog/sqlcoder-7b-2",
    name: "SQLCoder 7B",
    author: "Defog",
    task: "text-generation",
    contextWindow: 4_096,
    capabilities: ["code"],
    description: "Specialized SQL generation model. Converts natural language to SQL queries accurately.",
    free: true,
  },
  {
    id: "@cf/ibm/granite-3-8b-instruct",
    name: "Granite 3 8B",
    author: "IBM",
    task: "text-generation",
    contextWindow: 8_192,
    capabilities: ["function-calling"],
    description: "IBM's enterprise-grade instruction-following model. Strong at structured tasks.",
    free: true,
  },
  {
    id: "@cf/aisingapore/seallm-7b-v2.5",
    name: "SeaLLM 7B v2.5",
    author: "AI Singapore",
    task: "text-generation",
    contextWindow: 8_192,
    capabilities: ["multilingual"],
    description: "Specialized for Southeast Asian languages (Thai, Vietnamese, Indonesian, Malay, Tagalog, etc.).",
    free: true,
  },
  {
    id: "@cf/meta-llama/llama-guard-3-8b",
    name: "Llama Guard 3 8B",
    author: "Meta",
    task: "text-classification",
    contextWindow: 8_192,
    capabilities: [],
    description: "Safety and moderation model. Classifies content for harmful categories per Meta's safety taxonomy.",
    free: true,
  },
  {
    id: "@cf/deepseek-ai/deepseek-math-7b-instruct",
    name: "DeepSeek Math 7B",
    author: "DeepSeek",
    task: "text-generation",
    contextWindow: 4_096,
    capabilities: [],
    description: "Specialized mathematical reasoning model. Excels at algebra, calculus, and proof tasks.",
    free: true,
  },

  // ── Google Models ─────────────────────────────────────────────────────────
  {
    id: "@cf/google/gemma-3-27b-it",
    name: "Gemma 3 27B",
    author: "Google",
    task: "text-generation",
    contextWindow: 128_000,
    capabilities: ["vision", "multilingual"],
    description: "Google's Gemma 3 27B — multimodal instruction-following model with strong multilingual support.",
    free: true,
  },
  {
    id: "@cf/google/gemma-3-12b-it",
    name: "Gemma 3 12B",
    author: "Google",
    task: "text-generation",
    contextWindow: 128_000,
    capabilities: ["vision", "multilingual"],
    description: "Google's Gemma 3 12B — balanced model with vision and multilingual capabilities.",
    free: true,
  },
  {
    id: "@cf/google/gemma-2-9b-it",
    name: "Gemma 2 9B",
    author: "Google",
    task: "text-generation",
    contextWindow: 8_192,
    capabilities: [],
    description: "Google's Gemma 2 9B — efficient instruction-tuned model with good reasoning.",
    free: true,
  },
  {
    id: "@cf/google/gemma-7b-it",
    name: "Gemma 7B",
    author: "Google",
    task: "text-generation",
    contextWindow: 8_192,
    capabilities: [],
    description: "Google's original Gemma 7B instruction model.",
    free: true,
  },

  // ── Qwen Series ──────────────────────────────────────────────────────────
  {
    id: "@cf/qwen/qwen2.5-72b-instruct",
    name: "Qwen 2.5 72B",
    author: "Qwen",
    task: "text-generation",
    contextWindow: 128_000,
    capabilities: ["function-calling", "multilingual"],
    description: "Alibaba's Qwen 2.5 72B — strong multilingual model with function calling support.",
    free: false,
  },
  {
    id: "@cf/qwen/qwen1.5-72b-chat",
    name: "Qwen 1.5 72B Chat",
    author: "Qwen",
    task: "text-generation",
    contextWindow: 32_000,
    capabilities: ["multilingual"],
    description: "Qwen 1.5 72B chat model with strong multilingual capabilities.",
    free: false,
  },
  {
    id: "@cf/qwen/qwen1.5-14b-chat-awq",
    name: "Qwen 1.5 14B Chat (AWQ)",
    author: "Qwen",
    task: "text-generation",
    contextWindow: 16_000,
    capabilities: ["multilingual"],
    description: "Qwen 1.5 14B quantized with AWQ for efficient inference.",
    free: true,
  },
  {
    id: "@cf/qwen/qwen1.5-7b-chat-awq",
    name: "Qwen 1.5 7B Chat (AWQ)",
    author: "Qwen",
    task: "text-generation",
    contextWindow: 8_000,
    capabilities: ["multilingual"],
    description: "Qwen 1.5 7B quantized with AWQ. Fast and efficient for multilingual tasks.",
    free: true,
  },
  {
    id: "@cf/qwen/qwen1.5-1.8b-chat",
    name: "Qwen 1.5 1.8B Chat",
    author: "Qwen",
    task: "text-generation",
    contextWindow: 4_000,
    capabilities: [],
    description: "Ultra-compact Qwen model for low-latency, low-cost use cases.",
    free: true,
  },

  // ── Mistral Series ────────────────────────────────────────────────────────
  {
    id: "@cf/mistral/mistral-7b-instruct-v0.2-lora",
    name: "Mistral 7B v0.2 (LoRA)",
    author: "MistralAI",
    task: "text-generation",
    contextWindow: 32_000,
    capabilities: ["lora"],
    description: "Mistral 7B v0.2 with LoRA adapter support. Fine-tune on your own data.",
    free: true,
  },
  {
    id: "@cf/mistral/mistral-7b-instruct-v0.1",
    name: "Mistral 7B v0.1",
    author: "MistralAI",
    task: "text-generation",
    contextWindow: 8_000,
    capabilities: [],
    description: "Original Mistral 7B instruction model. Punches above its weight class.",
    free: true,
  },

  // ── Other Production Models ───────────────────────────────────────────────
  {
    id: "@cf/nousresearch/hermes-2-pro-mistral-7b",
    name: "Hermes 2 Pro Mistral 7B",
    author: "NousResearch",
    task: "text-generation",
    contextWindow: 4_096,
    capabilities: ["function-calling"],
    description: "NousResearch Hermes 2 — fine-tuned for precise instruction following and tool use.",
    free: true,
  },
  {
    id: "@cf/nexusflow/starling-lm-7b-beta",
    name: "Starling LM 7B Beta",
    author: "Nexusflow",
    task: "text-generation",
    contextWindow: 8_192,
    capabilities: [],
    description: "RLHF-trained 7B model with strong conversational quality.",
    free: true,
  },
  {
    id: "@cf/openchat/openchat-3.5-0106",
    name: "OpenChat 3.5",
    author: "OpenChat",
    task: "text-generation",
    contextWindow: 8_192,
    capabilities: [],
    description: "High-quality open-source chat model trained with RLHF from Mistral 7B.",
    free: true,
  },
  {
    id: "@cf/microsoft/phi-2",
    name: "Phi-2",
    author: "Microsoft",
    task: "text-generation",
    contextWindow: 2_048,
    capabilities: [],
    description: "Microsoft's 2.7B model. Surprisingly capable for its size on reasoning tasks.",
    free: true,
  },
  {
    id: "@cf/tinyllama/tinyllama-1.1b-chat-v1.0",
    name: "TinyLlama 1.1B",
    author: "TinyLlama",
    task: "text-generation",
    contextWindow: 2_048,
    capabilities: [],
    description: "Smallest practical chat model. Ultra-fast for simple tasks with minimal compute.",
    free: true,
  },
  {
    id: "@cf/tiiuae/falcon-7b-instruct",
    name: "Falcon 7B Instruct",
    author: "TII UAE",
    task: "text-generation",
    contextWindow: 2_048,
    capabilities: [],
    description: "TII UAE's Falcon 7B instruction-tuned model.",
    free: true,
  },
  {
    id: "@cf/fblgit/una-cybertron-7b-v2-bf16",
    name: "UNA Cybertron 7B v2",
    author: "fblgit",
    task: "text-generation",
    contextWindow: 4_096,
    capabilities: [],
    description: "Fine-tuned Mistral 7B with strong performance on standard benchmarks.",
    free: true,
  },
  {
    id: "@cf/meta/llama-2-7b-chat-fp16",
    name: "Llama 2 7B Chat",
    author: "Meta",
    task: "text-generation",
    contextWindow: 4_096,
    capabilities: [],
    description: "Meta's original Llama 2 7B chat model. Reliable baseline.",
    free: true,
  },
  {
    id: "@cf/thebloke/discolm-german-7b-v1-awq",
    name: "DiscoLM German 7B",
    author: "TheBloke",
    task: "text-generation",
    contextWindow: 4_096,
    capabilities: ["multilingual"],
    description: "Specialized German language model. Best-in-class for German text generation.",
    free: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TEXT-TO-IMAGE
// ─────────────────────────────────────────────────────────────────────────────
export const TEXT_TO_IMAGE_MODELS: WorkersAIModel[] = [
  {
    id: "@cf/black-forest-labs/flux-2-klein-9b",
    name: "FLUX.2 klein 9B",
    author: "Black Forest Labs",
    task: "text-to-image",
    capabilities: ["partner"],
    description: "Ultra-fast distilled image model with enhanced quality. Unified generation and editing.",
    recommended: true,
    free: false,
  },
  {
    id: "@cf/black-forest-labs/flux-2-klein-4b",
    name: "FLUX.2 klein 4B",
    author: "Black Forest Labs",
    task: "text-to-image",
    capabilities: ["partner"],
    description: "FLUX.2 klein 4B — fast image generation and editing in a single model.",
    free: false,
  },
  {
    id: "@cf/black-forest-labs/flux-2-dev",
    name: "FLUX.2 Dev",
    author: "Black Forest Labs",
    task: "text-to-image",
    capabilities: ["partner"],
    description: "FLUX.2 development model for high-quality image generation.",
    free: false,
  },
  {
    id: "@cf/black-forest-labs/flux-1-schnell",
    name: "FLUX.1 Schnell",
    author: "Black Forest Labs",
    task: "text-to-image",
    capabilities: [],
    description: "FLUX.1 Schnell — fast text-to-image generation with high quality outputs.",
    recommended: true,
    free: true,
  },
  {
    id: "@cf/bytedance/stable-diffusion-xl-lightning",
    name: "SDXL Lightning",
    author: "ByteDance",
    task: "text-to-image",
    capabilities: [],
    description: "ByteDance's distilled SDXL — generates 1024×1024 images in ~1 second.",
    free: true,
  },
  {
    id: "@cf/lykon/dreamshaper-8-lcm",
    name: "DreamShaper 8 LCM",
    author: "Lykon",
    task: "text-to-image",
    capabilities: [],
    description: "DreamShaper 8 with LCM distillation for ultra-fast artistic image generation.",
    free: true,
  },
  {
    id: "@cf/stability-ai/stable-diffusion-xl-base-1.0",
    name: "Stable Diffusion XL Base 1.0",
    author: "Stability AI",
    task: "text-to-image",
    capabilities: [],
    description: "The original SDXL base model. Strong photorealistic and artistic generation.",
    free: true,
  },
  {
    id: "@cf/runwayml/stable-diffusion-v1-5-img2img",
    name: "Stable Diffusion v1.5 (img2img)",
    author: "RunwayML",
    task: "text-to-image",
    capabilities: [],
    description: "SD v1.5 image-to-image variant. Transform existing images with text prompts.",
    free: true,
  },
  {
    id: "@cf/runwayml/stable-diffusion-v1-5-inpainting",
    name: "Stable Diffusion v1.5 (Inpainting)",
    author: "RunwayML",
    task: "text-to-image",
    capabilities: [],
    description: "SD v1.5 inpainting. Fill masked regions of images with AI-generated content.",
    free: true,
  },
  {
    id: "@cf/leonardo/dreamshaper-8",
    name: "DreamShaper 8",
    author: "Leonardo",
    task: "text-to-image",
    capabilities: ["partner"],
    description: "Leonardo's DreamShaper 8 — versatile artistic image generation.",
    free: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TEXT EMBEDDINGS
// ─────────────────────────────────────────────────────────────────────────────
export const EMBEDDING_MODELS: WorkersAIModel[] = [
  {
    id: "@cf/baai/bge-large-en-v1.5",
    name: "BGE Large EN v1.5",
    author: "BAAI",
    task: "text-embeddings",
    capabilities: [],
    description: "BAAI's large English text embedding model. Highest quality for retrieval and semantic search.",
    recommended: true,
    free: true,
  },
  {
    id: "@cf/baai/bge-base-en-v1.5",
    name: "BGE Base EN v1.5",
    author: "BAAI",
    task: "text-embeddings",
    capabilities: [],
    description: "BAAI's base English embedding model. Balanced speed and quality.",
    free: true,
  },
  {
    id: "@cf/baai/bge-small-en-v1.5",
    name: "BGE Small EN v1.5",
    author: "BAAI",
    task: "text-embeddings",
    capabilities: [],
    description: "Compact embedding model for fast inference and low-cost vector search.",
    free: true,
  },
  {
    id: "@cf/baai/bge-m3",
    name: "BGE M3",
    author: "BAAI",
    task: "text-embeddings",
    capabilities: ["multilingual"],
    description: "Multilingual embedding model supporting 100+ languages with dense, sparse, and colbert retrieval.",
    recommended: true,
    free: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SPEECH RECOGNITION
// ─────────────────────────────────────────────────────────────────────────────
export const SPEECH_MODELS: WorkersAIModel[] = [
  {
    id: "@cf/openai/whisper",
    name: "Whisper",
    author: "OpenAI",
    task: "automatic-speech-recognition",
    capabilities: ["multilingual"],
    description: "OpenAI's Whisper — state-of-the-art speech-to-text for 99 languages.",
    recommended: true,
    free: true,
  },
  {
    id: "@cf/openai/whisper-large-v3",
    name: "Whisper Large v3",
    author: "OpenAI",
    task: "automatic-speech-recognition",
    capabilities: ["multilingual"],
    description: "Largest Whisper model. Best accuracy for challenging audio in diverse languages.",
    free: false,
  },
  {
    id: "@cf/openai/whisper-tiny-en",
    name: "Whisper Tiny EN",
    author: "OpenAI",
    task: "automatic-speech-recognition",
    capabilities: [],
    description: "Smallest Whisper model for English-only transcription. Ultra-fast.",
    free: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export const ALL_MODELS: WorkersAIModel[] = [
  ...TEXT_GENERATION_MODELS,
  ...TEXT_TO_IMAGE_MODELS,
  ...EMBEDDING_MODELS,
  ...SPEECH_MODELS,
];

/** Models recommended for agentic tasks (text generation + function calling) */
export const AGENT_MODELS: WorkersAIModel[] = TEXT_GENERATION_MODELS.filter(
  (m) => m.recommended && (m.capabilities.includes("function-calling") || m.capabilities.includes("reasoning"))
);

/** Get a model by its @cf/ ID */
export function getModel(id: string): WorkersAIModel | undefined {
  return ALL_MODELS.find((m) => m.id === id);
}

/** Default model for new agents */
export const DEFAULT_AGENT_MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";
export const DEFAULT_FAST_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
export const DEFAULT_CODE_MODEL = "@cf/qwen/qwen2.5-coder-32b-instruct";
