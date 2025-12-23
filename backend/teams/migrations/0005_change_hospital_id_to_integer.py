# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('teams', '0004_add_hospital_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='participant',
            name='hospital_id',
            field=models.IntegerField(blank=True, help_text='รหัสประจำตัวจากระบบโรงพยาบาล', null=True, verbose_name='ID โรงพยาบาล'),
        ),
    ]

