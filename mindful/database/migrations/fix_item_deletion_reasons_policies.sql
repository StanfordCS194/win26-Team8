-- Fix RLS policies for item_deletion_reasons (run in Supabase SQL Editor)
-- Use this if the table exists but inserts are failing

-- Ensure RLS is enabled
ALTER TABLE public.item_deletion_reasons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (in case they're misconfigured)
DROP POLICY IF EXISTS "Users can insert their own deletion reasons" ON public.item_deletion_reasons;
DROP POLICY IF EXISTS "Users can view their own deletion reasons" ON public.item_deletion_reasons;

-- Recreate policies
CREATE POLICY "Users can insert their own deletion reasons" ON public.item_deletion_reasons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own deletion reasons" ON public.item_deletion_reasons
  FOR SELECT USING (auth.uid() = user_id);

SELECT 'Policies updated successfully.' AS status;
