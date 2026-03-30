/**
 * Token Usage API
 *
 * GET /api/usage/summary      — aggregate by provider
 * GET /api/usage/by-model     — aggregate by model
 * GET /api/usage/by-day       — daily cost/token trend
 * GET /api/usage/totals       — all-time totals
 * GET /api/usage/today        — today only totals
 * GET /api/usage/recent       — last N calls
 * GET /api/usage/session/:id  — per-session breakdown
 */

import { Router, type IRouter } from "express";
import {
  getUsageSummary,
  getUsageSummaryByModel,
  getUsageSummaryByDay,
  getUsageTotals,
  getUsageTotalsToday,
  getUsageBySession,
  getRecentUsage,
} from "../lib/usageTracker.js";

const router: IRouter = Router();

router.get("/summary", async (_req, res) => {
  try {
    const summary = await getUsageSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch usage summary", message: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/by-model", async (_req, res) => {
  try {
    const rows = await getUsageSummaryByModel();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch model usage", message: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/by-day", async (req, res) => {
  try {
    const days = Math.min(parseInt(String(req.query.days ?? "7"), 10), 90);
    const rows = await getUsageSummaryByDay(days);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch daily usage", message: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/totals", async (_req, res) => {
  try {
    const totals = await getUsageTotals();
    res.json(totals);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch totals", message: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/today", async (_req, res) => {
  try {
    const today = await getUsageTotalsToday();
    res.json(today);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch today totals", message: err instanceof Error ? err.message : String(err) });
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
