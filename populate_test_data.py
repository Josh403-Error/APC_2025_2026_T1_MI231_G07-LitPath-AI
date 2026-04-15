#!/usr/bin/env python
"""
Script to populate realistic test data for LitPath AI project
This includes data for users, sessions, research history, materials, and feedback
"""
import os
import sys
import django
from pathlib import Path
from datetime import datetime, timedelta
import uuid

# Add backend to the Python path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

def populate_test_data():
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()

    # Setup Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'litpath_backend.settings')
    django.setup()

    from django.contrib.auth.hashers import make_password
    from rag_api.models import UserAccount, Session, ResearchHistory, Material, Feedback, Bookmark, MaterialRating, MaterialView, CSMFeedback
    from django.utils import timezone

    print("Populating test data for LitPath AI project...")

    # Sample users
    users_data = [
        {
            'email': 'testuser@example.com',
            'username': 'testuser',
            'full_name': 'Test User',
            'school_level': 'College',
            'school_name': 'Sample University',
            'client_type': 'Student',
            'sex': 'Male',
            'age': '25-34',
            'region': 'Region IV-A',
            'category': 'Student',
            'terms_accepted': True,
            'terms_version': 'v2026-04-01',
            'role': 'user'
        },
        {
            'email': 'researcher@test.edu',
            'username': 'researcher',
            'full_name': 'Researcher Doe',
            'school_level': 'Graduate School',
            'school_name': 'Advanced Research Institute',
            'client_type': 'Researcher',
            'sex': 'Female',
            'age': '35-44',
            'region': 'National Capital Region',
            'category': 'Faculty Member',
            'terms_accepted': True,
            'terms_version': 'v2026-04-01',
            'role': 'user'
        },
        {
            'email': 'professor@university.edu',
            'username': 'prof_smith',
            'full_name': 'Professor Smith',
            'school_level': 'College',
            'school_name': 'State University',
            'client_type': 'Faculty',
            'sex': 'Male',
            'age': '45-54',
            'region': 'Region III',
            'category': 'Teaching Personnel',
            'terms_accepted': True,
            'terms_version': 'v2026-04-01',
            'role': 'staff'
        }
    ]

    created_users = []
    for user_data in users_data:
        # Check if user already exists
        existing_user = UserAccount.objects.filter(email=user_data['email']).first()
        if existing_user:
            print(f"User {user_data['email']} already exists")
            created_users.append(existing_user)
        else:
            user = UserAccount(
                email=user_data['email'],
                username=user_data['username'],
                full_name=user_data['full_name'],
                school_level=user_data['school_level'],
                school_name=user_data['school_name'],
                client_type=user_data['client_type'],
                sex=user_data['sex'],
                age=user_data['age'],
                region=user_data['region'],
                category=user_data['category'],
                terms_accepted=user_data['terms_accepted'],
                terms_version=user_data['terms_version'],
                role=user_data['role'],
                is_active=True
            )
            user.set_password('SecurePass123!')
            user.save()
            created_users.append(user)
            print(f"Created user: {user_data['email']}")

    # Create a guest session
    guest_session = Session.objects.create(
        is_anonymous=True,
        guest_id=str(uuid.uuid4()),
        session_token=f"guest_{uuid.uuid4()}",
        user=None
    )
    print(f"Created guest session: {guest_session.session_token}")

    # Create user sessions
    user_sessions = []
    for user in created_users:
        session = Session.objects.create(
            is_anonymous=False,
            guest_id=None,
            session_token=f"session_{uuid.uuid4()}",
            user=user
        )
        user_sessions.append(session)
        print(f"Created session for user: {user.email}")

    # Sample materials (theses/papers)
    materials_data = [
        {
            'file': 'thesis_ai_ethics_2023.txt',
            'title': 'Ethical Implications of Artificial Intelligence in Modern Society',
            'author': 'Dr. Jane Smith',
            'year': 2023,
            'abstract': 'This paper explores the ethical considerations surrounding the deployment of artificial intelligence in various sectors of modern society.',
            'degree': 'PhD in Computer Science',
            'call_no': 'QA76.76.I55 S65 2023',
            'subjects': 'Artificial Intelligence, Ethics, Philosophy of Technology',
            'school': 'School of Engineering and Applied Sciences',
            'university': 'Institute of Advanced Studies',
            'publication_date': '2023-06-15',
            'pages': 245,
            'adviser': 'Prof. John Doe',
            'department': 'Department of Computer Science',
            'course': 'Computer Science',
            'classification': 'Academic Research',
            'language': 'English',
            'format': 'PDF',
            'rights': 'Copyright Reserved',
            'accession_no': 'ACC-2023-001'
        },
        {
            'file': 'thesis_blockchain_security_2024.txt',
            'title': 'Security Challenges in Blockchain-Based Applications',
            'author': 'Michael Johnson',
            'year': 2024,
            'abstract': 'This thesis examines the security vulnerabilities present in blockchain implementations and proposes mitigation strategies.',
            'degree': 'Master of Science in Cybersecurity',
            'call_no': 'QA76.9.B53 J64 2024',
            'subjects': 'Blockchain, Cybersecurity, Cryptography',
            'school': 'School of Information Technology',
            'university': 'Cybersecurity University',
            'publication_date': '2024-03-20',
            'pages': 187,
            'adviser': 'Dr. Sarah Williams',
            'department': 'Department of Information Security',
            'course': 'Cybersecurity',
            'classification': 'Academic Research',
            'language': 'English',
            'format': 'PDF',
            'rights': 'Copyright Reserved',
            'accession_no': 'ACC-2024-002'
        },
        {
            'file': 'thesis_quantum_computing_2023.txt',
            'title': 'Quantum Computing Algorithms for Optimization Problems',
            'author': 'Dr. Alice Chen',
            'year': 2023,
            'abstract': 'This research presents novel quantum algorithms designed to solve complex optimization problems more efficiently than classical computers.',
            'degree': 'PhD in Quantum Physics',
            'call_no': 'QA76.88 C44 2023',
            'subjects': 'Quantum Computing, Algorithms, Optimization',
            'school': 'School of Physics and Engineering',
            'university': 'Quantum Research Institute',
            'publication_date': '2023-11-10',
            'pages': 210,
            'adviser': 'Prof. Robert Brown',
            'department': 'Department of Quantum Physics',
            'course': 'Quantum Computing',
            'classification': 'Academic Research',
            'language': 'English',
            'format': 'PDF',
            'rights': 'Copyright Reserved',
            'accession_no': 'ACC-2023-003'
        }
    ]

    created_materials = []
    for material_data in materials_data:
        # Check if material already exists
        existing_material = Material.objects.filter(file=material_data['file']).first()
        if existing_material:
            print(f"Material {material_data['file']} already exists")
            created_materials.append(existing_material)
        else:
            material = Material(**material_data)
            material.save()
            created_materials.append(material)
            print(f"Created material: {material_data['title']}")

    # Sample research histories
    research_histories = []
    for i, user in enumerate(created_users[:2]):  # Only first 2 users get research history
        history = ResearchHistory.objects.create(
            user_id=user.id,
            session_id=user_sessions[i].id,
            query=f"Sample research query {i+1} about {materials_data[i]['title']}",
            overview=f"This is a sample overview for query {i+1}. It discusses the main points from the research.",
            documents=[materials_data[i]['file']],
            sources_count=1,
            conversation_length=5,
            subjects=materials_data[i]['subjects'],
            date_filter="2023-2024",
            all_queries=[f"Initial query {i+1}", f"Follow-up query {i+1}"],
            conversation_data={"turns": [{"query": f"Initial query {i+1}", "response": "Sample response"}]},
            response_time_ms=1250,
            created_at=timezone.now() - timedelta(days=i*2)
        )
        research_histories.append(history)
        print(f"Created research history for user: {user.email}")

    # Sample feedback entries
    feedback_entries = []
    for i, user in enumerate(created_users[:2]):
        feedback = Feedback.objects.create(
            user_id=user.id,
            session_id=user_sessions[i].id,
            query_used=f"Query {i+1} about {materials_data[i]['title']}",
            document_used=materials_data[i]['file'],
            feedback_text=f"This is valuable research material for my studies. Well written and comprehensive.",
            rating=4,  # 1-5 scale
            category='Positive',
            is_resolved=True,
            created_at=timezone.now() - timedelta(days=i)
        )
        feedback_entries.append(feedback)
        print(f"Created feedback for user: {user.email}")

    # Sample bookmarks
    bookmarks = []
    for i, user in enumerate(created_users):
        bookmark = Bookmark.objects.create(
            user_id=user.id,
            session_id=user_sessions[i].id,
            file=materials_data[i % len(materials_data)]['file'],
            title=materials_data[i % len(materials_data)]['title'],
            author=materials_data[i % len(materials_data)]['author'],
            year=materials_data[i % len(materials_data)]['year'],
            abstract=materials_data[i % len(materials_data)]['abstract'][:100] + "...",
            degree=materials_data[i % len(materials_data)]['degree'],
            call_no=materials_data[i % len(materials_data)]['call_no'],
            subjects=materials_data[i % len(materials_data)]['subjects'],
            school=materials_data[i % len(materials_data)]['school'],
            university=materials_data[i % len(materials_data)]['university'],
            created_at=timezone.now() - timedelta(hours=i*5)
        )
        bookmarks.append(bookmark)
        print(f"Created bookmark for user: {user.email}")

    # Sample material ratings
    material_ratings = []
    for i, user in enumerate(created_users):
        rating = MaterialRating.objects.create(
            user_id=user.id,
            file=materials_data[i % len(materials_data)]['file'],
            rating=4,  # 1-5 scale
            is_relevant=True
        )
        material_ratings.append(rating)
        print(f"Created rating for user: {user.email}")

    # Sample material views
    material_views = []
    for i, user in enumerate(created_users):
        view = MaterialView.objects.create(
            user_id=user.id,
            session_id=user_sessions[i].id,
            file=materials_data[i % len(materials_data)]['file'],
            view_duration=timedelta(minutes=15),
            viewed_at=timezone.now() - timedelta(hours=i*3)
        )
        material_views.append(view)
        print(f"Created view record for user: {user.email}")

    # Sample CSM feedback (Client Satisfaction Monitoring)
    csm_feedback = CSMFeedback.objects.create(
        user_id=created_users[0].id,
        session_id=user_sessions[0].id,
        consent_given=True,
        client_type='Student',
        date=timezone.now().date(),
        sex=created_users[0].sex,
        age=created_users[0].age,
        region=created_users[0].region,
        category=created_users[0].category,
        litpath_rating=4,
        research_interests='AI Ethics, Machine Learning',
        missing_content='More recent publications needed',
        message_comment='Great service, very helpful for my research!',
        created_at=timezone.now() - timedelta(days=1)
    )
    print(f"Created CSM feedback for user: {created_users[0].email}")

    print("\n" + "="*60)
    print("Test data population completed successfully!")
    print(f"- Created {len(created_users)} users")
    print(f"- Created {len(created_materials)} materials")
    print(f"- Created {len(research_histories)} research histories")
    print(f"- Created {len(feedback_entries)} feedback entries")
    print(f"- Created {len(bookmarks)} bookmarks")
    print(f"- Created {len(material_ratings)} material ratings")
    print(f"- Created {len(material_views)} material views")
    print(f"- Created {len(user_sessions)} user sessions")
    print("- Created 1 guest session")
    print("- Created 1 CSM feedback")
    print("="*60)
    print("\nYou can now test various features of the LitPath AI application with this sample data.")

if __name__ == "__main__":
    populate_test_data()