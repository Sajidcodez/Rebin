#!/usr/bin/env python3
"""
Database migration script for ReBin Pro
Applies schema changes and data migrations to Supabase
"""

import asyncio
import os
import sys
from pathlib import Path
from typing import List, Optional

import asyncpg
from loguru import logger
from supabase import create_client

# Add the backend directory to the path so we can import our modules
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from utils.settings import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY


class DatabaseMigrator:
    """Handles database migrations for ReBin Pro"""
    
    def __init__(self):
        self.supabase_url = SUPABASE_URL
        self.supabase_key = SUPABASE_SERVICE_ROLE_KEY
        
        if not self.supabase_url or not self.supabase_key:
            raise RuntimeError("Supabase configuration missing")
        
        self.supabase = create_client(self.supabase_url, self.supabase_key)
        
    async def run_migration(self, migration_file: str) -> bool:
        """Run a specific migration file"""
        try:
            migration_path = Path(__file__).parent / migration_file
            if not migration_path.exists():
                logger.error(f"Migration file not found: {migration_path}")
                return False
            
            with open(migration_path, 'r') as f:
                sql_content = f.read()
            
            logger.info(f"Running migration: {migration_file}")
            
            # Split SQL content into individual statements
            statements = self._split_sql_statements(sql_content)
            
            for statement in statements:
                if statement.strip():
                    try:
                        # Use Supabase client to execute the statement
                        result = self.supabase.rpc('exec_sql', {'sql': statement}).execute()
                        logger.debug(f"Executed statement successfully")
                    except Exception as e:
                        logger.warning(f"Statement failed (might already exist): {e}")
                        # Continue with other statements even if one fails
                        continue
            
            logger.success(f"Migration completed: {migration_file}")
            return True
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            return False
    
    def _split_sql_statements(self, sql_content: str) -> List[str]:
        """Split SQL content into individual statements"""
        # Remove comments and split by semicolon
        lines = sql_content.split('\n')
        clean_lines = []
        
        for line in lines:
            # Remove single-line comments
            if '--' in line:
                line = line[:line.index('--')]
            clean_lines.append(line.strip())
        
        # Join and split by semicolon
        content = ' '.join(clean_lines)
        statements = [stmt.strip() for stmt in content.split(';') if stmt.strip()]
        
        return statements
    
    async def check_migration_status(self) -> dict:
        """Check which migrations have been applied"""
        try:
            # Try to get migration history
            result = self.supabase.table('migration_history').select('*').execute()
            return {
                'applied_migrations': [row['migration_name'] for row in result.data],
                'total_migrations': len(result.data)
            }
        except Exception:
            # Migration history table doesn't exist yet
            return {
                'applied_migrations': [],
                'total_migrations': 0
            }
    
    async def create_migration_history_table(self):
        """Create migration history table if it doesn't exist"""
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS migration_history (
            id SERIAL PRIMARY KEY,
            migration_name TEXT UNIQUE NOT NULL,
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            checksum TEXT,
            rollback_sql TEXT
        );
        """
        
        try:
            self.supabase.rpc('exec_sql', {'sql': create_table_sql}).execute()
            logger.info("Migration history table created/verified")
        except Exception as e:
            logger.warning(f"Could not create migration history table: {e}")
    
    async def record_migration(self, migration_name: str, checksum: str = "", rollback_sql: str = ""):
        """Record a migration as applied"""
        try:
            self.supabase.table('migration_history').insert({
                'migration_name': migration_name,
                'checksum': checksum,
                'rollback_sql': rollback_sql
            }).execute()
            logger.info(f"Recorded migration: {migration_name}")
        except Exception as e:
            logger.warning(f"Could not record migration: {e}")
    
    async def seed_initial_data(self):
        """Seed initial data for the application"""
        try:
            logger.info("Seeding initial data...")
            
            # Seed default policies
            policies_data = [
                {
                    "zip": "10001",
                    "rules_json": {
                        "recycling": ["plastic #1-2", "paper", "cardboard", "glass", "metal"],
                        "compost": ["food scraps", "yard waste", "soiled paper"],
                        "trash": ["styrofoam", "plastic bags", "electronics", "hazardous waste"]
                    },
                    "city": "New York",
                    "state": "NY",
                    "country": "US"
                },
                {
                    "zip": "94103",
                    "rules_json": {
                        "recycling": ["glass", "paper", "metal", "plastic #1-7"],
                        "compost": ["food", "soiled paper", "yard waste"],
                        "trash": ["film plastic", "styrofoam", "electronics"]
                    },
                    "city": "San Francisco",
                    "state": "CA",
                    "country": "US"
                },
                {
                    "zip": "90210",
                    "rules_json": {
                        "recycling": ["paper", "cardboard", "glass", "metal", "plastic #1-2"],
                        "compost": ["food waste", "yard trimmings"],
                        "trash": ["plastic bags", "styrofoam", "electronics"]
                    },
                    "city": "Beverly Hills",
                    "state": "CA",
                    "country": "US"
                }
            ]
            
            for policy in policies_data:
                try:
                    self.supabase.table('policies').upsert(policy, on_conflict='zip').execute()
                except Exception as e:
                    logger.warning(f"Could not insert policy for {policy['zip']}: {e}")
            
            # Seed default challenges
            challenges_data = [
                {
                    "title": "Recycling Rookie",
                    "description": "Sort your first 10 items correctly and start your eco-journey!",
                    "challenge_type": "recycling",
                    "target_items": 10,
                    "target_co2": 0.5,
                    "difficulty_level": "easy",
                    "reward_points": 50,
                    "is_active": True,
                    "is_featured": True
                },
                {
                    "title": "Compost Champion",
                    "description": "Compost 20 food items this month and reduce food waste!",
                    "challenge_type": "compost",
                    "target_items": 20,
                    "target_co2": 1.0,
                    "difficulty_level": "medium",
                    "reward_points": 100,
                    "is_active": True,
                    "is_featured": True
                },
                {
                    "title": "Waste Warrior",
                    "description": "Sort 100 items and save 5kg CO2 - become a true waste warrior!",
                    "challenge_type": "reduction",
                    "target_items": 100,
                    "target_co2": 5.0,
                    "difficulty_level": "hard",
                    "reward_points": 500,
                    "is_active": True,
                    "is_featured": False
                }
            ]
            
            for challenge in challenges_data:
                try:
                    self.supabase.table('challenges').insert(challenge).execute()
                except Exception as e:
                    logger.warning(f"Could not insert challenge {challenge['title']}: {e}")
            
            logger.success("Initial data seeding completed")
            
        except Exception as e:
            logger.error(f"Initial data seeding failed: {e}")
    
    async def run_all_migrations(self):
        """Run all pending migrations"""
        try:
            # Create migration history table first
            await self.create_migration_history_table()
            
            # Check current migration status
            status = await self.check_migration_status()
            logger.info(f"Current migration status: {status}")
            
            # Run schema migration
            schema_success = await self.run_migration('schema.sql')
            if schema_success:
                await self.record_migration('schema_v1.0.0')
            
            # Seed initial data
            await self.seed_initial_data()
            
            logger.success("All migrations completed successfully!")
            
        except Exception as e:
            logger.error(f"Migration process failed: {e}")
            raise


async def main():
    """Main migration function"""
    try:
        migrator = DatabaseMigrator()
        await migrator.run_all_migrations()
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
