import { pgTable, text, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sessionStatusEnum = pgEnum("session_status", [
  "initializing",
  "active",
  "idle",
  "terminated",
]);

export const planEnum = pgEnum("plan", ["free", "pro"]);

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: sessionStatusEnum("status").notNull().default("initializing"),
  model: text("model").notNull().default("claude-3-5-sonnet"),
  agentType: text("agent_type").notNull().default("openclaw"),
  plan: planEnum("plan").notNull().default("free"),
  taskCount: integer("task_count").notNull().default(0),
  memoryUsage: real("memory_usage").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastActiveAt: timestamp("last_active_at").notNull().defaultNow(),
});

export const tasksTable = pgTable("tasks", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessionsTable.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  status: taskStatusEnum("status").notNull().default("pending"),
  isolateId: text("isolate_id").notNull(),
  output: text("output"),
  executionTimeMs: real("execution_time_ms"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const historyTable = pgTable("history", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessionsTable.id, { onDelete: "cascade" }),
  command: text("command").notNull(),
  output: text("output").notNull(),
  exitCode: integer("exit_code").notNull().default(0),
  executionTimeMs: real("execution_time_ms").notNull().default(0),
  executedAt: timestamp("executed_at").notNull().defaultNow(),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({
  createdAt: true,
  lastActiveAt: true,
});
export const insertTaskSchema = createInsertSchema(tasksTable).omit({
  createdAt: true,
  completedAt: true,
});
export const insertHistorySchema = createInsertSchema(historyTable).omit({
  executedAt: true,
});

export type Session = typeof sessionsTable.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Task = typeof tasksTable.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type HistoryEntry = typeof historyTable.$inferSelect;
export type InsertHistory = z.infer<typeof insertHistorySchema>;
