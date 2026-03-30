/**
 * AutoResearch API — karpathy/autoresearch-inspired autonomous experiment loop
 *
 * POST /api/research/run          — start a new research loop
 * GET  /api/research/runs         — list all runs
 * GET  /api/research/:id          — get run details + experiments
 * GET  /api/research/:id/stream   — SSE stream of live events
 * POST /api/research/:id/pause    — pause a running loop
 * POST /api/research/:id/resume   — resume a paused loop
 * DELETE /api/research/:id        — abort a running loop
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { researchRunsTable, researchExperimentsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  startResearchLoop,
  pauseResearchRun,
  resumeResearchRun,
  abortResearchRun,
  researchEmitter,
  type ResearchEvent,
} from "../agent/ResearchLoop.js";

const router: IRouter = Router();

// ─── POST /api/research/run ────────────────────────────────────────────────────
router.post("/run", async (req, res) => {
  const { goal, model, maxIterations, sessionId, program } = req.body as {
    goal: string;
    model?: string;
    maxIterations?: number;
    sessionId?: string;
    program?: string;
  };

  if (!goal || typeof goal !== "string" || goal.trim().length < 5) {
    res.status(400).json({ error: "validation_error", message: "goal is required (min 5 chars)" });
    return;
  }

  const runId = await startResearchLoop({
    goal: goal.trim(),
    model: model ?? "gpt-4o",
    maxIterations: Math.max(1, Math.min(maxIterations ?? 5, 50)),
    sessionId,
    programOverride: program,
  });

  res.json({ runId, message: "Research loop started", goal, model: model ?? "gpt-4o" });
});

// ─── GET /api/research/runs ────────────────────────────────────────────────────
router.get("/runs", async (req, res) => {
  const runs = await db.select().from(researchRunsTable).orderBy(desc(researchRunsTable.createdAt)).limit(20);
  res.json(runs);
});

// ─── GET /api/research/:id ─────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  const [run] = await db.select().from(researchRunsTable).where(eq(researchRunsTable.id, req.params.id)).limit(1);
  if (!run) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const experiments = await db
    .select()
    .from(researchExperimentsTable)
    .where(eq(researchExperimentsTable.runId, req.params.id))
    .orderBy(researchExperimentsTable.iteration);

  res.json({ ...run, experiments });
});

// ─── GET /api/research/:id/stream ─────────────────────────────────────────────
router.get("/:id/stream", (req: Request, res: Response) => {
  const { id } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sendEvent = (event: ResearchEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  researchEmitter.on(`run:${id}`, sendEvent);

  req.on("close", () => {
    researchEmitter.off(`run:${id}`, sendEvent);
  });
});

// ─── POST /api/research/:id/pause ─────────────────────────────────────────────
router.post("/:id/pause", (req, res) => {
  pauseResearchRun(req.params.id);
  res.json({ ok: true, status: "paused" });
});

// ─── POST /api/research/:id/resume ────────────────────────────────────────────
router.post("/:id/resume", (req, res) => {
  resumeResearchRun(req.params.id);
  res.json({ ok: true, status: "running" });
});

// ─── DELETE /api/research/:id ─────────────────────────────────────────────────
router.delete("/:id", (req, res) => {
  abortResearchRun(req.params.id);
  res.json({ ok: true, message: "Research loop aborted" });
});

export default router;
