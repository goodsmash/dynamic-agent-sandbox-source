/**
 * Provider management API
 *
 * GET  /api/providers            — list all providers with status
 * GET  /api/providers/:id        — get single provider config
 * PUT  /api/providers/:id        — save/update API key and baseUrl
 * DELETE /api/providers/:id      — remove API key
 * POST /api/providers/:id/test   — test connection to provider
 * GET  /api/providers/:id/models — list popular models for provider
 */

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { providersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { PROVIDER_DEFS, PROVIDER_MAP } from "../lib/providerConfig.js";
import { testProvider, invalidateProviderCache } from "../lib/providerRouter.js";
import { fetchLiveModels, invalidateLiveModelCache } from "../lib/liveModels.js";

const router: IRouter = Router();

function maskKey(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "•".repeat(Math.min(key.length - 8, 20)) + key.slice(-4);
}

// ─── GET /api/providers ────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  const rows = await db.select().from(providersTable);
  const rowMap = Object.fromEntries(rows.map((r) => [r.id, r]));

  const providers = PROVIDER_DEFS.map((def) => {
    const row = rowMap[def.id];
    const hasKey = def.needsKey ? !!(row?.apiKey) : true;
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      color: def.color,
      pricingTier: def.pricingTier,
      pricingNote: def.pricingNote,
      needsKey: def.needsKey,
      free: def.free ?? false,
      docsUrl: def.docsUrl,
      configured: hasKey,
      enabled: row?.enabled ?? true,
      apiKey: maskKey(row?.apiKey),
      baseUrl: row?.baseUrl ?? def.defaultBaseUrl,
      defaultBaseUrl: def.defaultBaseUrl,
      popularModels: def.popularModels,
      modelPrefixes: def.modelPrefixes,
      supportsStreaming: def.supportsStreaming,
    };
  });

  res.json(providers);
});

// ─── GET /api/providers/:id ────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  const def = PROVIDER_MAP[req.params.id];
  if (!def) {
    res.status(404).json({ error: "not_found", message: "Provider not found" });
    return;
  }

  const [row] = await db.select().from(providersTable).where(eq(providersTable.id, req.params.id)).limit(1);
  const hasKey = def.needsKey ? !!(row?.apiKey) : true;

  res.json({
    id: def.id,
    name: def.name,
    configured: hasKey,
    apiKey: maskKey(row?.apiKey),
    baseUrl: row?.baseUrl ?? def.defaultBaseUrl,
    defaultBaseUrl: def.defaultBaseUrl,
    enabled: row?.enabled ?? true,
    popularModels: def.popularModels,
  });
});

// ─── PUT /api/providers/:id ────────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  const def = PROVIDER_MAP[req.params.id];
  if (!def) {
    res.status(404).json({ error: "not_found", message: "Provider not found" });
    return;
  }

  const { apiKey, baseUrl, enabled } = req.body as { apiKey?: string; baseUrl?: string; enabled?: boolean };

  await db
    .insert(providersTable)
    .values({
      id: req.params.id,
      name: def.name,
      apiKey: apiKey || null,
      baseUrl: baseUrl || null,
      enabled: enabled !== false,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: providersTable.id,
      set: {
        ...(apiKey !== undefined ? { apiKey: apiKey || null } : {}),
        ...(baseUrl !== undefined ? { baseUrl: baseUrl || null } : {}),
        ...(enabled !== undefined ? { enabled } : {}),
        updatedAt: new Date(),
      },
    });

  invalidateProviderCache(req.params.id);

  res.json({ ok: true, message: `Provider ${def.name} updated.` });
});

// ─── DELETE /api/providers/:id ─────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  await db.delete(providersTable).where(eq(providersTable.id, req.params.id));
  invalidateProviderCache(req.params.id);
  res.json({ ok: true });
});

// ─── POST /api/providers/:id/test ─────────────────────────────────────────────
router.post("/:id/test", async (req, res) => {
  const def = PROVIDER_MAP[req.params.id];
  if (!def) {
    res.status(404).json({ error: "not_found", message: "Provider not found" });
    return;
  }

  const { model } = req.body as { model?: string };
  const result = await testProvider(req.params.id, model);
  res.json(result);
});

// ─── GET /api/providers/:id/models ────────────────────────────────────────────
router.get("/:id/models", (req, res) => {
  const def = PROVIDER_MAP[req.params.id];
  if (!def) {
    res.status(404).json({ error: "not_found", message: "Provider not found" });
    return;
  }
  res.json({ id: def.id, models: def.popularModels });
});

// ─── GET /api/providers/:id/models/live ───────────────────────────────────────
router.get("/:id/models/live", async (req, res) => {
  const def = PROVIDER_MAP[req.params.id];
  if (!def) {
    res.status(404).json({ error: "not_found", message: "Provider not found" });
    return;
  }

  const result = await fetchLiveModels(req.params.id);
  res.json(result);
});

// ─── POST /api/providers/:id/models/refresh ───────────────────────────────────
router.post("/:id/models/refresh", async (req, res) => {
  const def = PROVIDER_MAP[req.params.id];
  if (!def) {
    res.status(404).json({ error: "not_found", message: "Provider not found" });
    return;
  }

  invalidateLiveModelCache(req.params.id);
  const result = await fetchLiveModels(req.params.id);
  res.json(result);
});

export default router;
