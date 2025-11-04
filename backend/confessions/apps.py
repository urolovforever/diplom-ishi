from django.apps import AppConfig

class ConfessionsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'confessions'

    def ready(self):
        import confessions.signals
