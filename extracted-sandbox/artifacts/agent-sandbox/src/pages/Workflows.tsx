import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Link, useLocation } from "wouter"
import { useState, useEffect } from "react"
import {
  Workflow, Search, Play, ChevronRight, Clock, Cpu,
  Star, ArrowRight, Filter, Zap, Code2, Globe, BookOpen
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreateSession } from "@workspace/api-client-react"
import {
  AGENTIC_WORKFLOWS, WORKFLOW_CATEGORIES, CATEGORY_ICONS,
  DIFFICULTY_COLORS, type WorkflowCategory, type AgenticWorkflow
} from "@/lib/workflows"
import { DEFAULT_MODEL } from "@/lib/models"

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "")

function WorkflowCard({ workflow, onImport, importing }: {
  workflow: AgenticWorkflow
  onImport: () => void
  importing: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl border border-white/5 hover:border-primary/20 transition-all duration-300 overflow-hidden group"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl shrink-0">{workflow.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-base group-hover:text-primary transition-colors">{workflow.name}</h3>
              <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-full border", DIFFICULTY_COLORS[workflow.difficulty])}>
                {workflow.difficulty}
              </span>
              {workflow.tags.includes("free") && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border text-green-400 border-green-400/30 bg-green-400/10">free</span>
              )}
            </div>
            <p className="text-xs text-primary/80 font-mono">{workflow.tagline}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{workflow.description}</p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {workflow.estimatedTime}
          </span>
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3" />
            {workflow.steps.length} steps
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-primary" />
            {workflow.steps.filter(s => s.command.startsWith("parallel")).length} parallel stages
          </span>
        </div>

        {/* Model */}
        <div className="text-[10px] font-mono text-muted-foreground/60 mb-4 truncate">
          model: {workflow.model}
        </div>

        {/* Steps preview */}
        <div className={cn("overflow-hidden transition-all duration-300", expanded ? "max-h-[500px]" : "max-h-0")}>
          <div className="border-t border-white/5 pt-4 mb-4">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Execution Steps</p>
            <div className="space-y-2">
              {workflow.steps.map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5">{i + 1}</span>
                  <div>
                    <code className="text-[11px] text-primary/80 font-mono block mb-0.5">{step.command}</code>
                    <p className="text-[11px] text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Use Cases</p>
              <div className="flex flex-wrap gap-1.5">
                {workflow.useCases.map(uc => (
                  <span key={uc} className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-muted-foreground">{uc}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onImport}
            disabled={importing}
            className="font-mono text-xs flex-1 gap-1.5"
          >
            <Play className="w-3 h-3" />
            {importing ? "IMPORTING..." : "IMPORT & RUN"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="font-mono text-xs px-3"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Hide" : "Steps"}
            <ChevronRight className={cn("w-3 h-3 ml-1 transition-transform", expanded && "rotate-90")} />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default function Workflows() {
  const [, setLocation] = useLocation()
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<WorkflowCategory | "All">("All")
  const [importingId, setImportingId] = useState<string | null>(null)
  const [allWorkflows, setAllWorkflows] = useState<AgenticWorkflow[]>(AGENTIC_WORKFLOWS)
  const [allCategories, setAllCategories] = useState<(WorkflowCategory | "All")[]>(["All", ...WORKFLOW_CATEGORIES])
  const { mutate: createSession } = useCreateSession()

  useEffect(() => {
    fetch(`${API_BASE}/api/workflows`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.workflows?.length) {
          setAllWorkflows(data.workflows)
          const cats: (WorkflowCategory | "All")[] = ["All", ...(data.categories || WORKFLOW_CATEGORIES)]
          setAllCategories(cats)
        }
      })
      .catch(() => {})
  }, [])

  const filtered = allWorkflows.filter(w => {
    const matchSearch = search === "" ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.description.toLowerCase().includes(search.toLowerCase()) ||
      w.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchCategory = activeCategory === "All" || w.category === activeCategory
    return matchSearch && matchCategory
  })

  const handleImport = (workflow: AgenticWorkflow) => {
    setImportingId(workflow.id)
    const sessionName = `${workflow.id}-${Date.now().toString(36)}`
    createSession(
      { data: { name: sessionName, model: workflow.model || DEFAULT_MODEL } },
      {
        onSuccess: (session) => {
          setImportingId(null)
          setLocation(`/session/${session.id}?workflow=${workflow.id}`)
        },
        onError: () => setImportingId(null),
      }
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="border-b border-white/5 bg-black/20">
          <div className="max-w-6xl mx-auto px-8 py-12">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-4">
                <Zap className="w-3 h-3" />
                {allWorkflows.length} WORKFLOWS READY
              </div>
              <h1 className="text-4xl font-bold mb-3">
                Agentic Workflow Library
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed mb-6">
                Pre-built multi-step AI agent programs. Each workflow fans out across parallel V8 isolates,
                persists state in Durable Objects, and produces a structured deliverable.
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search workflows..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-mono focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all w-72"
                  />
                </div>
                <Link href="/docs#workflows">
                  <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5">
                    <BookOpen className="w-3 h-3" />
                    Workflow Guide
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-8">
          {/* Category Filters */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <button
              onClick={() => setActiveCategory("All")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono border transition-all shrink-0",
                activeCategory === "All"
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
              )}
            >
              All ({allWorkflows.length})
            </button>
            {allCategories.filter(c => c !== "All").map(cat => {
              const count = allWorkflows.filter(w => w.category === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat as WorkflowCategory)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-mono border transition-all shrink-0 flex items-center gap-1.5",
                    activeCategory === cat
                      ? "bg-primary/20 border-primary/40 text-primary"
                      : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                  )}
                >
                  <span>{CATEGORY_ICONS[cat as WorkflowCategory] ?? "🔧"}</span>
                  {cat} ({count})
                </button>
              )
            })}
          </div>

          {/* Results count */}
          <p className="text-xs font-mono text-muted-foreground mb-6">
            {filtered.length} workflow{filtered.length !== 1 ? "s" : ""}
            {activeCategory !== "All" && ` in ${activeCategory}`}
            {search && ` matching "${search}"`}
          </p>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Workflow className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-mono text-sm">No workflows found for "{search}"</p>
              <button onClick={() => { setSearch(""); setActiveCategory("All") }} className="text-xs text-primary hover:underline mt-2">Clear filters</button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(workflow => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  importing={importingId === workflow.id}
                  onImport={() => handleImport(workflow)}
                />
              ))}
            </div>
          )}

          {/* How it works */}
          <div className="mt-16 glass-panel rounded-2xl border border-white/10 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">How Workflows Execute</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: "📥", title: "Import", desc: "Clicking 'Import & Run' creates a dedicated session pre-loaded with the workflow's model and parameters" },
                { icon: "🧠", title: "Context Load", desc: "Step 1 always stores the task context in durable SQLite memory so all subsequent isolates can access it" },
                { icon: "⚡", title: "Parallel Dispatch", desc: "Middle steps fan out across N fresh V8 isolates simultaneously — zero cold-start overhead" },
                { icon: "📄", title: "Synthesis", desc: "Final step collects all outputs and the AI generates the deliverable: report, code file, or structured data" },
              ].map(({ icon, title, desc }) => (
                <div key={title}>
                  <div className="text-2xl mb-2">{icon}</div>
                  <h4 className="font-semibold text-sm mb-1">{title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Want to build your own? Run steps manually in any terminal session.{" "}
                <Link href="/docs#workflows" className="text-primary hover:underline">See the guide →</Link>
              </p>
              <Link href="/docs">
                <Button variant="outline" size="sm" className="font-mono text-xs">
                  Full Documentation <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
