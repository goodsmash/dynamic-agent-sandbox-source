-- D1 Database Schema for OpenClaw Platform
-- Apply with: wrangler d1 migrations apply openclaw_users

-- User accounts and plan management
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                    -- Replit/Auth user ID
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,               -- Stripe customer ID for billing
  plan TEXT NOT NULL DEFAULT 'free'      -- 'free' | 'pro'
    CHECK (plan IN ('free', 'pro')),
  max_agents INTEGER NOT NULL DEFAULT 1, -- free=1, pro=unlimited
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Agent session records (metadata only — actual state lives in Durable Object SQLite)
CREATE TABLE IF NOT EXISTS agent_sessions (
  id TEXT PRIMARY KEY,                   -- Durable Object ID
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'claude-3-5-sonnet',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'idle', 'terminated')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_active_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Audit log for all sandbox executions (compliance, billing metering)
CREATE TABLE IF NOT EXISTS execution_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  session_id TEXT NOT NULL,
  isolate_id TEXT NOT NULL,             -- The ephemeral V8 isolate that ran the task
  command TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  exit_code INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Stripe billing events (idempotent webhook storage)
CREATE TABLE IF NOT EXISTS billing_events (
  stripe_event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  processed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_sessions_user ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_log_user ON execution_log(user_id);
CREATE INDEX IF NOT EXISTS idx_log_session ON execution_log(session_id);
