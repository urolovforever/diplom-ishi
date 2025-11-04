from django.core.management.base import BaseCommand
from confessions.models import Confession


class Command(BaseCommand):
    help = 'Seed initial confessions'

    def handle(self, *args, **kwargs):
        confessions_data = [
            {'name': 'Islam', 'slug': 'islam', 'description': 'Islamic faith and teachings'},
            {'name': 'Christianity', 'slug': 'christianity', 'description': 'Christian faith and teachings'},
            {'name': 'Judaism', 'slug': 'judaism', 'description': 'Jewish faith and teachings'},
            {'name': 'Buddhism', 'slug': 'buddhism', 'description': 'Buddhist philosophy and practices'},
            {'name': 'Hinduism', 'slug': 'hinduism', 'description': 'Hindu traditions and beliefs'},
            {'name': 'Sikhism', 'slug': 'sikhism', 'description': 'Sikh teachings and values'},
            {'name': 'Taoism', 'slug': 'taoism', 'description': 'Taoist philosophy and way of life'},
            {'name': 'Jainism', 'slug': 'jainism', 'description': 'Jain principles of non-violence'},
            {'name': 'Shinto', 'slug': 'shinto', 'description': 'Japanese indigenous spirituality'},
            {'name': 'Bahai', 'slug': 'bahai', 'description': 'Bahai faith teachings'},
            {'name': 'Zoroastrianism', 'slug': 'zoroastrianism', 'description': 'Ancient Persian religion'},
            {'name': 'Confucianism', 'slug': 'confucianism', 'description': 'Confucian philosophy'},
            {'name': 'Orthodox', 'slug': 'orthodox', 'description': 'Orthodox Christian tradition'},
            {'name': 'Catholic', 'slug': 'catholic', 'description': 'Catholic Christian faith'},
            {'name': 'Protestant', 'slug': 'protestant', 'description': 'Protestant Christian denominations'},
            {'name': 'Secular Humanism', 'slug': 'secular-humanism', 'description': 'Humanist philosophy and ethics'},
        ]

        for data in confessions_data:
            confession, created = Confession.objects.get_or_create(
                slug=data['slug'],
                defaults=data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created: {confession.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Already exists: {confession.name}'))

        self.stdout.write(self.style.SUCCESS('Seeding completed!'))