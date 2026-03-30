import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Sparkles, Trash2, RefreshCw, Brain, FlaskConical,
  BookOpen, BarChart3, Clock, Tag, User, Filter,
} from "lucide-react";

const API = "/api";

interface Skill {
  id: string;
  name: string;
  description: string;
  implementation: string;
  category: string;
  score: number;
  agentType: string;
  source: string;
  useCount: number;
  createdAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  research: "border-blue-500/30 bg-blue-500/5 text-blue-300",
  reasoning: "border-purple-500/30 bg-purple-500/5 text-purple-300",
  coding: "border-green-500/30 bg-green-500/5 text-green-300",
  analysis: "border-yellow-500/30 bg-yellow-500/5 text-yellow-300",
  writing: "border-orange-500/30 bg-orange-500/5 text-orange-300",
  planning: "border-cyan-500/30 bg-cyan-500/5 text-cyan-300",
  general: "border-white/10 bg-white/5 text-muted-foreground",
};

const AGENT_COLORS: Record<string, string> = {
  openclaw: "text-primary",
  nanoclaw: "text-cyan-400",
  nemoclaw: "text-purple-400",
  any: "text-muted-foreground",
};

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API}/skills`);
      if (resp.ok) {
        const data = await resp.json();
        setSkills(data);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  async function deleteSkill(id: number) {
    setDeletingId(id);
    try {
      await fetch(`${API}/skills/${id}`, { method: "DELETE" });
      setSkills((prev) => prev.filter((s) => s.id !== id));
    } catch {}
    finally { setDeletingId(null); }
  }

  const categories = Array.from(new Set(skills.map((s) => s.category)));
  const agents = Array.from(new Set(skills.map((s) => s.agentType)));

  const filtered = skills.filter((s) => {
    if (filterAgent !== "all" && s.agentType !== filterAgent) return false;
    if (filterCategory !== "all" && s.category !== filterCategory) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, Skill[]>>((acc, skill) => {
    const key = skill.category || "general";
    if (!acc[key]) acc[key] = [];
    acc[key].push(skill);
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border/40 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h1 className="text-base font-bold font-mono tracking-tight">LEARNED SKILLS</h1>
              <p className="text-[11px] text-muted-foreground font-mono">
                {skills.length} skills · extracted from AutoResearch + manual entries · injected into all agent runs
              </p>
            </div>
          </div>
          <button
            onClick={fetchSkills}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-xs font-mono text-muted-foreground hover:text-foreground hover:border-border transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            REFRESH
          </button>
        </div>

        {/* Filters */}
        <div className="border-b border-border/40 px-6 py-3 flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Agent:</span>
            <div className="flex items-center gap-1">
              {["all", ...agents].map((a) => (
                <button
                  key={a}
                  onClick={() => setFilterAgent(a)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-mono transition-all",
                    filterAgent === a
                      ? "bg-white/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {a === "all" ? "ALL" : a.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {categories.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase">Category:</span>
              <div className="flex items-center gap-1 flex-wrap">
                {["all", ...categories].map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilterCategory(c)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-mono transition-all",
                      filterCategory === c
                        ? "bg-white/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {c === "all" ? "ALL" : c.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm font-mono">Loading skills...</span>
              </div>
            </div>
          ) : skills.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-400/50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">No skills learned yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1 max-w-sm">
                  Skills are automatically extracted from AutoResearch experiments with a score ≥ 65%.
                  You can also add skills manually from any agent terminal with{" "}
                  <code className="font-mono text-purple-400">skill learn &lt;name&gt;: &lt;desc&gt;</code>
                </p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm font-mono">
              No skills match current filters.
            </div>
          ) : (
            <div className="space-y-8 max-w-4xl mx-auto">
              {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, categorySkills]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{category}</div>
                    <div className="h-px flex-1 bg-border/40" />
                    <div className="text-[10px] font-mono text-muted-foreground">{categorySkills.length}</div>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {categorySkills.map((skill) => (
                        <motion.div
                          key={skill.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className={cn("border rounded-lg overflow-hidden", CATEGORY_COLORS[category] || CATEGORY_COLORS.general)}
                        >
                          <button
                            onClick={() => setExpandedId(expandedId === skill.id ? null : skill.id)}
                            className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold">{skill.name}</span>
                                <span className={cn("text-[9px] font-mono", AGENT_COLORS[skill.agentType] || "text-muted-foreground")}>
                                  {skill.agentType}
                                </span>
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate mt-0.5">{skill.description}</div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex items-center gap-1">
                                <BarChart3 className="w-3 h-3 text-muted-foreground" />
                                <span className="text-[10px] font-mono">{(skill.score * 100).toFixed(0)}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FlaskConical className="w-3 h-3 text-muted-foreground" />
                                <span className="text-[10px] font-mono text-muted-foreground">{skill.source}</span>
                              </div>
                            </div>
                          </button>

                          <AnimatePresence>
                            {expandedId === skill.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3">
                                  {skill.implementation && skill.implementation !== skill.description && (
                                    <div>
                                      <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Implementation</div>
                                      <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{skill.implementation}</div>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground/60">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(skill.createdAt).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />used {skill.useCount}×</span>
                                    <span className="flex items-center gap-1"><User className="w-3 h-3" />id: {skill.id}</span>
                                    <button
                                      onClick={() => deleteSkill(skill.id)}
                                      disabled={deletingId === skill.id}
                                      className="flex items-center gap-1 text-red-400/60 hover:text-red-400 transition-colors ml-auto disabled:opacity-50"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      {deletingId === skill.id ? "DELETING..." : "DELETE"}
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}

              {/* Stats footer */}
              <div className="pt-4 border-t border-border/30 grid grid-cols-4 gap-4">
                {[
                  { label: "Total Skills", value: skills.length, icon: Sparkles },
                  { label: "Avg Score", value: skills.length > 0 ? `${(skills.reduce((a, s) => a + s.score, 0) / skills.length * 100).toFixed(1)}%` : "—", icon: BarChart3 },
                  { label: "Auto-learned", value: skills.filter(s => s.source === "research").length, icon: FlaskConical },
                  { label: "Manual", value: skills.filter(s => s.source === "manual").length, icon: User },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 border border-border/30 rounded-lg text-center">
                    <stat.icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <div className="text-lg font-bold font-mono">{stat.value}</div>
                    <div className="text-[9px] font-mono text-muted-foreground uppercase">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
