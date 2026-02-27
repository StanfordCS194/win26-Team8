-- Add goal column to items and unlocked_items for goals-based constraints.
-- Run in Supabase SQL Editor. Safe to run if columns already exist (use IF NOT EXISTS where supported).

-- items: goal text (what the user wants to complete before purchasing)
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS goal TEXT;

-- unlocked_items: preserve goal when archiving
ALTER TABLE public.unlocked_items
  ADD COLUMN IF NOT EXISTS goal TEXT;

SELECT 'goal column added to items and unlocked_items.' AS status;
