# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('teams', '0003_sync_raffle_eligibility'),
    ]

    operations = [
        migrations.AddField(
            model_name='participant',
            name='hospital_id',
            field=models.CharField(blank=True, help_text='รหัสประจำตัวจากระบบโรงพยาบาล', max_length=100, null=True, verbose_name='ID โรงพยาบาล'),
        ),
    ]

