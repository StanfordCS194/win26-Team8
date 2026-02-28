-- Allow users to delete their own rows from unlocked_items (e.g. remove from Unlocked list)
-- Run in Supabase SQL Editor if deletes are blocked by RLS

DROP POLICY IF EXISTS "Users can delete their own unlocked items" ON public.unlocked_items;
CREATE POLICY "Users can delete their own unlocked items" ON public.unlocked_items
  FOR DELETE USING (auth.uid() = user_id);
