"""
Management command to populate demo data for the librarian dashboard
Usage: python manage.py populate_librarian_demo_data
"""
from django.core.management.base import BaseCommand
from datetime import datetime, timedelta
from decimal import Decimal
import random
from rag_api.models import (
    UserAccount, Material, Feedback, ResearchHistory, Bookmark, 
    CSMFeedback, MaterialRating, MaterialView, SecurityAuditLogEntry,
    DatabaseBackupRecord, SystemSettings, UserRole
)


class Command(BaseCommand):
    help = 'Populates the database with realistic demo data for the librarian dashboard'

    def handle(self, *args, **options):
        self.stdout.write('Populating demo data for librarian dashboard...')
        
        # Get or create the admin and librarian users
        admin_user, admin_created = UserAccount.objects.get_or_create(
            email='admin@litpath.com',
            defaults={
                'username': 'admin',
                'full_name': 'System Administrator',
                'role': UserRole.ADMIN,
                'is_active': True
            }
        )
        if admin_created:
            admin_user.set_password('admin123456')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Created admin user'))

        librarian_user, librarian_created = UserAccount.objects.get_or_create(
            email='librarian@dost.gov.ph',
            defaults={
                'username': 'librarian',
                'full_name': 'DOST Librarian',
                'role': UserRole.STAFF,
                'is_active': True
            }
        )
        if librarian_created:
            librarian_user.set_password('librarian123')
            librarian_user.save()
            self.stdout.write(self.style.SUCCESS('Created librarian user'))

        # Sample thesis data for Materials
        sample_materials = [
            {
                "title": "Machine Learning Applications in Agricultural Technology",
                "author": "Maria Santos",
                "year": 2025,
                "abstract": "This study explores the integration of machine learning algorithms in modern agricultural practices, focusing on crop yield prediction and pest detection systems.",
                "degree": "Master of Science in Computer Engineering",
                "subjects": ["Machine Learning", "Agricultural Technology", "Data Science"],
                "school": "University of the Philippines Los Baños"
            },
            {
                "title": "Sustainable Energy Solutions for Rural Communities in the Philippines",
                "author": "Juan Dela Cruz",
                "year": 2024,
                "abstract": "An analysis of renewable energy implementations in off-grid communities, examining solar, wind, and micro-hydro systems.",
                "degree": "Bachelor of Science in Environmental Engineering",
                "subjects": ["Renewable Energy", "Environmental Engineering", "Sustainability"],
                "school": "Mapua University"
            },
            {
                "title": "Digital Transformation in Philippine Banking Sector",
                "author": "Ana Rodriguez",
                "year": 2025,
                "abstract": "Examines the impact of digital banking solutions on traditional banking operations in the Philippines post-COVID-19.",
                "degree": "Master of Business Administration",
                "subjects": ["Digital Transformation", "Banking", "Technology Adoption"],
                "school": "De La Salle University"
            },
            {
                "title": "Marine Biodiversity Conservation in the Coral Triangle",
                "author": "Carlos Mendoza",
                "year": 2024,
                "abstract": "Assessment of coral reef ecosystems in the Philippines and their resilience to climate change.",
                "degree": "Doctor of Philosophy in Marine Biology",
                "subjects": ["Marine Biology", "Conservation", "Climate Change"],
                "school": "University of the Philippines Marine Science Institute"
            },
            {
                "title": "Artificial Intelligence in Healthcare Diagnostics",
                "author": "Isabella Gutierrez",
                "year": 2025,
                "abstract": "Development of AI-powered diagnostic tools for early detection of common diseases in Filipino populations.",
                "degree": "Master of Science in Biomedical Engineering",
                "subjects": ["Artificial Intelligence", "Healthcare", "Biomedical Engineering"],
                "school": "Ateneo de Manila University"
            }
        ]

        # Create sample materials
        created_materials = []
        for material_data in sample_materials:
            material, created = Material.objects.get_or_create(
                file=f"thesis_{material_data['author'].replace(' ', '_')}_{material_data['year']}.pdf",
                defaults={
                    "title": material_data["title"],
                    "author": material_data["author"],
                    "year": material_data["year"],
                    "abstract": material_data["abstract"],
                    "degree": material_data["degree"],
                    "subjects": material_data["subjects"],
                    "school": material_data["school"]
                }
            )
            created_materials.append(material)
            if created:
                self.stdout.write(f"Created material: {material.title}")
            else:
                self.stdout.write(f"Material already exists: {material.title}")

        # Create sample research history records
        sample_queries = [
            "machine learning applications in agriculture",
            "sustainable energy solutions philippines",
            "digital transformation banking sector",
            "marine biodiversity conservation coral triangle",
            "artificial intelligence healthcare diagnostics",
            "renewable energy rural communities",
            "climate change impacts agriculture",
            "biomedical engineering innovations"
        ]

        for i in range(15):
            user_id = f"user_{random.randint(1000, 9999)}"
            query = random.choice(sample_queries)
            
            ResearchHistory.objects.create(
                session_id=f"session_{random.randint(100000, 999999)}",
                user_id=user_id,
                query=query,
                all_queries=[query],
                conversation_data={"messages": [{"role": "user", "content": query}]},
                sources_count=random.randint(3, 10),
                conversation_length=random.randint(1, 5),
                subjects=",".join(random.sample(sample_materials[0]["subjects"], min(2, len(sample_materials[0]["subjects"])))),
                date_filter="2024-2025",
                response_time_ms=Decimal(random.uniform(500, 3000))  # ms
            )
            self.stdout.write(f"Created research history: {query[:30]}...")

        # Create sample feedback entries
        feedback_categories = ["Positive", "Issue", "For Improvement"]
        feedback_statuses = ["Pending", "Reviewed", "Resolved"]

        for i in range(12):
            user_id = f"user_{random.randint(1000, 9999)}"
            rating = random.randint(1, 5)
            category = random.choice(feedback_categories)
            status = random.choice(feedback_statuses)
            
            Feedback.objects.create(
                user_id=user_id,
                query=random.choice(sample_queries),
                rating=rating,
                relevant=random.choice([True, False]),
                comment=f"This is sample feedback #{i+1} about the research system.",
                status=status,
                category=category,
                is_valid=random.choice([True, False, None]),
                is_doable=random.choice([True, False, None])
            )
            self.stdout.write(f"Created feedback: Rating {rating}, Status {status}")

        # Create sample CSM feedback
        client_types = ["Student", "Librarian/Library Staff", "Teaching Personnel", "Researcher"]
        sexes = ["Female", "Male", "Prefer not to say"]
        ages = ["21-25", "26-30", "31-35", "36-40"]
        regions = ["NCR", "R03", "R06", "R07", "R11"]

        for i in range(10):
            user_id = f"csm_user_{random.randint(1000, 9999)}"
            client_type = random.choice(client_types)
            sex = random.choice(sexes)
            age = random.choice(ages)
            region = random.choice(regions)
            
            CSMFeedback.objects.create(
                user_id=user_id,
                session_id=f"session_{random.randint(100000, 999999)}",
                consent_given=True,
                client_type=client_type,
                date=datetime.now().date() - timedelta(days=random.randint(0, 30)),
                sex=sex,
                age=age,
                region=region,
                category=client_type,
                litpath_rating=random.randint(3, 5),
                research_interests="Academic research and literature review",
                missing_content="More recent publications needed",
                message_comment=f"Sample CSM feedback #{i+1}",
                status=random.choice(["Pending", "Reviewed", "Resolved"])
            )
            self.stdout.write(f"Created CSM feedback: {client_type}, Rating {random.randint(3, 5)}")

        # Create sample bookmarks
        for i in range(8):
            user_id = f"bookmark_user_{random.randint(1000, 9999)}"
            material = random.choice(created_materials)
            
            Bookmark.objects.create(
                user_id=user_id,
                title=material.title,
                author=material.author,
                year=material.year,
                abstract=material.abstract[:200] + "...",
                file=material.file,
                degree=material.degree,
                subjects=",".join(material.subjects),
                school=material.school
            )
            self.stdout.write(f"Created bookmark: {material.title[:30]}...")

        # Create sample material ratings
        for material in created_materials:
            for i in range(random.randint(2, 5)):
                user_id = f"rating_user_{random.randint(1000, 9999)}"
                rating = random.randint(3, 5)
                
                MaterialRating.objects.get_or_create(
                    user_id=user_id,
                    file=material.file,
                    defaults={
                        'rating': rating,
                        'is_relevant': True
                    }
                )
            self.stdout.write(f"Created ratings for: {material.title}")

        # Create sample material views
        for material in created_materials:
            for i in range(random.randint(5, 15)):
                MaterialView.objects.create(
                    file=material.file,
                    user_id=f"viewer_{random.randint(1000, 9999)}",
                    session_id=f"session_{random.randint(100000, 999999)}"
                )
            self.stdout.write(f"Created views for: {material.title}")

        # Create sample security audit logs
        event_types = ["login_success", "login_failure", "manual_note"]
        severities = ["info", "warning"]

        for i in range(20):
            SecurityAuditLogEntry.objects.create(
                event_type=random.choice(event_types),
                actor_label=f"user_{random.randint(1000, 9999)}",
                action_summary=f"Audit log entry #{i+1}",
                severity=random.choice(severities),
                outcome="success",
                ip_address=f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}"
            )
            self.stdout.write(f"Created audit log: {event_types[i % len(event_types)]}")

        # Create sample database backup records
        for i in range(5):
            DatabaseBackupRecord.objects.create(
                name=f"Daily Backup {datetime.now().date()}_{i+1}",
                backup_type="incremental",
                target_environment="production",
                storage_location="/backups/daily/",
                retention_days=30,
                size_mb=Decimal(random.uniform(100, 500)),
                status=random.choice(["completed", "running"]),
                created_by=librarian_user,
                updated_by=librarian_user
            )
            self.stdout.write(f"Created backup record: Daily Backup {i+1}")

        self.stdout.write(
            self.style.SUCCESS(
                '\nDemo data population completed successfully!\n\n'
                'Summary:\n'
                f'- Materials: {Material.objects.count()}\n'
                f'- Research History: {ResearchHistory.objects.count()}\n'
                f'- Feedback: {Feedback.objects.count()}\n'
                f'- CSM Feedback: {CSMFeedback.objects.count()}\n'
                f'- Bookmarks: {Bookmark.objects.count()}\n'
                f'- Material Ratings: {MaterialRating.objects.count()}\n'
                f'- Material Views: {MaterialView.objects.count()}\n'
                f'- Security Audit Logs: {SecurityAuditLogEntry.objects.count()}\n'
                f'- Database Backups: {DatabaseBackupRecord.objects.count()}\n\n'
                'These records can now be viewed and managed through the librarian dashboard.'
            )
        )