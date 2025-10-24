from __future__ import annotations
import json
from django.test import TestCase, Client
from django.urls import reverse
from unittest.mock import patch

from core.models import Location, WeatherCache, UserPreferences


class TestWeatherAPI(TestCase):
    def setUp(self):
        self.client = Client()

    @patch('core.services.weather_service.WeatherService.get_current_weather')
    def test_current_weather_success(self, mock_get):
        mock_get.return_value = {
            'temperature': 20.0,
            'feels_like': 19.0,
            'humidity': 50,
            'pressure': 1012,
            'weather': 'clear sky',
            'weather_main': 'Clear',
            'icon': '01d',
            'wind_speed': 3.4,
            'wind_direction': 90,
            'visibility': 10000,
            'clouds': 0,
            'sunrise': 1,
            'sunset': 2,
            'timezone': 0,
            'dt': 0,
        }
        resp = self.client.get('/api/weather/current/', {'lat': '51.5', 'lon': '-0.12'})
        self.assertEqual(resp.status_code, 200)
        j = resp.json()
        self.assertTrue(j['success'])
        self.assertIn('data', j)
        self.assertIn('cached', j)

    def test_current_weather_invalid_coords(self):
        resp = self.client.get('/api/weather/current/', {'lat': '999', 'lon': '0'})
        self.assertEqual(resp.status_code, 400)

    @patch('core.services.weather_service.WeatherService.get_forecast')
    def test_forecast_success(self, mock_get):
        mock_get.return_value = {'days': [{'date': '2024-01-01', 'min_temp': 1, 'max_temp': 3, 'hours': []}]}
        resp = self.client.get('/api/weather/forecast/', {'lat': '51.5', 'lon': '-0.12', 'days': '3'})
        self.assertEqual(resp.status_code, 200)
        j = resp.json()
        self.assertTrue(j['success'])
        self.assertIn('data', j)

    @patch('core.services.weather_service.WeatherService.search_location')
    def test_location_search(self, mock_search):
        mock_search.return_value = [{'name': 'London', 'lat': 51.5, 'lon': -0.12, 'country': 'GB'}]
        resp = self.client.get('/api/locations/search/', {'q': 'London'})
        self.assertEqual(resp.status_code, 200)
        j = resp.json()
        self.assertTrue(j['success'])
        self.assertIn('results', j['data'])


class TestLocationAPI(TestCase):
    def setUp(self):
        self.client = Client()
        self.session_id = 'testsession'

    def test_save_location(self):
        payload = {
            'city': 'London', 'country': 'GB', 'lat': 51.5, 'lon': -0.12, 'session_id': self.session_id
        }
        resp = self.client.post('/api/locations/save/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 201)
        j = resp.json()
        self.assertTrue(j['success'])
        self.assertTrue(j['data']['created'])

    def test_get_user_locations(self):
        Location.objects.create(user_id=self.session_id, city_name='A', country='GB', latitude=1, longitude=1)
        resp = self.client.get('/api/locations/', {'session_id': self.session_id})
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()['success'])

    def test_delete_location(self):
        loc = Location.objects.create(user_id=self.session_id, city_name='A', country='GB', latitude=1, longitude=1)
        resp = self.client.delete(f'/api/locations/{loc.id}/', {'session_id': self.session_id})
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()['success'])

    def test_toggle_favorite(self):
        loc = Location.objects.create(user_id=self.session_id, city_name='A', country='GB', latitude=1, longitude=1)
        resp = self.client.post(f'/api/locations/{loc.id}/favorite/', data=json.dumps({'session_id': self.session_id}), content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()['success'])

    def test_duplicate_location(self):
        Location.objects.create(user_id=self.session_id, city_name='A', country='GB', latitude=1, longitude=1)
        payload = {'city': 'A', 'country': 'GB', 'lat': 1, 'lon': 1, 'session_id': self.session_id}
        resp = self.client.post('/api/locations/save/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()['success'])
        self.assertFalse(resp.json()['data']['created'])


class TestPreferencesAPI(TestCase):
    def setUp(self):
        self.client = Client()
        self.session_id = 'prefsess'

    def test_get_preferences(self):
        resp = self.client.get('/api/preferences/', {'session_id': self.session_id})
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()['success'])

    def test_update_preferences(self):
        payload = {'session_id': self.session_id, 'temperature_unit': 'F', 'theme': 'dark'}
        resp = self.client.post('/api/preferences/update/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()['success'])

    def test_default_preferences(self):
        # First fetch creates defaults
        resp = self.client.get('/api/preferences/', {'session_id': self.session_id})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']['preferences']
        self.assertIn(data['temperature_unit'], ['C', 'F'])

