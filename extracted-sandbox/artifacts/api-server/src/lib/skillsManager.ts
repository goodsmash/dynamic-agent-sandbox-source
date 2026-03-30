/**
 * SkillsManager — Persistent skill store for self-learning agents.
 *
 * Agents accumulate skills from:
 *   1. Research runs (high-score experiments → distilled skills)
 *   2. Manual `skill learn` commands
 *   3. Auto-extraction from successful task completions
 *
 * Skills are injected into agent system prompts for continuous improvement.
 */

import { db } from "@workspace/db";
import { skillsTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { chatComplete } from "./providerRouter.js";

export type AgentType = "openclaw" | "nanoclaw" | "nemoclaw" | "any";

// ─── Save a skill ─────────────────────────────────────────────────────────────
export async function saveSkill(params: {
  name: string;
  description: string;
  implementation: string;
  category?: string;
  score?: number;
  agentType?: AgentType;
  sessionId?: string;
  runId?: string;
  source?: "research" | "manual" | "auto";
}): Promise<string> {
  const [row] = await db
    .insert(skillsTable)
    .values({
      name: params.name.slice(0, 100),
      description: params.description.slice(0, 500),
      implementation: params.implementation.slice(0, 5000),
      category: params.category ?? "general",
      score: params.score ?? 0,
      agentType: params.agentType ?? "openclaw",
      sessionId: params.sessionId,
      runId: params.runId,
      source: params.source ?? "manual",
    })
    .returning({ id: skillsTable.id });
  return row.id;
}

// ─── Load top skills for an agent ────────────────────────────────────────────
export async function loadSkillsForAgent(agentType: AgentType, limit = 10): Promise<Array<{
  id: string; name: string; description: string; implementation: string; category: string; score: number; source: string;
}>> {
  try {
    const rows = await db
      .select({
        id: skillsTable.id,
        name: skillsTable.name,
        description: skillsTable.description,
        implementation: skillsTable.implementation,
        category: skillsTable.category,
        score: skillsTable.score,
        source: skillsTable.source,
      })
      .from(skillsTable)
      .where(
        agentType === "any"
          ? undefined
          : eq(skillsTable.agentType, agentType)
      )
      .orderBy(desc(skillsTable.score), desc(skillsTable.createdAt))
      .limit(limit);
    return rows;
  } catch {
    return [];
  }
}

// ─── Format skills as system prompt block ─────────────────────────────────────
export function formatSkillsForPrompt(skills: Array<{ name: string; description: string; category: string; score: number }>): string {
  if (!skills.length) return "";
  const lines = skills.map(
    (s) => `• [${s.category}] ${s.name} (score: ${(s.score * 100).toFixed(0)}%): ${s.description}`
  );
  return `## Learned Skills (from research + experience)\n${lines.join("\n")}`;
}

// ─── Extract and save a skill from a successful research experiment ───────────
export async function extractSkillFromExperiment(params: {
  goal: string;
  hypothesis: string;
  implementation: string;
  score: number;
  runId: string;
  model: string;
  sessionId?: string;
}): Promise<{ name: string; description: string; category: string } | null> {
  if (params.score < 0.65) return null;

  try {
    const extractPrompt = `You are extracting a reusable skill from a successful AI research experiment.

Research Goal: ${params.goal}
Hypothesis Tested: ${params.hypothesis}
Implementation: ${params.implementation.slice(0, 1000)}
Score: ${(params.score * 100).toFixed(1)}%

Extract the core reusable skill from this successful experiment.

Respond in JSON:
\`\`\`json
{
  "name": "short_snake_case_name",
  "description": "One sentence: what this skill does and when to use it",
  "category": "prompting|reasoning|coding|analysis|research|architecture|evaluation"
}
\`\`\``;

    const raw = await chatComplete(params.model, [
      { role: "system", content: "Extract a reusable skill from this research experiment. Respond only with the JSON block." },
      { role: "user", content: extractPrompt },
    ], 512);

    const match = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/\{[\s\S]*?\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[1] ?? match[0]);
    if (!parsed?.name || !parsed?.description) return null;

    const skillId = await saveSkill({
      name: parsed.name,
      description: parsed.description,
      implementation: params.implementation.slice(0, 3000),
      category: parsed.category ?? "general",
      score: params.score,
      agentType: "any",
      sessionId: params.sessionId,
      runId: params.runId,
      source: "research",
    });

    return { name: parsed.name, description: parsed.description, category: parsed.category ?? "general", skillId: String(skillId) };
  } catch {
    return null;
  }
}

// ─── Delete a skill ───────────────────────────────────────────────────────────
export async function deleteSkill(id: string): Promise<void> {
  await db.delete(skillsTable).where(eq(skillsTable.id, id));
}

// ─── List all skills ─────────────────────────────────────────────────────────
export async function listAllSkills(): Promise<typeof skillsTable.$inferSelect[]> {
  return db.select().from(skillsTable).orderBy(desc(skillsTable.score), desc(skillsTable.createdAt)).limit(100);
}

// ─── Increment use count ──────────────────────────────────────────────────────
export async function incrementSkillUseCount(id: string): Promise<void> {
  await db
    .update(skillsTable)
    .set({ useCount: (skillsTable.useCount as any) + 1, updatedAt: new Date() })
    .where(eq(skillsTable.id, id));
}
