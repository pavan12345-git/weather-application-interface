from django.contrib import admin
from django.db.models import QuerySet
from .models import Location, WeatherCache, UserPreferences


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = (
        'city_name', 'country', 'user_id', 'latitude', 'longitude', 'is_favorite', 'created_at'
    )
    list_filter = ('is_favorite', 'country', 'created_at')
    search_fields = ('city_name', 'country', 'user_id')
    ordering = ('-is_favorite', '-created_at')
    actions = ['mark_favorite', 'clear_cache']

    def mark_favorite(self, request, queryset: QuerySet[Location]) -> None:
        queryset.update(is_favorite=True)
    mark_favorite.short_description = 'Mark selected as favorite'  # type: ignore[attr-defined]

    def clear_cache(self, request, queryset: QuerySet[Location]) -> None:
        WeatherCache.objects.filter(location__in=list(queryset)).delete()
    clear_cache.short_description = 'Clear cache for selected locations'  # type: ignore[attr-defined]


@admin.register(WeatherCache)
class WeatherCacheAdmin(admin.ModelAdmin):
    list_display = ('location', 'cache_type', 'cached_at', 'age_minutes')
    list_filter = ('cache_type', 'cached_at')
    search_fields = ('location__city_name', 'location__country', 'location__user_id')
    ordering = ('-cached_at',)

    def age_minutes(self, obj: WeatherCache) -> int:
        return obj.get_age_minutes()
    age_minutes.short_description = 'Age (min)'  # type: ignore[attr-defined]


@admin.register(UserPreferences)
class UserPreferencesAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'temperature_unit', 'theme', 'default_location', 'updated_at')
    list_filter = ('temperature_unit', 'theme', 'updated_at')
    search_fields = ('session_id',)
    ordering = ('-updated_at',)


