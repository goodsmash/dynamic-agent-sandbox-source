import React, { useState } from "react"
import { Link, useLocation } from "wouter"
import { useListSessions, useCreateSession } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Terminal, Plus, Cpu, Activity, Shield, ChevronRight, BookOpen, Workflow, Settings, FlaskConical, Sparkles, BarChart3, Cloud, Users, ShieldAlert, Key } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { MULTI_PROVIDER_MODELS, MULTI_PROVIDER_GROUPS } from "@/lib/models"

const DEFAULT_MODEL = "gpt-5.2";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { data: sessions, isLoading, refetch } = useListSessions();
  const { mutate: createSession, isPending: isCreating } = useCreateSession();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Listen for the global new-session event dispatched by the hero button
  React.useEffect(() => {
    const handler = () => setIsCreateOpen(true);
    window.addEventListener("openclaw:new-session", handler);
    return () => window.removeEventListener("openclaw:new-session", handler);
  }, []);

  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionModel, setNewSessionModel] = useState(DEFAULT_MODEL);
  const [newSessionAgentType, setNewSessionAgentType] = useState<"openclaw" | "nanoclaw" | "nemoclaw" | "swarmclaw">("openclaw");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    
    createSession(
      { data: { name: newSessionName, model: newSessionModel, agentType: newSessionAgentType } as any },
      {
        onSuccess: (session) => {
          setIsCreateOpen(false);
          setNewSessionName("");
          setNewSessionModel(DEFAULT_MODEL);
          setNewSessionAgentType("openclaw");
          refetch();
          if (session?.id) {
            navigate(`/session/${session.id}`);
          }
        }
      }
    );
  }

  return (
    <div className="w-72 bg-card border-r border-border h-screen flex flex-col z-10 shadow-2xl shadow-black relative">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/50 transition-all duration-300">
            <Terminal className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight terminal-glow">SANDBOX</h1>
            <p className="text-[10px] text-primary/70 font-mono tracking-widest uppercase">DYNAMIC_WORKERS</p>
          </div>
        </Link>
      </div>

      {/* Plan Badge */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between bg-gradient-to-r from-secondary/40 to-background border border-secondary p-3 rounded-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-secondary/10 opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent"></div>
          <div className="relative z-10 flex items-center gap-2">
            <Shield className="w-4 h-4 text-secondary-foreground" />
            <span className="text-sm font-medium text-foreground">Pro Plan</span>
          </div>
          <Badge variant="outline" className="relative z-10 border-secondary-foreground/30 text-secondary-foreground text-xs uppercase tracking-wider bg-black/50">Active</Badge>
        </div>
      </div>

      {/* Nav Links */}
      <div className="px-4 py-3 border-b border-white/5 space-y-1">
        <Link href="/setup">
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono cursor-pointer transition-all",
            location === "/setup"
              ? "bg-primary/20 border border-primary/40 text-primary"
              : "text-primary/80 hover:text-primary hover:bg-primary/10 border border-primary/20"
          )}>
            <Key className="w-3.5 h-3.5" />
            ⚡ QUICK SETUP
          </div>
        </Link>
        <Link href="/workflows">
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono cursor-pointer transition-all",
            location === "/workflows"
              ? "bg-primary/10 border border-primary/20 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
          )}>
            <Workflow className="w-3.5 h-3.5" />
            WORKFLOW LIBRARY
          </div>
        </Link>
        <Link href="/docs">
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono cursor-pointer transition-all",
            location === "/docs"
              ? "bg-primary/10 border border-primary/20 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
          )}>
            <BookOpen className="w-3.5 h-3.5" />
            DOCUMENTATION
          </div>
        </Link>
        <Link href="/research">
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono cursor-pointer transition-all",
            location === "/research"
              ? "bg-primary/10 border border-primary/20 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
          )}>
            <FlaskConical className="w-3.5 h-3.5" />
            AUTOEXPERIMENT
          </div>
        </Link>
        <Link href="/skills">
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono cursor-pointer transition-all",
            location === "/skills"
              ? "bg-purple-500/10 border border-purple-500/20 text-purple-400"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
          )}>
            <Sparkles className="w-3.5 h-3.5" />
            LEARNED SKILLS
          </div>
        </Link>
        <Link href="/swarm">
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono cursor-pointer transition-all",
            location === "/swarm"
              ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
          )}>
            <Users className="w-3.5 h-3.5" />
            SWARM AGENTS
          </div>
        </Link>
        <Link href="/usage">
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono cursor-pointer transition-all",
            location === "/usage"
              ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
          )}>
            <BarChart3 className="w-3.5 h-3.5" />
            TOKEN USAGE
          </div>
        </Link>
        <Link href="/deploy">
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono cursor-pointer transition-all",
            location === "/deploy"
              ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
          )}>
            <Cloud className="w-3.5 h-3.5" />
            CF DEPLOY
          </div>
        </Link>
        <Link href="/settings">
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono cursor-pointer transition-all",
            location === "/settings"
              ? "bg-primary/10 border border-primary/20 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
          )}>
            <Settings className="w-3.5 h-3.5" />
            AI PROVIDERS
          </div>
        </Link>
        <Link href="/admin">
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono cursor-pointer transition-all",
            location === "/admin"
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
          )}>
            <ShieldAlert className="w-3.5 h-3.5" />
            ADMIN PANEL
          </div>
        </Link>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3 px-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Active Isolates</h2>
            <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full hover:bg-primary/20 hover:text-primary" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-1">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground font-mono animate-pulse">Loading instances...</div>
            ) : sessions?.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground font-mono border border-dashed border-white/10 rounded-lg">No active sessions</div>
            ) : (
              <AnimatePresence>
                {sessions?.map((session) => {
                  const isActive = location === `/session/${session.id}`;
                  return (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={session.id}
                    >
                      <Link href={`/session/${session.id}`}>
                        <div className={cn(
                          "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border",
                          isActive 
                            ? "bg-primary/10 border-primary/30 shadow-[inset_0_0_20px_rgba(57,255,20,0.05)]" 
                            : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10"
                        )}>
                          <div className="relative flex-shrink-0">
                            <Activity className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                            {session.status === 'active' && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={cn("text-sm font-medium truncate", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                                {session.name}
                              </p>
                              {isActive && <ChevronRight className="w-4 h-4 text-primary opacity-50" />}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono text-muted-foreground/70 flex items-center gap-1">
                                <Cpu className="w-3 h-3" /> {session.model}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground/70">
                                {formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(57,255,20,0.8)]"></span>
            <span>WS CONNECTED</span>
          </div>
          <span>v2.0.0</span>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono">
              <Terminal className="w-5 h-5 text-primary" />
              INIT_NEW_ISOLATE
            </DialogTitle>
            <DialogDescription>
              Provision a new AI agent. Choose from 23 providers · 200+ models · or Swarm for multi-agent orchestration.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground uppercase tracking-wider">Session Name</label>
              <input 
                autoFocus
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                placeholder="e.g. data-analyzer-01"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground uppercase tracking-wider">Agent Type</label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { id: "openclaw",  label: "Scout",  desc: "Full-featured",  color: "border-primary/40 bg-primary/10 text-primary" },
                  { id: "nanoclaw",  label: "Flash",  desc: "Ultra-fast",     color: "border-cyan-400/40 bg-cyan-400/10 text-cyan-400" },
                  { id: "nemoclaw",  label: "Nexus",  desc: "Deep reasoning", color: "border-purple-400/40 bg-purple-400/10 text-purple-400" },
                  { id: "swarmclaw", label: "Swarm",  desc: "Multi-agent",    color: "border-yellow-400/40 bg-yellow-400/10 text-yellow-400" },
                ] as const).map(agent => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setNewSessionAgentType(agent.id)}
                    className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      newSessionAgentType === agent.id
                        ? agent.color
                        : "border-border bg-background/50 text-muted-foreground hover:border-white/20"
                    }`}
                  >
                    <span className="text-xs font-bold font-mono">{agent.label}</span>
                    <span className="text-[9px] mt-0.5 opacity-80">{agent.desc}</span>
                  </button>
                ))}
              </div>
              {newSessionAgentType === "openclaw"  && <p className="text-[10px] text-primary/70 font-mono">Scout · Full-featured · 4096 tok · 20 parallel · gpt-5.2</p>}
              {newSessionAgentType === "nanoclaw"  && <p className="text-[10px] text-cyan-400/70 font-mono">Flash · Ultra-fast · 1024 tok · 10 parallel · gpt-5-mini</p>}
              {newSessionAgentType === "nemoclaw"  && <p className="text-[10px] text-purple-400/70 font-mono">Nexus · Deep reasoning · 16384 tok · 5 parallel · o4-mini</p>}
              {newSessionAgentType === "swarmclaw" && <p className="text-[10px] text-yellow-400/70 font-mono">Swarm · Multi-agent orchestrator · spawn companies of AI agents</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground uppercase tracking-wider flex items-center justify-between">
                <span>AI Model</span>
                <span className="text-[10px] text-primary/70 font-mono normal-case">23 providers · 200+ models</span>
              </label>
              <select 
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                value={newSessionModel}
                onChange={(e) => setNewSessionModel(e.target.value)}
              >
                {MULTI_PROVIDER_GROUPS.map(group => (
                  <optgroup key={group} label={group}>
                    {MULTI_PROVIDER_MODELS.filter(m => m.group === group).map(model => (
                      <option key={model.id} value={model.id}>
                        {model.tags.includes("recommended") ? "★ " : ""}{model.name}
                        {model.tags.includes("free") ? " [free]" : ""}
                        {model.tags.includes("fast") ? " [fast]" : ""}
                        {model.tags.includes("reasoning") ? " [reasoning]" : ""}
                        {model.tags.includes("local") ? " [local]" : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {newSessionModel && (
                <p className="text-[10px] font-mono text-muted-foreground break-all">
                  Selected: {newSessionModel}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground">
                Add API keys at{" "}
                <a href="/settings" className="text-primary underline">AI Providers</a>.
                OpenAI works immediately — no key needed.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isCreating || !newSessionName.trim()}>
                {isCreating ? "PROVISIONING..." : "DEPLOY ISOLATE"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Badge({ children, className, variant = "default" }: { children: React.ReactNode, className?: string, variant?: "default" | "outline" }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold transition-colors",
      variant === "default" ? "bg-primary text-primary-foreground" : "border border-border text-foreground",
      className
    )}>
      {children}
    </span>
  )
}
