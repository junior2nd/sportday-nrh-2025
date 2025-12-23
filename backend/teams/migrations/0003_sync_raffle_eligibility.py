# Generated migration to sync raffle eligibility for existing winners

from django.db import migrations


def disable_eligibility_for_existing_winners(apps, schema_editor):
    """Disable raffle eligibility for participants who have already won prizes"""
    Participant = apps.get_model('teams', 'Participant')
    RaffleParticipant = apps.get_model('raffle', 'RaffleParticipant')
    
    # Get all participant IDs who have won prizes
    winner_ids = RaffleParticipant.objects.values_list('participant_id', flat=True).distinct()
    
    # Update their eligibility to False
    Participant.objects.filter(id__in=winner_ids).update(is_raffle_eligible=False)


def reverse_disable_eligibility(apps, schema_editor):
    """Reverse: Enable raffle eligibility for all participants"""
    Participant = apps.get_model('teams', 'Participant')
    RaffleParticipant = apps.get_model('raffle', 'RaffleParticipant')
    
    # Get all participant IDs who have won prizes
    winner_ids = RaffleParticipant.objects.values_list('participant_id', flat=True).distinct()
    
    # Update their eligibility back to True
    Participant.objects.filter(id__in=winner_ids).update(is_raffle_eligible=True)


class Migration(migrations.Migration):

    dependencies = [
        ('teams', '0002_add_raffle_eligible_and_event_fields'),
        ('raffle', '0001_initial'),  # Need RaffleParticipant model
    ]

    operations = [
        migrations.RunPython(
            disable_eligibility_for_existing_winners,
            reverse_disable_eligibility,
        ),
    ]
