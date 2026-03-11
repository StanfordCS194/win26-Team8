-- Migration: Add friend_token UUID column for tracking email records
-- Run in Supabase SQL Editor: https://mohgivduzthccoybnbnr.supabase.co/project/_/sql/new

-- 1. Add friend_token UUID column for secure URL tokens
ALTER TABLE public.friend_unlock_emails
ADD COLUMN IF NOT EXISTS friend_token UUID DEFAULT gen_random_uuid();

-- 2. Create unique index on friend_token for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_friend_unlock_emails_token
ON public.friend_unlock_emails(friend_token);

-- 3. Backfill: generate tokens for any existing rows that lack one
UPDATE public.friend_unlock_emails
SET friend_token = gen_random_uuid()
WHERE friend_token IS NULL;

-- 4. Make friend_token NOT NULL after backfill
ALTER TABLE public.friend_unlock_emails
ALTER COLUMN friend_token SET NOT NULL;
