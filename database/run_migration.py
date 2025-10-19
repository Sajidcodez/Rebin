#!/usr/bin/env python3
"""
Migration script to set up user_profiles table in Supabase
Run this script to apply the user_profiles migration
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Get Supabase client with service role key"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables")
        sys.exit(1)
    
    return create_client(url, key)

def run_migration():
    """Run the user_profiles migration"""
    print("🚀 Starting user_profiles migration...")
    
    try:
        # Read the migration SQL file
        with open("migration_user_profiles.sql", "r") as f:
            migration_sql = f.read()
        
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Execute the migration
        print("📝 Executing migration SQL...")
        result = supabase.rpc('exec_sql', {'sql': migration_sql}).execute()
        
        print("✅ Migration completed successfully!")
        print("📋 user_profiles table has been created with proper RLS policies")
        print("🔐 Authentication should now work properly")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print("\n🔧 Manual steps:")
        print("1. Go to your Supabase dashboard")
        print("2. Navigate to SQL Editor")
        print("3. Copy and paste the contents of migration_user_profiles.sql")
        print("4. Execute the SQL")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()

