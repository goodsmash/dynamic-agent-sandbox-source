import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Link } from "wouter"
import {
  Terminal, Zap, Shield, Database, Network, BookOpen,
  Code2, ChevronRight, Copy, CheckCheck, Cpu, Globe,
  ArrowRight, Server, Package, Key, Play
} from "lucide-react"
import { useState } from "react"

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative rounded-xl border border-white/10 overflow-hidden my-4 group">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <span className="text-[10px] font-mono text-muted-foreground uppercase">{lang}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
        >
          {copied ? <CheckCheck className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="p-4 text-sm font-mono text-muted-foreground overflow-x-auto bg-black/40">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function Section({ id, title, icon: Icon, children }: {
  id: string; title: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20 mb-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function CommandRow({ cmd, desc, example }: { cmd: string; desc: string; example?: string }) {
  return (
    <div className="glass-panel rounded-xl p-4 border border-white/5 hover:border-primary/20 transition-colors group">
      <div className="flex items-start gap-4">
        <code className="text-primary font-mono text-sm bg-primary/10 px-3 py-1 rounded-lg shrink-0 group-hover:bg-primary/20 transition-colors">{cmd}</code>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground/80">{desc}</p>
          {example && <p className="text-xs font-mono text-muted-foreground mt-1 truncate">{example}</p>}
        </div>
      </div>
    </div>
  )
}

export default function Docs() {
  const navItems = [
    { id: "quickstart", label: "Quick Start", icon: Zap },
    { id: "terminal", label: "Terminal Commands", icon: Terminal },
    { id: "workflows", label: "Agentic Workflows", icon: Network },
    { id: "models", label: "Workers AI Models", icon: Cpu },
    { id: "memory", label: "Durable Memory", icon: Database },
    { id: "deploy", label: "Deploy to Cloudflare", icon: Globe },
    { id: "api", label: "REST API", icon: Code2 },
  ]

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex">
        {/* Left Nav */}
        <nav className="w-56 shrink-0 border-r border-white/5 overflow-y-auto p-4 hidden lg:block">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4 px-2">On this page</p>
          <div className="space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all group"
              >
                <Icon className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary transition-colors" />
                {label}
              </a>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-12">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-4">
                <BookOpen className="w-3 h-3" />
                DOCUMENTATION — v2.0.0
              </div>
              <h1 className="text-4xl font-bold mb-3">OpenClaw Platform Guide</h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Everything you need to run AI agents at the edge — from your first command to full Cloudflare production deployments.
              </p>
            </motion.div>

            {/* Quick Start */}
            <Section id="quickstart" title="Quick Start" icon={Zap}>
              <p className="text-muted-foreground leading-relaxed">
                OpenClaw provisions sandboxed AI agent environments in under 5ms using Cloudflare V8 isolates. Each session gets its own
                Durable Object with persistent SQLite memory and access to 100+ Workers AI models.
              </p>

              <div className="grid grid-cols-3 gap-4 my-6">
                {[
                  { step: "1", title: "Create a session", desc: "Click + in the sidebar or NEW_SESSION on the dashboard" },
                  { step: "2", title: "Choose a model", desc: "Pick from 100+ Workers AI models — defaults to Llama 4 Scout (free)" },
                  { step: "3", title: "Run commands", desc: "Type commands in the terminal — each task runs in a fresh V8 isolate" },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="glass-panel rounded-xl p-4 border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono text-sm font-bold mb-3">{step}</div>
                    <h4 className="font-semibold text-sm mb-1">{title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="glass-panel rounded-xl p-5 border border-primary/20 bg-primary/5">
                <p className="text-sm font-mono text-primary mb-2">▶ Try your first command</p>
                <p className="text-sm text-muted-foreground mb-3">After opening a session, type this in the terminal:</p>
                <CodeBlock code={`help                           # See all commands
chat Hello, what can you do?   # Start a conversation
parallel 3 analyze this data   # Spawn 3 agents at once
model @cf/qwen/qwen2.5-coder-32b-instruct  # Switch model`} lang="terminal" />
              </div>
            </Section>

            {/* Terminal Commands */}
            <Section id="terminal" title="Terminal Commands" icon={Terminal}>
              <p className="text-muted-foreground leading-relaxed">
                Every command runs via the terminal in your session. Commands execute in fresh V8 isolates (HTTP mode uses Express simulation).
                When you deploy to Cloudflare, commands hit real Durable Objects.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3 text-foreground/90">AI Execution</h3>
              <div className="space-y-2">
                <CommandRow cmd="chat <message>" desc="Multi-turn conversation with streaming token output. Maintains context via durable memory." example="chat Explain Durable Objects to me" />
                <CommandRow cmd="<any text>" desc="Send a task to the AI agent. Runs in a fresh V8 isolate with no network access." example="Summarize the pros and cons of edge computing" />
                <CommandRow cmd="parallel <N> <task>" desc="Spawn N isolates simultaneously. Results stream in as each worker completes." example="parallel 5 analyze a different aspect of this codebase" />
                <CommandRow cmd="model <@cf/author/name>" desc="Switch the AI model for this session. Persisted in durable memory." example="model @cf/moonshotai/kimi-k2.5" />
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-3 text-foreground/90">Memory & Context</h3>
              <div className="space-y-2">
                <CommandRow cmd="memory" desc="Display all files in the agent's persistent SQLite memory: skills, config, working notes." />
                <CommandRow cmd="remember <key>: <value>" desc="Write a key-value pair to durable memory. Persists across session restarts." example="remember context: We're building a REST API" />
                <CommandRow cmd="history" desc="Show last 25 isolate executions with timing and exit codes." />
                <CommandRow cmd="clear" desc="Clear the terminal display. Does not erase durable memory." />
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-3 text-foreground/90">Workflows</h3>
              <div className="space-y-2">
                <CommandRow cmd="workflow list" desc="List all available pre-built agentic workflow templates." />
                <CommandRow cmd="workflow run <id>" desc="Import and execute a workflow. Runs all steps in sequence with AI." example="workflow run code-reviewer" />
                <CommandRow cmd="workflow status" desc="Show progress of the currently running workflow." />
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-3 text-foreground/90">System</h3>
              <div className="space-y-2">
                <CommandRow cmd="models" desc="List all 100+ Workers AI models grouped by capability." />
                <CommandRow cmd="whoami" desc="Show agent identity: model, runtime, isolate config." />
                <CommandRow cmd="version" desc="Platform version, V8 engine, wrangler, and SDK info." />
                <CommandRow cmd="status" desc="Live CPU, memory, and active isolate count." />
                <CommandRow cmd="ps" desc="List active and queued isolates in this session." />
                <CommandRow cmd="ping" desc="Test connectivity (blocked by network policy in isolates by design)." />
              </div>

              <div className="glass-panel rounded-xl p-5 border border-accent/20 bg-accent/5 mt-6">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-accent mb-1">Network Isolation</p>
                    <p className="text-sm text-muted-foreground">All V8 isolates run with <code className="bg-white/10 px-1 rounded text-xs">globalOutbound: null</code>. No network calls from inside isolates by design — preventing data exfiltration from AI-generated code.</p>
                  </div>
                </div>
              </div>
            </Section>

            {/* Agentic Workflows */}
            <Section id="workflows" title="Agentic Workflows" icon={Network}>
              <p className="text-muted-foreground leading-relaxed">
                Workflows are pre-built multi-step agent programs. Each step runs in its own V8 isolate, with results fed forward into the next step's context via durable memory.
              </p>

              <div className="glass-panel rounded-xl p-5 border border-white/10 my-4">
                <p className="text-sm font-mono text-primary mb-3">How a workflow executes:</p>
                <div className="space-y-2">
                  {[
                    { n: "1", label: "Load context", desc: "Workflow stores task parameters in durable SQLite memory" },
                    { n: "2", label: "Parallel dispatch", desc: "Sub-tasks fan out across N fresh V8 isolates simultaneously" },
                    { n: "3", label: "Synthesis pass", desc: "Outputs collected, fed to an analysis isolate for correlation" },
                    { n: "4", label: "Final output", desc: "AI generates the final deliverable (report, code, data)" },
                  ].map(({ n, label, desc }) => (
                    <div key={n} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-mono text-primary shrink-0">{n}</span>
                      <span className="text-sm font-medium text-foreground/80 w-36 shrink-0">{label}</span>
                      <span className="text-sm text-muted-foreground">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <CodeBlock code={`# Run a pre-built workflow
workflow run code-reviewer

# Or run individual steps manually
remember context: Express API with JWT auth
parallel 3 scan for OWASP vulnerabilities
analyze Correlate all security findings
chat Generate remediation report ranked by severity`} lang="terminal" />

              <p className="text-sm text-muted-foreground">
                Browse all 12 available workflows in the{" "}
                <Link href="/workflows" className="text-primary hover:underline">Workflow Library →</Link>
              </p>
            </Section>

            {/* Models */}
            <Section id="models" title="Workers AI Models" icon={Cpu}>
              <p className="text-muted-foreground leading-relaxed">
                OpenClaw connects to Cloudflare Workers AI — 100+ models running on Cloudflare's GPU network worldwide.
                All models use the <code className="bg-white/10 px-1 rounded text-xs">@cf/</code> namespace.
              </p>

              <div className="grid grid-cols-2 gap-3 my-4">
                {[
                  { group: "Frontier", models: "Kimi K2.5 (256k), Llama 4 Scout (free, 131k), GPT-OSS 120B", color: "text-purple-400" },
                  { group: "Reasoning", models: "DeepSeek R1 32B (free), QwQ 32B (free), Llama 70B", color: "text-blue-400" },
                  { group: "Code", models: "Qwen2.5-Coder 32B (free), SQLCoder 7B (free)", color: "text-green-400" },
                  { group: "Production", models: "Llama 3.3 70B fast (free), Gemma 3 27B (free), Mistral Small", color: "text-yellow-400" },
                ].map(({ group, models, color }) => (
                  <div key={group} className="glass-panel rounded-xl p-4 border border-white/5">
                    <p className={`text-xs font-mono font-bold mb-1 ${color}`}>{group.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{models}</p>
                  </div>
                ))}
              </div>

              <CodeBlock code={`# Switch models in any session
model @cf/meta/llama-4-scout-17b-16e-instruct   # default, free, 131k ctx
model @cf/moonshotai/kimi-k2.5                   # frontier, 256k ctx
model @cf/qwen/qwen2.5-coder-32b-instruct        # code expert, free
model @cf/deepseek-ai/deepseek-r1-distill-qwen-32b  # reasoning, free

# See all models
models`} lang="terminal" />
            </Section>

            {/* Memory */}
            <Section id="memory" title="Durable Memory" icon={Database}>
              <p className="text-muted-foreground leading-relaxed">
                Each session has a Durable Object-backed SQLite database for persistent state. Memory survives agent restarts,
                isolate completions, and even Cloudflare Worker deployments.
              </p>

              <div className="glass-panel rounded-xl p-5 border border-white/10 my-4">
                <div className="space-y-3 font-mono text-sm">
                  <div>
                    <p className="text-primary text-xs mb-1">SKILLS (built-in capabilities)</p>
                    <p className="text-muted-foreground text-xs">code_execution • web_research • data_analysis • parallel_processing</p>
                  </div>
                  <div className="border-t border-white/5 pt-3">
                    <p className="text-accent text-xs mb-1">MEMORY (your working notes)</p>
                    <p className="text-muted-foreground text-xs">Free-form key-value store. Use <code className="bg-white/10 px-1 rounded">remember</code> to write.</p>
                  </div>
                  <div className="border-t border-white/5 pt-3">
                    <p className="text-yellow-400 text-xs mb-1">CONFIG (session config)</p>
                    <p className="text-muted-foreground text-xs">model • max_parallel_isolates: 50 • network: disabled</p>
                  </div>
                </div>
              </div>

              <CodeBlock code={`# Store context before a long workflow
remember project: Building a fintech API with Stripe
remember constraints: Must be PCI-compliant, no raw card data

# Recall what you stored
memory

# Memory persists across commands — agents can read it
chat Based on the project context in my memory, suggest an architecture`} lang="terminal" />
            </Section>

            {/* Deploy */}
            <Section id="deploy" title="Deploy to Cloudflare" icon={Globe}>
              <p className="text-muted-foreground leading-relaxed">
                The terminal sandbox runs in HTTP simulation mode by default. To use real V8 isolates, Durable Objects, and Workers AI,
                deploy the included <code className="bg-white/10 px-1 rounded text-xs">cloudflare-worker/</code> to your Cloudflare account.
              </p>

              <div className="glass-panel rounded-xl p-5 border border-white/10 my-4 space-y-4">
                {[
                  {
                    step: "1", title: "Prerequisites",
                    code: `# Install Wrangler CLI
npm install -g wrangler
wrangler login

# Or use the included package
cd cloudflare-worker && npm install`,
                    lang: "bash"
                  },
                  {
                    step: "2", title: "Create D1 Database",
                    code: `wrangler d1 create openclaw-db
# Copy the database_id into wrangler.jsonc
# Replace "your-d1-database-id-here" with the output above`,
                    lang: "bash"
                  },
                  {
                    step: "3", title: "Run Database Migration",
                    code: `wrangler d1 migrations apply openclaw-db --local
wrangler d1 migrations apply openclaw-db  # Production`,
                    lang: "bash"
                  },
                  {
                    step: "4", title: "Set Secrets (optional)",
                    code: `# Only needed if enabling Stripe billing
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET`,
                    lang: "bash"
                  },
                  {
                    step: "5", title: "Deploy",
                    code: `npm run deploy
# Output: https://openclaw.<your-account>.workers.dev
# Set VITE_CLOUDFLARE_WORKER_URL to this URL in Replit Secrets`,
                    lang: "bash"
                  },
                ].map(({ step, title, code, lang }) => (
                  <div key={step}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[11px] font-mono text-primary">{step}</span>
                      <h4 className="text-sm font-semibold">{title}</h4>
                    </div>
                    <CodeBlock code={code} lang={lang} />
                  </div>
                ))}
              </div>

              <div className="glass-panel rounded-xl p-5 border border-yellow-400/20 bg-yellow-400/5">
                <div className="flex gap-3">
                  <Key className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-400 mb-1">Connect the Frontend</p>
                    <p className="text-sm text-muted-foreground">After deploying, add your Worker URL as a Replit Secret: <code className="bg-white/10 px-1 rounded text-xs">VITE_CLOUDFLARE_WORKER_URL=https://openclaw.yourname.workers.dev</code>. The frontend will switch from HTTP simulation to real Durable Object WebSocket connections automatically.</p>
                  </div>
                </div>
              </div>
            </Section>

            {/* API Reference */}
            <Section id="api" title="REST API" icon={Code2}>
              <p className="text-muted-foreground leading-relaxed">
                The Express backend exposes a REST API for programmatic session management. All routes are prefixed with <code className="bg-white/10 px-1 rounded text-xs">/api</code>.
              </p>

              <div className="space-y-3 my-4">
                {[
                  { method: "GET", path: "/api/sessions", desc: "List all sessions" },
                  { method: "POST", path: "/api/sessions", desc: "Create new session — body: {name, model}" },
                  { method: "GET", path: "/api/sessions/:id", desc: "Get session details" },
                  { method: "DELETE", path: "/api/sessions/:id", desc: "Terminate a session" },
                  { method: "POST", path: "/api/sessions/:id/execute", desc: "Execute a command — body: {command}" },
                  { method: "GET", path: "/api/sessions/:id/history", desc: "Get command history" },
                  { method: "GET", path: "/api/sessions/:id/tasks", desc: "List background tasks" },
                  { method: "POST", path: "/api/sessions/:id/tasks", desc: "Spawn a background task" },
                ].map(({ method, path, desc }, i) => (
                  <div key={`${method}-${i}`} className="glass-panel rounded-xl p-3 border border-white/5 flex items-center gap-4">
                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded shrink-0 ${method === "GET" ? "text-green-400 bg-green-400/10" : method === "POST" ? "text-blue-400 bg-blue-400/10" : "text-red-400 bg-red-400/10"}`}>{method}</span>
                    <code className="text-sm font-mono text-foreground/80 w-64 shrink-0">{path}</code>
                    <span className="text-sm text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>

              <CodeBlock code={`# Create a new session
curl -X POST http://localhost:8080/api/sessions \\
  -H "Content-Type: application/json" \\
  -d '{"name": "my-agent", "model": "@cf/meta/llama-4-scout-17b-16e-instruct"}'

# Execute a command
curl -X POST http://localhost:8080/api/sessions/<id>/execute \\
  -H "Content-Type: application/json" \\
  -d '{"command": "chat What is the weather like?"}'`} lang="bash" />
            </Section>

            {/* Footer nav */}
            <div className="flex items-center justify-between pt-8 border-t border-white/5">
              <Link href="/">
                <Button variant="outline" className="font-mono text-sm">← Dashboard</Button>
              </Link>
              <Link href="/workflows">
                <Button className="font-mono text-sm">
                  Workflow Library <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
