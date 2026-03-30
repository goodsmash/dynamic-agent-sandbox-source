import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { Terminal, Shield, Zap, Server, Network, ShieldCheck, BookOpen, Workflow, ArrowRight, Play, CheckCircle, XCircle, Loader2, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { Link, useLocation } from "wouter"
import { useCreateSession, useListSessions } from "@workspace/api-client-react"
import { useQuery } from "@tanstack/react-query"
import { AGENTIC_WORKFLOWS, CATEGORY_ICONS, DIFFICULTY_COLORS } from "@/lib/workflows"
import { DEFAULT_MODEL } from "@/lib/models"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/\/[^/]*$/, "") + "/api"

const FEATURED_WORKFLOWS = AGENTIC_WORKFLOWS.filter(w =>
  ["code-reviewer", "research-agent", "data-pipeline", "parallel-comparator", "deploy-validator", "security-auditor"].includes(w.id)
)

const AGENT_TYPE_COLORS: Record<string, string> = {
  openclaw: "text-green-400 border-green-500/30",
  nanoclaw: "text-cyan-400 border-cyan-500/30",
  nemoclaw: "text-purple-400 border-purple-500/30",
  swarmclaw: "text-orange-400 border-orange-500/30",
}
const AGENT_TYPE_LABELS: Record<string, string> = {
  openclaw: "Scout", nanoclaw: "Flash", nemoclaw: "Nexus", swarmclaw: "Swarm",
}

