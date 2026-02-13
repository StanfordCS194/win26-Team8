-- ===================================================================
-- RESET ITEMS TABLE - Run this in Supabase SQL Editor
-- ===================================================================

-- Step 1: Drop the existing table (this will delete all data!)
DROP TABLE IF EXISTS public.items CASCADE;

-- Step 2: Create new simplified items table
CREATE TABLE public.items (
  -- Identity & Ownership
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Item Info
  name TEXT NOT NULL,
  image_url TEXT NULL,
  
  -- Constraint Info
  constraint_type TEXT NOT NULL CHECK (constraint_type IN ('time', 'goals')),
  consumption_score INTEGER NOT NULL CHECK (consumption_score >= 1 AND consumption_score <= 10),
  
  -- Time-based constraint (used when constraint_type = 'time')
  wait_until_date DATE NULL,
  
  -- Goals-based constraint (used when constraint_type = 'goals')
  difficulty TEXT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  
  -- Dynamic Questionnaire (stores JSON array of question-answer pairs)
  -- Example: [{"id":"consumption","question":"...","answer":"1"}, {...}]
  questionnaire JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Metadata
  added_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Primary Key
  PRIMARY KEY (id)
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS items_user_id_idx ON public.items(user_id);
CREATE INDEX IF NOT EXISTS items_created_at_idx ON public.items(created_at);
CREATE INDEX IF NOT EXISTS items_constraint_type_idx ON public.items(constraint_type);

-- Step 4: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Enable Row Level Security (RLS)
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS Policies
-- Users can only see their own items
CREATE POLICY "Users can view own items"
  ON public.items
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own items
CREATE POLICY "Users can insert own items"
  ON public.items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own items
CREATE POLICY "Users can update own items"
  ON public.items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own items
CREATE POLICY "Users can delete own items"
  ON public.items
  FOR DELETE
  USING (auth.uid() = user_id);

-- ===================================================================
-- DONE! Your new simplified items table is ready.
-- ===================================================================
