-- Migration: Add moderators table
-- Date: 2026-01-26
-- Description: Add table to manage moderators and administrators

-- ============================================================================
-- MODERATORS
-- ============================================================================
CREATE TABLE IF NOT EXISTS moderators (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  telegram_user_id TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('moderator', 'admin')),
  added_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_moderators_telegram_id ON moderators(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_moderators_role ON moderators(role);
