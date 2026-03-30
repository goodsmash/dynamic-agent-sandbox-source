/**
 * OpenClaw AutoResearch Loop Engine
 *
 * Inspired by karpathy/autoresearch: AI agents that autonomously run experiments,
 * propose hypotheses, implement, evaluate, decide keep/discard, and iterate.
 *
 * Loop: Hypothesis → Implement → Evaluate → Decide → Iterate
 */

import { EventEmitter } from "events";
import { chatComplete } from "../lib/providerRouter.js";
import { db } from "@workspace/db";
import { researchRunsTable, researchExperimentsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { extractSkillFromExperiment, loadSkillsForAgent, formatSkillsForPrompt } from "../lib/skillsManager.js";
function nanoid(n = 12) { return randomBytes(Math.ceil(n * 0.75)).toString("base64url").slice(0, n); }

export type ResearchEvent =
  | { type: "run_start"; runId: string; goal: string; model: string }
  | { type: "iteration_start"; runId: string; iteration: number; hypothesis: string }
  | { type: "implementing"; runId: string; iteration: number; text: string }
  | { type: "evaluating"; runId: string; iteration: number }
  | { type: "experiment_done"; runId: string; iteration: number; score: number; delta: number; decision: "keep" | "discard" | "inconclusive"; reasoning: string }
  | { type: "skill_learned"; runId: string; iteration: number; skillName: string; skillDescription: string; category: string; skillId: string; score: number }
  | { type: "run_complete"; runId: string; totalIterations: number; bestScore: number; bestIteration: number; skillsLearned: number }
  | { type: "run_error"; runId: string; error: string }
  | { type: "log"; runId: string; message: string };

export const researchEmitter = new EventEmitter();
researchEmitter.setMaxListeners(100);

const activeRuns = new Map<string, { abort: AbortController; status: "running" | "paused" }>();

// ─── The Research Program (program.md equivalent) ─────────────────────────────
function buildProgramPrompt(goal: string, history: string, currentCode: string, knownSkills: string): string {
  return `You are an autonomous AI research agent operating in a continuous improvement loop, inspired by the karpathy/autoresearch framework.

## Research Goal
${goal}

## Your Mission
You run experiments autonomously. Each iteration you:
1. PROPOSE a concrete hypothesis (specific, testable, measurable)
2. IMPLEMENT the change (write actual code/config/approach)
3. EVALUATE against a quality metric (0.0–1.0 scale where 1.0 is perfect)
4. DECIDE: keep (improvement) or discard (regression)

## Experiment History
${history || "No experiments yet. This is iteration 1."}

## Current Best Implementation
\`\`\`
${currentCode || "(empty — start from scratch)"}
\`\`\`
${knownSkills ? `\n## Previously Learned Skills (reuse these!)\n${knownSkills}\n` : ""}
## Instructions
Propose the NEXT experiment. Be specific and concrete. Think about what has and hasn't worked.
Focus on one clear change at a time — small, targeted experiments win.
If relevant learned skills exist above, build on them rather than starting from scratch.

Respond in this EXACT format (JSON block):
\`\`\`json
{
  "hypothesis": "Brief description of what you will try and why",
  "implementation": "The actual implementation — code, config, prompt, or approach (be complete)",
  "expected_improvement": "What metric you expect to improve and by how much",
  "confidence": 0.0
}
\`\`\``;
}

function buildEvaluationPrompt(goal: string, hypothesis: string, implementation: string, baselineScore: number, history: string): string {
  return `You are an autonomous AI evaluator in a research loop.

## Research Goal
${goal}

## Hypothesis Being Tested
${hypothesis}

## Implementation
${implementation}

## Current Baseline Score
${baselineScore.toFixed(3)} / 1.000

## Previous Experiments Summary
${history || "First experiment."}

## Your Task
Evaluate this implementation against the research goal. Give a quality score from 0.0 to 1.0 where:
- 1.0 = perfectly solves the goal
- 0.8 = very good, significant improvement
- 0.6 = moderate improvement
- 0.5 = baseline (no change)
- 0.3 = regression
- 0.0 = completely fails

Consider: correctness, efficiency, elegance, robustness, alignment with goal.

Respond in this EXACT format (JSON block):
\`\`\`json
{
  "score": 0.0,
  "decision": "keep",
  "reasoning": "Detailed explanation of the score and decision",
  "key_strengths": ["strength1", "strength2"],
  "key_weaknesses": ["weakness1"],
  "next_direction": "Suggestion for the next experiment"
}
\`\`\``;
}

function parseJSON(text: string): any {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (match) {
    try { return JSON.parse(match[1].trim()); } catch {}
  }
  // Try raw JSON
  const raw = text.trim();
  try { return JSON.parse(raw); } catch {}
  // Try extracting from anywhere
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch {}
  }
  return null;
}

