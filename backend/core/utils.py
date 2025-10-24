from __future__ import annotations
from math import atan2, degrees
from typing import Optional


def get_weather_icon_name(icon_code: str) -> str:
    """Map OpenWeather icon codes to a descriptive name used by the frontend.

    Examples: '01d' -> 'clear-day', '01n' -> 'clear-night'
    Fallback returns the original code if no mapping exists.
    """
    mapping = {
        '01d': 'clear-day', '01n': 'clear-night',
        '02d': 'partly-cloudy-day', '02n': 'partly-cloudy-night',
        '03d': 'cloudy', '03n': 'cloudy',
        '04d': 'overcast', '04n': 'overcast',
        '09d': 'showers', '09n': 'showers',
        '10d': 'rain', '10n': 'rain',
        '11d': 'thunderstorm', '11n': 'thunderstorm',
        '13d': 'snow', '13n': 'snow',
        '50d': 'mist', '50n': 'mist',
    }
    return mapping.get((icon_code or '').strip(), icon_code or '')


def calculate_heat_index(temp_c: float, humidity: float) -> Optional[float]:
    """Compute heat index (feels-like) in Celsius approximately.

    Converts to Fahrenheit, applies Rothfusz regression, then converts back.
    Returns None if inputs are invalid.
    """
    try:
        t_c = float(temp_c)
        rh = float(humidity)
    except (TypeError, ValueError):
        return None
    # Convert to Fahrenheit
    t_f = (t_c * 9.0 / 5.0) + 32.0
    # Rothfusz regression
    hi_f = (
        -42.379 + 2.04901523 * t_f + 10.14333127 * rh
        - 0.22475541 * t_f * rh - 0.00683783 * t_f * t_f
        - 0.05481717 * rh * rh + 0.00122874 * t_f * t_f * rh
        + 0.00085282 * t_f * rh * rh - 0.00000199 * t_f * t_f * rh * rh
    )
    # Convert back to Celsius
    hi_c = (hi_f - 32.0) * 5.0 / 9.0
    return round(hi_c, 2)


def format_wind_direction(degrees_value: float) -> str:
    """Convert wind direction in degrees to compass direction (16-wind)."""
    try:
        deg = float(degrees_value) % 360.0
    except (TypeError, ValueError):
        return 'N'
    dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
            'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    idx = int((deg + 11.25) // 22.5) % 16
    return dirs[idx]


