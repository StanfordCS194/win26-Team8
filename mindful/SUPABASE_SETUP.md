# Supabase Setup Guide

This guide will help you set up Supabase for the Second Thought application, enabling user authentication and cloud database storage.

## Prerequisites

- A Supabase account (free tier is sufficient)
- Your Supabase project URL: `https://mohgivduzthccoybnbnr.supabase.co`

## Step 1: Get Your Supabase API Keys

1. Go to your Supabase dashboard: https://mohgivduzthccoybnbnr.supabase.co
2. Click on **Settings** (gear icon) in the left sidebar
3. Click on **API** under Project Settings
4. Copy the following values:
   - **Project URL**: `https://mohgivduzthccoybnbnr.supabase.co`
   - **anon/public key**: This is your `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Step 2: Set Up Environment Variables

1. Create a `.env` file in the `mindful` directory:

```bash
cd mindful
touch .env
```

2. Add your Supabase credentials to the `.env` file:

```env
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Replace `your_supabase_anon_key_here` with the actual anon key from Step 1.

⚠️ **Important**: Never commit the `.env` file to version control. Add it to your `.gitignore` if not already present.

## Step 3: Set Up Database Tables

1. In your Supabase dashboard, go to the **SQL Editor** (database icon with "SQL" in the left sidebar)
2. Click **New Query**
3. Copy and paste the entire contents of `database/schema.sql` into the editor
4. Click **Run** to execute the SQL script

This will create:
- `profiles` table for user profiles
- `items` table for saved shopping items with reflections
- Row Level Security (RLS) policies for data protection
- Automatic triggers for user profile creation
- Database indexes for optimal performance

## Step 4: Configure Authentication

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Email** authentication (should be enabled by default)
3. (Optional) Configure additional providers like Google, GitHub, etc.

### Email Settings (Optional but Recommended)

1. Go to **Authentication** > **Email Templates**
2. Customize the confirmation email template
3. Go to **Authentication** > **Settings**
4. Configure your **Site URL** for production (e.g., your deployment URL)
5. Add **Redirect URLs** if needed

## Step 5: Test the Setup

1. Start your development server:

```bash
npm start
```

2. Open the application in your browser
3. Try creating a new account:
   - Click **Sign Up**
   - Enter an email and password
   - Check your email for the confirmation link
   - Click the confirmation link
   - Sign in with your credentials

4. Once signed in, try:
   - Adding a new item with reflections
   - Viewing your items in different views (Timeline, Goals)
   - Signing out and signing back in
   - Verifying your items persist across sessions

## Database Schema Overview

### Profiles Table

Stores user profile information:
- `id` (UUID): User ID from authentication
- `email` (TEXT): User's email address
- `full_name` (TEXT): User's full name (optional)
- `avatar_url` (TEXT): Profile picture URL (optional)
- `created_at`, `updated_at`: Timestamps

### Items Table

Stores user's shopping items and reflections:
- `id` (UUID): Unique item identifier
- `user_id` (UUID): Reference to the user who created the item
- `name` (TEXT): Item name
- `image_url` (TEXT): Item image URL
- `constraint_type` (TEXT): Either 'time' or 'goals'
- `consumption_score` (INTEGER): 1-10 score
- `wait_until_date` (DATE): For time-based constraints
- `difficulty` (TEXT): 'easy', 'medium', or 'hard' for goals-based
- `questionnaire_*`: Four reflection questions (why, alternatives, impact, urgency)
- `added_date`, `created_at`, `updated_at`: Timestamps

## Security Features

### Row Level Security (RLS)

All tables have RLS enabled, ensuring:
- Users can only view their own profiles and items
- Users can only create, update, and delete their own data
- No user can access another user's data

### Authentication

- Passwords are hashed using bcrypt
- Session management with JWT tokens
- Automatic token refresh
- Secure password reset flow via email

## Troubleshooting

### Cannot connect to Supabase

- Verify your `EXPO_PUBLIC_SUPABASE_ANON_KEY` is correct
- Check that you're using the correct project URL
- Ensure your `.env` file is in the correct location
- Restart your development server after adding environment variables

### Authentication errors

- Check Supabase dashboard > Authentication > Users to see if user was created
- Verify email confirmation if required
- Check browser console for detailed error messages

### Database errors

- Verify the SQL schema was executed successfully
- Check Supabase dashboard > Database > Tables to see if tables exist
- Review RLS policies in Table Editor > Policies
- Check Supabase dashboard > Logs for detailed error messages

### Items not saving or loading

- Verify you're signed in (check browser console)
- Inspect Network tab in browser dev tools for API errors
- Check that RLS policies allow the operation
- Verify the item data structure matches the schema

## Production Deployment

Before deploying to production:

1. Set up environment variables on your hosting platform
2. Update Site URL in Supabase Authentication settings
3. Add production URLs to Redirect URLs
4. Consider enabling additional security features:
   - Email rate limiting
   - CAPTCHA for signups
   - Custom SMTP for email delivery
5. Set up database backups
6. Monitor usage in Supabase dashboard

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Authentication Guide](https://supabase.com/docs/guides/auth)

## Support

For issues specific to this application, please refer to the main README.md or contact the development team.

For Supabase-specific issues, consult the [Supabase Community](https://github.com/supabase/supabase/discussions).


