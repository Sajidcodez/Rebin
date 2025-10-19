# 🗄️ Database Setup Fix

## 🚨 **Error Explanation**

The error `"relation "public.user_preferences" does not exist"` means that your Supabase database doesn't have the required tables yet. You need to apply the database schema first.

## ✅ **Solution: Apply Database Schema**

### **Step 1: Go to Supabase Dashboard**

1. Open your browser and go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your ReBin Pro project

### **Step 2: Apply the Main Schema**

1. In your Supabase dashboard, click on **"SQL Editor"** in the left sidebar
2. Click **"New Query"** to create a new SQL query
3. Copy the entire contents of `database/schema.sql` file
4. Paste it into the SQL Editor
5. Click **"Run"** to execute the schema

### **Step 3: Apply the User Triggers**

1. In the same SQL Editor, create another new query
2. Copy the entire contents of `database/user_trigger.sql` file
3. Paste it into the SQL Editor
4. Click **"Run"** to execute the triggers

### **Step 4: Verify Tables Were Created**

1. In your Supabase dashboard, click on **"Table Editor"** in the left sidebar
2. You should now see these tables:
   - ✅ `users`
   - ✅ `user_preferences`
   - ✅ `sort_events`
   - ✅ `policies`
   - ✅ `achievements`
   - ✅ `challenges`
   - ✅ `challenge_participants`
   - ✅ `user_sessions`
   - ✅ `analytics_events`
   - ✅ `feedback`
   - ✅ `leaderboard`

## 🔧 **Alternative: Use the Setup Script**

If you prefer to use a script, you can also run:

```bash
# Make sure you're in the project root
cd /Users/peguero/Rebin-1

# Run the database setup script
python3 database/run_migration.py
```

## 🧪 **Test the Fix**

After applying the schema:

1. **Restart your development server:**

   ```bash
   cd frontend
   npm run dev
   ```

2. **Test registration:**
   - Go to http://localhost:5173/register
   - Create a new account
   - Check your Supabase dashboard → Table Editor → `users` table
   - You should see the new user record

## 📋 **What the Schema Creates**

The `schema.sql` file creates:

### **Core Tables:**

- `users` - User profiles and information
- `user_preferences` - User settings and preferences
- `sort_events` - Waste sorting events and decisions
- `policies` - Local recycling policies by ZIP code

### **Community Features:**

- `achievements` - User achievements and badges
- `challenges` - Community challenges
- `challenge_participants` - User participation in challenges
- `leaderboard` - User rankings and statistics

### **Analytics & Tracking:**

- `user_sessions` - User session tracking
- `analytics_events` - Detailed analytics
- `feedback` - User feedback on sorting decisions

### **Functions & Triggers:**

- Automatic timestamp updates
- Leaderboard calculations
- Achievement checking
- User profile synchronization

## 🚨 **Troubleshooting**

### **If you get permission errors:**

1. Make sure you're using the correct Supabase project
2. Check that you have admin access to the project
3. Verify your Supabase project is fully initialized

### **If tables still don't appear:**

1. Check the SQL Editor for any error messages
2. Make sure you copied the entire `schema.sql` content
3. Try running the schema in smaller chunks if it's too large

### **If you get "relation already exists" errors:**

1. This means some tables already exist
2. You can safely ignore these errors
3. The schema will only create tables that don't exist

## ✅ **Success Criteria**

The fix is working when:

- ✅ All tables appear in Supabase Table Editor
- ✅ No errors in SQL Editor when running the schema
- ✅ User registration creates records in the `users` table
- ✅ No more "relation does not exist" errors

## 📚 **Files to Use**

- `database/schema.sql` - Main database schema (apply this first)
- `database/user_trigger.sql` - User profile triggers (apply this second)

---

**Once you apply the database schema, the authentication system will work perfectly and users will be properly stored in your Supabase database!** 🎉
