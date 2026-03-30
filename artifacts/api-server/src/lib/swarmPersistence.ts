/**
 * Swarm Persistence Layer
 * Writes task records, updates session counters, logs history.
 * Decoupled so SwarmSession stays clean.
 */

import { db } from "@workspace/db";
import { sessionsTable, tasksTable, historyTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function persistTaskStart(
  sessionId: string,
  agentRole: string,
  taskDescription: string,
): Promise<string> {
  const taskId = randomUUID();
  try {
    await db.insert(tasksTable).values({
      id: taskId,
      sessionId,
      isolateId: `swarm-${agentRole}`,
      description: taskDescription.slice(0, 500),
      status: "running",
    });
  } catch { /* non-fatal */ }
  return taskId;
}

export async function persistTaskComplete(
  taskId: string,
  sessionId: string,
  output: string,
  executionTimeMs: number,
  exitCode: number,
): Promise<void> {
  try {
    await db
      .update(tasksTable)
      .set({
        status: exitCode === 0 ? "completed" : "failed",
        output: output.slice(0, 4000),
        executionTimeMs,
        completedAt: new Date(),
      })
      .where(eq(tasksTable.id, taskId));

    await db
      .update(sessionsTable)
      .set({
        taskCount: sql`${sessionsTable.taskCount} + 1`,
        lastActiveAt: new Date(),
        status: "active",
      })
      .where(eq(sessionsTable.id, sessionId));
  } catch { /* non-fatal */ }
}

export async function persistHistory(
  sessionId: string,
  command: string,
  output: string,
  exitCode: number,
  executionTimeMs: number,
): Promise<void> {
  try {
    await db.insert(historyTable).values({
      id: randomUUID(),
      sessionId,
      command: command.slice(0, 500),
      output: output.slice(0, 8000),
      exitCode,
      executionTimeMs,
    });
  } catch { /* non-fatal */ }
}

export async function setSessionStatus(
  sessionId: string,
  status: "initializing" | "active" | "idle" | "error",
): Promise<void> {
  try {
    await db
      .update(sessionsTable)
      .set({ status, lastActiveAt: new Date() })
      .where(eq(sessionsTable.id, sessionId));
  } catch { /* non-fatal */ }
}

export async function touchSession(sessionId: string): Promise<void> {
  try {
    await db
      .update(sessionsTable)
      .set({ lastActiveAt: new Date(), status: "active" })
      .where(eq(sessionsTable.id, sessionId));
  } catch { /* non-fatal */ }
}

export async function incrementTaskCount(sessionId: string): Promise<void> {
  try {
    await db
      .update(sessionsTable)
      .set({
        taskCount: sql`${sessionsTable.taskCount} + 1`,
        lastActiveAt: new Date(),
        status: "active",
      })
      .where(eq(sessionsTable.id, sessionId));
  } catch { /* non-fatal */ }
}
