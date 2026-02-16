-- Migration: Add friend unlock fields for goals-based constraints
-- Run this in your Supabase SQL Editor: https://mohgivduzthccoybnbnr.supabase.co/project/_/sql/new

-- Add friend unlock columns to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS friend_name TEXT,
ADD COLUMN IF NOT EXISTS friend_email TEXT,
ADD COLUMN IF NOT EXISTS unlock_password TEXT,
ADD COLUMN IF NOT EXISTS is_unlocked BOOLEAN DEFAULT FALSE;

-- Add index on unlock_password for faster lookups
CREATE INDEX IF NOT EXISTS idx_items_unlock_password ON public.items(unlock_password) WHERE unlock_password IS NOT NULL;

-- Add comment to document the fields
COMMENT ON COLUMN public.items.friend_name IS 'Name of the friend who will unlock the item after goal completion';
COMMENT ON COLUMN public.items.friend_email IS 'Email of the friend who will unlock the item';
COMMENT ON COLUMN public.items.unlock_password IS 'Unique password that the friend needs to unlock the item';
COMMENT ON COLUMN public.items.is_unlocked IS 'Whether the item has been unlocked by the friend';
