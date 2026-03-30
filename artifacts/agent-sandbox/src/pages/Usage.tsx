import { AppLayout } from "@/components/layout/AppLayout"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { DollarSign, Zap, BarChart3, Clock, Activity, TrendingUp, Database, Cpu, Download, Filter, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useMemo } from "react"

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/\/[^/]*$/, "") + "/api"

async function fetchJson(path: string) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

function StatCard({ icon: Icon, label, value, sub, color = "text-primary", glow = "shadow-primary/20" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string; glow?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-card border border-white/8 rounded-xl p-5 shadow-lg", glow && `shadow-sm`)}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center")}>
          <Icon className={cn("w-4 h-4", color)} />
        </div>
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
      </div>
      <p className={cn("text-3xl font-bold tabular-nums", color)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1 font-mono">{sub}</p>}
    </motion.div>
  )
}

function CostBar({ label, tokens, cost, maxTokens }: { label: string; tokens: number; cost: number | null; maxTokens: number }) {
  const pct = maxTokens > 0 ? Math.max(2, Math.round((tokens / maxTokens) * 100)) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-foreground truncate max-w-[55%]">{label}</span>
        <div className="flex gap-3 text-muted-foreground">
          <span>{tokens.toLocaleString()} tok</span>
          {cost != null && <span className="text-primary">${cost.toFixed(4)}</span>}
          {cost == null && <span className="text-muted-foreground/50">$—</span>}
        </div>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full"
        />
      </div>
    </div>
  )
}

