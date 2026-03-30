/**
 * Portable database adapter for OpenClaw platform
 * 
 * Supports multiple backends:
 * - PostgreSQL (production)
 * - SQLite (quick testing)
 * - In-memory (minimal test)
 * 
 * This allows the platform to run without requiring external database setup
 */

import { drizzle as drizzlePostgres } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../schema/index.js";

// Check if we should use SQLite for testing
const USE_SQLITE = process.env.USE_SQLITE === 'true' || process.env.DATABASE_URL?.startsWith('sqlite:');

let db;
let pool;

if (USE_SQLITE) {
  // SQLite for development/testing
  const dbPath = process.env.SQLITE_PATH || './openclaw-test.db';
  console.log('📁 Using SQLite database:', dbPath);
  
  const sqlite = new Database(dbPath);
  db = drizzlePostgres(sqlite, { schema });
  
  // Initialize tables if they don't exist
  const initQueries = [
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      agent_type TEXT DEFAULT 'openclaw',
      model TEXT,
      status TEXT DEFAULT 'active',
      task_count INTEGER DEFAULT 0,
      last_active_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      command TEXT NOT NULL,
      output TEXT,
      exit_code INTEGER DEFAULT 0,
      execution_time_ms REAL,
      executed_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      description TEXT NOT NULL,
      agent_role TEXT,
      status TEXT DEFAULT 'pending',
      result TEXT,
      error TEXT,
      retries INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    )`,
    
    `CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      name TEXT,
      description TEXT,
      implementation TEXT,
      category TEXT,
      agent_type TEXT DEFAULT 'any',
      source TEXT DEFAULT 'manual',
      score REAL DEFAULT 0.7,
      usage_count INTEGER DEFAULT 0,
      last_used_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      provider_id TEXT,
      model TEXT,
      prompt_tokens INTEGER DEFAULT 0,
      completion_tokens INTEGER DEFAULT 0,
      total_tokens INTEGER DEFAULT 0,
      cost_usd REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`
  ];
  
  for (const query of initQueries) {
    sqlite.exec(query);
  }
  
} else if (process.env.DATABASE_URL) {
  // Original PostgreSQL path
  console.log('🐘 Using PostgreSQL database');
  const { drizzle as drizzlePostgres } = await import("drizzle-orm/node-postgres");
  const pg = await import("pg");
  const { Pool } = pg;
  
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzlePostgres(pool, { schema });
  
} else {
  // In-memory SQLite for minimal test
  console.log('💾 Using in-memory database');
  const sqlite = new Database(':memory:');
  db = drizzlePostgres(sqlite, { schema });
}

// Create clean interface compatible with drizzle imports
export const model = db;
export const dbInstance = db;

// These exports work with existing code
export * from "../schema";

// For compatibility
export { db as pool } from "../../index.js";