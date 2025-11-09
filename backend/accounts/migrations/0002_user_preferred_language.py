# Generated manually for adding preferred_language field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='preferred_language',
            field=models.CharField(
                choices=[('en', 'English'), ('uz', 'Uzbek'), ('ru', 'Russian')],
                default='en',
                max_length=5
            ),
        ),
    ]
