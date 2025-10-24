import random
import uuid
from django.core.management.base import BaseCommand, CommandError
from core.models import Location, UserPreferences


CITIES = [
    ('London', 'UK', 51.5074, -0.1278),
    ('New York', 'US', 40.7128, -74.0060),
    ('Paris', 'FR', 48.8566, 2.3522),
    ('Tokyo', 'JP', 35.6895, 139.6917),
    ('Sydney', 'AU', -33.8688, 151.2093),
    ('Toronto', 'CA', 43.6532, -79.3832),
    ('Berlin', 'DE', 52.5200, 13.4050),
    ('Mumbai', 'IN', 19.0760, 72.8777),
]


class Command(BaseCommand):
    help = 'Seed sample locations and user preferences. Usage: manage.py seed_data --locations=5'

    def add_arguments(self, parser):
        parser.add_argument('--locations', type=int, default=5, help='Number of locations to create')
        parser.add_argument('--session', type=str, default=None, help='Explicit session_id to use')

    def handle(self, *args, **options):
        num = max(1, min(int(options['locations']), 20))
        session_id = options.get('session') or uuid.uuid4().hex

        self.stdout.write(self.style.WARNING(f'Using session_id={session_id}'))

        # Create/update preferences
        prefs, _ = UserPreferences.objects.get_or_create(session_id=session_id)
        prefs.temperature_unit = random.choice(['C', 'F'])
        prefs.theme = random.choice(['light', 'dark', 'auto'])
        prefs.save()
        self.stdout.write(self.style.SUCCESS('Created/updated user preferences'))

        # Create locations
        created = 0
        for name, country, lat, lon in random.sample(CITIES, k=min(num, len(CITIES))):
            loc, was_created = Location.objects.get_or_create(
                user_id=session_id,
                latitude=lat,
                longitude=lon,
                defaults={'city_name': name, 'country': country, 'is_favorite': created == 0},
            )
            if was_created:
                created += 1
                self.stdout.write(self.style.SUCCESS(f'Created location: {name}, {country}'))
            else:
                self.stdout.write(self.style.WARNING(f'Location exists: {name}, {country}'))

        self.stdout.write(self.style.SUCCESS(f'Done. {created} locations created for session {session_id}.'))


