import { pgTable, text, timestamp, integer, real, serial } from "drizzle-orm/pg-core";

export const usageTable = pgTable("usage", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id"),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  latencyMs: integer("latency_ms"),
  estimatedCostUsd: real("estimated_cost_usd"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Usage = typeof usageTable.$inferSelect;
export type InsertUsage = typeof usageTable.$inferInsert;
