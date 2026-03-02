# Deletion Reasons Not Saving to Supabase – Troubleshooting

If the delete reason questionnaire works on the website but data is not appearing in Supabase, check the following:

## 1. Table exists

Confirm the `item_deletion_reasons` table exists in your Supabase project:

1. Open your Supabase project → **Table Editor**
2. Look for `item_deletion_reasons`

If it’s missing, run the migration in **SQL Editor**:

- File: `database/migrations/add_item_deletion_reasons.sql`
- Copy the SQL and run it in the Supabase SQL Editor

## 2. Check browser console

1. Open DevTools (F12) → **Console**
2. Delete an item and complete the delete reason questionnaire
3. Look for errors such as:
   - `Failed to save deletion reason:`
   - `relation "item_deletion_reasons" does not exist` → table not created
   - `permission denied` or `policy violation` → RLS policy issue
   - `new row violates row-level security policy` → RLS blocking insert

## 3. Row Level Security (RLS)

Ensure policies allow inserts:

- **Table Editor** → `item_deletion_reasons` → **RLS**
- There should be:
  - INSERT: `auth.uid() = user_id`
  - SELECT: `auth.uid() = user_id`

## 4. Supabase project

Verify the app is using the same Supabase project:

- `.env` or env config: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- These should match the project where you ran the migration and where you’re checking the table

## 5. Auth state

Deletion reasons are only saved when the user is logged in. Confirm:

- The user is authenticated when deleting
- `auth.uid()` returns a valid user ID (you can log this in the console if needed)

## Quick fix

If the table is missing:

1. Open Supabase → **SQL Editor**
2. Paste and run the contents of `database/migrations/add_item_deletion_reasons.sql`
3. Confirm the table appears in **Table Editor**
4. Try deleting an item again and check the console for errors
