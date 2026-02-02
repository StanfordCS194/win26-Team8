# Quick Start Guide - Supabase Integration

## What's New? 🎉

Your Second Thought application now has:
- ✅ User authentication (sign up, sign in, sign out)
- ✅ Cloud database storage with Supabase
- ✅ User profiles
- ✅ Secure data storage (users can only see their own items)
- ✅ Data persistence across devices and browsers

## Setup in 3 Steps

### Step 1: Get Your Supabase Key

1. Go to: https://mohgivduzthccoybnbnr.supabase.co/project/_/settings/api
2. Copy the **anon/public** key (it's a long string starting with `eyJ...`)

### Step 2: Create Environment File

1. In the `mindful` folder, create a file named `.env`:
```bash
cd mindful
touch .env
```

2. Add this line to the `.env` file (replace with your actual key):
```
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_key_here
```

### Step 3: Set Up Database

1. Go to: https://mohgivduzthccoybnbnr.supabase.co/project/_/sql/new
2. Open the file `mindful/database/schema.sql`
3. Copy all the SQL code from that file
4. Paste it into the Supabase SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned" - that's perfect!

### Step 4: Start Your App

```bash
npm start
```

Open the app and you'll see a beautiful login screen! 🎨

## First Time Using the App

1. **Sign Up**: Click "Sign Up" and create an account
2. **Check Email**: Look for a confirmation email from Supabase
3. **Confirm**: Click the confirmation link
4. **Sign In**: Return to the app and sign in
5. **Add Items**: Start adding items with reflections!

## Features You Can Try

### Add an Item
1. Click "Add Item" button
2. Enter item name and image URL
3. Answer the reflection questions
4. Choose a constraint type (Time or Goals)

### View Your Items
- **All Items**: See all your saved items
- **Timeline**: View items with time-based constraints
- **Goals**: View items with goals-based constraints

### User Menu
- Click your profile icon (top right)
- See your name and email
- Sign out when done

## Troubleshooting

### "Warning: EXPO_PUBLIC_SUPABASE_ANON_KEY is not set"
- Make sure your `.env` file exists in the `mindful` folder
- Check that the key name is exactly `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Restart your development server: Stop (Ctrl+C) and run `npm start` again

### "Failed to load items"
- Make sure you ran the database schema SQL (Step 3)
- Check the browser console for detailed error messages
- Verify you're signed in

### "Failed to sign in"
- Check your email/password
- Make sure you confirmed your email
- Try "Sign Up" if you haven't created an account yet

### Can't confirm email?
1. Go to Supabase dashboard: https://mohgivduzthccoybnbnr.supabase.co/project/_/auth/users
2. Find your user
3. Click the "..." menu
4. Select "Confirm email"

## Database Tables Created

### `profiles` table
- Stores user information (name, email, avatar)
- Created automatically when you sign up

### `items` table
- Stores all your shopping items with reflections
- Includes questionnaire answers
- Time/goals constraint data

## Security Features 🔒

- **Passwords**: Securely hashed, never stored in plain text
- **Row Level Security**: You can only see YOUR items
- **JWT Tokens**: Automatic session management
- **Data Privacy**: Other users can't access your data

## What Changed in the Code?

### New Files Created
```
mindful/
├── lib/supabase.ts              # Supabase configuration
├── contexts/AuthContext.tsx     # Authentication state
├── services/itemService.ts      # Database operations
├── components/Auth.tsx          # Login/signup UI
├── components/UserMenu.tsx      # User profile menu
└── database/schema.sql          # Database tables
```

### Modified Files
- `App.tsx`: Now uses Supabase instead of localStorage
- `package.json`: Added @supabase/supabase-js dependency
- `.gitignore`: Added .env to prevent committing secrets

## Need More Help?

- **Detailed Setup**: See `SUPABASE_SETUP.md`
- **Supabase Docs**: https://supabase.com/docs
- **React Context**: https://react.dev/reference/react/useContext

## Next Steps (Optional)

1. **Customize Email Templates**: 
   - Go to Authentication > Email Templates in Supabase
   - Customize welcome emails

2. **Add Profile Pictures**:
   - Extend the profile functionality
   - Use Supabase Storage for uploads

3. **Enable Social Login**:
   - Add Google, GitHub, etc. in Authentication > Providers

4. **Real-time Updates**:
   - Items already support real-time sync!
   - Check `services/itemService.ts` → `subscribeToUserItems`

Enjoy your new cloud-powered Second Thought app! 🌟


