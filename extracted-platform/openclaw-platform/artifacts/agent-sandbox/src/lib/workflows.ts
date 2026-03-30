export interface WorkflowStep {
  command: string;
  description: string;
  delay?: number;
}

export interface AgenticWorkflow {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: WorkflowCategory;
  model: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  steps: WorkflowStep[];
  useCases: string[];
  icon: string;
}

export type WorkflowCategory =
  | "Code Intelligence"
  | "Research & Analysis"
  | "Data Processing"
  | "Content Generation"
  | "Parallel Agents"
  | "DevOps & Deploy";

export const WORKFLOW_CATEGORIES: WorkflowCategory[] = [
  "Code Intelligence",
  "Research & Analysis",
  "Data Processing",
  "Content Generation",
  "Parallel Agents",
  "DevOps & Deploy",
];

export const AGENTIC_WORKFLOWS: AgenticWorkflow[] = [
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    tagline: "Deep AI-powered code analysis",
    description:
      "Runs a multi-pass review of your code: security vulnerabilities, performance bottlenecks, style issues, and refactoring opportunities. Each pass runs in its own V8 isolate.",
    category: "Code Intelligence",
    model: "@cf/qwen/qwen2.5-coder-32b-instruct",
    tags: ["code", "security", "quality", "free"],
    difficulty: "beginner",
    estimatedTime: "~30s",
    icon: "🔍",
    useCases: [
      "Pull request reviews",
      "Security audits",
      "Code quality gates",
      "Onboarding new codebases",
    ],
    steps: [
      {
        command: "remember context: Reviewing TypeScript Express API for code quality",
        description: "Load context into durable memory",
      },
      {
        command: "parallel 3 security vulnerability scan on auth middleware",
        description: "Spawn 3 isolates to scan in parallel",
      },
      {
        command: "analyze Check for N+1 query patterns in the database layer",
        description: "Performance analysis pass",
      },
      {
        command: "chat Summarize all issues found and prioritize by severity",
        description: "AI synthesis of findings",
      },
    ],
  },
  {
    id: "research-agent",
    name: "Research Assistant",
    tagline: "Multi-source research with citations",
    description:
      "Breaks down a research question into sub-tasks, dispatches parallel research agents, synthesizes findings, and produces a structured report with citations and confidence scores.",
    category: "Research & Analysis",
    model: "@cf/moonshotai/kimi-k2.5",
    tags: ["research", "synthesis", "citations", "parallel"],
    difficulty: "intermediate",
    estimatedTime: "~60s",
    icon: "📚",
    useCases: [
      "Market research",
      "Competitive analysis",
      "Technical due diligence",
      "Literature reviews",
    ],
    steps: [
      {
        command: "remember topic: Cloudflare Workers vs AWS Lambda edge performance",
        description: "Store research topic in durable memory",
      },
      {
        command: "parallel 5 research sub-question about cold start latency benchmarks",
        description: "Spawn 5 parallel research agents",
      },
      {
        command: "analyze Consolidate all research findings into structured insights",
        description: "Synthesis pass across all agent outputs",
      },
      {
        command: "chat Format as executive summary with key findings and citations",
        description: "Generate final report",
      },
    ],
  },
  {
    id: "bug-hunter",
    name: "Bug Hunter",
    tagline: "Find and fix bugs automatically",
    description:
      "Systematically hunts for bugs by analyzing stack traces, reproducing conditions in isolated environments, generating fix candidates, and validating them without touching production.",
    category: "Code Intelligence",
    model: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
    tags: ["debugging", "code", "reasoning", "free"],
    difficulty: "intermediate",
    estimatedTime: "~45s",
    icon: "🐛",
    useCases: [
      "Production incident response",
      "Flaky test diagnosis",
      "Memory leak detection",
      "Race condition hunting",
    ],
    steps: [
      {
        command: "remember error: TypeError: Cannot read property 'id' of undefined at line 42",
        description: "Load error context",
      },
      {
        command: "analyze Trace all code paths that could produce a null/undefined object at line 42",
        description: "Root cause analysis",
      },
      {
        command: "parallel 3 generate fix candidates for the null reference bug",
        description: "Generate multiple fix options in parallel",
      },
      {
        command: "chat Rank the fix candidates by correctness and minimal diff, output the best one",
        description: "AI selects the best fix",
      },
    ],
  },
  {
    id: "data-pipeline",
    name: "Data Pipeline Agent",
    tagline: "Transform and analyze data at scale",
    description:
      "Ingests raw data (CSV, JSON, logs), validates schema, runs statistical analysis across parallel workers, detects anomalies, and outputs a clean transformed dataset with quality report.",
    category: "Data Processing",
    model: "@cf/meta/llama-4-scout-17b-16e-instruct",
    tags: ["data", "pipeline", "parallel", "free"],
    difficulty: "beginner",
    estimatedTime: "~40s",
    icon: "📊",
    useCases: [
      "ETL pipelines",
      "Log analysis",
      "Data quality checks",
      "Anomaly detection",
    ],
    steps: [
      {
        command: "remember schema: {userId: string, amount: number, timestamp: ISO8601, status: enum}",
        description: "Load data schema into agent memory",
      },
      {
        command: "parallel 4 validate and clean records batch",
        description: "Parallel validation across 4 isolates",
      },
      {
        command: "analyze Run statistical summary: mean, std, outliers, missing values",
        description: "Statistical analysis pass",
      },
      {
        command: "chat Generate data quality report and flag rows requiring manual review",
        description: "Generate final data quality report",
      },
    ],
  },
  {
    id: "parallel-comparator",
    name: "Multi-Model Comparator",
    tagline: "Same prompt, 5 models simultaneously",
    description:
      "Runs your prompt through 5 different Workers AI models in parallel V8 isolates, then compares outputs by accuracy, reasoning depth, and response style to find the best model for your use case.",
    category: "Parallel Agents",
    model: "@cf/meta/llama-4-scout-17b-16e-instruct",
    tags: ["parallel", "models", "comparison", "benchmarking"],
    difficulty: "advanced",
    estimatedTime: "~20s",
    icon: "⚡",
    useCases: [
      "Model selection for production",
      "Prompt quality testing",
      "Cost vs quality tradeoffs",
      "Regression testing after model updates",
    ],
    steps: [
      {
        command: "remember prompt: Explain quantum entanglement in simple terms",
        description: "Store prompt in durable memory",
      },
      {
        command: "parallel 5 run stored prompt across frontier models",
        description: "All 5 models respond simultaneously",
      },
      {
        command: "analyze Score each model response on clarity, accuracy, and conciseness",
        description: "Evaluation pass",
      },
      {
        command: "chat Rank models and recommend best for this type of explanation task",
        description: "Final recommendation",
      },
    ],
  },
  {
    id: "api-doc-generator",
    name: "API Documenter",
    tagline: "Auto-generate beautiful API docs",
    description:
      "Reads your OpenAPI spec or Express routes, generates comprehensive documentation with examples, describes edge cases, and outputs ready-to-publish MDX documentation.",
    category: "Content Generation",
    model: "@cf/qwen/qwen2.5-coder-32b-instruct",
    tags: ["docs", "api", "openapi", "code", "free"],
    difficulty: "beginner",
    estimatedTime: "~35s",
    icon: "📝",
    useCases: [
      "Developer portals",
      "Internal API wikis",
      "SDK documentation",
      "Changelog generation",
    ],
    steps: [
      {
        command: "remember spec: POST /sessions {name, model} → {id, status, createdAt}",
        description: "Load API endpoint spec",
      },
      {
        command: "analyze Generate documentation for all endpoints including error responses",
        description: "Documentation generation pass",
      },
      {
        command: "parallel 3 generate code examples in Python, JavaScript, and cURL",
        description: "Generate SDK examples in parallel",
      },
      {
        command: "chat Format as MDX with frontmatter, code blocks, and parameter tables",
        description: "Final MDX output",
      },
    ],
  },
  {
    id: "security-auditor",
    name: "Security Auditor",
    tagline: "OWASP-aligned vulnerability scanning",
    description:
      "Scans your codebase for OWASP Top 10 vulnerabilities, checks dependency CVEs, identifies authentication weaknesses, and generates a security report with severity ratings and remediation steps.",
    category: "Code Intelligence",
    model: "@cf/deepseek-ai/deepseek-r1-distill-llama-70b",
    tags: ["security", "owasp", "audit", "compliance"],
    difficulty: "advanced",
    estimatedTime: "~50s",
    icon: "🛡️",
    useCases: [
      "Pre-deployment security checks",
      "SOC2 compliance prep",
      "Penetration test support",
      "Dependency auditing",
    ],
    steps: [
      {
        command: "remember target: Node.js Express app with JWT auth and PostgreSQL",
        description: "Load audit target context",
      },
      {
        command: "parallel 5 scan for OWASP Top 10 category vulnerabilities",
        description: "5 parallel security scanners, one per OWASP category",
      },
      {
        command: "analyze Correlate findings and identify attack chains between vulnerabilities",
        description: "Attack chain analysis",
      },
      {
        command: "chat Generate CVSS-scored security report with remediation priorities",
        description: "Final security report with CVE scores",
      },
    ],
  },
  {
    id: "deploy-validator",
    name: "Deploy Validator",
    tagline: "Pre-flight checks before every deploy",
    description:
      "Runs a comprehensive pre-deploy checklist: env var validation, dependency audit, smoke tests against staging, bundle size analysis, and rollback plan generation. Blocks deploys that fail checks.",
    category: "DevOps & Deploy",
    model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    tags: ["devops", "ci", "deploy", "validation", "free"],
    difficulty: "intermediate",
    estimatedTime: "~25s",
    icon: "🚀",
    useCases: [
      "CI/CD gate checks",
      "Zero-downtime deployments",
      "Staging validation",
      "Rollback planning",
    ],
    steps: [
      {
        command: "remember target: wrangler deploy cloudflare-worker/ to production",
        description: "Load deploy target",
      },
      {
        command: "parallel 4 run pre-deploy checks: env vars, types, bundle size, migrations",
        description: "4 parallel pre-flight checks",
      },
      {
        command: "analyze Assess risk level of this deployment based on change diff",
        description: "Risk assessment",
      },
      {
        command: "chat Generate deploy runbook with rollback commands if checks pass",
        description: "Output go/no-go decision and runbook",
      },
    ],
  },
  {
    id: "content-factory",
    name: "Content Factory",
    tagline: "Scale content production with agents",
    description:
      "Takes a content brief and spawns specialized agents for research, outlining, drafting, SEO optimization, and editing — all running in parallel to produce publication-ready content at scale.",
    category: "Content Generation",
    model: "@cf/mistral/mistral-small-3.1-24b-instruct",
    tags: ["content", "seo", "writing", "parallel", "free"],
    difficulty: "beginner",
    estimatedTime: "~55s",
    icon: "✍️",
    useCases: [
      "Blog post generation",
      "Product descriptions",
      "Email campaigns",
      "Social media content",
    ],
    steps: [
      {
        command: "remember brief: 1500-word technical blog post about Cloudflare Durable Objects",
        description: "Store content brief",
      },
      {
        command: "parallel 3 research key topics: architecture, use cases, performance benchmarks",
        description: "3 parallel research agents",
      },
      {
        command: "analyze Create detailed outline with SEO-optimized H2/H3 structure",
        description: "Outline generation with SEO analysis",
      },
      {
        command: "chat Draft the full article following the outline, matching target word count",
        description: "Full article generation",
      },
    ],
  },
  {
    id: "log-analyzer",
    name: "Log Intelligence",
    tagline: "Turn logs into actionable insights",
    description:
      "Ingests application logs, identifies error patterns, correlates events across services, detects anomalies, and generates an incident timeline with root cause hypotheses ranked by probability.",
    category: "Data Processing",
    model: "@cf/google/gemma-3-27b-it",
    tags: ["logs", "observability", "monitoring", "free"],
    difficulty: "intermediate",
    estimatedTime: "~30s",
    icon: "🔬",
    useCases: [
      "Incident post-mortems",
      "SLA violation analysis",
      "Error rate investigation",
      "Performance regression hunting",
    ],
    steps: [
      {
        command: "remember logs: 500 nginx error logs from 2026-03-25T07:00-08:00 UTC",
        description: "Load log window into agent memory",
      },
      {
        command: "parallel 3 analyze logs by: error type, affected endpoint, client IP pattern",
        description: "3 parallel analysis angles",
      },
      {
        command: "analyze Build incident timeline correlating all anomalies found",
        description: "Timeline correlation pass",
      },
      {
        command: "chat Generate incident report with root cause hypotheses and confidence scores",
        description: "Incident report generation",
      },
    ],
  },
  {
    id: "test-generator",
    name: "Test Generator",
    tagline: "Auto-generate test suites from code",
    description:
      "Analyzes your source code, generates unit tests for all functions, integration tests for all routes, and edge case tests for complex logic. Outputs ready-to-run test files with >90% coverage targets.",
    category: "Code Intelligence",
    model: "@cf/qwen/qwq-32b",
    tags: ["testing", "tdd", "quality", "code", "free"],
    difficulty: "intermediate",
    estimatedTime: "~40s",
    icon: "🧪",
    useCases: [
      "Test coverage improvement",
      "TDD bootstrap",
      "Regression test generation",
      "API contract testing",
    ],
    steps: [
      {
        command: "remember source: Express session management API with 8 routes",
        description: "Load source code context",
      },
      {
        command: "parallel 4 generate tests for: CRUD routes, auth middleware, error handling, edge cases",
        description: "4 parallel test generation workers",
      },
      {
        command: "analyze Review generated tests for completeness and identify gaps",
        description: "Coverage analysis",
      },
      {
        command: "chat Output final test file with Jest configuration and coverage report",
        description: "Final test suite assembly",
      },
    ],
  },
  {
    id: "competitive-intel",
    name: "Competitive Intel Agent",
    tagline: "Automated competitive analysis",
    description:
      "Takes a list of competitors, spawns parallel research agents for each one, extracts pricing, features, weaknesses, and positioning, then synthesizes a battle card and SWOT analysis.",
    category: "Research & Analysis",
    model: "@cf/moonshotai/kimi-k2.5",
    tags: ["research", "competitive", "strategy", "parallel"],
    difficulty: "advanced",
    estimatedTime: "~70s",
    icon: "📡",
    useCases: [
      "Sales battle cards",
      "Product positioning",
      "Pricing strategy",
      "Feature gap analysis",
    ],
    steps: [
      {
        command: "remember competitors: Vercel AI SDK, LangChain, Modal Labs, Replicate",
        description: "Load competitor list",
      },
      {
        command: "parallel 4 research each competitor: pricing, features, weaknesses, positioning",
        description: "4 agents research each competitor simultaneously",
      },
      {
        command: "analyze Build comparison matrix across all competitors vs OpenClaw",
        description: "Competitive matrix analysis",
      },
      {
        command: "chat Generate battle card and SWOT analysis for sales team use",
        description: "Battle card generation",
      },
    ],
  },
];

export function getWorkflowById(id: string): AgenticWorkflow | undefined {
  return AGENTIC_WORKFLOWS.find((w) => w.id === id);
}

export function getWorkflowsByCategory(
  category: WorkflowCategory
): AgenticWorkflow[] {
  return AGENTIC_WORKFLOWS.filter((w) => w.category === category);
}

export const DIFFICULTY_COLORS = {
  beginner: "text-green-400 border-green-400/30 bg-green-400/10",
  intermediate: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  advanced: "text-red-400 border-red-400/30 bg-red-400/10",
} as const;

export const CATEGORY_ICONS: Record<WorkflowCategory, string> = {
  "Code Intelligence": "💻",
  "Research & Analysis": "🔬",
  "Data Processing": "📊",
  "Content Generation": "✍️",
  "Parallel Agents": "⚡",
  "DevOps & Deploy": "🚀",
};
