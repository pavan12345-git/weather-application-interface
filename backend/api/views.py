import logging
import uuid
from typing import Any, Dict, List, Optional, Tuple

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

from core.models import Location, WeatherCache, UserPreferences
from core.services.weather_service import WeatherService
from .utils import success, error


logger = logging.getLogger(__name__)


def _parse_float(value: Optional[str], name: str) -> Tuple[Optional[float], Optional[Response]]:
    if value is None:
        return None, error(f'Missing required parameter: {name}', status.HTTP_400_BAD_REQUEST)
    try:
        return float(value), None
    except (TypeError, ValueError):
        return None, error(f'Invalid {name} value', status.HTTP_400_BAD_REQUEST)


def _validate_coords(lat: float, lon: float) -> Optional[Response]:
    if not (-90.0 <= lat <= 90.0):
        return error('Latitude out of range [-90, 90]', status.HTTP_400_BAD_REQUEST)
    if not (-180.0 <= lon <= 180.0):
        return error('Longitude out of range [-180, 180]', status.HTTP_400_BAD_REQUEST)
    return None


def _humanize_age_minutes(minutes: int) -> str:
    if minutes < 1:
        return 'just now'
    if minutes == 1:
        return '1 minute'
    if minutes < 60:
        return f'{minutes} minutes'
    hours = minutes // 60
    return f'{hours} hour' if hours == 1 else f'{hours} hours'


def _get_or_create_location_for_session(session_id: str, lat: float, lon: float, service: WeatherService) -> Location:
    loc = Location.objects.filter(user_id=session_id, latitude=lat, longitude=lon).first()
    if loc:
        return loc
    # Try to populate city/country from reverse geocoding; fallback to coordinates
    city = service.reverse_geocode(lat, lon) or f'({lat},{lon})'
    return Location.objects.create(
        user_id=session_id,
        city_name=city[:100],
        country='',
        latitude=lat,
        longitude=lon,
        is_favorite=False,
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request: Request) -> Response:
    return success({'status': 'ok', 'server_time': timezone.now().isoformat()})


@api_view(['GET'])
@permission_classes([AllowAny])
def current_weather(request: Request) -> Response:
    lat_str = request.query_params.get('lat')
    lon_str = request.query_params.get('lon')
    lat, err = _parse_float(lat_str, 'lat')
    if err:
        return err
    lon, err = _parse_float(lon_str, 'lon')
    if err:
        return err
    vr = _validate_coords(lat, lon)
    if vr:
        return vr

    # Session handling via cookie
    session_id = request.COOKIES.get('session_id') or uuid.uuid4().hex
    service = WeatherService()

    # Cache lookup
    loc = _get_or_create_location_for_session(session_id, lat, lon, service)
    cache: Optional[WeatherCache] = (
        WeatherCache.objects.filter(location=loc, cache_type=WeatherCache.CACHE_CURRENT)
        .order_by('-cached_at')
        .first()
    )
    if cache and cache.is_valid():
        resp = success({
            'data': cache.weather_data,
            'cached': True,
            'cache_age': _humanize_age_minutes(cache.get_age_minutes()),
        })
    else:
        try:
            weather = service.get_current_weather(lat, lon)
        except Exception as exc:
            logger.exception('Failed to fetch current weather')
            return error(f'Failed to fetch current weather: {exc}', status.HTTP_502_BAD_GATEWAY)

        cache = WeatherCache.objects.create(
            location=loc,
            cache_type=WeatherCache.CACHE_CURRENT,
            weather_data=weather,
        )
        resp = success({
            'data': weather,
            'cached': False,
            'cache_age': _humanize_age_minutes(0),
        })

    # Ensure session cookie is set
    if 'session_id' not in request.COOKIES:
        resp.set_cookie('session_id', session_id, max_age=60 * 60 * 24 * 30, httponly=False, samesite='Lax')
    return resp


