#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the path
sys.path.append('/home/apcadmin/Documents/APC_2025_2026_T1_MI231_G07-LitPath-AI/backend')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'litpath_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Create or update the test admin user
user, created = User.objects.get_or_create(
    username='testadmin',
    defaults={
        'email': 'testadmin@example.com',
        'is_staff': True,
        'is_active': True
    }
)

# Set a known password
user.set_password('admin123')
user.save()

print(f"Superuser testadmin {'created' if created else 'updated'} with password admin123")

# Also try updating the existing users that should have been created
existing_emails = ['admin@litpath.com', 'librarian@dost.gov.ph']
for email in existing_emails:
    users = User.objects.filter(email=email)
    if users.exists():
        user = users.first()
        user.set_password('admin123456' if email == 'admin@litpath.com' else 'librarian123')
        user.save()
        print(f"Updated password for {email}")
    else:
        print(f"User with email {email} not found")