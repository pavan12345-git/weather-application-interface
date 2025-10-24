import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests


logger = logging.getLogger(__name__)


class WeatherAPIError(Exception):
    """Base exception for Weather API errors."""


class InvalidAPIKey(WeatherAPIError):
    """Raised when the API key is invalid or missing."""


class RateLimitExceeded(WeatherAPIError):
    """Raised when the API rate limit is exceeded (HTTP 429)."""


class WeatherService:
    """Service to interact with the OpenWeatherMap API.

    Provides helpers to fetch current weather, 5-day/3-hour forecast, direct
    geocoding (city search), and reverse geocoding.
    """

    def __init__(self, api_key: Optional[str] = None) -> None:
        """Initialize the service.

        Args:
            api_key: Optional explicit API key; if None, uses OPENWEATHER_API_KEY env.
        """
        self.api_key = api_key or os.getenv('OPENWEATHER_API_KEY', '')
        self.base_url = 'https://api.openweathermap.org/data/2.5'
        self.geo_url = 'https://api.openweathermap.org/geo/1.0'
        self.timeout_seconds = 5

    # ----------------------------
    # Open-Meteo fallbacks (no API key required)
    # ----------------------------
    def _om_conditions(self, code: Optional[int]) -> Dict[str, str]:
        mapping = {
            0: ("clear sky", "Clear", "01d"),
            1: ("mainly clear", "Clear", "02d"),
            2: ("partly cloudy", "Clouds", "03d"),
            3: ("overcast", "Clouds", "04d"),
            45: ("fog", "Fog", "50d"),
            48: ("depositing rime fog", "Fog", "50d"),
            51: ("light drizzle", "Drizzle", "09d"),
            53: ("moderate drizzle", "Drizzle", "09d"),
            55: ("dense drizzle", "Drizzle", "09d"),
            56: ("freezing drizzle", "Drizzle", "09d"),
            57: ("dense freezing drizzle", "Drizzle", "09d"),
            61: ("slight rain", "Rain", "10d"),
            63: ("moderate rain", "Rain", "10d"),
            65: ("heavy rain", "Rain", "10d"),
            66: ("light freezing rain", "Rain", "10d"),
            67: ("heavy freezing rain", "Rain", "10d"),
            71: ("slight snow fall", "Snow", "13d"),
            73: ("moderate snow fall", "Snow", "13d"),
            75: ("heavy snow fall", "Snow", "13d"),
            77: ("snow grains", "Snow", "13d"),
            80: ("slight rain showers", "Rain", "09d"),
            81: ("moderate rain showers", "Rain", "09d"),
            82: ("violent rain showers", "Rain", "09d"),
            85: ("slight snow showers", "Snow", "13d"),
            86: ("heavy snow showers", "Snow", "13d"),
            95: ("thunderstorm", "Thunderstorm", "11d"),
            96: ("thunderstorm with hail", "Thunderstorm", "11d"),
            99: ("thunderstorm with heavy hail", "Thunderstorm", "11d"),
        }
        desc, main, icon = mapping.get(int(code or 0), ("clear sky", "Clear", "01d"))
        return {"description": desc, "main": main, "icon": icon}

    def _om_fetch(self, lat: float, lon: float, days: int) -> Dict[str, Any]:
        params = {
            'latitude': lat,
            'longitude': lon,
            'timezone': 'auto',
            # Hourly for rich current + hourly forecast
            'hourly': ','.join([
                'temperature_2m',
                'apparent_temperature',
                'relative_humidity_2m',
                'surface_pressure',
                'weather_code',
                'wind_speed_10m',
                'wind_direction_10m',
                'visibility',
                'cloudcover',
            ]),
            # Daily for min/max and sunrise/sunset
            'daily': 'temperature_2m_max,temperature_2m_min,sunrise,sunset',
            'forecast_days': max(1, min(int(days), 7)),
        }
        resp = requests.get('https://api.open-meteo.com/v1/forecast', params=params, timeout=self.timeout_seconds)
        resp.raise_for_status()
        return resp.json() or {}

    # ----------------------------
    # Internal helpers
    # ----------------------------
    def _safe_float(self, arr: Optional[List[Any]], i: int) -> Optional[float]:
        try:
            if isinstance(arr, list) and i < len(arr) and arr[i] is not None:
                return float(arr[i])
        except Exception:
            pass
        return None

    def _safe_int(self, arr: Optional[List[Any]], i: int) -> Optional[int]:
        try:
            if isinstance(arr, list) and i < len(arr) and arr[i] is not None:
                return int(arr[i])
        except Exception:
            pass
        return None
    def _handle_response(self, resp: requests.Response) -> Dict[str, Any]:
        """Validate HTTP response and return JSON or raise errors.

        Raises:
            InvalidAPIKey: When 401 returned.
            RateLimitExceeded: When 429 returned.
            WeatherAPIError: For other non-200 codes or JSON issues.
        """
        status = resp.status_code
        try:
            payload = resp.json()
        except ValueError:
            payload = None

        if status == 200:
            return payload if isinstance(payload, dict) else {'data': payload}
        if status == 401:
            raise InvalidAPIKey('Invalid or missing OpenWeather API key (401).')
        if status == 429:
            raise RateLimitExceeded('Rate limit exceeded (429).')

        message = None
        if isinstance(payload, dict):
            message = payload.get('message') or payload.get('error')
        message = message or resp.text or f'HTTP {status}'
        raise WeatherAPIError(message)

    def _get(self, url: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Perform a GET request with logging and error handling."""
        safe_params = {**params, 'appid': '***'} if 'appid' in params else params
        logger.debug('GET %s params=%s', url, safe_params)
        try:
            resp = requests.get(url, params=params, timeout=self.timeout_seconds)
        except requests.Timeout as exc:
            logger.error('Request timeout: %s', url)
            raise WeatherAPIError('Request to weather API timed out') from exc
        except requests.RequestException as exc:
            logger.exception('Network error calling %s', url)
            raise WeatherAPIError('Network error calling weather API') from exc
        result = self._handle_response(resp)
        logger.debug('Response %s status=%s', url, resp.status_code)
        return result

    # ----------------------------
    # Public API
    # ----------------------------
    def get_current_weather(self, lat: float, lon: float) -> Dict[str, Any]:
        """Fetch current weather for coordinates.

        Args:
            lat: Latitude
            lon: Longitude

        Returns:
            A normalized dictionary of current conditions.
        """
        # If no API key, use Open-Meteo to return accurate current-like data
        if not self.api_key:
            data = self._om_fetch(lat, lon, days=1)
            tz_offset = 0
            try:
                # Open-Meteo returns ISO strings; for dt, use current UTC ts
                from datetime import timezone as _tz
                tz_offset = 0
            except Exception:
                tz_offset = 0
            hourly = data.get('hourly') or {}
            daily = (data.get('daily') or {})
            # Take first hour as current approximation
            temp = (hourly.get('temperature_2m') or [None])[0]
            feels = (hourly.get('apparent_temperature') or [None])[0]
            rh = (hourly.get('relative_humidity_2m') or [None])[0]
            sp = (hourly.get('surface_pressure') or [None])[0]
            wc = (hourly.get('weather_code') or [0])[0]
            ws = (hourly.get('wind_speed_10m') or [None])[0]
            wd = (hourly.get('wind_direction_10m') or [None])[0]
            vis = (hourly.get('visibility') or [None])[0]
            cc = (hourly.get('cloudcover') or [None])[0]
            cond = self._om_conditions(wc)
            # sunrise/sunset for today
            sunrise = None
            sunset = None
            try:
                sunrise_str = (daily.get('sunrise') or [None])[0]
                sunset_str = (daily.get('sunset') or [None])[0]
                if sunrise_str:
                    sunrise = int(datetime.fromisoformat(sunrise_str.replace('Z', '+00:00')).timestamp())
                if sunset_str:
                    sunset = int(datetime.fromisoformat(sunset_str.replace('Z', '+00:00')).timestamp())
            except Exception:
                pass
            return {
                'temperature': float(temp) if temp is not None else None,
                'feels_like': float(feels) if feels is not None else None,
                'humidity': int(rh) if rh is not None else None,
                'pressure': int(sp) if sp is not None else None,
                'weather': cond['description'],
                'weather_main': cond['main'],
                'icon': cond['icon'],
                'wind_speed': float(ws) if ws is not None else None,
                'wind_direction': int(wd) if wd is not None else None,
                'visibility': int(vis) if vis is not None else None,
                'clouds': int(cc) if cc is not None else None,
                'sunrise': sunrise,
                'sunset': sunset,
                'timezone': tz_offset,
                'dt': int(datetime.utcnow().timestamp()),
            }

        params: Dict[str, Any] = {
            'lat': lat,
            'lon': lon,
            'appid': self.api_key,
            'units': 'metric',
        }
        data = self._get(f'{self.base_url}/weather', params)

        main = data.get('main', {})
        weather0 = (data.get('weather') or [{}])[0]
        wind = data.get('wind', {})
        sys = data.get('sys', {})
        clouds = data.get('clouds', {})

        return {
            'temperature': float(main.get('temp')) if main.get('temp') is not None else None,
            'feels_like': float(main.get('feels_like')) if main.get('feels_like') is not None else None,
            'humidity': int(main.get('humidity')) if main.get('humidity') is not None else None,
            'pressure': int(main.get('pressure')) if main.get('pressure') is not None else None,
            'weather': str(weather0.get('description') or ''),
            'weather_main': str(weather0.get('main') or ''),
            'icon': str(weather0.get('icon') or ''),
            'wind_speed': float(wind.get('speed')) if wind.get('speed') is not None else None,
            'wind_direction': int(wind.get('deg')) if wind.get('deg') is not None else None,
            'visibility': int(data.get('visibility')) if data.get('visibility') is not None else None,
            'clouds': int(clouds.get('all')) if clouds.get('all') is not None else None,
            'sunrise': int(sys.get('sunrise')) if sys.get('sunrise') is not None else None,
            'sunset': int(sys.get('sunset')) if sys.get('sunset') is not None else None,
            'timezone': int(data.get('timezone')) if data.get('timezone') is not None else None,
            'dt': int(data.get('dt')) if data.get('dt') is not None else None,
        }

    def get_forecast(self, lat: float, lon: float, days: int = 7) -> Dict[str, Any]:
        """Fetch and aggregate the 5-day/3-hour forecast by day.

        Args:
            lat: Latitude
            lon: Longitude
            days: Desired number of days to return (cap at 5 due to API limits)

        Returns:
            Dict with daily summaries and hourly breakdown per day.
        """
        # If no API key, use Open-Meteo forecast and map it to our schema
        if not self.api_key:
            from datetime import timedelta
            data = self._om_fetch(lat, lon, days)
            hourly = data.get('hourly') or {}
            daily = data.get('daily') or {}
            # Build a dict by date with hourly arrays
            times = hourly.get('time') or []
            out_days: Dict[str, List[int]] = {}
            for idx, t in enumerate(times):
                try:
                    dt = datetime.fromisoformat(str(t).replace('Z', '+00:00'))
                except Exception:
                    continue
                date_key = dt.strftime('%Y-%m-%d')
                out_days.setdefault(date_key, []).append(idx)
            result_days: List[Dict[str, Any]] = []
            for date_key, idxs in sorted(out_days.items()):
                hlist: List[Dict[str, Any]] = []
                for i in idxs:
                    wc = (hourly.get('weather_code') or [0])[i if i < len(hourly.get('weather_code') or []) else 0]
                    cond = self._om_conditions(wc)
                    try:
                        ts = int(datetime.fromisoformat(str(times[i]).replace('Z', '+00:00')).timestamp())
                    except Exception:
                        ts = None
                    hlist.append({
                        'dt': ts,
                        'dt_txt': str(times[i]),
                        'temperature': self._safe_float(hourly.get('temperature_2m'), i),
                        'feels_like': self._safe_float(hourly.get('apparent_temperature'), i),
                        'weather': cond['description'],
                        'weather_main': cond['main'],
                        'icon': cond['icon'],
                        'wind_speed': self._safe_float(hourly.get('wind_speed_10m'), i),
                        'wind_direction': self._safe_int(hourly.get('wind_direction_10m'), i),
                        'humidity': self._safe_int(hourly.get('relative_humidity_2m'), i),
                        'pressure': self._safe_int(hourly.get('surface_pressure'), i),
                        'clouds': self._safe_int(hourly.get('cloudcover'), i),
                    })
                # Daily min/max from daily arrays
                try:
                    di = list(out_days.keys()).index(date_key)
                except ValueError:
                    di = 0
                tmin = self._safe_float(daily.get('temperature_2m_min'), di)
                tmax = self._safe_float(daily.get('temperature_2m_max'), di)
                result_days.append({
                    'date': date_key,
                    'min_temp': tmin,
                    'max_temp': tmax,
                    'hours': hlist,
                })
            return {'days': result_days}

        params: Dict[str, Any] = {
            'lat': lat,
            'lon': lon,
            'appid': self.api_key,
            'units': 'metric',
        }
        raw = self._get(f'{self.base_url}/forecast', params)
        entries: List[Dict[str, Any]] = raw.get('list', [])

        grouped: Dict[str, List[Dict[str, Any]]] = {}
        for item in entries:
            # dt_txt format: 'YYYY-MM-DD HH:MM:SS'
            dt_txt = item.get('dt_txt')
            if not dt_txt:
                # Fallback to date from timestamp
                date_key = datetime.utcfromtimestamp(int(item.get('dt', 0))).strftime('%Y-%m-%d')
            else:
                date_key = dt_txt.split(' ')[0]
            grouped.setdefault(date_key, []).append(item)

        daily: List[Dict[str, Any]] = []
        for date_key, items in sorted(grouped.items())[: max(1, min(days, 5))]:
            temps_min: List[float] = []
            temps_max: List[float] = []
            hours: List[Dict[str, Any]] = []
            for it in items:
                main = it.get('main', {})
                weather0 = (it.get('weather') or [{}])[0]
                wind = it.get('wind', {})
                clouds = it.get('clouds', {})

                tmin = main.get('temp_min')
                tmax = main.get('temp_max')
                if tmin is not None:
                    temps_min.append(float(tmin))
                if tmax is not None:
                    temps_max.append(float(tmax))

                hours.append({
                    'dt': int(it.get('dt')) if it.get('dt') is not None else None,
                    'dt_txt': it.get('dt_txt'),
                    'temperature': float(main.get('temp')) if main.get('temp') is not None else None,
                    'feels_like': float(main.get('feels_like')) if main.get('feels_like') is not None else None,
                    'weather': str(weather0.get('description') or ''),
                    'weather_main': str(weather0.get('main') or ''),
                    'icon': str(weather0.get('icon') or ''),
                    'wind_speed': float(wind.get('speed')) if wind.get('speed') is not None else None,
                    'wind_direction': int(wind.get('deg')) if wind.get('deg') is not None else None,
                    'humidity': int(main.get('humidity')) if main.get('humidity') is not None else None,
                    'pressure': int(main.get('pressure')) if main.get('pressure') is not None else None,
                    'clouds': int(clouds.get('all')) if clouds.get('all') is not None else None,
                })

            daily.append({
                'date': date_key,
                'min_temp': min(temps_min) if temps_min else None,
                'max_temp': max(temps_max) if temps_max else None,
                'hours': hours,
            })

        return {'days': daily}

    def search_location(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search for cities by name using direct geocoding.

        Args:
            query: Free-text query (e.g. 'London, UK')
            limit: Maximum number of results to return

        Returns:
            List of dicts with name, country, state (optional), lat, lon.
        """
        # If no API key, use Open-Meteo's free geocoding API; if that fails, try Nominatim
        if not self.api_key:
            # 1) Open-Meteo geocoding
            try:
                params = {
                    'name': query,
                    'count': max(1, min(limit, 10)),
                    'language': 'en',
                    'format': 'json',
                }
                resp = requests.get('https://geocoding-api.open-meteo.com/v1/search', params=params, timeout=self.timeout_seconds)
                resp.raise_for_status()
                payload = resp.json() or {}
                out: List[Dict[str, Any]] = []
                for item in payload.get('results') or []:
                    out.append({
                        'name': item.get('name'),
                        'country': item.get('country'),
                        'state': item.get('admin1'),
                        'lat': item.get('latitude'),
                        'lon': item.get('longitude'),
                    })
                if out:
                    return out[: max(1, min(limit, 10))]
            except Exception:
                pass

            # 2) Nominatim (OpenStreetMap) as a secondary fallback (no API key required)
            try:
                nom_params = {
                    'q': query,
                    'format': 'jsonv2',
                    'addressdetails': 1,
                    'limit': max(1, min(limit, 10)),
                }
                headers = {
                    'User-Agent': 'WeatherApp/1.0 (+https://example.com)'
                }
                nresp = requests.get('https://nominatim.openstreetmap.org/search', params=nom_params, headers=headers, timeout=self.timeout_seconds)
                nresp.raise_for_status()
                ndata = nresp.json() or []
                out2: List[Dict[str, Any]] = []
                for item in ndata or []:
                    address = item.get('address') or {}
                    name = item.get('name') or (item.get('display_name') or '').split(',')[0]
                    country = address.get('country') or address.get('country_code')
                    state = address.get('state') or address.get('region')
                    try:
                        lat_val = float(item.get('lat')) if item.get('lat') is not None else None
                        lon_val = float(item.get('lon')) if item.get('lon') is not None else None
                    except Exception:
                        lat_val = None
                        lon_val = None
                    if name and lat_val is not None and lon_val is not None:
                        out2.append({
                            'name': str(name),
                            'country': str(country).upper() if country else None,
                            'state': state,
                            'lat': lat_val,
                            'lon': lon_val,
                        })
                if out2:
                    return out2[: max(1, min(limit, 10))]
            except Exception:
                pass

            # 3) As a last resort, return an empty list (do NOT default to a fixed city)
            return []

        params = {'q': query, 'limit': max(1, min(limit, 10)), 'appid': self.api_key}
        data = self._get(f'{self.geo_url}/direct', params)
        results: List[Dict[str, Any]] = []
        payload_list = data if isinstance(data, list) else data.get('data') if isinstance(data, dict) else None
        for item in payload_list or []:
            results.append({
                'name': item.get('name'),
                'country': item.get('country'),
                'state': item.get('state'),
                'lat': item.get('lat'),
                'lon': item.get('lon'),
            })
        return results

    def reverse_geocode(self, lat: float, lon: float) -> Optional[str]:
        """Reverse geocode coordinates to a city name.

        Args:
            lat: Latitude
            lon: Longitude

        Returns:
            The best-matching city name, if available.
        """
        # If no API key, try Open-Meteo reverse geocoding; otherwise fallback to coordinate label
        if not self.api_key:
            try:
                params = {
                    'latitude': float(lat),
                    'longitude': float(lon),
                    'language': 'en',
                    'format': 'json',
                }
                resp = requests.get('https://geocoding-api.open-meteo.com/v1/reverse', params=params, timeout=self.timeout_seconds)
                resp.raise_for_status()
                payload = resp.json() or {}
                results = payload.get('results') or []
                if isinstance(results, list) and results:
                    name = results[0].get('name')
                    if name:
                        return str(name)
            except Exception:
                pass
            try:
                return f"{float(lat):.2f},{float(lon):.2f}"
            except Exception:
                return None

        params = {'lat': lat, 'lon': lon, 'limit': 1, 'appid': self.api_key}
        try:
            data = self._get(f'{self.geo_url}/reverse', params)
        except WeatherAPIError:
            # Fail soft and let caller use coordinate label
            return None
        except Exception:
            return None
        payload_list = data if isinstance(data, list) else data.get('data') if isinstance(data, dict) else None
        if isinstance(payload_list, list) and payload_list:
            return payload_list[0].get('name')
        return None


