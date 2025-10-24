from __future__ import annotations
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from unittest.mock import patch

from core.models import Location, WeatherCache, UserPreferences
from core.services.weather_service import WeatherService, WeatherAPIError


class TestModels(TestCase):
    def test_location_creation(self):
        loc = Location.objects.create(
            user_id='u1', city_name='London', country='GB', latitude=51.5, longitude=-0.12
        )
        self.assertEqual(str(loc), 'London, GB')

    def test_weather_cache_validity(self):
        loc = Location.objects.create(user_id='u1', city_name='A', country='GB', latitude=1, longitude=1)
        cache = WeatherCache.objects.create(location=loc, cache_type=WeatherCache.CACHE_CURRENT, weather_data={})
        self.assertTrue(cache.is_valid())
        # Simulate old cache
        cache.cached_at = timezone.now() - timedelta(hours=2)
        cache.save(update_fields=['cached_at'])
        self.assertFalse(cache.is_valid())

    def test_user_preferences_defaults(self):
        prefs = UserPreferences.objects.create(session_id='s1')
        self.assertIn(prefs.temperature_unit, ['C', 'F'])
        self.assertIn(prefs.theme, ['light', 'dark', 'auto'])


class TestWeatherService(TestCase):
    @patch('core.services.weather_service.requests.get')
    def test_get_current_weather(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            'main': {'temp': 20, 'feels_like': 19, 'humidity': 50, 'pressure': 1012},
            'weather': [{'description': 'clear sky', 'main': 'Clear', 'icon': '01d'}],
            'wind': {'speed': 3.4, 'deg': 90},
            'visibility': 10000,
            'clouds': {'all': 0},
            'sys': {'sunrise': 1, 'sunset': 2},
            'timezone': 0,
            'dt': 0,
        }
        svc = WeatherService(api_key='x')
        data = svc.get_current_weather(1.0, 2.0)
        self.assertIn('temperature', data)

    @patch('core.services.weather_service.requests.get')
    def test_get_forecast(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            'list': [
                {'dt': 1, 'dt_txt': '2024-01-01 00:00:00', 'main': {'temp': 10, 'temp_min': 9, 'temp_max': 11}, 'weather': [{'main': 'Clear', 'description': 'clear', 'icon': '01d'}], 'wind': {'speed': 1, 'deg': 0}, 'clouds': {'all': 0}},
                {'dt': 2, 'dt_txt': '2024-01-01 03:00:00', 'main': {'temp': 8, 'temp_min': 7, 'temp_max': 9}, 'weather': [{'main': 'Clear', 'description': 'clear', 'icon': '01d'}], 'wind': {'speed': 1, 'deg': 0}, 'clouds': {'all': 0}},
            ]
        }
        svc = WeatherService(api_key='x')
        data = svc.get_forecast(1.0, 2.0, days=1)
        self.assertIn('days', data)

    @patch('core.services.weather_service.requests.get')
    def test_search_location(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = [
            {'name': 'London', 'lat': 51.5, 'lon': -0.12, 'country': 'GB'}
        ]
        svc = WeatherService(api_key='x')
        results = svc.search_location('London')
        self.assertTrue(len(results) > 0)

    @patch('core.services.weather_service.requests.get')
    def test_error_handling(self, mock_get):
        mock_get.return_value.status_code = 500
        mock_get.return_value.json.return_value = {'message': 'server error'}
        svc = WeatherService(api_key='x')
        with self.assertRaises(WeatherAPIError):
            svc.get_current_weather(0, 0)


