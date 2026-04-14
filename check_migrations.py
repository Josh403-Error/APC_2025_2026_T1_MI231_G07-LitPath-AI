#!/usr/bin/env python
"""
Migration Check Script
This script verifies and applies any pending migrations to the PostgreSQL database.
"""
import os
import sys
import django
from pathlib import Path

def check_and_apply_migrations():
    """Check for and apply any pending migrations"""
    # Add the backend directory to the path
    backend_path = Path(__file__).parent / "backend"
    sys.path.insert(0, str(backend_path))
    
    # Set the Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'litpath_backend.settings')
    
    # Setup Django
    django.setup()
    
    print("🔍 Checking for pending migrations...")
    
    # Import Django management commands after setup
    from django.core.management import execute_from_command_line
    from django.db.migrations.executor import MigrationExecutor
    from django.db import connection
    
    # Check for unapplied migrations
    executor = MigrationExecutor(connection)
    plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
    
    if plan:
        print(f"⚠️  Found {len(plan)} unapplied migrations:")
        for migration, backwards in plan:
            print(f"  - {migration.app_label}.{migration.name}")
        
        print("\n🔧 Applying migrations...")
        try:
            execute_from_command_line(["manage.py", "migrate"])
            print("✅ Migrations applied successfully!")
        except Exception as e:
            print(f"❌ Error applying migrations: {e}")
            return False
    else:
        print("✅ All migrations are already applied.")
    
    # Verify the database tables exist
    print("\n🔍 Verifying database tables...")
    try:
        with connection.cursor() as cursor:
            # Check if key tables exist
            tables_to_check = [
                'rag_api_useraccount',
                'rag_api_session',
                'rag_api_feedback',
                'rag_api_researchhistory',
                'auth_user'  # Standard Django auth table
            ]
            
            existing_tables = []
            for table in tables_to_check:
                cursor.execute("SELECT to_regclass(%s)", [table])
                if cursor.fetchone()[0] is not None:
                    existing_tables.append(table)
                    
            print(f"✅ Found {len(existing_tables)} expected tables: {existing_tables}")
            
            # Check if any users exist
            cursor.execute("SELECT COUNT(*) FROM auth_user;")
            user_count = cursor.fetchone()[0]
            print(f"👥 Found {user_count} users in the database")
            
    except Exception as e:
        print(f"❌ Error verifying tables: {e}")
        return False
        
    return True

def main():
    print("🔄 PostgreSQL Migration Verification")
    print("="*50)
    
    success = check_and_apply_migrations()
    
    print("\n" + "="*50)
    if success:
        print("🎉 Database migration verification completed successfully!")
        print("✅ Your PostgreSQL database is fully set up for development.")
        return True
    else:
        print("❌ Issues found during migration verification.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)