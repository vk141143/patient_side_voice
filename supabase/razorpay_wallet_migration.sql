-- ═══════════════════════════════════════════════════════════════════════════
-- RAZORPAY WALLET MIGRATION — Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Drop existing functions first (required to rename params) ─────────────
DROP FUNCTION IF EXISTS add_wallet(text, numeric);
DROP FUNCTION IF EXISTS deduct_wallet(text, numeric);

-- ── 2. add_wallet RPC — atomic credit with FOR UPDATE row lock ───────────────
CREATE OR REPLACE FUNCTION add_wallet(p_user_id TEXT, p_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current NUMERIC;
  v_new     NUMERIC;
BEGIN
  SELECT wallet_balance INTO v_current
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  v_new := COALESCE(v_current, 0) + p_amount;

  UPDATE users SET wallet_balance = v_new WHERE id = p_user_id;

  RETURN v_new;
END;
$$;

-- ── 3. deduct_wallet RPC — atomic debit with FOR UPDATE row lock ─────────────
CREATE OR REPLACE FUNCTION deduct_wallet(p_user_id TEXT, p_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current NUMERIC;
  v_new     NUMERIC;
BEGIN
  SELECT wallet_balance INTO v_current
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  IF COALESCE(v_current, 0) < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance: has %, needs %', v_current, p_amount;
  END IF;

  v_new := v_current - p_amount;

  UPDATE users SET wallet_balance = v_new WHERE id = p_user_id;

  RETURN v_new;
END;
$$;

-- ── 4. wallet_transactions table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              TEXT        NOT NULL,
  amount               NUMERIC     NOT NULL,
  type                 TEXT        NOT NULL CHECK (type IN ('credit', 'debit')),
  method               TEXT        DEFAULT 'razorpay',
  razorpay_payment_id  TEXT,
  razorpay_order_id    TEXT,
  description          TEXT,
  status               TEXT        NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  balance_after        NUMERIC,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_txn_user_date
  ON wallet_transactions(user_id, created_at DESC);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallet_txn_own_read" ON wallet_transactions;
CREATE POLICY "wallet_txn_own_read" ON wallet_transactions
  FOR SELECT USING (true);
