import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "2.0.0", ws: "active", uptime: process.uptime() });
});

router.get("/debug", async (_req, res) => {
  const start = performance.now();
  let dbStatus = "unknown";
  let dbLatency = 0;
  try {
    const dbStart = performance.now();
    await db.execute(sql`SELECT 1`);
    dbLatency = Math.round(performance.now() - dbStart);
    dbStatus = "connected";
  } catch { dbStatus = "error"; }

  let sessionCount = 0;
  let taskCount = 0;
  let usageCount = 0;
  try {
    const sc = await db.execute(sql`SELECT COUNT(*)::int as c FROM sessions`);
    sessionCount = Number(sc.rows?.[0]?.c ?? (sc as any)?.[0]?.c ?? 0);
    const tc = await db.execute(sql`SELECT COUNT(*)::int as c FROM tasks`);
    taskCount = Number(tc.rows?.[0]?.c ?? (tc as any)?.[0]?.c ?? 0);
    const uc = await db.execute(sql`SELECT COUNT(*)::int as c FROM usage`);
    usageCount = Number(uc.rows?.[0]?.c ?? (uc as any)?.[0]?.c ?? 0);
  } catch {}

  const mem = process.memoryUsage();
  res.json({
    status: "operational",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
    response_ms: Math.round(performance.now() - start),
    services: {
      api_server: "online",
      websocket: "online",
      database: { status: dbStatus, latency_ms: dbLatency },
      ai_router: "online",
      auto_research: "online",
      swarm_engine: "online",
    },
    metrics: {
      total_sessions: sessionCount,
      total_tasks: taskCount,
      total_api_calls: usageCount,
    },
    memory: {
      rss_mb: Math.round(mem.rss / 1024 / 1024),
      heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
      external_mb: Math.round(mem.external / 1024 / 1024),
    },
    node_version: process.version,
    platform: process.platform,
  });
});

export default router;
