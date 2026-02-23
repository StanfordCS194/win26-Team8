-- Run this in Supabase SQL Editor to speed up "list my items" / refresh.
-- Safe to run multiple times (IF NOT EXISTS).
CREATE INDEX IF NOT EXISTS items_user_id_created_at_idx
ON public.items (user_id, created_at DESC);

-- To verify the index is used, run (replace YOUR_USER_ID with a real auth.users id):
--   EXPLAIN (ANALYZE, BUFFERS)
--   SELECT id, user_id, name, image_url, category, constraint_type, consumption_score,
--          wait_until_date, difficulty, questionnaire, added_date, created_at, updated_at
--   FROM public.items
--   WHERE user_id = 'YOUR_USER_ID'
--   ORDER BY created_at DESC;
-- Look for "Index Scan using items_user_id_created_at_idx" in the plan.
