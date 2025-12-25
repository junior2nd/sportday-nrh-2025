# Generated migration for adding print status fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('raffle', '0003_raffleeligibleparticipant_is_opted_out_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='raffleparticipant',
            name='is_printed',
            field=models.BooleanField(default=False, verbose_name='พิมพ์แล้ว'),
        ),
        migrations.AddField(
            model_name='raffleparticipant',
            name='printed_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='วันที่พิมพ์'),
        ),
    ]

