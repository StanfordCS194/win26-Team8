# Setup Checklist - Connect to Your Existing Database

## ✅ Complete These Steps

### Step 1: Add Your Supabase API Key

**Quick way:**
```bash
cd /Users/minaky/win26-Team8/mindful
./setup-env.sh
```

**Manual way:**
```bash
cd /Users/minaky/win26-Team8/mindful
cat > .env << 'EOF'
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_actual_key_here
EOF
```

Get key from: https://mohgivduzthccoybnbnr.supabase.co/project/_/settings/api

---

### Step 2: Add Row Level Security Policies

**CRITICAL for data security!**

1. Go to: https://mohgivduzthccoybnbnr.supabase.co/project/_/sql/new
2. Copy contents of `database/add_rls_policies.sql`
3. Paste and click **Run**

**What it does:** 
- Prevents users from seeing each other's data
- Adds security policies to all 3 tables
- Creates performance indexes

---

### Step 3: Restart Development Server

```bash
# Press Ctrl+C to stop current server
npm start
```

---

## 🎯 How to Test

1. **Open the app** → Should see login screen
2. **Sign up** with a test email
3. **Add an item:**
   - Name: "Test Item"
   - Image URL: (any URL or leave blank)
   - Consumption Score: 5
   - Rate all 4 reflection questions (1-5 scale using sliders)
4. **Click "Add to Reflection List"**

### Verify in Supabase

Go to: https://mohgivduzthccoybnbnr.supabase.co/project/_/editor

**Check `items` table:**
- New row with your item name
- `user_id` matches your auth user
- `cost` = 50 (consumption_score * 10)

**Check `item_reflections` table:**
- 4 new rows with same `item_id`
- Questions: "why", "alternatives", "impact", "urgency"
- Responses are integers 1-5 (your ratings)

**Check `profiles` table:**
- Your user profile with first_name and last_name

---

## 📊 Data Mapping Reference

| App Field | Your DB Column | Notes |
|-----------|---------------|-------|
| Item name | `items.name` | Direct mapping |
| Image URL | `items.image_url` | Falls back to `items.url` if empty |
| Consumption Score | `items.cost` | Stored as score * 10 |
| Reflection ratings (1-5) | `item_reflections.response` | 4 rows per item with numerical ratings |
| User first name | `profiles.first_name` | From sign-up form |
| User last name | `profiles.last_name` | From sign-up form |

---

## 🔧 Troubleshooting

### "Row Level Security policy violation"
→ Run `database/add_rls_policies.sql` (Step 2)

### White screen or setup screen
→ Add `.env` file with your Supabase key (Step 1)

### "Failed to load items"
→ Check browser console for errors
→ Verify RLS policies are enabled

---

## 🎉 You're Done When...

- ✅ Login screen appears (not white/setup screen)
- ✅ Can sign up and sign in
- ✅ Can add items with reflections
- ✅ Items appear in your Supabase database
- ✅ Only see your own items (RLS working)

---

## Need Help?

- **Detailed guide:** See `EXISTING_DATABASE_SETUP.md`
- **Supabase logs:** https://mohgivduzthccoybnbnr.supabase.co/project/_/logs/explorer
- **RLS docs:** https://supabase.com/docs/guides/auth/row-level-security

