-- Run this SQL in your Supabase SQL Editor
-- HIPAA-compliant RLS policies — users can only access their own row

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,          -- Firebase UID
  email           TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  age             TEXT,
  gender          TEXT,
  phone           TEXT,
  location_lat    DOUBLE PRECISION,
  location_lng    DOUBLE PRECISION,
  location_city   TEXT,
  wallet_balance  INTEGER DEFAULT 0,
  promo_code      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop old insecure policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- HIPAA: Users can only read their own row (Firebase UID must match)
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id);

-- HIPAA: Users can only insert their own row
CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid()::text = id);

-- HIPAA: Users can only update their own row
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- Function to increment bonus minutes atomically
CREATE OR REPLACE FUNCTION increment_bonus_minutes(user_id TEXT, minutes INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET bonus_minutes = COALESCE(bonus_minutes, 0) + minutes
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
