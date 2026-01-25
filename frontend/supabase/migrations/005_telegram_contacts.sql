-- 005_telegram_contacts.sql
-- Track Telegram users who connect to the mini app

CREATE TABLE IF NOT EXISTS telegram_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_user_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT,
  is_premium BOOLEAN DEFAULT false,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visits_count INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_telegram_contacts_last_seen ON telegram_contacts(last_seen_at DESC);
