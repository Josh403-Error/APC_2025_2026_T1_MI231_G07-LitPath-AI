#!/usr/bin/env python
import os
import sys
import django
from django.conf import settings

# Add the backend directory to the path
sys.path.append('/home/apcadmin/Documents/APC_2025_2026_T1_MI231_G07-LitPath-AI/backend')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'litpath_backend.settings')
django.setup()

from rag_api.models import UserAccount, UserRole

def check_and_create_default_users():
    print("Checking for existing users...")
    
    # Check for existing users
    total_users = UserAccount.objects.count()
    print(f"Total users found: {total_users}")
    
    for user in UserAccount.objects.all():
        print(f"- {user.id}: {user.email} ({user.username}) - Role: {user.role}")
    
    # Create default admin user if none exist
    if not UserAccount.objects.filter(email='admin@litpath.local').exists():
        print("\nCreating default admin user...")
        admin_user = UserAccount(
            email='admin@litpath.local',
            username='admin',
            full_name='Admin User',
            role=UserRole.ADMIN,
            terms_accepted=True
        )
        admin_user.set_password('adminpass123')
        admin_user.save()
        print("Created admin user: admin@litpath.local / adminpass123")
    
    # Create secondary admin user if not exists
    if not UserAccount.objects.filter(email='admin@litpath.com').exists():
        print("\nCreating secondary admin user...")
        admin_user2 = UserAccount(
            email='admin@litpath.com',
            username='admin_main',
            full_name='Main Admin',
            role=UserRole.ADMIN,
            terms_accepted=True
        )
        admin_user2.set_password('admin123456')
        admin_user2.save()
        print("Created admin user: admin@litpath.com / admin123456")
    
    # Create librarian user if not exists
    if not UserAccount.objects.filter(email='librarian@dost.gov.ph').exists():
        print("\nCreating librarian user...")
        librarian_user = UserAccount(
            email='librarian@dost.gov.ph',
            username='librarian',
            full_name='Library Staff',
            role=UserRole.STAFF,
            terms_accepted=True
        )
        librarian_user.set_password('librarian123')
        librarian_user.save()
        print("Created librarian user: librarian@dost.gov.ph / librarian123")
    
    print("\nDatabase check completed!")

if __name__ == '__main__':
    check_and_create_default_users()