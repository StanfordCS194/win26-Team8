-- Second Thought Database Schema
-- Run in Supabase SQL Editor: https://mohgivduzthccoybnbnr.supabase.co/project/_/sql/new
-- For existing projects, prefer running migrations in database/migrations/ instead of recreating tables.

-- =============================================================================
-- PROFILES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ITEMS (matches current Supabase table; do not drop in production)
-- =============================================================================
-- To add only the performance index on an existing table, run:
--   database/migrations/add_items_user_created_at_index.sql
--
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  constraint_type TEXT NOT NULL CHECK (constraint_type IN ('time', 'goals')),
  consumption_score INTEGER NOT NULL CHECK (consumption_score >= 1 AND consumption_score <= 10),
  wait_until_date DATE,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  questionnaire JSONB NOT NULL DEFAULT '[]'::jsonb,
  added_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  category TEXT CHECK (
    category IS NULL OR category = ANY (ARRAY['Beauty', 'Clothes', 'Accessories', 'Sports', 'Electronics', 'Home', 'Other'])
  ),
  friend_name TEXT,
  friend_email TEXT,
  unlock_password TEXT,
  is_unlocked BOOLEAN DEFAULT false
);

-- Indexes (create if not exists; add items_user_id_created_at_idx for faster list/refresh)
CREATE INDEX IF NOT EXISTS items_user_id_idx ON public.items(user_id);
CREATE INDEX IF NOT EXISTS items_created_at_idx ON public.items(created_at);
CREATE INDEX IF NOT EXISTS items_constraint_type_idx ON public.items(constraint_type);
CREATE INDEX IF NOT EXISTS items_category_idx ON public.items(category);
CREATE INDEX IF NOT EXISTS items_user_id_created_at_idx ON public.items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_unlock_password ON public.items(unlock_password) WHERE unlock_password IS NOT NULL;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_items_updated_at ON public.items;
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ITEM_REFLECTIONS (optional / future use)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.item_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  response INTEGER NOT NULL CHECK (response >= 1 AND response <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS item_reflections_item_id_idx ON public.item_reflections(item_id);

-- =============================================================================
-- TRIGGERS FOR PROFILES
-- =============================================================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own items" ON public.items;
DROP POLICY IF EXISTS "Users can insert their own items" ON public.items;
DROP POLICY IF EXISTS "Users can update their own items" ON public.items;
DROP POLICY IF EXISTS "Users can delete their own items" ON public.items;
CREATE POLICY "Users can view their own items" ON public.items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own items" ON public.items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own items" ON public.items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own items" ON public.items FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view reflections for their items" ON public.item_reflections;
DROP POLICY IF EXISTS "Users can insert reflections for their items" ON public.item_reflections;
DROP POLICY IF EXISTS "Users can update reflections for their items" ON public.item_reflections;
DROP POLICY IF EXISTS "Users can delete reflections for their items" ON public.item_reflections;
CREATE POLICY "Users can view reflections for their items" ON public.item_reflections FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.items WHERE items.id = item_reflections.item_id AND items.user_id = auth.uid()));
CREATE POLICY "Users can insert reflections for their items" ON public.item_reflections FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.items WHERE items.id = item_reflections.item_id AND items.user_id = auth.uid()));
CREATE POLICY "Users can update reflections for their items" ON public.item_reflections FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.items WHERE items.id = item_reflections.item_id AND items.user_id = auth.uid()));
CREATE POLICY "Users can delete reflections for their items" ON public.item_reflections FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.items WHERE items.id = item_reflections.item_id AND items.user_id = auth.uid()));

SELECT 'Schema applied successfully.' AS status;
