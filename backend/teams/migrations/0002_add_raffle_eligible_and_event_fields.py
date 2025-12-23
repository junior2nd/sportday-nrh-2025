# Generated manually for Phase 5 migration

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('teams', '0001_initial'),
        ('core', '0001_initial'),
    ]

    operations = [
        # Add is_raffle_eligible field to Participant
        migrations.AddField(
            model_name='participant',
            name='is_raffle_eligible',
            field=models.BooleanField(
                default=True,
                verbose_name='มีสิทธิ์จับรางวัล',
                help_text='ถ้าเปิด หมายความว่ามีสิทธิ์จับรางวัล (ค่ามาตรฐาน: เปิด)'
            ),
        ),
        # Add event field to TeamMember (allow null temporarily for existing records)
        migrations.AddField(
            model_name='teammember',
            name='event',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='team_members',
                to='core.event',
                verbose_name='กิจกรรม',
                help_text='Event ที่ participant อยู่ในทีมนี้ (ต้องตรงกับ team.event)',
                null=True
            ),
        ),
        # Populate event field from team.event for existing records
        migrations.RunSQL(
            sql="UPDATE teams_teammember SET event_id = (SELECT event_id FROM teams_team WHERE teams_team.id = teams_teammember.team_id)",
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Make event field NOT NULL after populating
        migrations.AlterField(
            model_name='teammember',
            name='event',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='team_members',
                to='core.event',
                verbose_name='กิจกรรม',
                help_text='Event ที่ participant อยู่ในทีมนี้ (ต้องตรงกับ team.event)'
            ),
        ),
        # Add UniqueConstraint for (participant, event)
        migrations.AddConstraint(
            model_name='teammember',
            constraint=models.UniqueConstraint(
                fields=['participant', 'event'],
                name='unique_participant_per_event'
            ),
        ),
    ]