function buildHistory(experiments: Array<{ hypothesis: string; score?: number | null; decision: string; reasoning?: string | null; iteration: number }>): string {
  if (!experiments.length) return "";
  return experiments
    .slice(-5) // Last 5 experiments for context
    .map((e) => `Iteration ${e.iteration}: [${e.decision.toUpperCase()}] score=${e.score?.toFixed(3) ?? "?"} — ${e.hypothesis.slice(0, 100)}`)
    .join("\n");
}

// ─── Main Research Loop ────────────────────────────────────────────────────────
export async function startResearchLoop(params: {
  goal: string;
  model: string;
  maxIterations: number;
  sessionId?: string;
  programOverride?: string;
}): Promise<string> {
  const runId = nanoid(12);
  const abort = new AbortController();
  activeRuns.set(runId, { abort, status: "running" });

  // Create DB record
  await db.insert(researchRunsTable).values({
    id: runId,
    sessionId: params.sessionId ?? null,
    goal: params.goal,
    program: params.programOverride ?? buildProgramPrompt(params.goal, "", ""),
    model: params.model,
    status: "running",
    iterationCount: 0,
    metric: "quality_score",
  });

  emit({ type: "run_start", runId, goal: params.goal, model: params.model });
  emit({ type: "log", runId, message: `AutoResearch loop started. Goal: ${params.goal}` });
  emit({ type: "log", runId, message: `Model: ${params.model} | Max iterations: ${params.maxIterations}` });

  // Run async
  (async () => {
    let bestScore = 0;
    let bestIteration = 0;
    let currentCode = "";
    let skillsLearned = 0;
    const experiments: Array<{ hypothesis: string; score?: number | null; decision: string; reasoning?: string | null; iteration: number }> = [];

    // Load previously learned skills to seed the loop
    const existingSkills = await loadSkillsForAgent("any", 8);
    if (existingSkills.length > 0) {
      emit({ type: "log", runId, message: `📚 Loaded ${existingSkills.length} previously learned skills to guide experiments.` });
    }

    try {
      for (let iter = 1; iter <= params.maxIterations; iter++) {
        if (abort.signal.aborted) {
          emit({ type: "log", runId, message: "Research loop aborted by user." });
          break;
        }

        const runState = activeRuns.get(runId);
        if (runState?.status === "paused") {
          emit({ type: "log", runId, message: "Research loop paused. Waiting..." });
          await new Promise<void>((resolve) => {
            const check = setInterval(() => {
              const s = activeRuns.get(runId);
              if (s?.status === "running" || !s) { clearInterval(check); resolve(); }
            }, 1000);
          });
        }

        emit({ type: "log", runId, message: `\n━━━ ITERATION ${iter}/${params.maxIterations} ━━━` });

        // ── Phase 1: Propose hypothesis ────────────────────────────────────────
        const knownSkillsText = formatSkillsForPrompt(existingSkills);
        const proposalPrompt = buildProgramPrompt(params.goal, buildHistory(experiments), currentCode, knownSkillsText);

        emit({ type: "log", runId, message: "🧠 Proposing hypothesis..." });

        let proposalText = "";
        try {
          proposalText = await chatComplete(params.model, [
            { role: "system", content: "You are an autonomous research agent. Respond only with the JSON block." },
            { role: "user", content: proposalPrompt },
          ], 2048, params.sessionId);
        } catch (err) {
          emit({ type: "log", runId, message: `❌ Proposal failed: ${err instanceof Error ? err.message : err}` });
          continue;
        }

        const proposal = parseJSON(proposalText);
        if (!proposal?.hypothesis) {
          emit({ type: "log", runId, message: `⚠️ Could not parse proposal, skipping iteration.` });
          continue;
        }

        const hypothesis = proposal.hypothesis;
        const implementation = proposal.implementation ?? proposalText;

        emit({ type: "iteration_start", runId, iteration: iter, hypothesis });
        emit({ type: "implementing", runId, iteration: iter, text: implementation });
        emit({ type: "log", runId, message: `💡 Hypothesis: ${hypothesis}` });
        emit({ type: "log", runId, message: `⚙️  Expected: ${proposal.expected_improvement ?? "improvement"}` });

        // ── Phase 2: Evaluate ──────────────────────────────────────────────────
        emit({ type: "evaluating", runId, iteration: iter });
        emit({ type: "log", runId, message: "📊 Evaluating implementation..." });

        let evalText = "";
        try {
          evalText = await chatComplete(params.model, [
            { role: "system", content: "You are an autonomous evaluator. Respond only with the JSON block." },
            { role: "user", content: buildEvaluationPrompt(params.goal, hypothesis, implementation, bestScore, buildHistory(experiments)) },
          ], 1024, params.sessionId);
        } catch (err) {
          emit({ type: "log", runId, message: `❌ Evaluation failed: ${err instanceof Error ? err.message : err}` });
          continue;
        }

        const evaluation = parseJSON(evalText);
        const score = Math.max(0, Math.min(1, parseFloat(evaluation?.score ?? "0.5") || 0.5));
        const delta = score - bestScore;
        const rawDecision = evaluation?.decision ?? (delta > 0.01 ? "keep" : delta < -0.01 ? "discard" : "inconclusive");
        const decision: "keep" | "discard" | "inconclusive" =
          rawDecision === "keep" ? "keep" : rawDecision === "discard" ? "discard" : "inconclusive";
        const reasoning = evaluation?.reasoning ?? "No reasoning provided.";

        emit({ type: "log", runId, message: `📈 Score: ${score.toFixed(3)} (delta: ${delta >= 0 ? "+" : ""}${delta.toFixed(3)})` });
        emit({ type: "log", runId, message: `🔰 Decision: ${decision.toUpperCase()} — ${reasoning.slice(0, 200)}` });

        // ── Phase 3: Keep/Discard + Self-Learning ──────────────────────────────
        if (decision === "keep") {
          currentCode = implementation;
          if (score > bestScore) {
            bestScore = score;
            bestIteration = iter;
            emit({ type: "log", runId, message: `🏆 New best! Score ${score.toFixed(3)} at iteration ${iter}` });
          }

          // ── Self-learning: extract a reusable skill from high-score experiments
          if (score >= 0.65) {
            emit({ type: "log", runId, message: `🎓 Extracting reusable skill from this experiment...` });
            const skill = await extractSkillFromExperiment({
              goal: params.goal,
              hypothesis,
              implementation,
              score,
              runId,
              model: params.model,
              sessionId: params.sessionId,
            });
            if (skill) {
              skillsLearned++;
              existingSkills.push({ id: runId + "-" + iter, name: skill.name, description: skill.description, implementation, category: skill.category, score, source: "research" });
              emit({ type: "skill_learned", runId, iteration: iter, skillName: skill.name, skillDescription: skill.description, category: skill.category, skillId: skill.skillId ?? "", score });
              emit({ type: "log", runId, message: `✨ Skill learned: "${skill.name}" — ${skill.description}` });
            }
          }
        } else if (decision === "discard") {
          emit({ type: "log", runId, message: `🗑️  Discarded — reverting to previous best.` });
        } else {
          emit({ type: "log", runId, message: `🔄 Inconclusive — keeping current code, trying new approach.` });
        }

        // ── Save experiment to DB ──────────────────────────────────────────────
        await db.insert(researchExperimentsTable).values({
          runId,
          iteration: iter,
          hypothesis,
          implementation,
          evaluation: evalText,
          score,
          baselineScore: bestScore,
          delta,
          decision,
          reasoning: reasoning.slice(0, 2000),
          metadata: {
            strengths: evaluation?.key_strengths,
            weaknesses: evaluation?.key_weaknesses,
            nextDirection: evaluation?.next_direction,
          } as any,
        });

        experiments.push({ hypothesis, score, decision, reasoning, iteration: iter });

        emit({ type: "experiment_done", runId, iteration: iter, score, delta, decision, reasoning });

        // Update run stats
        await db.update(researchRunsTable)
          .set({ iterationCount: iter, bestScore, bestIteration, updatedAt: new Date() })
          .where(eq(researchRunsTable.id, runId));

        // Small delay between iterations
        await new Promise((r) => setTimeout(r, 500));
      }

      // ── Run complete ───────────────────────────────────────────────────────
      await db.update(researchRunsTable)
        .set({ status: "completed", iterationCount: experiments.length, bestScore, bestIteration, completedAt: new Date(), updatedAt: new Date() })
        .where(eq(researchRunsTable.id, runId));

      emit({ type: "run_complete", runId, totalIterations: experiments.length, bestScore, bestIteration, skillsLearned });
      emit({ type: "log", runId, message: `\n✅ Research complete! Best score: ${bestScore.toFixed(3)} at iteration ${bestIteration}${skillsLearned > 0 ? ` | 🎓 ${skillsLearned} new skill${skillsLearned > 1 ? "s" : ""} learned` : ""}` });

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await db.update(researchRunsTable)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(researchRunsTable.id, runId));
      emit({ type: "run_error", runId, error: msg });
    } finally {
      activeRuns.delete(runId);
    }
  })();

  return runId;
}

export function pauseResearchRun(runId: string) {
  const run = activeRuns.get(runId);
  if (run) run.status = "paused";
}

export function resumeResearchRun(runId: string) {
  const run = activeRuns.get(runId);
  if (run) run.status = "running";
}

export function abortResearchRun(runId: string) {
  const run = activeRuns.get(runId);
  if (run) run.abort.abort();
  activeRuns.delete(runId);
}

function emit(event: ResearchEvent) {
  researchEmitter.emit("event", event);
  researchEmitter.emit(`run:${(event as any).runId}`, event);
}
