# Generated migration to update 'General' to 'Irrelevant' in admin_category
from django.db import migrations

def update_general_to_irrelevant(apps, schema_editor):
    """Update all CSMFeedback records with admin_category 'General' to 'Irrelevant'."""
    CSMFeedback = apps.get_model('rag_api', 'CSMFeedback')
    
    # Update all records where admin_category is 'General' to 'Irrelevant'
    CSMFeedback.objects.filter(admin_category='General').update(admin_category='Irrelevant')


def reverse_update_general_to_irrelevant(apps, schema_editor):
    """Reverse the update - change 'Irrelevant' back to 'General'."""
    CSMFeedback = apps.get_model('rag_api', 'CSMFeedback')
    
    # Update all records where admin_category is 'Irrelevant' back to 'General'
    CSMFeedback.objects.filter(admin_category='Irrelevant').update(admin_category='General')


class Migration(migrations.Migration):

    dependencies = [
        ('rag_api', '0019_auto_20260413_0316'),
    ]

    operations = [
        migrations.RunPython(
            update_general_to_irrelevant,
            reverse_update_general_to_irrelevant
        ),
    ]