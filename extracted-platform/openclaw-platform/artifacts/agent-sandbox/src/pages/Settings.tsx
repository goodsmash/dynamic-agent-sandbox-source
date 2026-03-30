import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  Zap,
  Save,
  TestTube,
  Trash2,
  RefreshCw,
  BarChart3,
  Coins,
  Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  pricingTier: "free" | "cheap" | "standard" | "premium";
  pricingNote: string;
  needsKey: boolean;
  free: boolean;
  docsUrl: string;
  configured: boolean;
  enabled: boolean;
  apiKey: string | null;
  baseUrl: string;
  defaultBaseUrl: string;
  popularModels: string[];
  supportsStreaming: boolean;
}

type TestResult = { ok: boolean; latencyMs: number; error?: string } | null;

const TIER_COLORS: Record<string, string> = {
  free: "text-green-400 border-green-400/30 bg-green-400/10",
  cheap: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  standard: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  premium: "text-purple-400 border-purple-400/30 bg-purple-400/10",
};

const TIER_LABELS: Record<string, string> = {
  free: "FREE",
  cheap: "CHEAP",
  standard: "STANDARD",
  premium: "PREMIUM",
};

function ProviderCard({ provider, onSaved }: { provider: ProviderInfo; onSaved: () => void }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(provider.baseUrl ?? provider.defaultBaseUrl);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [deleting, setDeleting] = useState(false);
  const [liveModels, setLiveModels] = useState<Array<{ id: string; name: string; context?: number }> | null>(null);
  const [fetchingModels, setFetchingModels] = useState(false);

  const isConfigured = provider.configured;
  const isLocal = !provider.needsKey;

  async function handleFetchLiveModels() {
    setFetchingModels(true);
    setLiveModels(null);
    try {
      const res = await fetch(`${API_BASE}/api/providers/${provider.id}/models/refresh`, { method: "POST" });
      const data = await res.json();
      if (data.error) {
        toast({ title: "Could not fetch models", description: data.error, variant: "destructive" });
      } else {
        setLiveModels(data.models ?? []);
        toast({ title: `${provider.name} models loaded`, description: `${data.models?.length ?? 0} models from ${data.source}` });
      }
    } catch (err) {
      toast({ title: "Failed", description: String(err), variant: "destructive" });
    } finally {
      setFetchingModels(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/providers/${provider.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey || undefined,
          baseUrl: baseUrl !== provider.defaultBaseUrl ? baseUrl : undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: `${provider.name} saved`, description: "API key stored successfully." });
      setApiKey("");
      onSaved();
    } catch (err) {
      toast({ title: "Save failed", description: String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/providers/${provider.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: provider.popularModels[0] }),
      });
      const data = await res.json();
      setTestResult(data);
      if (data.ok) {
        toast({ title: `${provider.name} connected!`, description: `${data.latencyMs}ms response time` });
      } else {
        toast({ title: "Connection failed", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      setTestResult({ ok: false, latencyMs: 0, error: String(err) });
    } finally {
      setTesting(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove ${provider.name} API key?`)) return;
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/api/providers/${provider.id}`, { method: "DELETE" });
      toast({ title: `${provider.name} key removed` });
      onSaved();
    } catch (err) {
      toast({ title: "Delete failed", description: String(err), variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "border rounded-xl overflow-hidden transition-all duration-200",
        expanded ? "border-primary/40 shadow-[0_0_20px_rgba(57,255,20,0.05)]" : "border-white/10 hover:border-white/20",
        "bg-card"
      )}
    >
      {/* Card Header */}
      <button
        type="button"
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/2 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-mono flex-shrink-0 border"
          style={{ borderColor: `${provider.color}40`, backgroundColor: `${provider.color}15`, color: provider.color }}
        >
          {provider.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">{provider.name}</span>
            <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border", TIER_COLORS[provider.pricingTier])}>
              {TIER_LABELS[provider.pricingTier]}
            </span>
            {provider.free && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border text-green-400 border-green-400/30 bg-green-400/10">
                FREE TIER
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{provider.pricingNote}</p>
        </div>

        {/* Status */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isLocal ? (
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <Zap className="w-3.5 h-3.5" />
              <span className="font-mono">LOCAL</span>
            </div>
          ) : isConfigured ? (
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-mono">CONFIGURED</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="font-mono">NOT SET</span>
            </div>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">{provider.description}</p>

              {/* Models */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                    {liveModels ? `Live Models (${liveModels.length})` : `Popular Models`}
                  </p>
                  <button
                    type="button"
                    onClick={handleFetchLiveModels}
                    disabled={fetchingModels}
                    className="flex items-center gap-1 text-[10px] font-mono text-primary/70 hover:text-primary border border-primary/20 rounded px-2 py-0.5 disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-2.5 h-2.5", fetchingModels && "animate-spin")} />
                    {fetchingModels ? "FETCHING..." : "FETCH LIVE"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {(liveModels ?? provider.popularModels.map((id) => ({ id, name: id }))).slice(0, liveModels ? 50 : 6).map((m) => (
                    <code key={typeof m === "string" ? m : m.id} className="text-[10px] bg-background border border-white/10 rounded px-1.5 py-0.5 text-primary/70 font-mono">
                      {typeof m === "string"
                        ? (m.length > 40 ? m.slice(0, 38) + "…" : m)
                        : (m.name.length > 40 ? m.name.slice(0, 38) + "…" : m.name)}
                      {typeof m !== "string" && m.context ? ` (${(m.context / 1000).toFixed(0)}k)` : ""}
                    </code>
                  ))}
                </div>
              </div>

              {/* Test result */}
              {testResult && (
                <div className={cn(
                  "flex items-center gap-2 text-xs px-3 py-2 rounded-lg border font-mono",
                  testResult.ok ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400"
                )}>
                  {testResult.ok ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" />Connected — {testResult.latencyMs}ms</>
                  ) : (
                    <><XCircle className="w-3.5 h-3.5" />Failed: {testResult.error}</>
                  )}
                </div>
              )}

              {/* Form */}
              {provider.needsKey && (
                <form onSubmit={handleSave} className="space-y-3">
                  {/* API Key */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>API Key</span>
                      {isConfigured && (
                        <span className="text-green-400 text-[10px]">●  Key saved: {provider.apiKey}</span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all pr-10"
                        placeholder={isConfigured ? "Enter new key to replace existing…" : "sk-…  or  your-api-key"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowKey(!showKey)}
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Custom Base URL */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Base URL <span className="text-muted-foreground/50 normal-case">(optional — leave default unless using a proxy)</span>
                    </label>
                    <input
                      type="url"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                      placeholder={provider.defaultBaseUrl}
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={saving || (!apiKey && baseUrl === (provider.baseUrl ?? provider.defaultBaseUrl))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-mono hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      {saving ? "Saving…" : "Save Key"}
                    </button>
                    <button
                      type="button"
                      onClick={handleTest}
                      disabled={testing || !isConfigured}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-mono hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <TestTube className="w-3 h-3" />}
                      {testing ? "Testing…" : "Test"}
                    </button>
                    {isConfigured && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-mono hover:bg-red-500/10 disabled:opacity-50 transition-all ml-auto"
                      >
                        {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Remove
                      </button>
                    )}
                    <a
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Docs
                    </a>
                  </div>
                </form>
              )}

              {/* Local providers (no key needed) */}
              {!provider.needsKey && (
                <div className="space-y-3">
                  {/* Custom Base URL for local */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Server URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                        placeholder={provider.defaultBaseUrl}
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          setSaving(true);
                          await fetch(`${API_BASE}/api/providers/${provider.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ baseUrl }),
                          });
                          setSaving(false);
                          toast({ title: "URL saved" });
                          onSaved();
                        }}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-mono hover:bg-primary/90 disabled:opacity-50 transition-all"
                      >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleTest}
                      disabled={testing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-mono hover:bg-white/5 disabled:opacity-50 transition-all"
                    >
                      {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <TestTube className="w-3 h-3" />}
                      {testing ? "Testing…" : "Test Connection"}
                    </button>
                    <a
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Docs
                    </a>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface UsageRow {
  provider: string;
  calls: number;
  total_tokens: string;
  prompt_tokens: string;
  completion_tokens: string;
  total_cost_usd: string;
  avg_latency_ms: number;
}

function UsageStats() {
  const [stats, setStats] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/usage/summary`);
      if (res.ok) setStats(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (visible) load(); }, [visible]);

  const totalTokens = stats.reduce((a, r) => a + parseInt(r.total_tokens ?? "0"), 0);
  const totalCost = stats.reduce((a, r) => a + parseFloat(r.total_cost_usd ?? "0"), 0);
  const totalCalls = stats.reduce((a, r) => a + (r.calls ?? 0), 0);

  return (
    <div className="border border-white/10 rounded-xl bg-card overflow-hidden">
      <div
        onClick={() => setVisible(!visible)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-4 h-4 text-primary/70" />
          <span className="text-sm font-medium">Token Usage &amp; Cost Tracking</span>
          {totalCalls > 0 && (
            <span className="text-[10px] font-mono text-muted-foreground border border-border/40 rounded px-1.5 py-0.5">
              {totalCalls} calls · {(totalTokens / 1000).toFixed(1)}k tokens
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); load(); }}
            className="p-1 hover:bg-white/10 rounded text-muted-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </span>
          {visible ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="px-5 py-4">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading usage stats...
                </div>
              ) : stats.length === 0 ? (
                <div className="text-xs text-muted-foreground font-mono">
                  No usage recorded yet. Start chatting to see token tracking here.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-background rounded-lg p-3 border border-border/40">
                      <div className="text-lg font-bold font-mono text-primary">{(totalTokens / 1000).toFixed(1)}k</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Total Tokens</div>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-border/40">
                      <div className="text-lg font-bold font-mono text-foreground">${totalCost.toFixed(4)}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Est. Cost (USD)</div>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-border/40">
                      <div className="text-lg font-bold font-mono text-foreground">{totalCalls}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">API Calls</div>
                    </div>
                  </div>

                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border/30">
                        <th className="text-left pb-2">Provider</th>
                        <th className="text-right pb-2">Calls</th>
                        <th className="text-right pb-2">Tokens</th>
                        <th className="text-right pb-2">Cost</th>
                        <th className="text-right pb-2">Avg Lat.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {stats.map((row) => (
                        <tr key={row.provider} className="text-foreground/80">
                          <td className="py-1.5 text-primary/80">{row.provider}</td>
                          <td className="py-1.5 text-right">{row.calls}</td>
                          <td className="py-1.5 text-right">{(parseInt(row.total_tokens) / 1000).toFixed(1)}k</td>
                          <td className="py-1.5 text-right">${parseFloat(row.total_cost_usd ?? "0").toFixed(4)}</td>
                          <td className="py-1.5 text-right">{row.avg_latency_ms}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Settings() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/providers`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProviders(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const configured = providers.filter((p) => p.configured).length;
  const total = providers.length;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
              <span className="text-[10px] font-mono text-primary/60 tracking-widest">SETTINGS</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/50 to-transparent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground terminal-glow">AI Providers &amp; API Keys</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure access to 11+ AI providers — OpenAI, Anthropic, Groq, Together, OpenRouter, Mistral, Gemini, Cohere, Perplexity, Ollama, and LM Studio.
              All keys are stored locally in your database. Switch models at runtime with: <code className="font-mono text-primary text-[11px]">model &lt;name&gt;</code>
            </p>
          </div>

          {/* Stats */}
          {!loading && (
            <div className="grid grid-cols-3 gap-4">
              <div className="border border-white/10 rounded-xl p-4 bg-card">
                <div className="text-2xl font-bold text-primary terminal-glow">{configured}</div>
                <div className="text-xs text-muted-foreground font-mono mt-1">Configured</div>
              </div>
              <div className="border border-white/10 rounded-xl p-4 bg-card">
                <div className="text-2xl font-bold text-foreground">{total}</div>
                <div className="text-xs text-muted-foreground font-mono mt-1">Total Providers</div>
              </div>
              <div className="border border-white/10 rounded-xl p-4 bg-card">
                <div className="text-2xl font-bold text-foreground">300+</div>
                <div className="text-xs text-muted-foreground font-mono mt-1">Models Available</div>
              </div>
            </div>
          )}

          {/* Usage Stats */}
          <UsageStats />

          {/* Quick start */}
          <div className="border border-primary/20 rounded-xl p-4 bg-primary/5 space-y-2">
            <p className="text-xs font-mono text-primary font-semibold">QUICK START — FREE PROVIDERS</p>
            <ul className="text-xs text-muted-foreground space-y-1 font-mono">
              <li><span className="text-green-400">✓ OpenAI</span> — Already active via Replit AI proxy. No key needed.</li>
              <li><span className="text-yellow-400">→ Groq</span> — Free tier at console.groq.com. ~700 tok/s inference.</li>
              <li><span className="text-yellow-400">→ OpenRouter</span> — Free models at openrouter.ai. 300+ providers in one API.</li>
              <li><span className="text-blue-400">→ Google Gemini</span> — Free tier at aistudio.google.com. 2M token context.</li>
              <li><span className="text-green-400">⬡ Ollama</span> — 100% local, free forever. Install at ollama.com.</li>
            </ul>
          </div>

          {/* Provider Cards */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border border-white/10 rounded-xl h-[72px] bg-card animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="border border-red-500/30 rounded-xl p-6 text-red-400 text-sm font-mono">
              Error loading providers: {error}
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onSaved={fetchProviders}
                />
              ))}
            </div>
          )}

          {/* Footer note */}
          <div className="text-[11px] text-muted-foreground/60 font-mono border-t border-white/5 pt-6">
            API keys are stored in your local PostgreSQL database. They are never sent to third parties.
            All AI calls go directly from this server to the provider. Deploy to Cloudflare Workers for
            production-grade V8 isolates, Durable Objects, and Workers AI (100+ models, no key needed).
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
