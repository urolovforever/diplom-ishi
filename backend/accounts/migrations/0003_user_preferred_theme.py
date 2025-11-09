# Generated manually for adding preferred_theme field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_preferred_language'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='preferred_theme',
            field=models.CharField(
                choices=[('light', 'Light'), ('dark', 'Dark')],
                default='light',
                max_length=10
            ),
        ),
    ]
