# Generated by Django 5.1.6 on 2025-04-14 01:52

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0004_user_room_number"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="has_completed_setup",
            field=models.BooleanField(default=False),
        ),
    ]
