/**
 * Skills API — Persistent self-learning skill store
 *
 * GET  /api/skills              — list all skills
 * POST /api/skills              — create a skill manually
 * GET  /api/skills/:id          — get a skill
 * DELETE /api/skills/:id        — delete a skill
 * GET  /api/skills/agent/:type  — get skills for a specific agent type
 */

import { Router, type IRouter } from "express";
import { saveSkill, listAllSkills, deleteSkill, loadSkillsForAgent } from "../lib/skillsManager.js";
import { db } from "@workspace/db";
import { skillsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const skills = await listAllSkills();
    res.json(skills);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/agent/:type", async (req, res) => {
  try {
    const type = req.params.type as any;
    const skills = await loadSkillsForAgent(type, 50);
    res.json(skills);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/", async (req, res) => {
  const { name, description, implementation, category, agentType, sessionId } = req.body;
  if (!name || !description) {
    res.status(400).json({ error: "name and description are required" });
    return;
  }
  try {
    const id = await saveSkill({
      name,
      description,
      implementation: implementation ?? description,
      category: category ?? "general",
      agentType: agentType ?? "openclaw",
      sessionId,
      source: "manual",
      score: 0.7,
    });
    res.json({ id, ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/:id", async (req, res) => {
  const [skill] = await db.select().from(skillsTable).where(eq(skillsTable.id, req.params.id)).limit(1);
  if (!skill) { res.status(404).json({ error: "not_found" }); return; }
  res.json(skill);
});

router.delete("/:id", async (req, res) => {
  await deleteSkill(req.params.id);
  res.json({ ok: true });
});

export default router;
