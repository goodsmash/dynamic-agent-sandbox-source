import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const providersTable = pgTable("providers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  apiKey: text("api_key"),
  baseUrl: text("base_url"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Provider = typeof providersTable.$inferSelect;
export type InsertProvider = typeof providersTable.$inferInsert;
