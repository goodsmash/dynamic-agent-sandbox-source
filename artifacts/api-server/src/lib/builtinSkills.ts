import { db } from "@workspace/db";
import { skillsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const BUILTIN_SKILLS = [
  {
    name: "web_research",
    description: "Search the web, extract content from URLs, and synthesize findings into structured reports",
    implementation: `1. Parse user query into search terms\n2. Execute web search via configured search API\n3. Extract key content from top results\n4. Synthesize findings with citations\n5. Return structured summary with sources`,
    category: "research",
    agentType: "openclaw" as const,
    score: 0.95,
  },
  {
    name: "code_generation",
    description: "Generate, analyze, refactor, and debug code in any programming language with best practices",
    implementation: `1. Analyze the coding task requirements\n2. Select optimal language/framework\n3. Generate code with proper structure, types, and error handling\n4. Add inline documentation\n5. Suggest tests and edge cases`,
    category: "coding",
    agentType: "openclaw" as const,
    score: 0.92,
  },
  {
    name: "data_analysis",
    description: "Analyze datasets, compute statistics, identify patterns, and generate visualizations",
    implementation: `1. Ingest data (CSV, JSON, SQL results)\n2. Compute descriptive statistics\n3. Identify trends, outliers, correlations\n4. Generate summary tables\n5. Suggest visualization types`,
    category: "analysis",
    agentType: "openclaw" as const,
    score: 0.90,
  },
  {
    name: "parallel_fan_out",
    description: "Split a complex task into N independent subtasks and execute them simultaneously across isolates",
    implementation: `1. Decompose the task into independent units\n2. Assign each unit to a separate isolate\n3. Execute all isolates with Promise.all()\n4. Collect and merge results\n5. Handle partial failures gracefully`,
    category: "architecture",
    agentType: "openclaw" as const,
    score: 0.93,
  },
  {
    name: "chain_of_thought_reasoning",
    description: "Break complex problems into step-by-step reasoning chains for higher accuracy",
    implementation: `1. Identify the core question\n2. Break into logical sub-questions\n3. Solve each sub-question sequentially\n4. Verify each step before proceeding\n5. Synthesize final answer with confidence level`,
    category: "reasoning",
    agentType: "nemoclaw" as const,
    score: 0.91,
  },
  {
    name: "rapid_response",
    description: "Ultra-fast responses for simple queries using minimal token budgets and streamlined prompts",
    implementation: `1. Classify query complexity (simple/medium/complex)\n2. For simple: direct answer, no chain-of-thought\n3. Use compact system prompt (< 200 tokens)\n4. Set max_tokens to 256 for speed\n5. Skip conversation history for stateless queries`,
    category: "prompting",
    agentType: "nanoclaw" as const,
    score: 0.88,
  },
  {
    name: "multi_model_comparison",
    description: "Send the same prompt to multiple AI models simultaneously and compare outputs for quality",
    implementation: `1. Format the prompt for model-agnostic input\n2. Fan out to N models via parallel isolates\n3. Collect all responses with timing metadata\n4. Score responses on accuracy, completeness, style\n5. Return ranked comparison with best answer highlighted`,
    category: "evaluation",
    agentType: "openclaw" as const,
    score: 0.87,
  },
  {
    name: "document_summarization",
    description: "Summarize long documents, articles, or codebases into structured executive summaries",
    implementation: `1. Chunk the document into manageable sections\n2. Extract key points from each section\n3. Identify themes and recurring concepts\n4. Generate hierarchical summary (TL;DR → details)\n5. Preserve critical quotes and data points`,
    category: "analysis",
    agentType: "openclaw" as const,
    score: 0.89,
  },
  {
    name: "api_integration",
    description: "Connect to external APIs, handle authentication, parse responses, and chain API calls",
    implementation: `1. Parse the API specification (OpenAPI/REST/GraphQL)\n2. Construct authenticated request with proper headers\n3. Handle rate limits and retries\n4. Parse and validate response data\n5. Transform data into the required output format`,
    category: "coding",
    agentType: "openclaw" as const,
    score: 0.86,
  },
  {
    name: "creative_writing",
    description: "Generate blog posts, marketing copy, technical documentation, and creative content",
    implementation: `1. Analyze the writing brief (audience, tone, length)\n2. Create an outline with key sections\n3. Draft content with engaging hooks and transitions\n4. Apply style guidelines (technical vs casual)\n5. Self-edit for clarity, grammar, and impact`,
    category: "writing",
    agentType: "openclaw" as const,
    score: 0.85,
  },
  {
    name: "task_decomposition",
    description: "Break complex goals into actionable subtasks with dependencies and priority ordering",
    implementation: `1. Parse the high-level goal\n2. Identify all required subtasks\n3. Map dependencies between subtasks\n4. Assign priority and estimated effort\n5. Output as ordered task list with blockers noted`,
    category: "planning",
    agentType: "openclaw" as const,
    score: 0.90,
  },
  {
    name: "code_review",
    description: "Review code for bugs, security issues, performance problems, and style violations",
    implementation: `1. Parse the code and identify the language/framework\n2. Check for common vulnerability patterns (injection, XSS, etc)\n3. Analyze time/space complexity\n4. Check naming conventions and code style\n5. Output prioritized list: critical → warning → suggestion`,
    category: "coding",
    agentType: "nemoclaw" as const,
    score: 0.91,
  },
  {
    name: "swarm_orchestration",
    description: "Coordinate multiple specialized agents working on different aspects of a complex project",
    implementation: `1. Analyze the project scope and identify required specialties\n2. Spawn specialized sub-agents (researcher, coder, reviewer, writer)\n3. Assign tasks based on agent capabilities\n4. Monitor progress and redistribute on failure\n5. Merge all outputs into coherent final deliverable`,
    category: "architecture",
    agentType: "openclaw" as const,
    score: 0.88,
  },
  {
    name: "hypothesis_testing",
    description: "Formulate hypotheses, design experiments, execute tests, and evaluate results systematically",
    implementation: `1. Define the research question clearly\n2. Generate testable hypotheses\n3. Design experiment with control variables\n4. Execute the experiment (code, prompts, data)\n5. Evaluate results with statistical rigor\n6. Accept/reject hypothesis with confidence score`,
    category: "research",
    agentType: "openclaw" as const,
    score: 0.87,
  },
  {
    name: "smart_model_selection",
    description: "Automatically select the optimal AI model based on task type, complexity, and cost constraints",
    implementation: `1. Classify the task type (coding, reasoning, vision, translation, general)\n2. Estimate required token budget\n3. Check available models and their costs\n4. Select the cheapest model meeting quality requirements\n5. Fall back to next-best if primary is unavailable`,
    category: "architecture",
    agentType: "openclaw" as const,
    score: 0.92,
  },
  {
    name: "error_recovery",
    description: "Detect, diagnose, and recover from errors during task execution with graceful fallbacks",
    implementation: `1. Wrap all operations in try/catch blocks\n2. Classify error type (network, auth, rate limit, parsing)\n3. Apply appropriate recovery strategy\n4. Retry with exponential backoff for transient errors\n5. Log error context for debugging\n6. Fall back to alternative approach if retries exhausted`,
    category: "architecture",
    agentType: "openclaw" as const,
    score: 0.89,
  },
  {
    name: "prompt_engineering",
    description: "Craft optimized prompts with system instructions, few-shot examples, and output formatting",
    implementation: `1. Define the desired output format clearly\n2. Write a concise system prompt with role and constraints\n3. Add 2-3 few-shot examples for complex tasks\n4. Use structured output (JSON, markdown tables)\n5. Include negative examples (what NOT to do)\n6. Test and iterate on prompt quality`,
    category: "prompting",
    agentType: "openclaw" as const,
    score: 0.93,
  },
  {
    name: "database_operations",
    description: "Design schemas, write queries, optimize performance, and manage database operations",
    implementation: `1. Analyze data requirements and relationships\n2. Design normalized schema with proper indexes\n3. Write type-safe queries (Drizzle ORM / raw SQL)\n4. Implement CRUD operations with validation\n5. Add connection pooling and error handling`,
    category: "coding",
    agentType: "openclaw" as const,
    score: 0.86,
  },
  {
    name: "security_analysis",
    description: "Analyze code and configurations for security vulnerabilities and suggest remediations",
    implementation: `1. Scan for OWASP Top 10 vulnerabilities\n2. Check for exposed secrets and credentials\n3. Analyze authentication and authorization logic\n4. Review input validation and sanitization\n5. Output prioritized remediation plan`,
    category: "analysis",
    agentType: "nemoclaw" as const,
    score: 0.88,
  },
  {
    name: "memory_management",
    description: "Store, retrieve, and manage agent memory for long-running tasks and cross-session context",
    implementation: `1. Identify key facts and decisions worth remembering\n2. Store with semantic tags for retrieval\n3. Prune outdated or low-value memories\n4. Inject relevant memories into system prompt\n5. Update memories based on new information`,
    category: "architecture",
    agentType: "openclaw" as const,
    score: 0.84,
  },
  {
    name: "workflow_automation",
    description: "Design and execute multi-step automated workflows with conditional branching and loops",
    implementation: `1. Parse workflow definition (steps, conditions, loops)\n2. Execute steps sequentially or in parallel as specified\n3. Evaluate conditions for branching decisions\n4. Handle loop iterations with termination conditions\n5. Collect step outputs and pass to next step\n6. Report final workflow status and outputs`,
    category: "architecture",
    agentType: "openclaw" as const,
    score: 0.91,
  },
  {
    name: "natural_language_to_sql",
    description: "Convert natural language questions into SQL queries against known database schemas",
    implementation: `1. Parse the natural language question\n2. Identify referenced tables and columns from schema\n3. Determine query type (SELECT, aggregate, join)\n4. Generate SQL with proper JOINs and WHERE clauses\n5. Validate query syntax before execution`,
    category: "coding",
    agentType: "openclaw" as const,
    score: 0.87,
  },
  {
    name: "competitive_analysis",
    description: "Research competitors, compare features, pricing, and positioning for strategic insights",
    implementation: `1. Identify the competitive landscape\n2. Research each competitor's product offering\n3. Compare on key dimensions (features, pricing, UX)\n4. Identify gaps and opportunities\n5. Generate SWOT analysis and recommendations`,
    category: "research",
    agentType: "openclaw" as const,
    score: 0.83,
  },
  {
    name: "test_generation",
    description: "Generate comprehensive test suites with unit tests, integration tests, and edge cases",
    implementation: `1. Analyze the code under test\n2. Identify public API surface and edge cases\n3. Generate unit tests for each function/method\n4. Add integration tests for component interactions\n5. Include error path and boundary condition tests`,
    category: "coding",
    agentType: "openclaw" as const,
    score: 0.86,
  },
];

export async function seedBuiltinSkills(): Promise<number> {
  let seeded = 0;
  for (const skill of BUILTIN_SKILLS) {
    try {
      const existing = await db
        .select({ id: skillsTable.id })
        .from(skillsTable)
        .where(eq(skillsTable.name, skill.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(skillsTable).values({
          name: skill.name,
          description: skill.description,
          implementation: skill.implementation,
          category: skill.category,
          agentType: skill.agentType,
          score: skill.score,
          source: "auto",
        });
        seeded++;
      }
    } catch {}
  }
  if (seeded > 0) {
    console.log(`[Skills] Seeded ${seeded} built-in skills (${BUILTIN_SKILLS.length} total defined)`);
  }
  return seeded;
}