@api_view(['GET'])
@permission_classes([AllowAny])
def forecast_weather(request: Request) -> Response:
    lat_str = request.query_params.get('lat')
    lon_str = request.query_params.get('lon')
    days_str = request.query_params.get('days', '7')
    lat, err = _parse_float(lat_str, 'lat')
    if err:
        return err
    lon, err = _parse_float(lon_str, 'lon')
    if err:
        return err
    vr = _validate_coords(lat, lon)
    if vr:
        return vr
    try:
        days = int(days_str)
    except ValueError:
        return error('Invalid days value', status.HTTP_400_BAD_REQUEST)
    days = max(1, min(days, 7))

    session_id = request.COOKIES.get('session_id') or uuid.uuid4().hex
    service = WeatherService()
    loc = _get_or_create_location_for_session(session_id, lat, lon, service)

    cache: Optional[WeatherCache] = (
        WeatherCache.objects.filter(location=loc, cache_type=WeatherCache.CACHE_FORECAST)
        .order_by('-cached_at')
        .first()
    )
    if cache and cache.is_valid():
        data = cache.forecast_data or {}
        resp = success({'data': data.get('days') if isinstance(data, dict) else data, 'cached': True, 'cache_age': _humanize_age_minutes(cache.get_age_minutes())})
    else:
        try:
            forecast = WeatherService().get_forecast(lat, lon, days=days)
        except Exception as exc:
            logger.exception('Failed to fetch forecast')
            return error(f'Failed to fetch forecast: {exc}', status.HTTP_502_BAD_GATEWAY)
        WeatherCache.objects.create(
            location=loc,
            cache_type=WeatherCache.CACHE_FORECAST,
            forecast_data=forecast,
        )
        resp = success({'data': forecast.get('days'), 'cached': False, 'cache_age': _humanize_age_minutes(0)})

    if 'session_id' not in request.COOKIES:
        resp.set_cookie('session_id', session_id, max_age=60 * 60 * 24 * 30, httponly=False, samesite='Lax')
    return resp


@api_view(['GET'])
@permission_classes([AllowAny])
def search_locations(request: Request) -> Response:
    query = request.query_params.get('q')
    if not query:
        return error('Missing required parameter: q', status.HTTP_400_BAD_REQUEST)
    try:
        results = WeatherService().search_location(query, limit=5)
        return success({'results': results})
    except Exception as exc:
        logger.exception('Location search failed')
        return error(f'Failed to search locations: {exc}', status.HTTP_502_BAD_GATEWAY)


