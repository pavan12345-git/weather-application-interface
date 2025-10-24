from __future__ import annotations
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Tuple

from django.http import HttpRequest
from rest_framework.response import Response


def api_response(data: Any = None, message: Optional[str] = None, success: bool = True, status: int = 200) -> Response:
    payload: Dict[str, Any] = {
        'success': success,
        'data': data if success else None,
        'message': message if success else None,
        'error': None if success else (message or 'An error occurred'),
    }
    return Response(payload, status=status)


# Backwards-compatible helpers used in current views
def success(data: Dict[str, Any], status_code: int = 200) -> Response:
    return api_response(data=data, success=True, status=status_code)


def error(message: str, status_code: int = 400) -> Response:
    return api_response(message=message, success=False, status=status_code)


def validate_coordinates(lat: float, lon: float) -> bool:
    return (-90.0 <= float(lat) <= 90.0) and (-180.0 <= float(lon) <= 180.0)


def get_or_create_session(request: HttpRequest) -> str:
    session_id = request.COOKIES.get('session_id')
    if not session_id:
        # Leave setting cookie to SessionMiddleware or the view
        import uuid
        session_id = uuid.uuid4().hex
    return session_id


def celsius_to_fahrenheit(temp: float) -> float:
    return (float(temp) * 9.0 / 5.0) + 32.0


def format_cache_age(cached_at) -> str:
    if cached_at is None:
        return 'unknown'
    if not isinstance(cached_at, datetime):
        return 'unknown'
    delta: timedelta = datetime.utcnow() - cached_at.replace(tzinfo=None)
    minutes = int(delta.total_seconds() // 60)
    if minutes < 1:
        return 'just now'
    if minutes == 1:
        return '1 minute ago'
    if minutes < 60:
        return f'{minutes} minutes ago'
    hours = minutes // 60
    return f'{hours} hour ago' if hours == 1 else f'{hours} hours ago'


def get_client_ip(request: HttpRequest) -> Tuple[str, Optional[str]]:
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    proxy = None
    if xff:
        parts = [p.strip() for p in xff.split(',') if p.strip()]
        if parts:
            proxy = request.META.get('REMOTE_ADDR')
            return parts[0], proxy
    return request.META.get('REMOTE_ADDR', ''), proxy