function StatusRing({ status, size = 40 }: { status: string; size?: number }) {
  const isActive = status === "active" || status === "initializing"
  const color = isActive ? "#22c55e" : "#6b7280"
  const r = (size - 4) / 2
  const circ = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={3} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: isActive ? `${circ * 0.85} ${circ * 0.15}` : `${circ * 0.3} ${circ * 0.7}` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {isActive && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </motion.div>
      )}
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [, setLocation] = useLocation()
  const { mutate: createSession, isPending } = useCreateSession()
  const { data: sessions } = useListSessions()
  const { data: usageTotals } = useQuery({
    queryKey: ["dash-usage"],
    queryFn: async () => { const r = await fetch(`${API_BASE}/usage/totals`); return r.json() },
    refetchInterval: 15000,
  })

  const handleImportWorkflow = (workflow: typeof AGENTIC_WORKFLOWS[0]) => {
    createSession(
      { data: { name: `${workflow.id}-${Date.now().toString(36)}`, model: workflow.model || DEFAULT_MODEL } },
      { onSuccess: (session) => setLocation(`/session/${session.id}?workflow=${workflow.id}`) }
    )
  }

  const recentSessions = (sessions as any[])?.slice(0, 8) ?? []
  const activeSessions = recentSessions.filter((s: any) => s.status === "active" || s.status === "initializing")
  const totalTasks = recentSessions.reduce((sum: number, s: any) => sum + (s.taskCount || 0), 0)

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Hero Section */}
        <div className="relative border-b border-white/5 bg-black/40 overflow-hidden">
          <div className="absolute inset-0 opacity-20 mix-blend-screen">
            <img
              src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
              alt="Cyber background"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

          <div className="relative z-10 max-w-5xl mx-auto px-8 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-blink"></span>
                SYSTEM_ONLINE — v2.0.0
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 text-white">
                Execute AI Workloads <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary terminal-glow">At the Edge</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed">
                Spin up secure, isolated environments for your AI agents instantly.
                Powered by durable memory, 100+ Workers AI models, and infinite parallel task execution.
              </p>

              <div className="flex items-center gap-4 flex-wrap">
                <Button
                  size="lg"
                  className="font-mono text-sm group"
                  onClick={() => window.dispatchEvent(new CustomEvent("openclaw:new-session"))}
                >
                  <Terminal className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                  NEW_SESSION
                </Button>
                <Link href="/workflows">
                  <Button size="lg" variant="outline" className="font-mono text-sm gap-2">
                    <Workflow className="w-4 h-4" />
                    WORKFLOW LIBRARY
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button size="lg" variant="ghost" className="font-mono text-sm gap-2 text-muted-foreground hover:text-foreground">
                    <BookOpen className="w-4 h-4" />
                    READ_DOCS
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Live Agent Grid */}
        {recentSessions.length > 0 && (
          <div className="border-b border-white/5 bg-black/20">
            <div className="max-w-6xl mx-auto px-8 py-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                  </motion.div>
                  <h2 className="text-sm font-mono font-semibold uppercase tracking-wider">Live Agent Grid</h2>
                  <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-white/5">
                    {activeSessions.length} active / {recentSessions.length} total
                  </span>
                </div>
                <div className="flex gap-3 text-[10px] font-mono text-muted-foreground">
                  <span>{totalTasks} tasks completed</span>
                  <span>{usageTotals?.total_calls ?? 0} API calls</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {recentSessions.map((s: any, i: number) => {
                  const agentType = s.agentType || "openclaw"
                  const colorClass = AGENT_TYPE_COLORS[agentType] || AGENT_TYPE_COLORS.openclaw
                  const label = AGENT_TYPE_LABELS[agentType] || "Scout"
                  const isActive = s.status === "active" || s.status === "initializing"
                  const successRate = s.taskCount > 0 ? Math.round(((s.taskCount - (s.failedTasks || 0)) / s.taskCount) * 100) : 100
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setLocation(`/session/${s.id}`)}
                      className={cn(
                        "glass-panel rounded-xl p-3 border cursor-pointer hover:border-primary/30 transition-all group",
                        isActive ? "border-green-500/20" : "border-white/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <StatusRing status={s.status} size={36} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono font-semibold truncate group-hover:text-primary transition-colors">{s.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={cn("text-[9px] font-mono px-1 py-0.5 rounded border", colorClass)}>{label}</span>
                            <span className="text-[9px] font-mono text-muted-foreground truncate">{s.model?.split('/').pop()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/5">
                        <div>
                          <p className="text-[8px] text-muted-foreground uppercase">Tasks</p>
                          <p className="text-[10px] font-mono font-semibold">{s.taskCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-muted-foreground uppercase">Success</p>
                          <p className={cn("text-[10px] font-mono font-semibold", successRate >= 90 ? "text-green-400" : successRate >= 50 ? "text-yellow-400" : "text-red-400")}>{successRate}%</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-muted-foreground uppercase">Last</p>
                          <p className="text-[10px] font-mono text-muted-foreground truncate">
                            {s.lastActiveAt ? formatDistanceToNow(new Date(s.lastActiveAt), { addSuffix: false }) : "—"}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="border-b border-white/5 bg-black/20">
          <div className="max-w-5xl mx-auto px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Workers AI Models", value: "100+", sub: "via @cf/ namespace", color: "text-primary" },
                { label: "Max Parallel Isolates", value: "50", sub: "per session", color: "text-blue-400" },
                { label: "Cold Start Latency", value: "<5ms", sub: "V8 isolates", color: "text-green-400" },
                { label: "Workflow Templates", value: "54", sub: "ready to import", color: "text-yellow-400" },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="glass-panel rounded-xl p-4 border border-white/5">
                  <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
                  <p className="text-xs font-medium text-foreground/80 mt-1">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Workflows */}
        <div className="max-w-5xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Workflow className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">Featured Workflows</h2>
                <p className="text-sm text-muted-foreground">Pre-built agentic programs — import and run in one click</p>
              </div>
            </div>
            <Link href="/workflows">
              <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5">
                View all 12 <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {FEATURED_WORKFLOWS.map((workflow, i) => (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass-panel rounded-xl border border-white/5 hover:border-primary/20 transition-all p-5 group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{workflow.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-bold group-hover:text-primary transition-colors">{workflow.name}</h3>
                      <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border", DIFFICULTY_COLORS[workflow.difficulty])}>
                        {workflow.difficulty}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{CATEGORY_ICONS[workflow.category]} {workflow.category}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">{workflow.description}</p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-mono text-[10px] flex-1 gap-1 h-7"
                    onClick={() => handleImportWorkflow(workflow)}
                    disabled={isPending}
                  >
                    <Play className="w-2.5 h-2.5" />
                    IMPORT & RUN
                  </Button>
                  <span className="text-[9px] font-mono text-muted-foreground/60">{workflow.estimatedTime}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Architecture Panel */}
        <div className="max-w-5xl mx-auto px-8 pb-12">
          <div className="flex items-center gap-3 mb-8">
            <Server className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-bold">Dynamic Worker Architecture</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              {
                icon: Zap,
                title: "Zero Cold Starts",
                sub: "Isolates provision in <5ms",
                desc: "V8 isolate architecture means agents spin up in under 5ms — no Docker overhead, no container warmup.",
                color: "text-primary border-primary/20 bg-primary/10",
              },
              {
                icon: ShieldCheck,
                title: "Durable Memory",
                sub: "State persists across invocations",
                desc: "SQLite-backed Durable Objects maintain agent context window and working memory across restarts.",
                color: "text-blue-400 border-blue-400/20 bg-blue-400/10",
              },
              {
                icon: Network,
                title: "Parallel Dispatch",
                sub: "Spawn 50 sub-tasks at once",
                desc: "Let agents fan out hundreds of parallel analysis tasks via the Dynamic Workers LOADER binding.",
                color: "text-accent border-accent/20 bg-accent/10",
              },
            ].map(({ icon: Icon, title, sub, desc, color }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-panel p-6 rounded-2xl hover-elevate group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{title}</h3>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground/80 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Deploy CTA */}
          <div className="glass-panel rounded-2xl border border-primary/10 bg-primary/5 p-8 flex items-center justify-between gap-8">
            <div>
              <h3 className="text-xl font-bold mb-2">Ready for Cloudflare Production?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                This sandbox runs in HTTP simulation mode. Deploy <code className="bg-white/10 px-1 rounded text-xs">cloudflare-worker/</code> to
                your Cloudflare account for real Durable Objects, Workers AI, and Dynamic Workers — all for free to start.
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Link href="/docs#deploy">
                <Button className="font-mono text-sm whitespace-nowrap gap-2">
                  Deploy Guide <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button variant="outline" className="font-mono text-sm whitespace-nowrap gap-2">
                  <BookOpen className="w-4 h-4" /> Full Docs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
