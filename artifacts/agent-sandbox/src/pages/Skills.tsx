import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import {
  Sparkles, Trash2, RefreshCw, Brain, FlaskConical,
  BookOpen, BarChart3, Clock, User, Search,
  Code2, PenTool, Lightbulb, Telescope, Zap,
  X, Plus, Terminal, Star, ChevronRight,
  Activity, Layers,
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

const CATEGORY_CONFIG: Record<string, {
  color: string; bg: string; border: string;
  Icon: React.FC<{ className?: string }>;
  gradient: string; glow: string;
}> = {
  research:  { color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30",   Icon: Telescope,  gradient: "from-blue-500/25 via-blue-600/10 to-transparent",   glow: "shadow-blue-500/20" },
  reasoning: { color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", Icon: Brain,      gradient: "from-purple-500/25 via-purple-600/10 to-transparent", glow: "shadow-purple-500/20" },
  coding:    { color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30",  Icon: Code2,      gradient: "from-green-500/25 via-green-600/10 to-transparent",  glow: "shadow-green-500/20" },
  analysis:  { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", Icon: BarChart3,  gradient: "from-yellow-500/25 via-yellow-600/10 to-transparent", glow: "shadow-yellow-500/20" },
  writing:   { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", Icon: PenTool,   gradient: "from-orange-500/25 via-orange-600/10 to-transparent", glow: "shadow-orange-500/20" },
  planning:  { color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/30",   Icon: Lightbulb, gradient: "from-cyan-500/25 via-cyan-600/10 to-transparent",   glow: "shadow-cyan-500/20" },
  general:   { color: "text-zinc-400",   bg: "bg-white/5",       border: "border-white/10",       Icon: Zap,       gradient: "from-white/10 via-white/5 to-transparent",            glow: "shadow-white/5" },
};

const SOURCE_CONFIG: Record<string, { label: string; cls: string; Icon: React.FC<{ className?: string }> }> = {
  auto:     { label: "Built-in",    cls: "text-primary border-primary/40 bg-primary/10",             Icon: Star },
  research: { label: "Auto-Learned", cls: "text-blue-400 border-blue-500/40 bg-blue-500/10",        Icon: FlaskConical },
  manual:   { label: "Manual",       cls: "text-orange-400 border-orange-500/40 bg-orange-500/10",  Icon: User },
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? "bg-primary" : pct >= 60 ? "bg-yellow-400" : "bg-orange-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

function SkillCard({
  skill, selected, onSelect, onDelete, onLaunch, deleting,
}: {
  skill: Skill;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onLaunch: () => void;
  deleting: boolean;
}) {
  const cat = CATEGORY_CONFIG[skill.category] ?? CATEGORY_CONFIG.general;
  const src = SOURCE_CONFIG[skill.source] ?? SOURCE_CONFIG.manual;
  const CatIcon = cat.Icon;
  const SrcIcon = src.Icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onSelect}
      className={cn(
        "group relative rounded-xl border overflow-hidden cursor-pointer transition-all duration-200",
        "hover:shadow-lg",
        selected
          ? cn("border-primary/60 shadow-lg shadow-primary/10 bg-card/80", cat.glow)
          : "border-border/40 bg-card/40 hover:border-border/80 hover:bg-card/60"
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300", cat.gradient)} />
      {selected && <div className={cn("absolute inset-0 bg-gradient-to-br", cat.gradient)} />}

      <div className="relative p-4">
        <div className="flex items-start gap-3">
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm", cat.bg, cat.border, "border")}>
            <CatIcon className={cn("w-4 h-4", cat.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-semibold font-mono leading-tight truncate">{skill.name}</h3>
              <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border shrink-0", src.cls)}>
                <SrcIcon className="w-2.5 h-2.5" />
                {src.label}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
              {skill.description}
            </p>
            <ScoreBar score={skill.score} />
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
            <span className={cn("px-1.5 py-0.5 rounded text-[9px]", cat.bg, cat.color)}>{skill.category}</span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {skill.useCount}×
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(skill.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>

          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button
              onClick={onLaunch}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all"
            >
              <Terminal className="w-3 h-3" />
              Launch
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="p-1 rounded text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      )}
    </motion.div>
  );
}

function SkillDetailPanel({ skill, onClose, onLaunch }: {
  skill: Skill;
  onClose: () => void;
  onLaunch: () => void;
}) {
  const cat = CATEGORY_CONFIG[skill.category] ?? CATEGORY_CONFIG.general;
  const src = SOURCE_CONFIG[skill.source] ?? SOURCE_CONFIG.manual;
  const CatIcon = cat.Icon;
  const SrcIcon = src.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-80 shrink-0 border-l border-border/40 bg-card/30 flex flex-col overflow-hidden"
    >
      <div className={cn("px-4 py-4 border-b border-border/30 bg-gradient-to-br", cat.gradient)}>
        <div className="flex items-start justify-between mb-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", cat.bg, cat.border, "border shadow")}>
            <CatIcon className={cn("w-5 h-5", cat.color)} />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <h2 className="text-sm font-bold font-mono mb-1">{skill.name}</h2>
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border", src.cls)}>
            <SrcIcon className="w-2.5 h-2.5" />
            {src.label}
          </span>
          <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-mono", cat.bg, cat.color)}>{skill.category}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Description</div>
          <p className="text-xs text-muted-foreground leading-relaxed">{skill.description}</p>
        </div>

        {skill.implementation && skill.implementation !== skill.description && (
          <div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Implementation</div>
            <div className="bg-black/30 border border-border/30 rounded-lg p-3">
              <p className="text-[11px] font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">{skill.implementation}</p>
            </div>
          </div>
        )}

        <div>
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Performance</div>
          <ScoreBar score={skill.score} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Times Used", value: `${skill.useCount}×`, Icon: BookOpen },
            { label: "Agent", value: skill.agentType || "any", Icon: Activity },
            { label: "Source", value: src.label, Icon: SrcIcon },
            { label: "Created", value: new Date(skill.createdAt).toLocaleDateString(), Icon: Clock },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="bg-white/5 rounded-lg p-2">
              <div className="flex items-center gap-1 mb-1">
                <Icon className="w-3 h-3 text-muted-foreground" />
                <span className="text-[9px] font-mono text-muted-foreground uppercase">{label}</span>
              </div>
              <div className="text-xs font-mono truncate">{value}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Use in Terminal</div>
          <div className="bg-black/40 border border-border/30 rounded-lg p-2.5 font-mono text-[10px] text-primary">
            <div className="text-muted-foreground mb-1">{"# In any agent terminal:"}</div>
            <div>skill use {skill.name}</div>
            <div className="text-muted-foreground mt-1">{"# Or reference in task:"}</div>
            <div className="text-muted-foreground">apply the {skill.name} skill to...</div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border/30">
        <button
          onClick={onLaunch}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-mono font-semibold hover:bg-primary/90 transition-colors"
        >
          <Terminal className="w-4 h-4" />
          Launch Agent with this Skill
        </button>
      </div>
    </motion.div>
  );
}

function AddSkillModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || !description.trim()) return;
    setSaving(true);
    try {
      await fetch(`${API}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), implementation: description.trim(), category, agentType: "any", source: "manual", score: 0.7 }),
      });
      onAdded();
      onClose();
    } catch {}
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border/60 rounded-xl w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold font-mono">Add New Skill</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">Skill Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. structured-analysis"
              className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/60 transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">Description & Implementation</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what this skill does and how the agent should use it..."
              rows={4}
              className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/60 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(CATEGORY_CONFIG).map(cat => {
                const cfg = CATEGORY_CONFIG[cat];
                const Icon = cfg.Icon;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border transition-all",
                      category === cat
                        ? cn(cfg.bg, cfg.border, cfg.color)
                        : "border-border/40 text-muted-foreground hover:border-border/80"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-border/40">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-border/60 text-sm font-mono text-muted-foreground hover:text-foreground hover:border-border transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !description.trim() || saving}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-mono font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {saving ? "Saving..." : "Save Skill"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Skills() {
  const [, navigate] = useLocation();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API}/skills`);
      if (resp.ok) setSkills(await resp.json());
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSkills(); }, [fetchSkills]);

  async function deleteSkill(id: string) {
    setDeletingId(id);
    if (selectedId === id) setSelectedId(null);
    try {
      await fetch(`${API}/skills/${id}`, { method: "DELETE" });
      setSkills(prev => prev.filter(s => s.id !== id));
    } catch {}
    finally { setDeletingId(null); }
  }

  async function launchWithSkill(skill: Skill) {
    try {
      const resp = await fetch(`${API}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `skill-${skill.name}`, agentType: "openclaw", model: "gpt-5.2" }),
      });
      if (resp.ok) {
        const { id } = await resp.json();
        navigate(`/session/${id}?autorun=${encodeURIComponent(`skill use ${skill.name}: ${skill.description.slice(0, 80)}`)}`);
      }
    } catch {}
  }

  const categories = Array.from(new Set(skills.map(s => s.category))).sort();
  const sources = Array.from(new Set(skills.map(s => s.source)));

  const filtered = skills.filter(s => {
    if (filterCategory !== "all" && s.category !== filterCategory) return false;
    if (filterSource !== "all" && s.source !== filterSource) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
        !s.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedSkill = skills.find(s => s.id === selectedId) ?? null;

  const stats = {
    total: skills.length,
    builtIn: skills.filter(s => s.source === "auto").length,
    learned: skills.filter(s => s.source === "research").length,
    manual: skills.filter(s => s.source === "manual").length,
    avgScore: skills.length > 0 ? skills.reduce((a, s) => a + s.score, 0) / skills.length : 0,
    categories: categories.length,
  };

  return (
    <AppLayout>
      <AnimatePresence>
        {showAddModal && (
          <AddSkillModal
            onClose={() => setShowAddModal(false)}
            onAdded={fetchSkills}
          />
        )}
      </AnimatePresence>

      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border/40 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h1 className="text-base font-bold font-mono tracking-tight">SKILL LIBRARY</h1>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {skills.length} skills injected into every agent run — auto-learned + manual
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchSkills}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-xs font-mono text-muted-foreground hover:text-foreground hover:border-border transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-xs font-mono text-primary hover:bg-primary/20 hover:border-primary/50 transition-all"
              >
                <Plus className="w-3 h-3" />
                Add Skill
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-6 gap-2 mb-4">
            {[
              { label: "Total", value: stats.total, color: "text-foreground", bg: "bg-white/5" },
              { label: "Built-in", value: stats.builtIn, color: "text-primary", bg: "bg-primary/5" },
              { label: "Auto-Learned", value: stats.learned, color: "text-blue-400", bg: "bg-blue-500/5" },
              { label: "Manual", value: stats.manual, color: "text-orange-400", bg: "bg-orange-500/5" },
              { label: "Categories", value: stats.categories, color: "text-cyan-400", bg: "bg-cyan-500/5" },
              { label: "Avg Score", value: `${Math.round(stats.avgScore * 100)}%`, color: stats.avgScore >= 0.8 ? "text-green-400" : "text-yellow-400", bg: "bg-white/5" },
            ].map(stat => (
              <div key={stat.label} className={cn("rounded-lg p-2.5 text-center border border-border/30", stat.bg)}>
                <div className={cn("text-lg font-bold font-mono", stat.color)}>{stat.value}</div>
                <div className="text-[9px] font-mono text-muted-foreground uppercase mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Search + filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search skills..."
                className="w-full bg-background border border-border/50 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono focus:outline-none focus:border-primary/50 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterCategory("all")}
                className={cn("px-2.5 py-1 rounded text-[10px] font-mono transition-all", filterCategory === "all" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground")}
              >ALL</button>
              {categories.map(c => {
                const cfg = CATEGORY_CONFIG[c] ?? CATEGORY_CONFIG.general;
                const Icon = cfg.Icon;
                return (
                  <button
                    key={c}
                    onClick={() => setFilterCategory(filterCategory === c ? "all" : c)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all border",
                      filterCategory === c ? cn(cfg.bg, cfg.border, cfg.color) : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {c}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 ml-auto">
              {["all", ...sources].map(src => {
                const cfg = src !== "all" ? (SOURCE_CONFIG[src] ?? SOURCE_CONFIG.manual) : null;
                return (
                  <button
                    key={src}
                    onClick={() => setFilterSource(src)}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] font-mono transition-all border",
                      filterSource === src
                        ? src === "all" ? "bg-white/10 border-white/20 text-foreground" : cn(cfg?.cls)
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {src === "all" ? "All Sources" : cfg?.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-mono">Loading skills...</span>
                </div>
              </div>
            ) : skills.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-purple-400/50" />
                </div>
                <div className="text-center max-w-sm">
                  <p className="text-sm font-semibold mb-2">No skills yet</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Skills are automatically extracted from AutoResearch experiments with score ≥ 65%,
                    or add them manually from any agent terminal:
                  </p>
                  <code className="text-xs font-mono text-purple-400 mt-2 block">skill learn name: description</code>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-sm font-mono text-primary hover:bg-primary/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add First Skill
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <Search className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm font-mono text-muted-foreground">No skills match current filters</p>
                <button
                  onClick={() => { setSearch(""); setFilterCategory("all"); setFilterSource("all"); }}
                  className="text-xs font-mono text-primary hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className={cn(
                "grid gap-3",
                selectedSkill ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              )}>
                <AnimatePresence mode="popLayout">
                  {filtered.map(skill => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      selected={selectedId === skill.id}
                      onSelect={() => setSelectedId(selectedId === skill.id ? null : skill.id)}
                      onDelete={() => deleteSkill(skill.id)}
                      onLaunch={() => launchWithSkill(skill)}
                      deleting={deletingId === skill.id}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Detail panel */}
          <AnimatePresence>
            {selectedSkill && (
              <SkillDetailPanel
                skill={selectedSkill}
                onClose={() => setSelectedId(null)}
                onLaunch={() => launchWithSkill(selectedSkill)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
