#!/usr/bin/env python
"""
Environment Test Script
This script verifies that all environment variables are properly configured
for both frontend and backend development.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

def check_backend_env():
    """Check backend environment variables"""
    print("🔍 Checking Backend Environment...")
    
    # Change to backend directory to load .env
    backend_path = Path("./backend")
    os.chdir(backend_path)
    
    # Load environment variables from backend/.env
    backend_env_path = backend_path / ".env"
    if backend_env_path.exists():
        load_dotenv(override=True)
        print(f"✅ Loaded environment from {backend_env_path}")
    else:
        print(f"❌ Backend .env file not found at {backend_env_path}")
        return False
    
    # Check essential variables
    checks = [
        ("DJANGO_SECRET_KEY", os.getenv("DJANGO_SECRET_KEY")),
        ("DEBUG", os.getenv("DEBUG")),
        ("DATABASE_URL", os.getenv("DATABASE_URL")),
        ("DB_HOST", os.getenv("DB_HOST")),
        ("DB_NAME", os.getenv("DB_NAME")),
        ("DB_USER", os.getenv("DB_USER")),
        ("GEMINI_API_KEY", os.getenv("GEMINI_API_KEY")),
        ("HF_TOKEN", os.getenv("HF_TOKEN")),
    ]
    
    all_good = True
    for var_name, value in checks:
        if value:
            print(f"✅ {var_name}: {'SET' if value else 'NOT SET'}")
        else:
            print(f"❌ {var_name}: NOT SET")
            all_good = False
            
    return all_good

def check_frontend_env():
    """Check frontend environment variables"""
    print("\n🔍 Checking Frontend Environment...")
    
    # Change to frontend directory
    frontend_path = Path("../frontend")
    os.chdir(frontend_path)
    
    # Load environment variables from frontend/.env
    frontend_env_path = frontend_path / ".env"
    if frontend_env_path.exists():
        load_dotenv(override=True)
        print(f"✅ Loaded environment from {frontend_env_path}")
    else:
        print(f"❌ Frontend .env file not found at {frontend_env_path}")
        return False
    
    # Check essential variables
    checks = [
        ("VITE_SUPABASE_URL", os.getenv("VITE_SUPABASE_URL")),
        ("VITE_SUPABASE_ANON_KEY", os.getenv("VITE_SUPABASE_ANON_KEY")),
        ("VITE_API_BASE_URL", os.getenv("VITE_API_BASE_URL")),
    ]
    
    all_good = True
    for var_name, value in checks:
        if value:
            print(f"✅ {var_name}: {'SET' if value else 'NOT SET'}")
        else:
            print(f"❌ {var_name}: NOT SET")
            all_good = False
            
    return all_good

def main():
    print("🧪 Environment Consistency Check")
    print("="*50)
    
    backend_ok = check_backend_env()
    frontend_ok = check_frontend_env()
    
    print("\n" + "="*50)
    print("📋 Summary:")
    print(f"Backend Config: {'✅ OK' if backend_ok else '❌ Issues Found'}")
    print(f"Frontend Config: {'✅ OK' if frontend_ok else '❌ Issues Found'}")
    
    if backend_ok and frontend_ok:
        print("\n🎉 All environment configurations look good!")
        print("✅ You should be able to start both frontend and backend processes without issues.")
        return True
    else:
        print("\n❌ Some environment variables are missing or misconfigured.")
        return False

if __name__ == "__main__":
    # Start from the project root
    project_root = Path(__file__).parent
    os.chdir(project_root)
    
    success = main()
    sys.exit(0 if success else 1)