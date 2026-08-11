#!/usr/bin/env python
"""
Script to populate the database with realistic demo data for the librarian dashboard
"""
import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal
import random

# Add the project directory to Python path
sys.path.insert(0, '/home/apcadmin/Documents/APC_2025_2026_T1_MI231_G07-LitPath-AI/backend')

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'litpath_backend.settings')

# Setup Django
django.setup()

from rag_api.models import (
    UserAccount, Material, Feedback, ResearchHistory, Bookmark, 
    CSMFeedback, MaterialRating, MaterialView, SecurityAuditLogEntry,
    DatabaseBackupRecord, SystemSettings, UserRole
)

def populate_demo_data():
    print("Populating demo data for librarian dashboard...")
    
    # Get the admin and librarian users
    try:
        admin_user = UserAccount.objects.get(email='admin@litpath.com')
    except UserAccount.DoesNotExist:
        admin_user = UserAccount.objects.create(
            email='admin@litpath.com',
            username='admin',
            full_name='System Administrator',
            role=UserRole.ADMIN,
            is_active=True
        )
        admin_user.set_password('admin123456')
        admin_user.save()
        print("Created admin user")

    try:
        librarian_user = UserAccount.objects.get(email='librarian@dost.gov.ph')
    except UserAccount.DoesNotExist:
        librarian_user = UserAccount.objects.create(
            email='librarian@dost.gov.ph',
            username='librarian',
            full_name='DOST Librarian',
            role=UserRole.STAFF,
            is_active=True
        )
        librarian_user.set_password('librarian123')
        librarian_user.save()
        print("Created librarian user")

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
            print(f"Created material: {material.title}")
        else:
            print(f"Material already exists: {material.title}")

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
        print(f"Created research history: {query[:30]}...")

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
        print(f"Created feedback: Rating {rating}, Status {status}")

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
        print(f"Created CSM feedback: {client_type}, Rating {random.randint(3, 5)}")

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
        print(f"Created bookmark: {material.title[:30]}...")

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
        print(f"Created ratings for: {material.title}")

    # Create sample material views
    for material in created_materials:
        for i in range(random.randint(5, 15)):
            MaterialView.objects.create(
                file=material.file,
                user_id=f"viewer_{random.randint(1000, 9999)}",
                session_id=f"session_{random.randint(100000, 999999)}"
            )
        print(f"Created views for: {material.title}")

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
        print(f"Created audit log: {event_types[i % len(event_types)]}")

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
        print(f"Created backup record: Daily Backup {i+1}")

    print("\nDemo data population completed successfully!")
    print("\nSummary:")
    print(f"- Materials: {Material.objects.count()}")
    print(f"- Research History: {ResearchHistory.objects.count()}")
    print(f"- Feedback: {Feedback.objects.count()}")
    print(f"- CSM Feedback: {CSMFeedback.objects.count()}")
    print(f"- Bookmarks: {Bookmark.objects.count()}")
    print(f"- Material Ratings: {MaterialRating.objects.count()}")
    print(f"- Material Views: {MaterialView.objects.count()}")
    print(f"- Security Audit Logs: {SecurityAuditLogEntry.objects.count()}")
    print(f"- Database Backups: {DatabaseBackupRecord.objects.count()}")
    print("\nThese records can now be viewed and managed through the librarian dashboard.")

if __name__ == '__main__':
    populate_demo_data()