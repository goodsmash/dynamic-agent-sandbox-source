import { AppLayout } from "@/components/layout/AppLayout"
import { motion } from "framer-motion"
import { Users, Play, Zap, Building2, FlaskConical, Code2, DollarSign, Sparkles, ArrowRight, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCreateSession } from "@workspace/api-client-react"
import { useLocation } from "wouter"
import { DEFAULT_MODEL } from "@/lib/models"

const BLUEPRINTS = [
  {
    id: "startup",
    name: "AI Startup Company",
    icon: "🏢",
    description: "CEO + CTO + 3 Engineers + Marketing + Researcher all work in parallel phases to build your product.",
    agents: ["CEO", "CTO", "Backend Eng", "Frontend Eng", "DevOps", "Marketing", "Researcher"],
    difficulty: "advanced",
    time: "~3-5 min",
    example: "Build an AI-powered code review SaaS",
    color: "from-yellow-500/10 to-orange-500/10 border-yellow-500/20",
    accent: "text-yellow-400",
  },
  {
    id: "research-lab",
    name: "Research Laboratory",
    icon: "🔬",
    description: "Lead Researcher + Tech Analyst + Market Analyst + Risk Analyst + Synthesizer produce a comprehensive report.",
    agents: ["Lead Researcher", "Tech Analyst", "Market Analyst", "Risk Analyst", "Synthesizer"],
    difficulty: "intermediate",
    time: "~2-3 min",
    example: "Analyze the future of edge AI inference",
    color: "from-cyan-500/10 to-blue-500/10 border-cyan-500/20",
    accent: "text-cyan-400",
  },
  {
    id: "dev-team",
    name: "Software Dev Team",
    icon: "💻",
    description: "PM writes PRD, Architect designs, 2 Devs implement, QA tests, DevOps deploys. Ships real code.",
    agents: ["Product Manager", "Architect", "Backend Dev", "Frontend Dev", "QA Engineer", "DevOps"],
    difficulty: "advanced",
    time: "~3-4 min",
    example: "Build a JWT auth system with refresh tokens",
    color: "from-green-500/10 to-emerald-500/10 border-green-500/20",
    accent: "text-green-400",
  },
  {
    id: "content-agency",
    name: "Content Agency",
    icon: "✍️",
    description: "Strategist plans, 2 Writers produce, SEO optimizes, Editor polishes. Full content pipeline.",
    agents: ["Content Strategist", "Writer A", "Writer B", "SEO Expert", "Senior Editor"],
    difficulty: "beginner",
    time: "~1-2 min",
    example: "Create a developer blog post about Cloudflare Workers",
    color: "from-pink-500/10 to-rose-500/10 border-pink-500/20",
    accent: "text-pink-400",
  },
  {
    id: "investment-thesis",
    name: "Investment Analysis Firm",
    icon: "💰",
    description: "Analyst runs due diligence, Finance models returns, Risk flags red flags, Partner makes the call.",
    agents: ["Investment Analyst", "Financial Modeler", "Risk Officer", "Managing Partner"],
    difficulty: "advanced",
    time: "~2-3 min",
    example: "Analyze investing in an AI infrastructure company",
    color: "from-purple-500/10 to-violet-500/10 border-purple-500/20",
    accent: "text-purple-400",
  },
  {
    id: "hackathon",
    name: "Hackathon Team",
    icon: "⚡",
    description: "Lean team that ships fast: Hacker builds, Designer crafts UI, Pitcher writes the deck, Judge scores.",
    agents: ["Lead Hacker", "Product Designer", "Pitch Specialist", "Hackathon Judge"],
    difficulty: "beginner",
    time: "~90s",
    example: "Build an AI tool that summarizes Slack threads",
    color: "from-orange-500/10 to-red-500/10 border-orange-500/20",
    accent: "text-orange-400",
  },
];

const QUICK_COMMANDS = [
  { cmd: "autopilot Create a full SaaS product strategy", desc: "Fully autonomous — no human input needed" },
  { cmd: "delegate How do we optimize LLM inference costs?", desc: "3 specialists answer simultaneously" },
  { cmd: "project Design a real-time collaborative editor", desc: "Plans and executes step by step" },
  { cmd: "spawn researcher Latest trends in AI agent frameworks", desc: "Single specialist, immediate output" },
  { cmd: "spawn ceo Go-to-market strategy for a developer tool", desc: "CEO persona, strategic thinking" },
  { cmd: "spawn engineer Build a WebSocket server in TypeScript", desc: "Senior engineer writes real code" },
];

const DIFF_COLOR: Record<string, string> = {
  beginner: "text-green-400 border-green-400/30 bg-green-400/10",
  intermediate: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  advanced: "text-red-400 border-red-400/30 bg-red-400/10",
};

