# Setup Guide - Using Your Existing Database

Great! You already have a Supabase database with `items`, `profiles`, and `item_reflections` tables. This guide will help you connect your Second Thought app to your existing database.

## Your Database Schema

I've detected your existing tables:

### `profiles`
- `id` (uuid) - Primary key
- `first_name` (text)
- `last_name` (text)
- `created_at` (timestamptz)

### `items`
- `id` (uuid) - Primary key
- `user_id` (uuid) - Foreign key to profiles
- `name` (text)
- `url` (text)
- `image_url` (text)
- `cost` (numeric)
- `created_at` (timestamptz)

### `item_reflections`
- `id` (uuid) - Primary key
- `item_id` (uuid) - Foreign key to items
- `question` (text)
- `response` (int4)
- `created_at` (timestamptz)

## Setup Steps

### Step 1: Get Your Supabase API Key

1. Go to: https://mohgivduzthccoybnbnr.supabase.co/project/_/settings/api
2. Copy the **anon/public** key (long string starting with `eyJ...`)

### Step 2: Create Environment File

**Option A: Use the setup script (easiest)**

```bash
cd mindful
./setup-env.sh
```

**Option B: Create manually**

```bash
cd mindful
cat > .env << 'EOF'
EXPO_PUBLIC_SUPABASE_ANON_KEY=paste_your_key_here
EOF
```

Replace `paste_your_key_here` with your actual key from Step 1.

### Step 3: Add Row Level Security (IMPORTANT!)

To protect your data, you need to add Row Level Security policies:

1. Go to: https://mohgivduzthccoybnbnr.supabase.co/project/_/sql/new
2. Open the file `database/add_rls_policies.sql` in your project
3. Copy all the SQL code
4. Paste it into the Supabase SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)

This will:
- ✅ Enable Row Level Security on your tables
- ✅ Add policies so users can only see their own data
- ✅ Create database indexes for better performance

**⚠️ Important**: Without RLS policies, users could potentially see each other's data!

### Step 4: Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
npm start
```

## How the Integration Works

### Data Mapping

The app has been adapted to work with your existing schema:

**Items:**
- `cost` → Used to calculate consumption score (cost / 10)
- `url` and `image_url` → App prefers `image_url`, falls back to `url`
- Constraint type determined by cost (0 = time-based, >0 = goals-based)

**Reflections:**
- Stored in separate `item_reflections` table
- Four reflection questions: `why`, `alternatives`, `impact`, `urgency`
- Responses stored as integers in the `response` column

**Profiles:**
- `first_name` + `last_name` → Combined for display name
- Creates profile automatically on user signup

### What Changed in the Code

1. **Type definitions** (`lib/supabase.ts`) - Updated to match your schema
2. **Item service** (`services/itemService.ts`) - Adapted to work with your tables
3. **Auth context** (`contexts/AuthContext.tsx`) - Creates profiles using your schema
4. **User menu** (`components/UserMenu.tsx`) - Displays first_name + last_name

## Testing Your Setup

1. **Start the app**: `npm start`
2. **You should see**: Login screen (not the white screen or setup screen!)
3. **Sign up**: Create a new account
4. **Add an item**: Test creating an item with reflections
5. **Check database**: 
   - Go to Supabase Table Editor
   - Verify the item appears in `items` table
   - Verify reflections appear in `item_reflections` table

## Troubleshooting

### "Failed to load items"
- Make sure you ran `add_rls_policies.sql` in Step 3
- Check browser console for detailed errors
- Verify you're signed in

### "Row Level Security policy violation"
- You forgot to run the RLS policies SQL
- Run `database/add_rls_policies.sql` in Supabase SQL Editor

### Items not showing up
- Check that `user_id` in items table matches your auth user ID
- Verify RLS policies are enabled
- Check Supabase logs: https://mohgivduzthccoybnbnr.supabase.co/project/_/logs/explorer

### Reflections not saving
- Check that `item_reflections` table has RLS policies
- Verify foreign key from `item_id` to `items.id` exists
- Check for any database constraints

## Understanding the Response Field

In your schema, `item_reflections.response` is an `int4` (integer). The app stores text responses, so we convert them:
- Text answers are parsed to integers when saving
- Missing/invalid responses default to 0
- You may want to change this column to `text` in the future

To change it:
```sql
ALTER TABLE item_reflections 
ALTER COLUMN response TYPE text;
```

## Next Steps

Once everything is working:

1. **Invite team members**: Share the app URL
2. **Customize**: Modify the UI to match your preferences
3. **Add features**: Consider adding:
   - Profile pictures (use Supabase Storage)
   - Email notifications
   - Social sharing
   - Analytics

## Support

- **RLS Documentation**: https://supabase.com/docs/guides/auth/row-level-security
- **Supabase Logs**: https://mohgivduzthccoybnbnr.supabase.co/project/_/logs/explorer
- **Database Table Editor**: https://mohgivduzthccoybnbnr.supabase.co/project/_/editor

Your existing data is safe! The app will only read from your existing tables and create new rows for new users and items.


