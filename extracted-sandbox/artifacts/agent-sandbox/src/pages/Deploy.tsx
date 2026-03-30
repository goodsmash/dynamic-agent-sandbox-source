import { AppLayout } from "@/components/layout/AppLayout"
import { motion } from "framer-motion"
import { Cloud, Copy, CheckCheck, Server, Zap, Database, Shield, DollarSign, Terminal, ChevronRight, Globe, ArrowRight, ExternalLink, Cpu, Layers } from "lucide-react"
import { useState } from "react"

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative group rounded-lg bg-black/60 border border-white/8 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/2">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{lang}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
        >
          {copied ? <CheckCheck className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 text-xs text-foreground/90 overflow-x-auto leading-relaxed font-mono whitespace-pre">{code}</pre>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: n * 0.05 }}
      className="flex gap-5"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary text-sm font-bold font-mono">
        {n}
      </div>
      <div className="flex-1 space-y-3 pb-8">
        <h3 className="text-sm font-semibold font-mono text-foreground pt-1">{title}</h3>
        {children}
      </div>
    </motion.div>
  )
}

export default function Deploy() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-white/5 bg-black/30 px-8 py-6">
          <div className="flex items-center gap-3 mb-1">
            <Cloud className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold font-mono tracking-tight">CLOUDFLARE DEPLOY</h1>
          </div>
          <p className="text-sm text-muted-foreground">One-click production deployment — Workers + Durable Objects + D1 + Workers AI</p>
        </div>

        <div className="max-w-3xl mx-auto px-8 py-8 space-y-10">
          {/* Architecture overview */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: Server, label: "Workers", desc: "HTTP + WebSocket router", color: "text-orange-400" },
              { icon: Zap, label: "Durable Objects", desc: "Persistent agent memory", color: "text-cyan-400" },
              { icon: Database, label: "D1 SQLite", desc: "Users + billing", color: "text-blue-400" },
              { icon: Shield, label: "Workers AI", desc: "100+ models, no keys", color: "text-green-400" },
              { icon: Globe, label: "Edge Network", desc: "300+ PoPs worldwide", color: "text-purple-400" },
              { icon: DollarSign, label: "Stripe Billing", desc: "Free → Pro upgrades", color: "text-yellow-400" },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="bg-card border border-white/8 rounded-xl p-4 flex items-start gap-3">
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
                <div>
                  <p className="text-xs font-mono font-semibold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Prerequisites */}
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-5">
            <h2 className="text-xs font-mono font-semibold text-yellow-400 uppercase tracking-wider mb-3">Prerequisites</h2>
            <ul className="text-xs font-mono text-muted-foreground space-y-1">
              <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-yellow-400" /> Node.js 20+ installed</li>
              <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-yellow-400" /> Cloudflare account — <a href="https://cloudflare.com" target="_blank" rel="noreferrer" className="text-primary underline">cloudflare.com</a> (free tier works)</li>
              <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-yellow-400" /> Stripe account (optional) — <a href="https://stripe.com" target="_blank" rel="noreferrer" className="text-primary underline">stripe.com</a></li>
            </ul>
          </div>

          {/* Step-by-step */}
          <div className="relative">
            <div className="absolute left-4 top-8 bottom-0 w-px bg-white/5" />
            <div className="space-y-0">

              <Step n={1} title="Install Wrangler CLI & Dependencies">
                <CodeBlock code={`cd cloudflare-worker
npm install
npx wrangler login`} />
                <p className="text-xs text-muted-foreground">Opens a browser window — log in with your Cloudflare account. Takes 30 seconds.</p>
              </Step>

              <Step n={2} title="Create the D1 Database">
                <CodeBlock code={`npx wrangler d1 create openclaw_users`} />
                <p className="text-xs text-muted-foreground">Copy the <code className="text-primary">database_id</code> from the output and paste into <code className="text-foreground">wrangler.jsonc</code>:</p>
                <CodeBlock lang="jsonc" code={`"d1_databases": [
  {
    "binding": "DB",
    "database_name": "openclaw_users",
    "database_id": "PASTE_YOUR_ID_HERE"
  }
]`} />
              </Step>

              <Step n={3} title="Run Database Migrations">
                <CodeBlock code={`npm run d1:migrate`} />
                <p className="text-xs text-muted-foreground">Creates the <code className="text-primary">users</code> and <code className="text-primary">agent_sessions</code> tables in D1.</p>
              </Step>

              <Step n={4} title="Configure Worker Secrets">
                <p className="text-xs text-muted-foreground">Set required secrets. Only Stripe is truly optional (for billing):</p>
                <CodeBlock code={`# Required for Workers AI (already bound via wrangler.jsonc — no action needed)
# Optional: Stripe billing
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put STRIPE_PRO_PRICE_ID`} />
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-[10px] font-mono text-primary">Workers AI models work automatically via the <code>AI</code> binding in wrangler.jsonc — no API key needed for 100+ Cloudflare models.</p>
                </div>
              </Step>

              <Step n={5} title="Deploy to Production">
                <CodeBlock code={`npm run deploy
# or: npx wrangler deploy`} />
                <p className="text-xs text-muted-foreground">Deploys in ~15 seconds. You'll get a URL like <code className="text-primary">https://openclaw-platform.YOUR_ACCOUNT.workers.dev</code></p>
              </Step>

              <Step n={6} title="Connect the Frontend">
                <p className="text-xs text-muted-foreground">Update the frontend to point to your Cloudflare Worker instead of the local dev server:</p>
                <CodeBlock lang="typescript" code={`// In artifacts/agent-sandbox/src/lib/config.ts
// Switch to Cloudflare Worker URL when ready:
export const CF_WORKER_URL = "https://openclaw-platform.YOUR_ACCOUNT.workers.dev"

// WebSocket connections to agents use:
// wss://openclaw-platform.YOUR_ACCOUNT.workers.dev/agents/OpenClawAgent/:sessionId`} />
              </Step>

              <Step n={7} title="Verify Deployment">
                <CodeBlock code={`# Check health
curl https://openclaw-platform.YOUR_ACCOUNT.workers.dev/api/health

# List available AI models
curl https://openclaw-platform.YOUR_ACCOUNT.workers.dev/api/models

# Connect a WebSocket agent
wscat -c "wss://openclaw-platform.YOUR_ACCOUNT.workers.dev/agents/OpenClawAgent/test-session"`} />
              </Step>

            </div>
          </div>

          {/* What each agent type becomes on Cloudflare */}
          <div className="bg-card border border-white/8 rounded-xl p-6">
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              Agent Types on Cloudflare Workers
            </h2>
            <div className="space-y-3">
              {[
                {
                  name: "Scout (OpenClawAgent)",
                  cls: "OpenClawAgent",
                  desc: "Full-featured agent with persistent SQLite memory, parallel V8 isolates, and 20 concurrent sub-agents.",
                  ws: "/agents/OpenClawAgent/:sessionId",
                  color: "text-primary border-primary/30 bg-primary/5",
                },
                {
                  name: "Flash (NanoClawAgent)",
                  cls: "NanoClawAgent",
                  desc: "Ultra-fast lightweight agent optimized for speed, 10 parallel isolates, 1024 token ceiling per call.",
                  ws: "/agents/NanoClawAgent/:sessionId",
                  color: "text-cyan-400 border-cyan-400/30 bg-cyan-400/5",
                },
                {
                  name: "Nexus (NemoClawAgent)",
                  cls: "NemoClawAgent",
                  desc: "Deep reasoning agent with 16K token budget, 5 parallel isolates, optimized for complex multi-step analysis.",
                  ws: "/agents/NemoClawAgent/:sessionId",
                  color: "text-purple-400 border-purple-400/30 bg-purple-400/5",
                },
              ].map(a => (
                <div key={a.cls} className={`border rounded-lg p-4 ${a.color}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-mono font-bold">{a.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{a.desc}</p>
                    </div>
                    <code className="text-[9px] font-mono text-muted-foreground whitespace-nowrap">{a.ws}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Billing on CF */}
          <div className="bg-card border border-white/8 rounded-xl p-6">
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              Cloudflare Cost Estimate
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { tier: "Workers Free", detail: "100K req/day, 10ms CPU", cost: "$0/month" },
                { tier: "Workers Paid", detail: "Unlimited requests", cost: "$5/month" },
                { tier: "Durable Objects", detail: "Free up to 1B requests/month", cost: "~$0.15/M req" },
                { tier: "D1 SQLite", detail: "Free up to 5M rows", cost: "$0.75/M reads" },
                { tier: "Workers AI", detail: "Free 10K neurons/day", cost: "$0.011/1K neurons" },
                { tier: "Total (light use)", detail: "100 users, 50 agents", cost: "~$5–15/month" },
              ].map(({ tier, detail, cost }) => (
                <div key={tier} className="bg-black/40 rounded-lg p-3">
                  <p className="text-xs font-mono font-semibold text-foreground">{tier}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{detail}</p>
                  <p className="text-xs text-primary font-mono mt-2 font-bold">{cost}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Auto-setup tips */}
          <div className="bg-gradient-to-r from-primary/5 to-cyan-500/5 border border-primary/20 rounded-xl p-6">
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Automatic User Setup
            </h2>
            <p className="text-xs text-muted-foreground font-mono mb-4">
              When a new user hits your deployed Worker, they're automatically registered and provisioned:
            </p>
            <div className="space-y-2">
              {[
                "POST /api/users/register → Auto-creates user with free plan (1 agent)",
                "POST /api/sessions → Spawns first agent, assigns stable DO instance ID",
                "WebSocket upgrade → Agent connects, loads SQLite memory, ready in <100ms",
                "POST /api/billing/checkout → Stripe session for Pro plan upgrade ($20/month)",
                "GET /api/usage/today → Live token + cost dashboard for the user",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-xs font-mono">
                  <ArrowRight className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Worker Loader — NEW SECTION */}
          <div className="bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-yellow-400">Dynamic Worker Loader — Open Beta</h2>
                <p className="text-[10px] text-muted-foreground font-mono">Sandboxed AI code execution in V8 isolates &lt;5ms cold start</p>
              </div>
              <a
                href="https://blog.cloudflare.com/dynamic-workers/"
                target="_blank"
                rel="noreferrer"
                className="ml-auto flex items-center gap-1 text-[10px] font-mono text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                Announcement <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="mt-5 space-y-4">
              <p className="text-xs font-mono text-muted-foreground">
                The <strong className="text-foreground">Dynamic Worker Loader API</strong> lets any Cloudflare Worker instantiate a new Worker — with AI-generated code — in its own isolated V8 sandbox at runtime. No containers, no Docker, no cold start penalty. This is how our Swarm agents can safely execute code generated by the AI.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "<5ms", sub: "cold start", icon: Zap },
                  { label: "V8 only", sub: "not containers", icon: Shield },
                  { label: "Open Beta", sub: "paid plan", icon: Globe },
                ].map(({ label, sub, icon: Icon }) => (
                  <div key={label} className="bg-black/40 border border-white/8 rounded-lg p-3 text-center">
                    <Icon className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                    <div className="text-sm font-mono font-bold text-foreground">{label}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{sub}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">How to use in your Worker:</p>
                <CodeBlock lang="typescript" code={`// wrangler.jsonc — add the binding
{
  "bindings": [
    {
      "type": "worker_loader",
      "name": "SANDBOX"
    }
  ]
}

// worker.ts — spawn AI-generated code in an isolated V8 sandbox
export default {
  async fetch(req: Request, env: Env) {
    // AI generates this code string
    const agentCode = \`
      export default {
        async run(input, env) {
          // AI-generated logic here — fully sandboxed
          return { result: "Agent completed task: " + input.task }
        }
      }
    \`

    // Instantiate the sandbox Worker — < 5ms cold start
    const sandbox = await env.SANDBOX.fromCode(agentCode, {
      compatibilityDate: "2025-01-01"
    })

    // Call the exported function directly via RPC
    const result = await sandbox.run({ task: "Analyze this data" }, env)
    return Response.json(result)
  }
}`} />
              </div>

              <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3">
                <p className="text-[10px] font-mono text-yellow-400 font-semibold mb-1">Why this matters for AI agents</p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  Instead of calling 10 tools (10 LLM round-trips), the agent writes one TypeScript function that calls all the APIs it needs. Dynamic Workers executes it safely in isolation. Result: <strong className="text-foreground">81% fewer tokens</strong>, dramatically faster agents, and perfect sandboxing.
                </p>
              </div>

              <div className="flex gap-3">
                <a
                  href="https://developers.cloudflare.com/workers/runtime-apis/bindings/worker-loader/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-mono hover:bg-yellow-500/20 transition-colors"
                >
                  Read the Docs <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://workers.new/templates/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-mono hover:bg-primary/20 transition-colors"
                >
                  Browse Templates <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* CF Workers Template Quickstart */}
          <div className="bg-card border border-white/8 rounded-xl p-6">
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              22 Official Cloudflare Templates
            </h2>
            <p className="text-xs text-muted-foreground font-mono mb-5">
              All templates from <a href="https://workers.new/templates/" target="_blank" rel="noreferrer" className="text-primary hover:underline">workers.new/templates</a> are available in the Workflow Library under <strong className="text-foreground">"Cloudflare Workers"</strong> and <strong className="text-foreground">"Dynamic Workers"</strong> categories. Each template generates complete scaffolding code, wrangler config, and deploy instructions via AI.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { name: "LLM Chat App", tag: "Workers AI", color: "text-green-400 bg-green-400/5 border-green-400/20" },
                { name: "Durable Chat", tag: "Durable Objects", color: "text-cyan-400 bg-cyan-400/5 border-cyan-400/20" },
                { name: "Worker + D1", tag: "SQLite Edge", color: "text-blue-400 bg-blue-400/5 border-blue-400/20" },
                { name: "Workflows Starter", tag: "Durable Workflows", color: "text-purple-400 bg-purple-400/5 border-purple-400/20" },
                { name: "OpenAuth Server", tag: "OAuth 2.0 / OIDC", color: "text-yellow-400 bg-yellow-400/5 border-yellow-400/20" },
                { name: "R2 Explorer", tag: "Object Storage", color: "text-orange-400 bg-orange-400/5 border-orange-400/20" },
                { name: "Text to Image", tag: "Workers AI", color: "text-pink-400 bg-pink-400/5 border-pink-400/20" },
                { name: "SaaS Admin", tag: "Astro + shadcn", color: "text-red-400 bg-red-400/5 border-red-400/20" },
                { name: "React + Hono", tag: "Fullstack", color: "text-primary bg-primary/5 border-primary/20" },
                { name: "Website Builder", tag: "Workers for Platforms", color: "text-indigo-400 bg-indigo-400/5 border-indigo-400/20" },
                { name: "x402 Payment", tag: "Micropayments", color: "text-emerald-400 bg-emerald-400/5 border-emerald-400/20" },
                { name: "Dynamic Sandbox", tag: "Worker Loader", color: "text-yellow-400 bg-yellow-400/5 border-yellow-400/20" },
              ].map(t => (
                <div key={t.name} className={`border rounded-lg px-3 py-2 ${t.color}`}>
                  <p className="text-xs font-mono font-semibold">{t.name}</p>
                  <p className="text-[10px] font-mono opacity-70 mt-0.5">{t.tag}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
              Go to <strong className="text-foreground mx-1">Workflow Library</strong> → filter by <strong className="text-foreground mx-1">"Cloudflare Workers"</strong> or <strong className="text-foreground mx-1">"Dynamic Workers"</strong> to use any template
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
