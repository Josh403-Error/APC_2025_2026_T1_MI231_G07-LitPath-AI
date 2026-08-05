#!/usr/bin/env python
"""
Script to start the backend server with proper database configuration
"""
import os
import sys
import subprocess
from pathlib import Path
from dotenv import load_dotenv

def main():
    # Load environment variables
    backend_path = Path(__file__).parent / "backend"
    env_path = backend_path / ".env"
    load_dotenv(dotenv_path=env_path)
    
    # Change to backend directory
    os.chdir(backend_path)
    
    # Set environment variables for the subprocess
    env = os.environ.copy()
    
    print("Attempting to start Django server with PostgreSQL configuration...")
    print(f"Database Host: {os.getenv('DB_HOST', 'Not set')}")
    print(f"Database Name: {os.getenv('DB_NAME', 'Not set')}")
    print(f"Database User: {os.getenv('DB_USER', 'Not set')}")
    print(f"Database Port: {os.getenv('DB_PORT', 'Not set')}")
    
    try:
        # Try to run migrations first
        print("\nRunning migrations...")
        result = subprocess.run([
            sys.executable.replace('python', '../venv/bin/python'), 
            'manage.py', 
            'migrate'
        ], env=env, capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            print(f"Migrations failed: {result.stderr}")
            print("This might indicate a database connection issue.")
        else:
            print("Migrations completed successfully!")
        
        # Start the server
        print("\nStarting server...")
        subprocess.run([
            sys.executable.replace('python', '../venv/bin/python'), 
            'manage.py', 
            'runserver', 
            '127.0.0.1:8000'
        ], env=env)
        
    except subprocess.TimeoutExpired:
        print("Operation timed out.")
    except FileNotFoundError:
        print("Virtual environment Python not found. Trying with system Python...")
        # Fallback to system Python
        subprocess.run([
            sys.executable, 
            'manage.py', 
            'runserver', 
            '127.0.0.1:8000'
        ], env=env)

if __name__ == "__main__":
    main()