import React, { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MULTI_PROVIDER_MODELS } from "@/lib/models";
import {
  Play, Pause, Square, RefreshCw, ChevronDown, ChevronUp,
  Brain, Lightbulb, CheckCircle2, XCircle, HelpCircle, TrendingUp,
  FlaskConical, Zap, Clock, Award, BarChart3,
} from "lucide-react";

const API = "/api";

interface ResearchEvent {
  type: string;
  runId: string;
  iteration?: number;
  hypothesis?: string;
  text?: string;
  score?: number;
  delta?: number;
  decision?: "keep" | "discard" | "inconclusive";
  reasoning?: string;
  message?: string;
  goal?: string;
  model?: string;
  totalIterations?: number;
  bestScore?: number;
  bestIteration?: number;
  error?: string;
}

interface Experiment {
  iteration: number;
  hypothesis: string;
  score?: number;
  delta?: number;
  decision: "keep" | "discard" | "inconclusive" | "pending";
  reasoning?: string;
  expanded?: boolean;
}

interface RunState {
  runId: string;
  goal: string;
  model: string;
  status: "running" | "paused" | "completed" | "failed" | "idle";
  iterationCount: number;
  bestScore: number;
  bestIteration: number;
  experiments: Experiment[];
  logs: string[];
}

const EXAMPLE_GOALS = [
  "Design an optimal prompt engineering strategy for coding assistants that minimizes hallucinations",
  "Find the best chain-of-thought approach for complex math reasoning tasks",
  "Develop a RAG architecture that maximizes retrieval precision for technical documents",
  "Optimize a system prompt for creative writing that balances creativity with coherence",
  "Create the most effective few-shot examples for sentiment analysis",
  "Design an agent loop that best handles multi-step data analysis tasks",
];

