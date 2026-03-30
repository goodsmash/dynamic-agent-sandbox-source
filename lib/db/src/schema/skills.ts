import { pgTable, text, real, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { randomBytes } from "crypto";

function nanoid(n = 12) {
  return randomBytes(Math.ceil(n * 0.75)).toString("base64url").slice(0, n);
}

export const skillSourceEnum = pgEnum("skill_source", ["research", "manual", "auto"]);

export const skillsTable = pgTable("skills", {
  id: text("id").primaryKey().$defaultFn(() => nanoid(12)),
  name: text("name").notNull(),
  description: text("description").notNull(),
  implementation: text("implementation").notNull(),
  category: text("category").notNull().default("general"),
  score: real("score").notNull().default(0),
  agentType: text("agent_type").notNull().default("openclaw"),
  sessionId: text("session_id"),
  runId: text("run_id"),
  source: skillSourceEnum("source").notNull().default("manual"),
  useCount: integer("use_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Skill = typeof skillsTable.$inferSelect;
export type InsertSkill = typeof skillsTable.$inferInsert;
