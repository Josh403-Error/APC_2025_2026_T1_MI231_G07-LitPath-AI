#!/usr/bin/env python
"""
Script to create a default admin user in the custom UserAccount system
"""
import os
import sys
import django
from pathlib import Path

# Add backend to the Python path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

def create_admin_user():
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Setup Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'litpath_backend.settings')
    django.setup()
    
    # Import models after Django setup
    from rag_api.models import UserAccount
    from django.contrib.auth.hashers import make_password
    
    # Define admin credentials
    admin_email = 'admin@litpath.local'
    admin_username = 'admin'
    admin_password = 'adminpass123'
    
    # Check if admin user already exists
    existing_user = UserAccount.objects.filter(email=admin_email).first()
    
    if existing_user:
        print(f"Admin user with email '{admin_email}' already exists.")
        print(f"Email: {existing_user.email}")
        print(f"Username: {existing_user.username}")
        print(f"Role: {existing_user.role}")
        return
    
    # Create new admin user
    admin_user = UserAccount(
        email=admin_email,
        username=admin_username,
        full_name='Admin User',
        role=UserAccount.UserRole.ADMIN,  # Use the enum value 'admin'
        school_level='College',
        school_name='Default School',
        client_type='Researcher',
        sex='Other',
        age='25-34',
        region='Region IV-A',
        category='Teaching Personnel',
        terms_accepted=True,
        terms_version='v2026-04-01'
    )
    admin_user.set_password(admin_password)
    admin_user.save()
    
    print(f"Successfully created admin user:")
    print(f"  Email: {admin_email}")
    print(f"  Username: {admin_username}")
    print(f"  Password: {admin_password}")
    print(f"  Role: {admin_user.role}")

if __name__ == "__main__":
    create_admin_user()