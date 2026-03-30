/**
 * Token Usage API
 *
 * GET /api/usage/summary     — aggregate by provider
 * GET /api/usage/recent      — last 50 calls
 * GET /api/usage/session/:id — per-session breakdown
 */

import { Router, type IRouter } from "express";
import { getUsageSummary, getUsageBySession, getRecentUsage } from "../lib/usageTracker.js";

const router: IRouter = Router();

router.get("/summary", async (req, res) => {
  try {
    const summary = await getUsageSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch usage summary", message: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/recent", async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10), 200);
    const rows = await getRecentUsage(limit);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recent usage", message: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/session/:sessionId", async (req, res) => {
  try {
    const rows = await getUsageBySession(req.params.sessionId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch session usage", message: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
