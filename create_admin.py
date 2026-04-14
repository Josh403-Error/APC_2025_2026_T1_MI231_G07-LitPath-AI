#!/usr/bin/env python
"""
Script to create admin users in the LitPath system
"""
import os
import sys
import django

# Add the backend directory to the path
sys.path.insert(0, '/home/apcadmin/Documents/APC_2025_2026_T1_MI231_G07-LitPath-AI/backend')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'litpath_backend.settings')
django.setup()

from rag_api.models import UserAccount, AdminUser

def create_admin_users():
    print("Creating admin users...")
    
    # Create a main admin user with admin role
    admin_data = {
        'email': 'admin@litpath.local',
        'password': 'adminpass123',
        'full_name': 'System Administrator',
        'username': 'admin',
        'role': 'admin'
    }
    
    try:
        # Check if admin already exists
        admin_user, created = UserAccount.objects.get_or_create(
            username=admin_data['username'],
            defaults={
                'email': admin_data['email'],
                'full_name': admin_data['full_name'],
                'role': admin_data['role'],
                'is_active': True
            }
        )
        
        if created:
            print(f"Created new admin user: {admin_user.username}")
        else:
            print(f"Admin user already exists: {admin_user.username}")
        
        # Set the password regardless (in case it's an existing user)
        admin_user.set_password(admin_data['password'])
        admin_user.save()
        print(f"Password set for admin user: {admin_user.username}")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
    
    # Create a staff user
    staff_data = {
        'email': 'staff@litpath.local',
        'password': 'staffpass123',
        'full_name': 'System Staff',
        'username': 'staff',
        'role': 'staff'
    }
    
    try:
        # Check if staff already exists
        staff_user, created = UserAccount.objects.get_or_create(
            username=staff_data['username'],
            defaults={
                'email': staff_data['email'],
                'full_name': staff_data['full_name'],
                'role': staff_data['role'],
                'is_active': True
            }
        )
        
        if created:
            print(f"Created new staff user: {staff_user.username}")
        else:
            print(f"Staff user already exists: {staff_user.username}")
        
        # Set the password regardless
        staff_user.set_password(staff_data['password'])
        staff_user.save()
        print(f"Password set for staff user: {staff_user.username}")
        
    except Exception as e:
        print(f"Error creating staff user: {e}")

    # Also create the legacy admin users (for backward compatibility)
    initial_admins = [
        {
            'email': 'admin@litpath.com',
            'password': 'admin123456',
            'full_name': 'System Administrator',
            'is_active': True
        },
        {
            'email': 'librarian@dost.gov.ph',
            'password': 'librarian123',
            'full_name': 'DOST Librarian',
            'is_active': True
        }
    ]
    
    for admin_data in initial_admins:
        email = admin_data['email']
        try:
            admin, created = AdminUser.objects.get_or_create(
                email=email,
                defaults={
                    'full_name': admin_data['full_name'],
                    'is_active': admin_data['is_active']
                }
            )
            
            if created:
                print(f"Created legacy admin: {email}")
            else:
                print(f"Legacy admin already exists: {email}")
                
            # Set password regardless
            admin.set_password(admin_data['password'])
            admin.save()
            print(f"Password set for legacy admin: {email}")
            
        except Exception as e:
            print(f"Error creating legacy admin {email}: {e}")
    
    print("\nAdmin users have been created/updated successfully!")
    print("\nCredentials:")
    print("  Modern System:")
    print("    Username: admin | Email: admin@litpath.local | Password: adminpass123")
    print("    Username: staff | Email: staff@litpath.local | Password: staffpass123")
    print("  Legacy System:")
    print("    Email: admin@litpath.com | Password: admin123456")
    print("    Email: librarian@dost.gov.ph | Password: librarian123")

if __name__ == '__main__':
    create_admin_users()