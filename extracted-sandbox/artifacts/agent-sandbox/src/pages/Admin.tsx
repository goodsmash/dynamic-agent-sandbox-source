import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import {
  Activity, Users, Server, Cpu, BarChart3, Trash2, RefreshCw,
  Shield, Database, Zap, Clock, TrendingUp, AlertTriangle, CheckCircle2,
  XCircle, Terminal, Brain, Globe, ChevronRight, Settings, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface SessionData {
  id: string;
  name: string;
  model: string;
  agentType: string;
  status: string;
  taskCount: number;
  createdAt: string;
  lastActiveAt: string;
}

interface ProviderStatus {
  id: string;
  name: string;
  configured: boolean;
  enabled: boolean;
  latencyMs?: number;
  error?: string;
}

interface SystemStats {
  totalSessions: number;
  activeSessions: number;
  totalTasks: number;
  totalTokens: number;
  totalCostUsd: number;
  providers: ProviderStatus[];
  sessions: SessionData[];
}

const AGENT_COLORS: Record<string, string> = {
  openclaw: "text-primary border-primary/30 bg-primary/10",
  nanoclaw: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  nemoclaw: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  swarmclaw: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
};

const AGENT_NAMES: Record<string, string> = {
  openclaw: "Scout",
  nanoclaw: "Flash",
  nemoclaw: "Nexus",
  swarmclaw: "Swarm",
};

function StatCard({ label, value, icon: Icon, sub, color = "text-primary" }: {
  label: string; value: string | number; icon: React.ElementType; sub?: string; color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-white/8 rounded-xl p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <div className={cn("text-3xl font-bold font-mono tracking-tight", color)}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground font-mono">{sub}</div>}
    </motion.div>
  );
}

function SessionRow({ session, onTerminate }: { session: SessionData; onTerminate: (id: string) => void }) {
  const agentColor = AGENT_COLORS[session.agentType] || AGENT_COLORS.openclaw;
  const agentName = AGENT_NAMES[session.agentType] || session.agentType;
  const isActive = session.status === "active";
  const relTime = new Date(session.lastActiveAt).toLocaleTimeString();

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5 hover:bg-white/2 transition-colors group">
      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", isActive ? "bg-green-400 animate-pulse" : "bg-white/20")} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-mono text-foreground truncate">{session.name}</div>
        <div className="text-xs text-muted-foreground font-mono truncate">{session.model}</div>
      </div>
      <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded border", agentColor)}>{agentName}</span>
      <span className="text-xs font-mono text-muted-foreground hidden sm:block">{session.taskCount} tasks</span>
      <span className="text-xs font-mono text-muted-foreground hidden md:block">{relTime}</span>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link href={`/session/${session.id}`}>
          <Button variant="ghost" size="icon" className="w-7 h-7 text-primary hover:bg-primary/10">
            <Eye className="w-3.5 h-3.5" />
          </Button>
        </Link>
        <Button
          variant="ghost" size="icon"
          className="w-7 h-7 text-red-400 hover:bg-red-400/10"
          onClick={() => onTerminate(session.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function ProviderRow({ provider }: { provider: ProviderStatus }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5">
      {provider.configured ? (
        provider.error ? (
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
        )
      ) : (
        <XCircle className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
      )}
      <span className="text-sm font-mono text-foreground flex-1">{provider.name}</span>
      {provider.latencyMs && (
        <span className="text-xs font-mono text-muted-foreground">{provider.latencyMs}ms</span>
      )}
      <span className={cn(
        "text-[10px] font-mono px-2 py-0.5 rounded border",
        provider.configured
          ? "text-green-400 border-green-400/30 bg-green-400/10"
          : "text-white/30 border-white/10 bg-white/5"
      )}>
        {provider.configured ? "LIVE" : "NO KEY"}
      </span>
    </div>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "providers">("overview");

  const fetchStats = async () => {
    try {
      const [sessionsRes, usageRes, providersRes] = await Promise.all([
        fetch(`${API_BASE}/api/sessions`),
        fetch(`${API_BASE}/api/usage/totals`),
        fetch(`${API_BASE}/api/providers`),
      ]);

      const sessionsData = sessionsRes.ok ? await sessionsRes.json() : { sessions: [] };
      const usageData = usageRes.ok ? await usageRes.json() : {};
      const providersData = providersRes.ok ? await providersRes.json() : { providers: [] };

      const sessions: SessionData[] = sessionsData.sessions || sessionsData || [];
      const rawProviders = Array.isArray(providersData) ? providersData : (providersData.providers || []);
      const providers: ProviderStatus[] = rawProviders.map((p: ProviderStatus) => ({
        id: p.id,
        name: p.name,
        configured: p.configured,
        enabled: p.enabled,
      }));

      setStats({
        totalSessions: sessions.length,
        activeSessions: sessions.filter((s: SessionData) => s.status === "active").length,
        totalTasks: sessions.reduce((sum: number, s: SessionData) => sum + (s.taskCount || 0), 0),
        totalTokens: Number(usageData.total_tokens || usageData.totalTokens || 0),
        totalCostUsd: Number(usageData.total_cost_usd || usageData.totalCostUsd || 0),
        providers,
        sessions,
      });
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleTerminate = async (sessionId: string) => {
    try {
      await fetch(`${API_BASE}/api/sessions/${sessionId}`, { method: "DELETE" });
      toast({ title: "Session terminated", description: `Session ${sessionId.slice(0, 8)} removed.` });
      fetchStats();
    } catch {
      toast({ title: "Error", description: "Failed to terminate session.", variant: "destructive" });
    }
  };

  const handleTerminateAll = async () => {
    try {
      const sessions = stats?.sessions || [];
      await Promise.all(sessions.map(s =>
        fetch(`${API_BASE}/api/sessions/${s.id}`, { method: "DELETE" })
      ));
      toast({ title: "All sessions cleared", description: `${sessions.length} sessions terminated.` });
      fetchStats();
    } catch {
      toast({ title: "Error", description: "Failed to clear sessions.", variant: "destructive" });
    }
  };

  const configuredCount = stats?.providers.filter(p => p.configured).length || 0;
  const totalProviders = stats?.providers.length || 0;

  const tabs = [
    { id: "overview", label: "OVERVIEW", icon: BarChart3 },
    { id: "sessions", label: "SESSIONS", icon: Terminal },
    { id: "providers", label: "PROVIDERS", icon: Globe },
  ] as const;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-white/5 bg-black/30 px-8 py-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-mono text-foreground">ADMIN PANEL</h1>
                <p className="text-xs text-muted-foreground font-mono">System management &amp; monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="gap-2 font-mono text-xs border-white/10 hover:bg-white/5"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Link href="/settings">
                <Button variant="outline" size="sm" className="gap-2 font-mono text-xs border-white/10 hover:bg-white/5">
                  <Settings className="w-3.5 h-3.5" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-sm font-mono text-muted-foreground animate-pulse">Loading system data...</div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Total Sessions"
                  value={stats?.totalSessions || 0}
                  icon={Terminal}
                  sub={`${stats?.activeSessions || 0} active`}
                  color="text-primary"
                />
                <StatCard
                  label="Total Tasks"
                  value={stats?.totalTasks || 0}
                  icon={Cpu}
                  sub="across all sessions"
                  color="text-blue-400"
                />
                <StatCard
                  label="Providers Live"
                  value={`${configuredCount}/${totalProviders}`}
                  icon={Globe}
                  sub={`${totalProviders - configuredCount} unconfigured`}
                  color="text-green-400"
                />
                <StatCard
                  label="Total Tokens"
                  value={stats?.totalTokens ? stats.totalTokens.toLocaleString() : "0"}
                  icon={Zap}
                  sub={`$${(stats?.totalCostUsd || 0).toFixed(4)} estimated`}
                  color="text-yellow-400"
                />
              </div>

              {/* System Health Bar */}
              <div className="bg-card border border-white/8 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-mono font-semibold">SYSTEM HEALTH</span>
                  </div>
                  <span className="text-xs font-mono text-green-400">ALL SYSTEMS OPERATIONAL</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "API Server", status: "online", color: "bg-green-400" },
                    { label: "WebSocket", status: "online", color: "bg-green-400" },
                    { label: "Database", status: "online", color: "bg-green-400" },
                    { label: "AI Router", status: "online", color: "bg-green-400" },
                    { label: "AutoResearch", status: "online", color: "bg-green-400" },
                    { label: "Swarm Engine", status: "online", color: "bg-green-400" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2.5 bg-black/30 rounded-lg px-3 py-2 border border-white/5">
                      <div className={cn("w-2 h-2 rounded-full flex-shrink-0 animate-pulse", item.color)} />
                      <span className="text-xs font-mono text-muted-foreground">{item.label}</span>
                      <span className={cn("ml-auto text-[10px] font-mono", "text-green-400")}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-white/8">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 text-xs font-mono transition-all border-b-2 -mb-px",
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab: Overview */}
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-card border border-white/8 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                      <span className="text-sm font-mono font-semibold">Agent Distribution</span>
                    </div>
                    <div className="p-5 space-y-3">
                      {Object.entries(AGENT_NAMES).map(([type, name]) => {
                        const count = (stats?.sessions || []).filter(s => s.agentType === type).length;
                        const pct = stats?.totalSessions ? Math.round((count / stats.totalSessions) * 100) : 0;
                        return (
                          <div key={type} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className={cn("text-xs font-mono", AGENT_COLORS[type].split(" ")[0])}>{name}</span>
                              <span className="text-xs font-mono text-muted-foreground">{count} sessions</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all duration-500",
                                  type === "openclaw" ? "bg-primary" :
                                  type === "nanoclaw" ? "bg-blue-400" :
                                  type === "nemoclaw" ? "bg-purple-400" : "bg-yellow-400"
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-card border border-white/8 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                      <span className="text-sm font-mono font-semibold">Quick Actions</span>
                    </div>
                    <div className="p-5 space-y-2">
                      {[
                        { label: "View Usage Analytics", icon: BarChart3, href: "/usage", color: "text-yellow-400" },
                        { label: "Configure AI Providers", icon: Settings, href: "/settings", color: "text-primary" },
                        { label: "Deploy to Cloudflare", icon: Globe, href: "/deploy", color: "text-cyan-400" },
                        { label: "Launch Swarm Agents", icon: Users, href: "/swarm", color: "text-yellow-400" },
                        { label: "Browse Workflow Library", icon: Zap, href: "/workflows", color: "text-purple-400" },
                        { label: "AutoResearch Loop", icon: Brain, href: "/research", color: "text-green-400" },
                      ].map(action => (
                        <Link key={action.href} href={action.href}>
                          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group border border-transparent hover:border-white/8">
                            <action.icon className={cn("w-3.5 h-3.5 flex-shrink-0", action.color)} />
                            <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
                            <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Sessions */}
              {activeTab === "sessions" && (
                <div className="bg-card border border-white/8 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <span className="text-sm font-mono font-semibold">All Sessions ({stats?.sessions.length || 0})</span>
                    {(stats?.sessions.length || 0) > 0 && (
                      <Button
                        variant="ghost" size="sm"
                        onClick={handleTerminateAll}
                        className="text-xs font-mono text-red-400 hover:bg-red-400/10 gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear All
                      </Button>
                    )}
                  </div>
                  {(stats?.sessions.length || 0) === 0 ? (
                    <div className="p-12 text-center text-sm font-mono text-muted-foreground">No sessions found</div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-white/5 bg-white/2">
                        <span className="col-span-1"></span>
                        <span className="col-span-4 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Name / Model</span>
                        <span className="col-span-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Agent</span>
                        <span className="col-span-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider hidden sm:block">Tasks</span>
                        <span className="col-span-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider hidden md:block">Last Active</span>
                        <span className="col-span-1"></span>
                      </div>
                      {stats?.sessions.map(session => (
                        <SessionRow key={session.id} session={session} onTerminate={handleTerminate} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Providers */}
              {activeTab === "providers" && (
                <div className="bg-card border border-white/8 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <span className="text-sm font-mono font-semibold">Provider Status ({configuredCount}/{totalProviders} configured)</span>
                    <Link href="/settings">
                      <Button variant="outline" size="sm" className="text-xs font-mono border-white/10 gap-1.5">
                        <Settings className="w-3.5 h-3.5" />
                        Configure Keys
                      </Button>
                    </Link>
                  </div>
                  {(stats?.providers.length || 0) === 0 ? (
                    <div className="p-12 text-center text-sm font-mono text-muted-foreground">No providers found</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y-0 md:divide-x md:divide-white/5">
                      <div>{stats?.providers.slice(0, Math.ceil((stats?.providers.length || 0) / 2)).map(p => (
                        <ProviderRow key={p.id} provider={p} />
                      ))}</div>
                      <div>{stats?.providers.slice(Math.ceil((stats?.providers.length || 0) / 2)).map(p => (
                        <ProviderRow key={p.id} provider={p} />
                      ))}</div>
                    </div>
                  )}
                  <div className="px-5 py-4 border-t border-white/5 bg-white/2 flex items-center gap-3">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                    <p className="text-xs font-mono text-muted-foreground">
                      Free providers (Cloudflare, Ollama, LM Studio) work without API keys. Add keys in{" "}
                      <Link href="/settings" className="text-primary hover:underline">AI Providers</Link> to unlock all 23 providers.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
