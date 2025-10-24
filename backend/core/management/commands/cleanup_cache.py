from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import WeatherCache


class Command(BaseCommand):
    help = 'Delete WeatherCache entries older than 24 hours.'

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(hours=24)
        qs = WeatherCache.objects.filter(cached_at__lt=cutoff)
        count = qs.count()
        qs.delete()
        if count:
            self.stdout.write(self.style.SUCCESS(f"Deleted {count} old WeatherCache entries (<= {cutoff})."))
        else:
            self.stdout.write(self.style.WARNING('No old WeatherCache entries to delete.'))


