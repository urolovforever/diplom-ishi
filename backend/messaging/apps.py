from django.apps import AppConfig
from django.db import connection
from django.db.backends.signals import connection_created
from django.dispatch import receiver


class MessagingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "messaging"

    def ready(self):
        """Enable SQLite WAL mode for better concurrency"""
        # Import signals if needed
        pass


@receiver(connection_created)
def enable_sqlite_wal(sender, connection, **kwargs):
    """
    Enable WAL (Write-Ahead Logging) mode for SQLite.
    This significantly improves concurrency for WebSocket + HTTP operations.
    """
    if connection.vendor == 'sqlite':
        with connection.cursor() as cursor:
            cursor.execute('PRAGMA journal_mode=WAL;')
            cursor.execute('PRAGMA synchronous=NORMAL;')
            cursor.execute('PRAGMA temp_store=MEMORY;')
            cursor.execute('PRAGMA mmap_size=30000000000;')