@api_view(['POST'])
@permission_classes([AllowAny])
def save_location(request: Request) -> Response:
    data = request.data or {}
    session_id = data.get('session_id') or request.COOKIES.get('session_id')
    if not session_id:
        return error('session_id is required', status.HTTP_400_BAD_REQUEST)
    city = (data.get('city') or '').strip()
    country = (data.get('country') or '').strip()
    lat, err = _parse_float(str(data.get('lat')), 'lat')
    if err:
        return err
    lon, err = _parse_float(str(data.get('lon')), 'lon')
    if err:
        return err
    vr = _validate_coords(lat, lon)
    if vr:
        return vr

    existing = Location.objects.filter(user_id=session_id, latitude=lat, longitude=lon).first()
    if existing:
        return success({'location': {
            'id': existing.id,
            'city_name': existing.city_name,
            'country': existing.country,
            'latitude': float(existing.latitude),
            'longitude': float(existing.longitude),
            'is_favorite': existing.is_favorite,
            'created_at': existing.created_at,
        }, 'created': False}, status.HTTP_200_OK)

    loc = Location.objects.create(
        user_id=session_id,
        city_name=city or f'({lat},{lon})',
        country=country,
        latitude=lat,
        longitude=lon,
    )
    return success({'location': {
        'id': loc.id,
        'city_name': loc.city_name,
        'country': loc.country,
        'latitude': float(loc.latitude),
        'longitude': float(loc.longitude),
        'is_favorite': loc.is_favorite,
        'created_at': loc.created_at,
    }, 'created': True}, status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_locations(request: Request) -> Response:
    session_id = request.query_params.get('session_id') or request.COOKIES.get('session_id')
    if not session_id:
        return error('session_id is required', status.HTTP_400_BAD_REQUEST)
    locs = Location.objects.filter(user_id=session_id).order_by('-is_favorite', '-created_at')
    result: List[Dict[str, Any]] = []
    for loc in locs:
        cache = (
            WeatherCache.objects.filter(location=loc, cache_type=WeatherCache.CACHE_CURRENT)
            .order_by('-cached_at').first()
        )
        result.append({
            'id': loc.id,
            'city_name': loc.city_name,
            'country': loc.country,
            'latitude': float(loc.latitude),
            'longitude': float(loc.longitude),
            'is_favorite': loc.is_favorite,
            'created_at': loc.created_at,
            'weather': cache.weather_data if cache and cache.is_valid() else None,
        })
    return success({'locations': result})


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_location(request: Request, location_id: int) -> Response:
    session_id = request.query_params.get('session_id') or request.COOKIES.get('session_id')
    if not session_id:
        return error('session_id is required', status.HTTP_400_BAD_REQUEST)
    loc = Location.objects.filter(id=location_id, user_id=session_id).first()
    if not loc:
        return error('Location not found', status.HTTP_404_NOT_FOUND)
    loc.delete()
    return success({'message': 'Location deleted'})


@api_view(['POST'])
@permission_classes([AllowAny])
def toggle_favorite(request: Request, location_id: int) -> Response:
    session_id = request.data.get('session_id') or request.COOKIES.get('session_id')
    if not session_id:
        return error('session_id is required', status.HTTP_400_BAD_REQUEST)
    loc = Location.objects.filter(id=location_id, user_id=session_id).first()
    if not loc:
        return error('Location not found', status.HTTP_404_NOT_FOUND)
    loc.is_favorite = not loc.is_favorite
    loc.save(update_fields=['is_favorite'])
    return success({'location': {
        'id': loc.id,
        'city_name': loc.city_name,
        'country': loc.country,
        'latitude': float(loc.latitude),
        'longitude': float(loc.longitude),
        'is_favorite': loc.is_favorite,
        'created_at': loc.created_at,
    }})


@api_view(['GET'])
@permission_classes([AllowAny])
def get_preferences(request: Request) -> Response:
    session_id = request.query_params.get('session_id') or request.COOKIES.get('session_id')
    if not session_id:
        return error('session_id is required', status.HTTP_400_BAD_REQUEST)
    prefs, _ = UserPreferences.objects.get_or_create(session_id=session_id)
    return success({'preferences': {
        'session_id': prefs.session_id,
        'temperature_unit': prefs.temperature_unit,
        'theme': prefs.theme,
        'default_location': prefs.default_location_id,
        'updated_at': prefs.updated_at,
    }})


@api_view(['POST'])
@permission_classes([AllowAny])
def update_preferences(request: Request) -> Response:
    data = request.data or {}
    session_id = data.get('session_id') or request.COOKIES.get('session_id')
    if not session_id:
        return error('session_id is required', status.HTTP_400_BAD_REQUEST)
    temperature_unit = data.get('temperature_unit')
    theme = data.get('theme')
    default_location = data.get('default_location')

    # Validate choices
    valid_units = {'C', 'F'}
    valid_themes = {'light', 'dark', 'auto'}
    if temperature_unit and temperature_unit not in valid_units:
        return error('Invalid temperature_unit', status.HTTP_400_BAD_REQUEST)
    if theme and theme not in valid_themes:
        return error('Invalid theme', status.HTTP_400_BAD_REQUEST)

    prefs, _ = UserPreferences.objects.get_or_create(session_id=session_id)
    if temperature_unit:
        prefs.temperature_unit = temperature_unit
    if theme:
        prefs.theme = theme
    if default_location is not None:
        # Ensure the location belongs to this session
        if default_location == '':
            prefs.default_location = None
        else:
            try:
                loc_id = int(default_location)
            except (TypeError, ValueError):
                return error('Invalid default_location', status.HTTP_400_BAD_REQUEST)
            loc = Location.objects.filter(id=loc_id, user_id=session_id).first()
            if not loc:
                return error('default_location not found for this session', status.HTTP_400_BAD_REQUEST)
            prefs.default_location = loc
    prefs.save()

    return success({'preferences': {
        'session_id': prefs.session_id,
        'temperature_unit': prefs.temperature_unit,
        'theme': prefs.theme,
        'default_location': prefs.default_location_id,
        'updated_at': prefs.updated_at,
    }})


