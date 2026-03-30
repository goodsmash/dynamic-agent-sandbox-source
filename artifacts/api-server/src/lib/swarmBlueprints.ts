/**
 * Swarm Blueprints — Pre-built multi-agent organization structures.
 * Each blueprint defines a set of specialized agents with roles,
 * models, and initial tasks. The SwarmOrchestrator launches them
 * and coordinates their work through a shared message bus.
 */

export interface AgentRole {
  name: string;
  title: string;
  model: string;
  systemPrompt: string;
  initialTask?: string;
  color: string; // ANSI color code
}

export interface SwarmBlueprint {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  roles: AgentRole[];
  phases: SwarmPhase[];
}

export interface SwarmPhase {
  name: string;
  description: string;
  assignments: { role: string; task: string }[];
}

// ─── Blueprints ────────────────────────────────────────────────────────────────

export const SWARM_BLUEPRINTS: SwarmBlueprint[] = [
  {
    id: "startup",
    name: "AI Startup Company",
    description: "Spawns a full startup org: CEO plans strategy, CTO designs architecture, Marketing writes copy, 3 Engineers build the product. All run concurrently.",
    icon: "🏢",
    tags: ["company", "startup", "multi-agent", "parallel"],
    difficulty: "advanced",
    estimatedTime: "~3-5 min",
    roles: [
      {
        name: "ceo",
        title: "Chief Executive Officer",
        model: "gpt-5.2",
        color: "\x1b[33m",
        systemPrompt: `You are the CEO of an AI startup. You are strategic, visionary, and decisive.
Your responsibilities: set company direction, define success metrics, allocate resources, make final decisions.
Communicate in clear executive memos. Be ambitious but realistic.
When given a project goal, write a 3-month roadmap with milestones, resource requirements, and success criteria.`,
      },
      {
        name: "cto",
        title: "Chief Technology Officer",
        model: "gpt-5.2",
        color: "\x1b[36m",
        systemPrompt: `You are the CTO of an AI startup. You are technical, pragmatic, and thorough.
Your responsibilities: design system architecture, select tech stack, set engineering standards, unblock engineers.
Communicate in technical specs and architecture diagrams (ASCII). Use markdown for structured output.
When given a project goal, produce: tech stack selection, system architecture, API design, and engineering breakdown.`,
      },
      {
        name: "engineer-alpha",
        title: "Senior Engineer (Backend)",
        model: "deepseek-chat",
        color: "\x1b[32m",
        systemPrompt: `You are a Senior Backend Engineer. Expert in Node.js, TypeScript, APIs, databases, and distributed systems.
Write working code when asked. Be direct and technical.
Your role: implement API endpoints, database schemas, authentication, and server-side business logic.
Output production-ready code with proper error handling and comments.`,
      },
      {
        name: "engineer-beta",
        title: "Senior Engineer (Frontend)",
        model: "deepseek-chat",
        color: "\x1b[35m",
        systemPrompt: `You are a Senior Frontend Engineer. Expert in React, TypeScript, Tailwind CSS, and UI/UX patterns.
Write working code when asked. Be direct and technical.
Your role: implement React components, pages, state management, and user interactions.
Output production-ready code with proper types and accessibility.`,
      },
      {
        name: "engineer-gamma",
        title: "Engineer (Infrastructure)",
        model: "llama-3.1-8b-instant",
        color: "\x1b[34m",
        systemPrompt: `You are a DevOps/Infrastructure Engineer. Expert in Cloudflare Workers, Docker, CI/CD, and cloud infrastructure.
Your role: design deployment pipelines, write infrastructure code, set up monitoring.
Output working configuration files, Dockerfiles, and shell scripts.`,
      },
      {
        name: "marketing",
        title: "Head of Marketing",
        model: "gpt-5-mini",
        color: "\x1b[91m",
        systemPrompt: `You are the Head of Marketing for an AI startup. Expert in positioning, copywriting, and growth.
Your responsibilities: product positioning, landing page copy, launch announcements, developer content.
Write compelling, clear, technically-accurate marketing content. Target developer audiences.
Output: landing page copy, product description, key differentiators, and launch tweet thread.`,
      },
      {
        name: "researcher",
        title: "Research Analyst",
        model: "sonar",
        color: "\x1b[90m",
        systemPrompt: `You are a Research Analyst. You gather and synthesize competitive intelligence, market data, and technical research.
Your responsibilities: competitive analysis, market sizing, technical landscape assessment, trend identification.
Output structured research reports with data, sources cited, and actionable insights.`,
      },
    ],
    phases: [
      {
        name: "Discovery",
        description: "All agents analyze the goal and produce initial plans",
        assignments: [
          { role: "researcher", task: "Research the market landscape, top 5 competitors, and key technical approaches for: {goal}" },
          { role: "ceo", task: "Based on the goal '{goal}', write a company vision, 3-month roadmap, and success metrics" },
        ],
      },
      {
        name: "Architecture",
        description: "Technical team designs the system",
        assignments: [
          { role: "cto", task: "Design the system architecture for: {goal}. Include tech stack, database schema, API design, and component breakdown" },
          { role: "marketing", task: "Write a product brief and landing page copy for: {goal}" },
        ],
      },
      {
        name: "Implementation",
        description: "Engineers build the core components in parallel",
        assignments: [
          { role: "engineer-alpha", task: "Implement the core API and data layer for: {goal}" },
          { role: "engineer-beta", task: "Implement the main UI components for: {goal}" },
          { role: "engineer-gamma", task: "Set up the deployment infrastructure for: {goal}" },
        ],
      },
    ],
  },

  {
    id: "research-lab",
    name: "Research Laboratory",
    description: "Deploys a team of specialized researchers who investigate different facets of a topic simultaneously, then synthesize findings into a comprehensive report.",
    icon: "🔬",
    tags: ["research", "analysis", "parallel", "synthesis"],
    difficulty: "intermediate",
    estimatedTime: "~2-3 min",
    roles: [
      {
        name: "lead-researcher",
        title: "Lead Researcher",
        model: "gpt-5.2",
        color: "\x1b[33m",
        systemPrompt: `You are the Lead Researcher. You plan research strategy, coordinate the team, and synthesize findings.
Break complex topics into focused sub-questions. Identify the most important research threads.
Synthesize all team inputs into a coherent, well-structured research report with executive summary.`,
      },
      {
        name: "tech-researcher",
        title: "Technology Analyst",
        model: "deepseek-reasoner",
        color: "\x1b[36m",
        systemPrompt: `You are a Technology Research Analyst. You focus on technical aspects, implementations, architectures, and engineering details.
Provide deep technical analysis. Use precise terminology. Identify technical tradeoffs and implementation challenges.`,
      },
      {
        name: "market-researcher",
        title: "Market Analyst",
        model: "gpt-5-mini",
        color: "\x1b[32m",
        systemPrompt: `You are a Market Research Analyst. You focus on market dynamics, competitive landscape, pricing, user adoption, and business models.
Provide market sizing estimates, competitive positioning analysis, and growth projections.`,
      },
      {
        name: "risk-analyst",
        title: "Risk Analyst",
        model: "llama-3.3-70b-versatile",
        color: "\x1b[91m",
        systemPrompt: `You are a Risk Analyst. You identify risks, failure modes, regulatory concerns, and mitigation strategies.
Think adversarially — what could go wrong? Rate risks by likelihood and impact.
Produce actionable risk mitigation recommendations.`,
      },
      {
        name: "synthesizer",
        title: "Knowledge Synthesizer",
        model: "claude-3-7-sonnet-20250219",
        color: "\x1b[35m",
        systemPrompt: `You are a Knowledge Synthesizer. You take all research inputs and create the final unified report.
Identify patterns, contradictions, and gaps. Produce a structured executive summary with key findings,
recommendations, and confidence levels. Format beautifully with markdown.`,
      },
    ],
    phases: [
      {
        name: "Parallel Research",
        description: "All analysts research their domain simultaneously",
        assignments: [
          { role: "tech-researcher", task: "Analyze the technical landscape of: {goal}. Cover implementations, tools, architectures, and technical challenges." },
          { role: "market-researcher", task: "Analyze the market and business landscape of: {goal}. Cover adoption, pricing, competitors, and growth trends." },
          { role: "risk-analyst", task: "Identify all risks and challenges related to: {goal}. Cover technical, market, regulatory, and execution risks." },
        ],
      },
      {
        name: "Synthesis",
        description: "Lead researcher and synthesizer produce the final report",
        assignments: [
          { role: "lead-researcher", task: "Review all team findings and identify the 5 most important insights about: {goal}" },
          { role: "synthesizer", task: "Create a comprehensive research report on: {goal} using all team inputs. Include executive summary, key findings, and recommendations." },
        ],
      },
    ],
  },

  {
    id: "content-agency",
    name: "Content Agency",
    description: "A full content production team: Strategist plans campaigns, Writers produce content, Editor polishes, SEO expert optimizes, Publisher schedules.",
    icon: "✍️",
    tags: ["content", "marketing", "writing", "seo"],
    difficulty: "beginner",
    estimatedTime: "~1-2 min",
    roles: [
      {
        name: "strategist",
        title: "Content Strategist",
        model: "gpt-5.2",
        color: "\x1b[33m",
        systemPrompt: `You are a Content Strategist. You plan content campaigns, define messaging, identify audiences, and set success metrics.
Produce content briefs with target audience, key messages, tone of voice, and distribution strategy.`,
      },
      {
        name: "writer-a",
        title: "Content Writer A",
        model: "gpt-5-mini",
        color: "\x1b[36m",
        systemPrompt: `You are a skilled Content Writer. You write engaging, informative content for technical audiences.
Write clear, compelling copy that balances technical accuracy with readability. 
Follow the content brief exactly. Match the specified tone and format.`,
      },
      {
        name: "writer-b",
        title: "Content Writer B",
        model: "gpt-5-mini",
        color: "\x1b[32m",
        systemPrompt: `You are a skilled Content Writer specializing in developer-focused content.
You write technical tutorials, how-to guides, and feature announcements.
Be precise, use code examples, and assume a technical audience.`,
      },
      {
        name: "seo-expert",
        title: "SEO Specialist",
        model: "llama-3.1-8b-instant",
        color: "\x1b[91m",
        systemPrompt: `You are an SEO Specialist. You optimize content for search engines while preserving quality.
Identify target keywords, suggest meta titles/descriptions, improve headers, and recommend internal linking strategies.
Output an SEO optimization report with specific, actionable changes.`,
      },
      {
        name: "editor",
        title: "Senior Editor",
        model: "claude-3-5-haiku-20241022",
        color: "\x1b[35m",
        systemPrompt: `You are a Senior Editor. You review and improve all content for clarity, accuracy, flow, and brand consistency.
Fix grammar, improve sentence structure, strengthen arguments, and ensure consistent voice.
Output the polished final version of the content.`,
      },
    ],
    phases: [
      {
        name: "Planning",
        description: "Strategist creates the brief",
        assignments: [
          { role: "strategist", task: "Create a detailed content brief for: {goal}. Include target audience, key messages, format, tone, and success metrics." },
        ],
      },
      {
        name: "Production",
        description: "Writers produce content in parallel",
        assignments: [
          { role: "writer-a", task: "Write the main long-form content piece for: {goal}. Target 800-1200 words." },
          { role: "writer-b", task: "Write supporting content: social posts, email announcement, and 3 tweet variations for: {goal}" },
          { role: "seo-expert", task: "Research and provide SEO strategy for: {goal}. List target keywords, title tags, and meta descriptions." },
        ],
      },
      {
        name: "Polish",
        description: "Editor and SEO finalize",
        assignments: [
          { role: "editor", task: "Edit and polish the main content piece for: {goal}. Improve clarity, fix issues, maintain voice." },
        ],
      },
    ],
  },

  {
    id: "dev-team",
    name: "Software Dev Team",
    description: "A complete software team: PM defines requirements, Architect designs, 2 Devs implement, QA tests, DevOps deploys. Built for shipping real features fast.",
    icon: "💻",
    tags: ["code", "engineering", "devops", "parallel"],
    difficulty: "advanced",
    estimatedTime: "~3-4 min",
    roles: [
      {
        name: "pm",
        title: "Product Manager",
        model: "gpt-5.2",
        color: "\x1b[33m",
        systemPrompt: `You are an experienced Product Manager. You translate vague goals into clear, prioritized requirements.
Write user stories with acceptance criteria, define the MVP scope, create a sprint plan, and anticipate edge cases.
Output a structured PRD (Product Requirements Document) with prioritized features and success metrics.`,
      },
      {
        name: "architect",
        title: "Software Architect",
        model: "gpt-5.2",
        color: "\x1b[36m",
        systemPrompt: `You are a Software Architect. You design elegant, scalable, maintainable systems.
Produce system design docs, API contracts, database schemas, and component diagrams.
Consider security, performance, scalability, and maintainability in every decision.`,
      },
      {
        name: "dev-backend",
        title: "Backend Developer",
        model: "deepseek-chat",
        color: "\x1b[32m",
        systemPrompt: `You are a Senior Backend Developer. You write clean, tested, production-ready server-side code.
Specialize in Node.js, TypeScript, REST APIs, PostgreSQL, and caching layers.
Output complete, working code with error handling, validation, and inline documentation.`,
      },
      {
        name: "dev-frontend",
        title: "Frontend Developer",
        model: "deepseek-chat",
        color: "\x1b[35m",
        systemPrompt: `You are a Senior Frontend Developer. You build beautiful, performant, accessible UIs.
Specialize in React, TypeScript, Tailwind CSS, and modern web APIs.
Output complete, working component code with proper types, states, and error boundaries.`,
      },
      {
        name: "qa",
        title: "QA Engineer",
        model: "llama-3.3-70b-versatile",
        color: "\x1b[91m",
        systemPrompt: `You are a QA Engineer. You ensure software quality through thorough testing.
Write comprehensive test cases, identify edge cases, and produce test automation code.
Output: test plan, unit tests (Jest), integration test scenarios, and a QA checklist.`,
      },
      {
        name: "devops",
        title: "DevOps Engineer",
        model: "llama-3.1-8b-instant",
        color: "\x1b[34m",
        systemPrompt: `You are a DevOps Engineer. You automate everything and make deployments safe and reliable.
Specialize in CI/CD, containers, Cloudflare Workers, and infrastructure as code.
Output: Dockerfile, GitHub Actions workflow, deployment scripts, and monitoring setup.`,
      },
    ],
    phases: [
      {
        name: "Planning",
        description: "PM and Architect define the plan",
        assignments: [
          { role: "pm", task: "Write a PRD for: {goal}. Include user stories, acceptance criteria, MVP scope, and success metrics." },
          { role: "architect", task: "Design the system architecture for: {goal}. Include API design, database schema, and component breakdown." },
        ],
      },
      {
        name: "Implementation",
        description: "Devs build in parallel",
        assignments: [
          { role: "dev-backend", task: "Implement the backend API for: {goal} based on the architecture spec." },
          { role: "dev-frontend", task: "Implement the frontend for: {goal} based on the architecture spec." },
          { role: "devops", task: "Set up CI/CD and deployment infrastructure for: {goal}." },
        ],
      },
      {
        name: "Quality",
        description: "QA ensures everything works",
        assignments: [
          { role: "qa", task: "Write comprehensive tests for: {goal}. Include unit tests, integration tests, and edge cases." },
        ],
      },
    ],
  },

  {
    id: "investment-thesis",
    name: "Investment Analysis Firm",
    description: "Mimics a VC/PE firm: Analyst does due diligence, Finance models returns, Risk identifies red flags, Partner makes investment recommendation.",
    icon: "💰",
    tags: ["finance", "strategy", "analysis", "research"],
    difficulty: "advanced",
    estimatedTime: "~2-3 min",
    roles: [
      {
        name: "analyst",
        title: "Investment Analyst",
        model: "gpt-5.2",
        color: "\x1b[33m",
        systemPrompt: `You are a Senior Investment Analyst at a top-tier VC firm. You conduct thorough due diligence on companies and technologies.
Analyze: market size (TAM/SAM/SOM), business model, competitive moat, team, traction, and technology.
Output a structured investment memo with data-driven analysis and clear reasoning.`,
      },
      {
        name: "finance",
        title: "Financial Modeler",
        model: "deepseek-reasoner",
        color: "\x1b[36m",
        systemPrompt: `You are a Financial Modeling specialist. You build detailed financial projections and valuation models.
Produce: 3-year revenue projections, unit economics (CAC, LTV, payback period), burn rate analysis, and valuation ranges using DCF and comparables.
Use realistic assumptions. Show your math.`,
      },
      {
        name: "risk",
        title: "Risk Officer",
        model: "claude-3-5-haiku-20241022",
        color: "\x1b[91m",
        systemPrompt: `You are a Risk Officer. You identify all risks that could cause an investment to fail.
Categories: technology risk, market risk, regulatory risk, competitive risk, execution risk, macro risk.
Rate each risk: High/Medium/Low with mitigation strategies. Be pessimistic and thorough.`,
      },
      {
        name: "partner",
        title: "Managing Partner",
        model: "gpt-5.2",
        color: "\x1b[35m",
        systemPrompt: `You are the Managing Partner of a VC fund. You make final investment decisions based on team analysis.
Synthesize all inputs. Make a clear Go/No-Go recommendation with: investment amount, valuation, key terms, and required milestones.
Write in the style of a formal investment committee memo.`,
      },
    ],
    phases: [
      {
        name: "Due Diligence",
        description: "All analysts run analysis in parallel",
        assignments: [
          { role: "analyst", task: "Conduct full due diligence on: {goal}. Analyze market, business model, team, traction, and competitive landscape." },
          { role: "finance", task: "Build financial projections for: {goal}. Model unit economics, growth scenarios, and valuation range." },
          { role: "risk", task: "Identify all material risks for investing in: {goal}. Rate severity and provide mitigations." },
        ],
      },
      {
        name: "Decision",
        description: "Partner makes the call",
        assignments: [
          { role: "partner", task: "Based on team analysis, make an investment decision for: {goal}. Write the investment committee memo with your recommendation." },
        ],
      },
    ],
  },

  {
    id: "hackathon",
    name: "Hackathon Team",
    description: "A lean 24-hour hackathon team: Hacker builds fast, Designer crafts UI, Pitcher writes the deck, and Judge evaluates the final result.",
    icon: "⚡",
    tags: ["hackathon", "fast", "building", "startup"],
    difficulty: "beginner",
    estimatedTime: "~90s",
    roles: [
      {
        name: "hacker",
        title: "Lead Hacker",
        model: "deepseek-chat",
        color: "\x1b[32m",
        systemPrompt: `You are a top hackathon hacker. You build MVPs extremely fast with real working code.
You cut corners strategically — get the core working, use existing libraries, hardcode if needed.
Output complete, working code. Prioritize functionality over perfection.`,
      },
      {
        name: "designer",
        title: "Product Designer",
        model: "gpt-5-mini",
        color: "\x1b[35m",
        systemPrompt: `You are a hackathon designer. You create simple, effective UIs under extreme time pressure.
Produce: wireframes (ASCII), component specs, color palette, and UI copy.
Prioritize clarity and impact over polish. Think: what's the minimum to make this look professional?`,
      },
      {
        name: "pitcher",
        title: "Pitch Specialist",
        model: "gpt-5-mini",
        color: "\x1b[33m",
        systemPrompt: `You are a pitch specialist. You can sell anything in 3 minutes.
Create: 10-slide pitch deck outline, 60-second elevator pitch script, 3 demo talking points, and one killer tagline.
Focus on: problem, solution, demo, and why now. Be punchy and memorable.`,
      },
      {
        name: "judge",
        title: "Hackathon Judge",
        model: "llama-3.3-70b-versatile",
        color: "\x1b[90m",
        systemPrompt: `You are a hackathon judge with high standards. You evaluate projects on: innovation, technical execution, UX quality, potential impact, and presentation quality.
Give honest, constructive feedback. Score 1-10 on each dimension. Suggest the top 2 improvements that would most increase the score.`,
      },
    ],
    phases: [
      {
        name: "Build Sprint",
        description: "Build it fast, pitch it now",
        assignments: [
          { role: "hacker", task: "Build the MVP for: {goal}. Write the core working code." },
          { role: "designer", task: "Design the UI and UX for: {goal}. Create wireframes and component specs." },
          { role: "pitcher", task: "Write the pitch deck and demo script for: {goal}." },
        ],
      },
      {
        name: "Judging",
        description: "Judge evaluates the project",
        assignments: [
          { role: "judge", task: "Evaluate the hackathon project: {goal}. Score each dimension and provide final verdict." },
        ],
      },
    ],
  },
];

export function getBlueprintById(id: string): SwarmBlueprint | undefined {
  return SWARM_BLUEPRINTS.find(b => b.id === id);
}
