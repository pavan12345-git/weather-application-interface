from django.db import models
from django.utils import timezone
from datetime import timedelta
from typing import Optional


class Location(models.Model):
    user_id = models.CharField(max_length=255, db_index=True)
    city_name = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    is_favorite = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_favorite', '-created_at']
        indexes = [
            models.Index(fields=['user_id']),
            models.Index(fields=['latitude']),
            models.Index(fields=['longitude']),
        ]
        unique_together = ['user_id', 'latitude', 'longitude']

    def __str__(self) -> str:
        return f"{self.city_name}, {self.country}"

    def get_cached_weather(self, cache_type: str = 'current') -> Optional['WeatherCache']:
        latest: Optional['WeatherCache'] = (
            WeatherCache.objects.filter(location=self, cache_type=cache_type)
            .order_by('-cached_at')
            .first()
        )
        if latest and latest.is_valid():
            return latest
        return None

    def needs_update(self, cache_type: str = 'current') -> bool:
        cached = self.get_cached_weather(cache_type=cache_type)
        return cached is None


class WeatherCache(models.Model):
    CACHE_CURRENT = 'current'
    CACHE_FORECAST = 'forecast'
    CACHE_TYPE_CHOICES = [
        (CACHE_CURRENT, 'Current'),
        (CACHE_FORECAST, 'Forecast'),
    ]

    location = models.ForeignKey('Location', on_delete=models.CASCADE, related_name='caches')
    weather_data = models.JSONField(default=dict)
    forecast_data = models.JSONField(null=True, blank=True)
    cache_type = models.CharField(max_length=10, choices=CACHE_TYPE_CHOICES)
    cached_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-cached_at']
        indexes = [
            models.Index(fields=['location']),
            models.Index(fields=['cached_at']),
            models.Index(fields=['cache_type']),
        ]

    def is_valid(self) -> bool:
        now = timezone.now()
        ttl = timedelta(minutes=10) if self.cache_type == self.CACHE_CURRENT else timedelta(hours=1)
        return self.cached_at >= now - ttl

    def get_age_minutes(self) -> int:
        delta = timezone.now() - self.cached_at
        return int(delta.total_seconds() // 60)


class UserPreferences(models.Model):
    UNIT_C = 'C'
    UNIT_F = 'F'
    UNIT_CHOICES = [
        (UNIT_C, 'Celsius'),
        (UNIT_F, 'Fahrenheit'),
    ]

    THEME_LIGHT = 'light'
    THEME_DARK = 'dark'
    THEME_AUTO = 'auto'
    THEME_CHOICES = [
        (THEME_LIGHT, 'Light'),
        (THEME_DARK, 'Dark'),
        (THEME_AUTO, 'Auto'),
    ]

    session_id = models.CharField(max_length=255, primary_key=True)
    temperature_unit = models.CharField(max_length=1, choices=UNIT_CHOICES, default=UNIT_C)
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default=THEME_AUTO)
    default_location = models.ForeignKey('Location', null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Preferences<{self.session_id}>"