export default function Swarm() {
  const [, navigate] = useLocation()
  const { mutate: createSession, isPending } = useCreateSession()

  const launchBlueprint = (blueprintId: string, example: string) => {
    const name = `swarm-${blueprintId}-${Date.now().toString(36)}`
    createSession(
      { data: { name, model: DEFAULT_MODEL, agentType: "swarmclaw" } as any },
      {
        onSuccess: (session) => {
          navigate(`/session/${session.id}?swarm=${blueprintId}&goal=${encodeURIComponent(example)}`)
        },
      }
    )
  }

  const launchAutopilot = (goal: string) => {
    const name = `autopilot-${Date.now().toString(36)}`
    createSession(
      { data: { name, model: DEFAULT_MODEL, agentType: "swarmclaw" } as any },
      { onSuccess: (session) => navigate(`/session/${session.id}?autopilot=${encodeURIComponent(goal)}`) }
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-white/5 bg-black/30 px-8 py-6">
          <div className="flex items-center gap-3 mb-1">
            <Users className="w-5 h-5 text-yellow-400" />
            <h1 className="text-xl font-bold font-mono tracking-tight">SWARM ORCHESTRATOR</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">AUTONOMOUS</span>
          </div>
          <p className="text-sm text-muted-foreground">Spawn entire companies of AI agents — they plan, collaborate, and build in parallel phases</p>
        </div>

        <div className="max-w-5xl mx-auto px-8 py-8 space-y-10">
          {/* How it works */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Building2, label: "Pick a Blueprint", desc: "Choose a pre-built org: startup, research lab, dev team, or more", color: "text-yellow-400" },
              { icon: Zap, label: "Set Your Goal", desc: "Describe what you want built, researched, or created in plain English", color: "text-cyan-400" },
              { icon: Sparkles, label: "Watch the Swarm", desc: "All agents run in parallel — real AI calls, real output, full collaboration", color: "text-purple-400" },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="bg-card border border-white/8 rounded-xl p-4 text-center">
                <Icon className={`w-6 h-6 mx-auto mb-3 ${color}`} />
                <p className="text-xs font-mono font-semibold text-foreground mb-1">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          {/* Company Blueprints */}
          <div>
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-yellow-400" />
              Company Blueprints
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BLUEPRINTS.map((bp, i) => (
                <motion.div
                  key={bp.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-gradient-to-br ${bp.color} border rounded-xl p-5 flex flex-col gap-4`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{bp.icon}</span>
                      <div>
                        <h3 className="text-sm font-bold font-mono text-foreground">{bp.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${DIFF_COLOR[bp.difficulty]}`}>
                            {bp.difficulty.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">{bp.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">{bp.description}</p>

                  <div className="flex flex-wrap gap-1">
                    {bp.agents.map(a => (
                      <span key={a} className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 ${bp.accent}`}>{a}</span>
                    ))}
                  </div>

                  <div className="bg-black/30 rounded-lg p-2">
                    <p className="text-[10px] font-mono text-muted-foreground mb-1">Example goal:</p>
                    <p className="text-xs font-mono text-foreground">{bp.example}</p>
                  </div>

                  <Button
                    size="sm"
                    className="w-full"
                    disabled={isPending}
                    onClick={() => launchBlueprint(bp.id, bp.example)}
                  >
                    <Play className="w-3.5 h-3.5 mr-2" />
                    Launch {bp.name}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Commands */}
          <div>
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Quick Agent Commands
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {QUICK_COMMANDS.map(({ cmd, desc }) => (
                <div
                  key={cmd}
                  className="bg-card border border-white/8 rounded-lg p-4 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all group"
                  onClick={() => launchAutopilot(cmd)}
                >
                  <div className="flex items-start gap-3">
                    <code className="text-xs font-mono text-primary flex-1 leading-relaxed">{cmd}</code>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Autonomous Modes */}
          <div className="bg-gradient-to-r from-primary/5 to-yellow-500/5 border border-primary/20 rounded-xl p-6">
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Autonomous Execution Modes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  label: "autopilot <goal>",
                  desc: "Fully autonomous. The AI plans its own execution phases, assigns roles, and runs everything without human input.",
                  color: "text-primary",
                },
                {
                  label: "project <goal>",
                  desc: "Step-by-step project execution. AI breaks the goal into phases and executes each with specialized expertise.",
                  color: "text-cyan-400",
                },
                {
                  label: "delegate <task>",
                  desc: "Instantly fans out to 3 specialists in parallel: Strategic Analyst + Technical Expert + Critical Reviewer.",
                  color: "text-purple-400",
                },
              ].map(({ label, desc, color }) => (
                <div key={label} className="bg-black/30 rounded-lg p-4">
                  <code className={`text-xs font-mono font-bold ${color}`}>{label}</code>
                  <p className="text-xs text-muted-foreground mt-2">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal tip */}
          <div className="bg-black/40 border border-white/8 rounded-xl p-5">
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-muted-foreground" />
              Inside the Swarm Terminal
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              In any Swarm session, each agent streams its output in real-time with color-coded role prefixes.
              Phases run sequentially — earlier phase outputs become shared context for later phases.
            </p>
            <div className="font-mono text-xs space-y-1 bg-black/60 rounded-lg p-4">
              <div className="text-yellow-400">orchestrator@swarm:~$ swarm launch startup Build an AI note-taking app</div>
              <div className="text-muted-foreground">┌─ SWARM ACTIVATED: 🏢 AI STARTUP COMPANY ─────────────</div>
              <div className="text-muted-foreground">── PHASE 1: DISCOVERY ─────────────────────────────────</div>
              <div className="text-muted-foreground">[Research Analyst] → Analyzing market landscape...</div>
              <div className="text-muted-foreground">[Chief Executive Officer] → Writing company vision...</div>
              <div className="text-primary/70">The note-taking app market is currently dominated by Notion...</div>
              <div className="text-yellow-400/70">Our vision is to build the first AI-native note-taking tool...</div>
              <div className="text-green-400">✓ Phase "Discovery" complete — 18.3s · ~2,400 tokens</div>
              <div className="text-muted-foreground">── PHASE 2: ARCHITECTURE ──────────────────────────────</div>
              <div className="text-muted-foreground">[Chief Technology Officer] → Designing system architecture...</div>
              <div className="text-cyan-400/70">Tech Stack: Next.js 15, Cloudflare Workers, D1, Workers AI...</div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
