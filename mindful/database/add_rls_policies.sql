-- SQL to add Row Level Security (RLS) policies to your existing tables
-- Run this in your Supabase SQL Editor: https://mohgivduzthccoybnbnr.supabase.co/project/_/sql/new

-- Enable Row Level Security on existing tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_reflections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own items" ON public.items;
DROP POLICY IF EXISTS "Users can insert their own items" ON public.items;
DROP POLICY IF EXISTS "Users can update their own items" ON public.items;
DROP POLICY IF EXISTS "Users can delete their own items" ON public.items;
DROP POLICY IF EXISTS "Users can view reflections for their items" ON public.item_reflections;
DROP POLICY IF EXISTS "Users can insert reflections for their items" ON public.item_reflections;
DROP POLICY IF EXISTS "Users can update reflections for their items" ON public.item_reflections;
DROP POLICY IF EXISTS "Users can delete reflections for their items" ON public.item_reflections;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Items policies
CREATE POLICY "Users can view their own items"
  ON public.items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items"
  ON public.items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
  ON public.items
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
  ON public.items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Item reflections policies
CREATE POLICY "Users can view reflections for their items"
  ON public.item_reflections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = item_reflections.item_id
      AND items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert reflections for their items"
  ON public.item_reflections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = item_reflections.item_id
      AND items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update reflections for their items"
  ON public.item_reflections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = item_reflections.item_id
      AND items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete reflections for their items"
  ON public.item_reflections
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = item_reflections.item_id
      AND items.user_id = auth.uid()
    )
  );

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS items_user_id_idx ON public.items(user_id);
CREATE INDEX IF NOT EXISTS items_created_at_idx ON public.items(created_at);
CREATE INDEX IF NOT EXISTS item_reflections_item_id_idx ON public.item_reflections(item_id);
CREATE INDEX IF NOT EXISTS item_reflections_question_idx ON public.item_reflections(question);

-- Success message
SELECT 'Row Level Security policies added successfully!' as status;


