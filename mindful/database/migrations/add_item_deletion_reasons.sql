-- Table to store user's reasons when deleting items before constraint completion
-- Run in Supabase SQL Editor
-- Note: item_id is stored for reference; no FK since the item is deleted

CREATE TABLE IF NOT EXISTS public.item_deletion_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_name TEXT,
  reason TEXT NOT NULL CHECK (reason IN ('dont_want', 'purchased_early')),
  sub_reason TEXT NOT NULL,
  constraint_type TEXT NOT NULL CHECK (constraint_type IN ('time', 'goals')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS item_deletion_reasons_user_id_idx ON public.item_deletion_reasons(user_id);
CREATE INDEX IF NOT EXISTS item_deletion_reasons_created_at_idx ON public.item_deletion_reasons(created_at);

ALTER TABLE public.item_deletion_reasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own deletion reasons" ON public.item_deletion_reasons;
DROP POLICY IF EXISTS "Users can view their own deletion reasons" ON public.item_deletion_reasons;

CREATE POLICY "Users can insert their own deletion reasons" ON public.item_deletion_reasons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own deletion reasons" ON public.item_deletion_reasons
  FOR SELECT USING (auth.uid() = user_id);

SELECT 'item_deletion_reasons table created successfully.' AS status;