export default function Research() {
  const [goal, setGoal] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [maxIterations, setMaxIterations] = useState(5);
  const [runState, setRunState] = useState<RunState | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [pastRuns, setPastRuns] = useState<any[]>([]);
  const [showPastRuns, setShowPastRuns] = useState(false);
  const [expandedExp, setExpandedExp] = useState<number | null>(null);
  const logsRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetchPastRuns();
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [runState?.logs]);

  async function fetchPastRuns() {
    try {
      const resp = await fetch(`${API}/research/runs`);
      if (resp.ok) setPastRuns(await resp.json());
    } catch {}
  }

  function subscribeToRun(runId: string) {
    eventSourceRef.current?.close();
    const es = new EventSource(`${API}/research/${runId}/stream`);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const event: ResearchEvent = JSON.parse(e.data);
      handleEvent(event);
    };

    es.onerror = () => {
      es.close();
    };
  }

  const handleEvent = useCallback((event: ResearchEvent) => {
    setRunState((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };

      switch (event.type) {
        case "log":
          updated.logs = [...updated.logs, event.message ?? ""];
          break;
        case "iteration_start":
          updated.iterationCount = event.iteration ?? updated.iterationCount;
          updated.experiments = [
            ...updated.experiments.filter((e) => e.iteration !== event.iteration),
            {
              iteration: event.iteration!,
              hypothesis: event.hypothesis!,
              decision: "pending",
            },
          ];
          break;
        case "experiment_done":
          updated.experiments = updated.experiments.map((e) =>
            e.iteration === event.iteration
              ? { ...e, score: event.score, delta: event.delta, decision: event.decision!, reasoning: event.reasoning }
              : e
          );
          if ((event.score ?? 0) > updated.bestScore) {
            updated.bestScore = event.score ?? 0;
            updated.bestIteration = event.iteration ?? 0;
          }
          break;
        case "run_complete":
          updated.status = "completed";
          updated.bestScore = event.bestScore ?? updated.bestScore;
          updated.bestIteration = event.bestIteration ?? updated.bestIteration;
          eventSourceRef.current?.close();
          fetchPastRuns();
          break;
        case "run_error":
          updated.status = "failed";
          updated.logs = [...updated.logs, `❌ ERROR: ${event.error}`];
          eventSourceRef.current?.close();
          break;
      }

      return updated;
    });
  }, []);

  async function startRun() {
    if (!goal.trim()) return;
    setIsStarting(true);

    try {
      const resp = await fetch(`${API}/research/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.trim(), model, maxIterations }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        alert(`Failed to start: ${err.message}`);
        return;
      }

      const { runId } = await resp.json();
      setRunState({
        runId,
        goal: goal.trim(),
        model,
        status: "running",
        iterationCount: 0,
        bestScore: 0,
        bestIteration: 0,
        experiments: [],
        logs: [],
      });
      setExpandedExp(null);
      subscribeToRun(runId);
    } finally {
      setIsStarting(false);
    }
  }

  async function pauseRun() {
    if (!runState) return;
    await fetch(`${API}/research/${runState.runId}/pause`, { method: "POST" });
    setRunState((p) => p ? { ...p, status: "paused" } : p);
  }

  async function resumeRun() {
    if (!runState) return;
    await fetch(`${API}/research/${runState.runId}/resume`, { method: "POST" });
    setRunState((p) => p ? { ...p, status: "running" } : p);
  }

  async function abortRun() {
    if (!runState) return;
    await fetch(`${API}/research/${runState.runId}`, { method: "DELETE" });
    eventSourceRef.current?.close();
    setRunState((p) => p ? { ...p, status: "failed" } : p);
  }

  async function loadRun(run: any) {
    const resp = await fetch(`${API}/research/${run.id}`);
    if (!resp.ok) return;
    const data = await resp.json();
    setRunState({
      runId: data.id,
      goal: data.goal,
      model: data.model,
      status: data.status,
      iterationCount: data.iterationCount,
      bestScore: data.bestScore ?? 0,
      bestIteration: data.bestIteration ?? 0,
      experiments: (data.experiments ?? []).map((e: any) => ({
        iteration: e.iteration,
        hypothesis: e.hypothesis,
        score: e.score,
        delta: e.delta,
        decision: e.decision,
        reasoning: e.reasoning,
      })),
      logs: [`Loaded run: ${data.id}`, `Goal: ${data.goal}`, `Status: ${data.status}`],
    });
  }

  const decisionIcon = (d: string) => {
    if (d === "keep") return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    if (d === "discard") return <XCircle className="w-4 h-4 text-red-400" />;
    if (d === "pending") return <RefreshCw className="w-3.5 h-3.5 text-yellow-400 animate-spin" />;
    return <HelpCircle className="w-4 h-4 text-yellow-400" />;
  };

  const decisionColor = (d: string) => {
    if (d === "keep") return "border-green-500/30 bg-green-500/5";
    if (d === "discard") return "border-red-500/30 bg-red-500/5";
    if (d === "pending") return "border-yellow-500/30 bg-yellow-500/5";
    return "border-border bg-background/30";
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">AUTOEXPERIMENT</div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary" />
              AutoResearch Loop
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Autonomous AI experiment loop — propose, implement, evaluate, iterate. Inspired by{" "}
              <a href="https://github.com/karpathy/autoresearch" target="_blank" rel="noopener" className="text-primary underline">
                karpathy/autoresearch
              </a>
            </p>
          </div>

          <button
            onClick={() => { setShowPastRuns(!showPastRuns); fetchPastRuns(); }}
            className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1.5 border border-border/50 rounded-lg px-3 py-2"
          >
            <Clock className="w-3.5 h-3.5" />
            PAST RUNS ({pastRuns.length})
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* ── Left: Config + Experiments ────────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Config panel */}
            {!runState && (
              <div className="p-6 border-b border-border/40">
                <div className="max-w-2xl space-y-4">
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 block">
                      Research Goal
                    </label>
                    <textarea
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm font-mono text-foreground resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/50"
                      rows={3}
                      placeholder="Describe what you want to research and optimize..."
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {EXAMPLE_GOALS.slice(0, 3).map((g, i) => (
                        <button
                          key={i}
                          onClick={() => setGoal(g)}
                          className="text-[10px] font-mono text-muted-foreground hover:text-primary border border-border/40 hover:border-primary/30 rounded px-2 py-1 transition-colors"
                        >
                          {g.slice(0, 50)}…
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 block">Model</label>
                      <select
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                      >
                        {MULTI_PROVIDER_MODELS.filter((m) => !m.tags.includes("local")).map((m) => (
                          <option key={m.id} value={m.id}>
                            [{m.provider}] {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-40">
                      <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 block">Iterations</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={1}
                          max={20}
                          value={maxIterations}
                          onChange={(e) => setMaxIterations(parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm font-mono text-primary w-8">{maxIterations}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">~{maxIterations * 20}s est.</div>
                    </div>
                  </div>

                  <button
                    onClick={startRun}
                    disabled={isStarting || !goal.trim()}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-mono font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    {isStarting ? "STARTING..." : "RUN AUTOEXPERIMENT"}
                  </button>
                </div>
              </div>
            )}

            {/* Run header */}
            {runState && (
              <div className="px-6 py-3 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    runState.status === "running" ? "bg-green-400 animate-pulse" :
                    runState.status === "paused" ? "bg-yellow-400" :
                    runState.status === "completed" ? "bg-blue-400" : "bg-red-400"
                  )} />
                  <div>
                    <div className="text-xs font-mono text-muted-foreground">{runState.status.toUpperCase()} · {runState.model}</div>
                    <div className="text-sm font-medium truncate max-w-md">{runState.goal}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {runState.bestScore > 0 && (
                    <div className="text-xs font-mono text-muted-foreground flex items-center gap-1.5 border border-border/40 rounded px-2 py-1">
                      <Award className="w-3 h-3 text-yellow-400" />
                      Best: {(runState.bestScore * 100).toFixed(1)}% @ iter {runState.bestIteration}
                    </div>
                  )}
                  <div className="text-xs font-mono text-muted-foreground border border-border/40 rounded px-2 py-1">
                    {runState.iterationCount}/{maxIterations} iters
                  </div>

                  {runState.status === "running" && (
                    <button onClick={pauseRun} className="p-1.5 hover:bg-yellow-500/10 rounded text-yellow-400 border border-yellow-500/20">
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {runState.status === "paused" && (
                    <button onClick={resumeRun} className="p-1.5 hover:bg-green-500/10 rounded text-green-400 border border-green-500/20">
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {(runState.status === "running" || runState.status === "paused") && (
                    <button onClick={abortRun} className="p-1.5 hover:bg-red-500/10 rounded text-red-400 border border-red-500/20">
                      <Square className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {(runState.status === "completed" || runState.status === "failed") && (
                    <button
                      onClick={() => { setRunState(null); setGoal(runState.goal); }}
                      className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 border border-border/40 rounded hover:bg-white/5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      NEW RUN
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Experiments */}
            {runState && (
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {runState.experiments.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 animate-pulse" />
                      <span className="text-sm font-mono">Preparing first hypothesis...</span>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {runState.experiments.map((exp) => (
                    <motion.div
                      key={exp.iteration}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("border rounded-lg overflow-hidden", decisionColor(exp.decision))}
                    >
                      <button
                        onClick={() => setExpandedExp(expandedExp === exp.iteration ? null : exp.iteration)}
                        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-muted-foreground w-16">ITER {exp.iteration}</span>
                          {decisionIcon(exp.decision)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{exp.hypothesis}</div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {exp.score !== undefined && (
                            <>
                              <div className="flex items-center gap-1">
                                <BarChart3 className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs font-mono">{(exp.score * 100).toFixed(1)}%</span>
                              </div>
                              {exp.delta !== undefined && (
                                <span className={cn(
                                  "text-[10px] font-mono",
                                  exp.delta > 0 ? "text-green-400" : exp.delta < 0 ? "text-red-400" : "text-muted-foreground"
                                )}>
                                  {exp.delta >= 0 ? "+" : ""}{(exp.delta * 100).toFixed(1)}%
                                </span>
                              )}
                            </>
                          )}
                          {expandedExp === exp.iteration ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {expandedExp === exp.iteration && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
                              <div>
                                <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Reasoning</div>
                                <div className="text-xs text-muted-foreground leading-relaxed">{exp.reasoning ?? "Awaiting evaluation..."}</div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Score progress */}
                {runState.experiments.filter((e) => e.score !== undefined).length > 1 && (
                  <div className="mt-4 p-4 border border-border/40 rounded-lg bg-background/30">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase mb-3 flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" /> Score Progression
                    </div>
                    <div className="flex items-end gap-1.5 h-16">
                      {runState.experiments
                        .filter((e) => e.score !== undefined)
                        .map((e) => (
                          <div key={e.iteration} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className={cn("w-full rounded-sm transition-all", e.decision === "keep" ? "bg-green-500" : e.decision === "discard" ? "bg-red-500/50" : "bg-yellow-500/50")}
                              style={{ height: `${(e.score! * 100).toFixed(0)}%` }}
                            />
                            <span className="text-[9px] font-mono text-muted-foreground">{e.iteration}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Live Log + Past Runs ─────────────────────────────── */}
          <div className="w-80 border-l border-border/40 flex flex-col">
            {/* Live terminal log */}
            <div className="border-b border-border/40 px-3 py-2 flex items-center justify-between">
              <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-yellow-400" /> LIVE LOG
              </div>
              {runState?.status === "running" && (
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              )}
            </div>
            <div
              ref={logsRef}
              className="flex-1 overflow-y-auto p-3 space-y-0.5 font-mono text-[11px] text-muted-foreground bg-black/20"
            >
              {!runState ? (
                <div className="text-muted-foreground/40 mt-4 text-center text-xs">Start a run to see live output</div>
              ) : (
                runState.logs.map((log, i) => (
                  <div
                    key={i}
                    className={cn(
                      "leading-relaxed",
                      log.includes("✅") || log.includes("🏆") ? "text-green-400" :
                      log.includes("❌") || log.includes("🗑️") ? "text-red-400" :
                      log.includes("━━━") ? "text-primary font-bold" :
                      log.includes("💡") ? "text-yellow-300" :
                      log.includes("📊") || log.includes("📈") ? "text-blue-400" :
                      log.includes("🔰") ? "text-purple-400" : ""
                    )}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>

            {/* Past runs */}
            <div className="border-t border-border/40">
              <button
                onClick={() => setShowPastRuns(!showPastRuns)}
                className="w-full px-3 py-2 text-[10px] font-mono text-muted-foreground hover:text-foreground flex items-center justify-between"
              >
                <span>PAST RUNS</span>
                {showPastRuns ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <AnimatePresence>
                {showPastRuns && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="max-h-48 overflow-y-auto">
                      {pastRuns.length === 0 ? (
                        <div className="px-3 py-2 text-[10px] text-muted-foreground/50">No past runs</div>
                      ) : (
                        pastRuns.map((run) => (
                          <button
                            key={run.id}
                            onClick={() => loadRun(run)}
                            className="w-full text-left px-3 py-2 hover:bg-white/5 border-t border-border/20 text-xs"
                          >
                            <div className={cn(
                              "text-[10px] font-mono mb-0.5",
                              run.status === "completed" ? "text-green-400" :
                              run.status === "running" ? "text-yellow-400" : "text-red-400"
                            )}>
                              [{run.status?.toUpperCase()}] {run.iterationCount} iters
                            </div>
                            <div className="text-muted-foreground truncate">{run.goal?.slice(0, 50)}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
