-- Table to store items that have been successfully unlocked (time or goals constraints)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.unlocked_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_item_id UUID NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  product_url TEXT,
  category TEXT,
  constraint_type TEXT NOT NULL CHECK (constraint_type IN ('time', 'goals')),
  consumption_score INTEGER NOT NULL CHECK (consumption_score >= 1 AND consumption_score <= 10),
  wait_until_date DATE,
  difficulty TEXT,
  questionnaire JSONB NOT NULL,
  added_date TIMESTAMP WITH TIME ZONE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  friend_name TEXT,
  friend_email TEXT,
  unlock_password TEXT,
  goal TEXT
);

CREATE INDEX IF NOT EXISTS unlocked_items_user_id_idx ON public.unlocked_items(user_id);
CREATE INDEX IF NOT EXISTS unlocked_items_unlocked_at_idx ON public.unlocked_items(unlocked_at);

ALTER TABLE public.unlocked_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own unlocked items" ON public.unlocked_items;
DROP POLICY IF EXISTS "Users can view their own unlocked items" ON public.unlocked_items;

CREATE POLICY "Users can insert their own unlocked items" ON public.unlocked_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own unlocked items" ON public.unlocked_items
  FOR SELECT USING (auth.uid() = user_id);

SELECT 'unlocked_items table created successfully.' AS status;

