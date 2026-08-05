#!/usr/bin/env python3
"""
Database setup script for LitPath AI
This script helps set up the PostgreSQL database for the application
"""

import os
import sys
import subprocess
from pathlib import Path

def check_postgres_connection():
    """Check if PostgreSQL is accessible"""
    try:
        import psycopg2
        # Try to connect with the current configuration
        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'litpath_ai'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'postgres'),
            'port': os.getenv('DB_PORT', '5432')
        }
        
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"Successfully connected to PostgreSQL: {version[0]}")
        conn.close()
        return True
    except Exception as e:
        print(f"Could not connect to PostgreSQL: {e}")
        return False

def setup_database():
    """Set up the database using Django management commands"""
    try:
        # Change to backend directory
        backend_dir = Path(__file__).parent / "backend"
        os.chdir(backend_dir)
        
        # Activate virtual environment and run migrations
        env = os.environ.copy()
        env['PYTHONPATH'] = str(backend_dir)
        
        # Run Django migrations
        print("Running Django migrations...")
        result = subprocess.run([
            sys.executable, "manage.py", "migrate"
        ], capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print("Database migrations completed successfully!")
            print(result.stdout)
            
            # Create a superuser if prompted
            print("\nCreating a superuser account...")
            subprocess.run([sys.executable, "manage.py", "createsuperuser"], timeout=120)
        else:
            print(f"Migration failed: {result.stderr}")
            return False
            
        return True
    except subprocess.TimeoutExpired:
        print("Database setup timed out.")
        return False
    except Exception as e:
        print(f"Error during database setup: {e}")
        return False

def main():
    print("LitPath AI Database Setup")
    print("="*30)
    
    # Check if we can connect to PostgreSQL
    if not check_postgres_connection():
        print("\nCould not connect to PostgreSQL with current configuration.")
        print("Please ensure:")
        print("1. PostgreSQL server is running")
        print("2. The credentials in backend/.env are correct")
        print("3. The database exists and the user has appropriate permissions")
        print("\nDefault expected credentials in .env:")
        print("DB_HOST=localhost")
        print("DB_NAME=litpath_ai") 
        print("DB_USER=postgres")
        print("DB_PASSWORD=postgres")
        print("DB_PORT=5432")
        return 1
    
    # Proceed with setting up the database tables
    if setup_database():
        print("\nDatabase setup completed successfully!")
        print("You can now start the backend server with: python manage.py runserver")
        return 0
    else:
        print("\nDatabase setup failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())