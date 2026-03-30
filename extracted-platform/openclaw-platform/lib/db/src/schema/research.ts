import { pgTable, text, timestamp, integer, real, serial, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const researchStatusEnum = pgEnum("research_status", [
  "running",
  "paused",
  "completed",
  "failed",
]);

export const experimentDecisionEnum = pgEnum("experiment_decision", [
  "keep",
  "discard",
  "inconclusive",
  "pending",
]);

export const researchRunsTable = pgTable("research_runs", {
  id: text("id").primaryKey(),
  sessionId: text("session_id"),
  goal: text("goal").notNull(),
  program: text("program").notNull(),
  model: text("model").notNull(),
  status: researchStatusEnum("status").notNull().default("running"),
  iterationCount: integer("iteration_count").notNull().default(0),
  bestScore: real("best_score"),
  bestIteration: integer("best_iteration"),
  metric: text("metric").notNull().default("quality_score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const researchExperimentsTable = pgTable("research_experiments", {
  id: serial("id").primaryKey(),
  runId: text("run_id").notNull(),
  iteration: integer("iteration").notNull(),
  hypothesis: text("hypothesis").notNull(),
  implementation: text("implementation").notNull(),
  evaluation: text("evaluation"),
  score: real("score"),
  baselineScore: real("baseline_score"),
  delta: real("delta"),
  decision: experimentDecisionEnum("decision").notNull().default("pending"),
  reasoning: text("reasoning"),
  tokensCost: integer("tokens_cost"),
  latencyMs: integer("latency_ms"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ResearchRun = typeof researchRunsTable.$inferSelect;
export type InsertResearchRun = typeof researchRunsTable.$inferInsert;
export type ResearchExperiment = typeof researchExperimentsTable.$inferSelect;
export type InsertResearchExperiment = typeof researchExperimentsTable.$inferInsert;
