"""
Management command to create initial users in the UserAccount model
Usage: python manage.py seed_users
"""
from django.core.management.base import BaseCommand
from rag_api.models import UserAccount, UserRole


class Command(BaseCommand):
    help = 'Creates initial users for the system using the UserAccount model'

    def handle(self, *args, **options):
        # Define initial users
        initial_users = [
            {
                'email': 'admin@litpath.local',
                'password': 'adminpass123',
                'username': 'admin',
                'full_name': 'Local Administrator',
                'role': UserRole.ADMIN,
                'terms_accepted': True
            },
            {
                'email': 'admin@litpath.com',
                'password': 'admin123456',
                'username': 'main_admin',
                'full_name': 'System Administrator',
                'role': UserRole.ADMIN,
                'terms_accepted': True
            },
            {
                'email': 'librarian@dost.gov.ph',
                'password': 'librarian123',
                'username': 'librarian',
                'full_name': 'DOST Librarian',
                'role': UserRole.STAFF,
                'terms_accepted': True
            }
        ]

        created_count = 0
        skipped_count = 0

        for user_data in initial_users:
            email = user_data['email']

            # Check if user already exists
            if UserAccount.objects.filter(email=email).exists():
                self.stdout.write(
                    self.style.WARNING(f'User already exists: {email}')
                )
                skipped_count += 1
                continue

            # Create new user
            user = UserAccount(
                email=user_data['email'],
                username=user_data['username'],
                full_name=user_data['full_name'],
                role=user_data['role'],
                terms_accepted=user_data['terms_accepted']
            )
            user.set_password(user_data['password'])
            user.save()

            self.stdout.write(
                self.style.SUCCESS(f'✓ Created user: {email}')
            )
            created_count += 1

        self.stdout.write('\n' + '='*50)
        self.stdout.write(f'Created: {created_count} | Skipped: {skipped_count}')
        self.stdout.write('='*50 + '\n')

        if created_count > 0:
            self.stdout.write(self.style.SUCCESS('Default credentials:'))
            self.stdout.write('  Email: admin@litpath.local | Username: admin | Password: adminpass123')
            self.stdout.write('  Email: admin@litpath.com | Username: main_admin | Password: admin123456')
            self.stdout.write('  Email: librarian@dost.gov.ph | Username: librarian | Password: librarian123')
            self.stdout.write(self.style.WARNING('\n⚠️  Change these passwords in production!'))
