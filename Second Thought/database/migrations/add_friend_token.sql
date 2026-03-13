-- Migration: Add friend_token for secure email links and set_unlock_password RPC function
-- Run in Supabase SQL Editor: https://mohgivduzthccoybnbnr.supabase.co/project/_/sql/new

-- 1. Add friend_token UUID column for secure URL tokens
ALTER TABLE public.friend_unlock_emails
ADD COLUMN IF NOT EXISTS friend_token UUID DEFAULT gen_random_uuid();

-- 2. Add password_set_at to track when friend set the password
ALTER TABLE public.friend_unlock_emails
ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMP WITH TIME ZONE;

-- 3. Make unlock_password nullable (friend sets it later, not at creation)
ALTER TABLE public.friend_unlock_emails
ALTER COLUMN unlock_password DROP NOT NULL;

-- 4. Create unique index on friend_token for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_friend_unlock_emails_token
ON public.friend_unlock_emails(friend_token);

-- 5. Backfill: generate tokens for any existing rows that lack one
UPDATE public.friend_unlock_emails
SET friend_token = gen_random_uuid()
WHERE friend_token IS NULL;

-- 6. Make friend_token NOT NULL after backfill
ALTER TABLE public.friend_unlock_emails
ALTER COLUMN friend_token SET NOT NULL;

-- 7. Create RPC function for friends to set the unlock password
-- SECURITY DEFINER allows unauthenticated callers (the friend) to update the DB
CREATE OR REPLACE FUNCTION public.set_unlock_password(
  p_token UUID,
  p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record RECORD;
BEGIN
  -- Look up the friend_unlock_emails record by token
  SELECT id, item_id, password_set_at
  INTO v_record
  FROM public.friend_unlock_emails
  WHERE friend_token = p_token;

  -- Token not found
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired link');
  END IF;

  -- Validate password length
  IF p_password IS NULL OR length(trim(p_password)) < 4 THEN
    RETURN json_build_object('success', false, 'error', 'Password must be at least 4 characters');
  END IF;

  -- Save password to friend_unlock_emails
  UPDATE public.friend_unlock_emails
  SET unlock_password = trim(p_password),
      password_set_at = now()
  WHERE friend_token = p_token;

  -- Save password to items table (this is what the app checks)
  UPDATE public.items
  SET unlock_password = trim(p_password)
  WHERE id = v_record.item_id;

  RETURN json_build_object('success', true);
END;
$$;

-- 8. Allow anonymous and authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.set_unlock_password(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.set_unlock_password(UUID, TEXT) TO authenticated;
