#!/usr/bin/env python
"""
Script to synchronize users between Django's auth_user and the custom UserAccount system
"""
import os
import sys
import django
from pathlib import Path

# Add backend to the Python path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

def sync_users():
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Setup Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'litpath_backend.settings')
    django.setup()
    
    # Import models after Django setup
    from django.contrib.auth.models import User
    from rag_api.models import UserAccount
    from django.contrib.auth.hashers import make_password
    
    print("Synchronizing users between auth_user and UserAccount systems...")
    
    # Sync from auth_user to UserAccount
    for django_user in User.objects.all():
        # Check if a corresponding UserAccount exists
        try:
            user_account = UserAccount.objects.get(email=django_user.email)
            print(f"User {django_user.email} already exists in UserAccount system")
        except UserAccount.DoesNotExist:
            # Create a corresponding UserAccount
            user_account = UserAccount(
                email=django_user.email,
                username=django_user.username,
                full_name=django_user.get_full_name() or django_user.first_name + ' ' + django_user.last_name,
                role=UserAccount.UserRole.ADMIN if django_user.is_superuser else UserAccount.UserRole.USER,
                school_level='College',
                school_name='Default School',
                client_type='Researcher',
                sex='Other',
                age='25-34',
                region='Region IV-A',
                category='Teaching Personnel',
                terms_accepted=True,
                terms_version='v2026-04-01',
                is_active=django_user.is_active
            )
            # Use the same password hash
            user_account.password_hash = django_user.password
            user_account.save()
            print(f"Created UserAccount for {django_user.email}")
    
    # Sync from UserAccount to auth_user
    for user_account in UserAccount.objects.all():
        # Check if a corresponding auth_user exists
        try:
            django_user = User.objects.get(email=user_account.email)
            print(f"User {user_account.email} already exists in auth_user system")
        except User.DoesNotExist:
            # Create a corresponding auth_user
            django_user = User(
                username=user_account.username,
                email=user_account.email,
                first_name=(user_account.full_name or '').split(' ')[0] if user_account.full_name else '',
                last_name=' '.join((user_account.full_name or '').split(' ')[1:]) if user_account.full_name else '',
                is_active=user_account.is_active,
                is_staff=user_account.is_staff_or_admin(),
                is_superuser=(user_account.role == UserAccount.UserRole.ADMIN)
            )
            # Use the same password hash
            django_user.password = user_account.password_hash
            django_user.save()
            print(f"Created auth_user for {user_account.email}")
    
    print("User synchronization completed!")

if __name__ == "__main__":
    sync_users()