#!/usr/bin/env python3
"""
Script to populate the PostgreSQL database with sample data for dashboard sections:
- Trending Topics
- Top 5 Most Viewed Theses
- Citation Activity
- Activity Trends
"""

import os
import sys
import django
import random
from datetime import datetime, timedelta
from decimal import Decimal

# Setup Django environment
sys.path.append('/home/apcadmin/Documents/APC_2025_2026_T1_MI231_G07-LitPath-AI/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'litpath_backend.settings')

django.setup()

from rag_api.models import CSMFeedback, Feedback, Material, MaterialView, CitationCopy, ResearchHistory


def populate_material_views():
    """Populate material views to simulate activity for "Most Viewed Theses" and "Activity Trends" """
    print("Populating Material Views data...")
    
    # Get all existing materials
    materials = list(Material.objects.all())
    
    if not materials:
        print("No materials found. Please populate materials first.")
        return
    
    # Create material views over the past 30 days
    for i in range(200):  # Create 200 view events
        # Random material
        material = random.choice(materials)
        
        # Random date within the last 30 days
        days_back = random.randint(0, 30)
        view_date = datetime.now() - timedelta(days=days_back)
        
        # Random user/session IDs
        user_id = f"user_{random.randint(1000, 9999)}"
        session_id = f"session_{random.randint(1000, 9999)}"
        
        # Create and save the material view
        material_view = MaterialView(
            file=material.file,
            user_id=user_id,
            session_id=session_id,
            viewed_at=view_date
        )
        
        material_view.save()
        print(f"Created Material View #{i+1}")
    
    print("Successfully populated Material Views data!")


def populate_citation_copies():
    """Populate citation copies for "Citation Activity" section"""
    print("Populating Citation Copies data...")
    
    # Get all existing materials
    materials = list(Material.objects.all())
    
    if not materials:
        print("No materials found. Please populate materials first.")
        return
    
    citation_styles = ['APA', 'MLA', 'Chicago', 'IEEE', 'Harvard']
    
    # Create citation copy events over the past 30 days
    for i in range(150):  # Create 150 citation copy events
        # Random material
        material = random.choice(materials)
        
        # Random date within the last 30 days
        days_back = random.randint(0, 30)
        copy_date = datetime.now() - timedelta(days=days_back)
        
        # Random user/session IDs
        user_id = f"user_{random.randint(1000, 9999)}"
        session_id = f"session_{random.randint(1000, 9999)}"
        
        # Random citation style
        style = random.choice(citation_styles)
        
        # Create and save the citation copy
        citation_copy = CitationCopy(
            document=material,
            user_id=user_id,
            session_id=session_id,
            citation_style=style,
            copied_at=copy_date
        )
        
        citation_copy.save()
        print(f"Created Citation Copy #{i+1}")
    
    print("Successfully populated Citation Copies data!")


def populate_research_history():
    """Populate research history for "Activity Trends" section"""
    print("Populating Research History data...")
    
    queries = [
        'renewable energy sources in the Philippines',
        'sustainable agriculture practices',
        'marine biodiversity conservation',
        'climate change adaptation strategies',
        'artificial intelligence in healthcare',
        'urban planning and smart cities',
        'biodegradable materials from waste',
        'water resource management',
        'disaster risk reduction',
        'public health interventions',
        'nanotechnology applications',
        'food security solutions',
        'electronic governance systems',
        'aquaculture innovations',
        'energy efficiency in buildings'
    ]
    
    subjects = [
        'Environmental Science',
        'Computer Science',
        'Agriculture',
        'Marine Biology',
        'Public Health',
        'Urban Development',
        'Materials Engineering',
        'Climate Studies',
        'Biotechnology',
        'Economics'
    ]
    
    # Create research history entries over the past 30 days
    for i in range(180):  # Create 180 research history entries
        # Random date within the last 30 days
        days_back = random.randint(0, 30)
        created_date = datetime.now() - timedelta(days=days_back)
        
        # Random user/session IDs
        user_id = f"user_{random.randint(1000, 9999)}"
        session_id = f"session_{random.randint(1000, 9999)}"
        
        # Random query and subjects
        query = random.choice(queries)
        subject_list = ', '.join(random.sample(subjects, random.randint(2, 4)))
        
        # Random response time (between 500ms and 5000ms)
        response_time = random.uniform(500.0, 5000.0)
        
        # Random source count (0-10)
        sources_count = random.randint(0, 10)
        
        # Random conversation length (1-15)
        conversation_length = random.randint(1, 15)
        
        # Create and save the research history
        research_history = ResearchHistory(
            session_id=session_id,
            user_id=user_id,
            query=query,
            all_queries=[query] + [f"Follow up: {query}" for _ in range(random.randint(0, 3))],
            conversation_data={'turns': [{'query': query, 'response': 'Sample response'}]},
            sources_count=sources_count,
            conversation_length=conversation_length,
            subjects=subject_list,
            date_filter=None,
            created_at=created_date,
            response_time_ms=response_time
        )
        
        research_history.save()
        print(f"Created Research History #{i+1}")
    
    print("Successfully populated Research History data!")


if __name__ == '__main__':
    print("Starting to populate database with dashboard sample data...")
    
    try:
        # Populate all dashboard-related tables
        populate_material_views()
        populate_citation_copies()
        populate_research_history()
        
        print("\nDatabase successfully populated with dashboard sample data!")
        print("- Material Views for Most Viewed Theses and Activity Trends")
        print("- Citation Copies for Citation Activity")
        print("- Research History for Activity Trends")
        
    except Exception as e:
        print(f"An error occurred while populating the database: {e}")
        import traceback
        traceback.print_exc()