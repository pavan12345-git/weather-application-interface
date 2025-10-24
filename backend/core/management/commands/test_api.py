import os
from django.core.management.base import BaseCommand
from core.services.weather_service import WeatherService, WeatherAPIError, InvalidAPIKey, RateLimitExceeded


class Command(BaseCommand):
    help = 'Test OpenWeatherMap API connectivity and endpoints. Usage: manage.py test_api'

    def add_arguments(self, parser):
        parser.add_argument('--lat', type=float, default=51.5074, help='Latitude for test (default London)')
        parser.add_argument('--lon', type=float, default=-0.1278, help='Longitude for test (default London)')
        parser.add_argument('--query', type=str, default='London', help='City query for geocoding test')

    def handle(self, *args, **options):
        api_key = os.getenv('OPENWEATHER_API_KEY', '')
        service = WeatherService(api_key=api_key)
        lat = options['lat']
        lon = options['lon']
        query = options['query']

        def ok(msg: str):
            self.stdout.write(self.style.SUCCESS(f'✔ {msg}'))

        def fail(msg: str):
            self.stdout.write(self.style.ERROR(f'✘ {msg}'))

        # Validate key
        if not api_key:
            fail('OPENWEATHER_API_KEY not set')
            return
        ok('API key present')

        # Current weather
        try:
            data = service.get_current_weather(lat, lon)
            if data and 'temperature' in data:
                ok('Current weather fetched')
            else:
                fail('Current weather missing expected fields')
        except InvalidAPIKey:
            fail('Invalid API key (401)')
            return
        except RateLimitExceeded:
            fail('Rate limited (429)')
        except WeatherAPIError as exc:
            fail(f'API error: {exc}')
        except Exception as exc:  # pragma: no cover
            fail(f'Unexpected error: {exc}')

        # Forecast
        try:
            data = service.get_forecast(lat, lon, days=3)
            if data and 'days' in data:
                ok('Forecast fetched')
            else:
                fail('Forecast missing expected fields')
        except WeatherAPIError as exc:
            fail(f'Forecast error: {exc}')
        except Exception as exc:  # pragma: no cover
            fail(f'Unexpected error: {exc}')

        # Geocoding search
        try:
            results = service.search_location(query, limit=5)
            if isinstance(results, list):
                ok(f'Geocoding search returned {len(results)} results')
            else:
                fail('Geocoding search returned invalid response')
        except WeatherAPIError as exc:
            fail(f'Geocoding error: {exc}')

        # Reverse geocode
        try:
            name = service.reverse_geocode(lat, lon)
            if name:
                ok(f'Reverse geocoding resolved to: {name}')
            else:
                fail('Reverse geocoding returned no name')
        except WeatherAPIError as exc:
            fail(f'Reverse geocoding error: {exc}')


