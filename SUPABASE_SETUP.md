# Supabase Setup Guide

## Issue

You're getting the error "Failed to create profile: Could not find the table 'public.user_profiles' in the schema cache" because:

1. **Environment variables not set**: Your app is falling back to mock authentication
2. **Database schema mismatch**: The AuthContext was looking for `user_profiles` table but your schema has `users` table

## ✅ What I Fixed

1. **Updated AuthContext**: Now uses the existing `users` table instead of `user_profiles`
2. **Fixed profile creation**: Creates user records in the `users` table with proper metadata structure
3. **Updated profile fetching**: Reads from `users` table and maps to the expected format

## 🔧 What You Need to Do

### Step 1: Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully set up (this can take a few minutes)

### Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key

### Step 3: Create Environment File

Copy the example environment file and update it with your Supabase credentials:

```bash
# Copy the example file
cp frontend/env.example frontend/.env

# Edit the .env file with your actual Supabase credentials
# In /Users/peguero/Rebin-1/frontend/.env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_ENV=development
```

### Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `database/schema.sql`
3. Click **Run** to create all the tables and functions

### Step 5: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Under **Site URL**, add: `http://localhost:5173` (or your dev server port)
3. Under **Redirect URLs**, add: `http://localhost:5173/**`
4. Under **Email Templates**, configure your email templates:
   - **Confirm signup**: Use the default template or customize it
   - **Reset password**: Use the default template or customize it
5. For development, you can turn OFF **Enable email confirmations** to skip email verification
6. For production, keep **Enable email confirmations** ON for security

### Step 6: Test the Setup

1. Restart your development server: `npm run dev`
2. Try to register a new account
3. Try to log in

## 🔍 Troubleshooting

### If you still get "user_profiles" errors:

The AuthContext has been updated to use the `users` table. Make sure you've restarted your dev server after the changes.

### If authentication still doesn't work:

1. Check browser console for errors
2. Verify your environment variables are set correctly
3. Make sure your Supabase project is fully initialized
4. Check that the database schema was applied successfully

### If you get RLS (Row Level Security) errors:

The schema includes RLS policies. Make sure they were created successfully in the SQL Editor.

## 📋 Database Schema Overview

The `users` table structure:

```sql
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb
);
```

The AuthContext now:

- Creates user records in the `users` table
- Stores profile data in the `metadata` JSONB field
- Maps the data to the expected `UserProfile` interface

## 🔄 Authentication Flow

The app now supports two authentication modes:

### Development Mode (Email Confirmation OFF)

- Users are immediately authenticated after signup
- No email verification required
- Automatic redirect to dashboard

### Production Mode (Email Confirmation ON)

- Users receive email verification link after signup
- Must click link to verify account
- Redirected to login page with verification message
- After email verification, redirected to dashboard

## 🚀 Next Steps

Once you have Supabase set up:

1. Authentication will work with real Supabase auth
2. User profiles will be stored in the database
3. All community features will work with real data
4. Email verification works properly
5. Protected routes redirect unauthenticated users
6. You can remove the mock data fallbacks if desired

## 📞 Need Help?

If you run into issues:

1. Check the browser console for detailed error messages
2. Verify your Supabase project settings
3. Make sure all environment variables are set correctly
4. Ensure the database schema was applied successfully
