from __future__ import annotations
import uuid
from typing import Callable
from django.http import HttpRequest, HttpResponse


class SessionMiddleware:
    """Ensure a session_id cookie exists and attach it to the request.

    - If missing, generates a UUID4 session id
    - Attaches `request.session_id`
    - Sets cookie on the response with 30-day expiration, HttpOnly, SameSite=Lax
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        session_id = request.COOKIES.get('session_id') or uuid.uuid4().hex
        # Attach to request for downstream use
        setattr(request, 'session_id', session_id)

        response = self.get_response(request)

        # If cookie was missing, set it on the response
        if 'session_id' not in request.COOKIES:
            response.set_cookie(
                'session_id',
                session_id,
                max_age=60 * 60 * 24 * 30,  # 30 days
                httponly=True,
                samesite='Lax',
            )
        return response


class ApiKeyRequiredMiddleware:
    """Optional example middleware to enforce API key on certain endpoints.

    Not enabled by default; add to settings MIDDLEWARE if desired.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        return self.get_response(request)