function DayCostChart({ data }: { data: Array<{ day: string; total_tokens: number; total_cost_usd: number }> }) {
  if (!data.length) return (
    <div className="h-32 flex items-center justify-center text-xs text-muted-foreground font-mono">
      No data yet — run an agent to see trends
    </div>
  )
  const maxCost = Math.max(...data.map(d => Number(d.total_cost_usd) || 0), 0.0001)
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => {
        const h = Math.max(4, Math.round((Number(d.total_cost_usd) / maxCost) * 100))
        const day = new Date(d.day).toLocaleDateString("en", { weekday: "short" })
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-default">
            <div className="relative w-full" style={{ height: "100px" }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.05 }}
                style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
                className="bg-gradient-to-t from-primary/80 to-primary/30 rounded-t-sm group-hover:from-primary group-hover:to-primary/60 transition-colors"
              />
            </div>
            <span className="text-[9px] font-mono text-muted-foreground">{day}</span>
            <span className="text-[8px] font-mono text-primary/70 opacity-0 group-hover:opacity-100 transition-opacity">
              ${Number(d.total_cost_usd).toFixed(4)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function RecentCallsTable({ data }: { data: any[] | undefined }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterProvider, setFilterProvider] = useState<string>("all")

  const providers = useMemo(() => {
    if (!data?.length) return []
    return [...new Set(data.map((r: any) => r.provider))].sort()
  }, [data])

  const filtered = useMemo(() => {
    if (!data?.length) return []
    return data.filter((r: any) => {
      if (filterProvider !== "all" && r.provider !== filterProvider) return false
      if (searchTerm && !r.model?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !r.provider?.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
  }, [data, filterProvider, searchTerm])

  const exportCSV = () => {
    if (!filtered?.length) return
    const headers = ["Time","Provider","Model","Prompt Tokens","Completion Tokens","Total Tokens","Latency (ms)","Cost (USD)"]
    const rows = filtered.map((r: any) => [
      new Date(r.created_at).toISOString(),
      r.provider, r.model,
      r.prompt_tokens, r.completion_tokens, r.total_tokens,
      r.latency_ms ?? "", r.estimated_cost_usd ?? ""
    ])
    const csv = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `openclaw-usage-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-card border border-white/8 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-400" />
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider">Audit Log — Recent API Calls</h2>
          <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-white/5">
            {filtered?.length ?? 0} entries
          </span>
        </div>
        <button
          onClick={exportCSV}
          disabled={!filtered?.length}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono hover:bg-primary/20 transition-colors disabled:opacity-40"
        >
          <Download className="w-3 h-3" />
          EXPORT CSV
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30"
            placeholder="Search model or provider..."
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-muted-foreground" />
          <select
            value={filterProvider}
            onChange={e => setFilterProvider(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs font-mono text-foreground focus:outline-none focus:border-primary/30"
          >
            <option value="all">All providers</option>
            {providers.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {!filtered?.length ? (
        <p className="text-xs text-muted-foreground font-mono py-4 text-center">
          {data?.length ? "No matches for current filters" : "No recent calls — run an agent to see the audit log"}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground">
                <th className="text-left pb-3 pr-4">Time</th>
                <th className="text-left pb-3 pr-4">Provider</th>
                <th className="text-left pb-3 pr-4 max-w-[180px]">Model</th>
                <th className="text-right pb-3 pr-4">Prompt</th>
                <th className="text-right pb-3 pr-4">Completion</th>
                <th className="text-right pb-3 pr-4">Total</th>
                <th className="text-right pb-3 pr-4">Latency</th>
                <th className="text-right pb-3">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((r: any) => (
                <tr key={r.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-2 pr-4 text-foreground">{r.provider}</td>
                  <td className="py-2 pr-4 text-muted-foreground max-w-[180px] truncate">{r.model}</td>
                  <td className="py-2 pr-4 text-right">{Number(r.prompt_tokens).toLocaleString()}</td>
                  <td className="py-2 pr-4 text-right">{Number(r.completion_tokens).toLocaleString()}</td>
                  <td className="py-2 pr-4 text-right text-foreground font-semibold">{Number(r.total_tokens).toLocaleString()}</td>
                  <td className="py-2 pr-4 text-right text-muted-foreground">
                    {r.latency_ms != null ? `${r.latency_ms}ms` : "—"}
                  </td>
                  <td className="py-2 text-right text-primary">
                    {r.estimated_cost_usd != null ? `$${Number(r.estimated_cost_usd).toFixed(6)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function Usage() {
  const { data: totals, isLoading: lt } = useQuery({
    queryKey: ["usage-totals"],
    queryFn: () => fetchJson("/usage/totals"),
    refetchInterval: 30000,
  })
  const { data: today } = useQuery({
    queryKey: ["usage-today"],
    queryFn: () => fetchJson("/usage/today"),
    refetchInterval: 30000,
  })
  const { data: byModel } = useQuery({
    queryKey: ["usage-by-model"],
    queryFn: () => fetchJson("/usage/by-model"),
    refetchInterval: 30000,
  })
  const { data: byProvider } = useQuery({
    queryKey: ["usage-summary"],
    queryFn: () => fetchJson("/usage/summary"),
    refetchInterval: 30000,
  })
  const { data: byDay7 } = useQuery({
    queryKey: ["usage-by-day-7"],
    queryFn: () => fetchJson("/usage/by-day?days=7"),
    refetchInterval: 60000,
  })
  const { data: recent } = useQuery({
    queryKey: ["usage-recent"],
    queryFn: () => fetchJson("/usage/recent?limit=20"),
    refetchInterval: 30000,
  })

  const fmt = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString())
  const fmtCost = (n: number | null | undefined) => (n == null ? "$—" : `$${Number(n).toFixed(4)}`)
  const fmtMs = (n: number | null | undefined) => (n == null ? "—" : `${n}ms`)

  // Projected monthly from today's usage
  const todayTokens = Number(today?.total_tokens ?? 0)
  const todayCost = Number(today?.cost_usd ?? 0)
  const projectedMonthly = fmtCost(todayCost * 30)

  const maxModelTokens = byModel ? Math.max(...byModel.map((m: any) => Number(m.total_tokens ?? 0))) : 0
  const maxProviderTokens = byProvider ? Math.max(...byProvider.map((p: any) => Number(p.total_tokens ?? 0))) : 0

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-white/5 bg-black/30 px-8 py-6">
          <div className="flex items-center gap-3 mb-1">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold font-mono tracking-tight">TOKEN USAGE &amp; BILLING</h1>
          </div>
          <p className="text-sm text-muted-foreground">Real-time token consumption and cost tracking across all 23 providers</p>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
          {/* Top Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={DollarSign}
              label="Today's Cost"
              value={fmtCost(today?.cost_usd)}
              sub={`${fmt(today?.calls)} calls · ${(todayTokens / 1000).toFixed(1)}K tokens`}
              color="text-primary"
            />
            <StatCard
              icon={TrendingUp}
              label="Projected Monthly"
              value={projectedMonthly}
              sub="Based on today's rate"
              color="text-yellow-400"
            />
            <StatCard
              icon={Zap}
              label="All-Time Tokens"
              value={lt ? "…" : `${((Number(totals?.total_tokens ?? 0)) / 1_000_000).toFixed(2)}M`}
              sub={`${fmt(totals?.total_calls)} total API calls`}
              color="text-cyan-400"
            />
            <StatCard
              icon={DollarSign}
              label="All-Time Cost"
              value={fmtCost(totals?.total_cost_usd)}
              sub={`${fmt(totals?.providers_used)} providers · ${fmt(totals?.models_used)} models`}
              color="text-orange-400"
            />
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Cpu} label="Avg Latency" value={fmtMs(totals?.avg_latency_ms)} sub="per API call" color="text-purple-400" />
            <StatCard icon={Activity} label="Active Sessions" value={fmt(totals?.sessions)} sub="with usage" color="text-green-400" />
            <StatCard icon={Database} label="Providers Used" value={fmt(totals?.providers_used)} sub="of 23 configured" color="text-blue-400" />
            <StatCard icon={BarChart3} label="Models Used" value={fmt(totals?.models_used)} sub="distinct models" color="text-pink-400" />
          </div>

          {/* Cost Trend + Provider Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 7-day cost trend */}
            <div className="bg-card border border-white/8 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-mono font-semibold uppercase tracking-wider">7-Day Cost Trend</h2>
              </div>
              <DayCostChart data={byDay7 ?? []} />
            </div>

            {/* Provider breakdown */}
            <div className="bg-card border border-white/8 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Database className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-mono font-semibold uppercase tracking-wider">By Provider</h2>
              </div>
              {!byProvider?.length ? (
                <p className="text-xs text-muted-foreground font-mono">No usage yet</p>
              ) : (
                <div className="space-y-4">
                  {byProvider.slice(0, 8).map((p: any) => (
                    <CostBar
                      key={p.provider}
                      label={p.provider}
                      tokens={Number(p.total_tokens ?? 0)}
                      cost={p.total_cost_usd != null ? Number(p.total_cost_usd) : null}
                      maxTokens={maxProviderTokens}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Model Breakdown */}
          <div className="bg-card border border-white/8 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Cpu className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-mono font-semibold uppercase tracking-wider">Token Usage by Model</h2>
            </div>
            {!byModel?.length ? (
              <p className="text-xs text-muted-foreground font-mono">No usage recorded yet — start an agent to track tokens</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                {byModel.slice(0, 20).map((m: any) => (
                  <CostBar
                    key={`${m.provider}:${m.model}`}
                    label={`${m.model}`}
                    tokens={Number(m.total_tokens ?? 0)}
                    cost={m.total_cost_usd != null ? Number(m.total_cost_usd) : null}
                    maxTokens={maxModelTokens}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Recent Calls Table — with filters and export */}
          <RecentCallsTable data={recent} />

          {/* Audit Log / Billing Plans Info */}
          <div className="bg-gradient-to-r from-primary/5 to-cyan-500/5 border border-primary/20 rounded-xl p-6">
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              BILLING MODEL — Pay As You Go
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-primary font-mono">FREE TIER</h3>
                <ul className="text-xs text-muted-foreground space-y-1 font-mono">
                  <li>• 1 concurrent agent</li>
                  <li>• All 23 providers via own keys</li>
                  <li>• Cloudflare Workers AI free</li>
                  <li>• Full skills + AutoResearch</li>
                  <li>• Token usage tracking</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-cyan-400 font-mono">PRO — $20/month</h3>
                <ul className="text-xs text-muted-foreground space-y-1 font-mono">
                  <li>• Unlimited parallel agents</li>
                  <li>• Priority routing to fastest models</li>
                  <li>• Shared API key pool (no own keys)</li>
                  <li>• Sub-agent spawning up to 20x</li>
                  <li>• Full billing dashboard</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-orange-400 font-mono">ENTERPRISE</h3>
                <ul className="text-xs text-muted-foreground space-y-1 font-mono">
                  <li>• Dedicated Cloudflare Workers</li>
                  <li>• Custom token limits per agent</li>
                  <li>• Team access controls + SSO</li>
                  <li>• SLA + on-call support</li>
                  <li>• Volume token pricing</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <p className="text-xs text-muted-foreground font-mono">
                Token costs are pass-through from providers. We charge a <span className="text-primary">10% platform fee</span> on token spend for Pro accounts.
                Free accounts use their own API keys — zero markup.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
