/* eslint-disable @typescript-eslint/no-explicit-any */
// Prefer env; otherwise derive from window location for dev machines and LAN
export const API_BASE_URL = (() => {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL;
  const sanitize = (v: string) => v.replace(/\/$/, "");
  const isValidUrl = (v: string) => {
    try { new URL(v); return true; } catch { return false; }
  };
  if (fromEnv && isValidUrl(fromEnv)) return sanitize(fromEnv);

  if (typeof window !== 'undefined') {
    try {
      const protocol = window.location.protocol || 'http:';
      const host = String(window.location.hostname || '').trim();
      const invalid = !host || /<|>|YOUR-IP|\[|\]/i.test(host) || host === '0.0.0.0';
      if (!invalid) {
        const candidate = `${protocol}//${host}:8000/api`;
        if (isValidUrl(candidate)) return sanitize(candidate);
      }
    } catch {}
  }
  return 'http://localhost:8000/api';
})();

// -----------------------------
// Types
// -----------------------------
export type WeatherCurrent = {
  temperature: number | null;
  feels_like: number | null;
  humidity: number | null;
  pressure: number | null;
  weather: string;
  weather_main: string;
  icon: string;
  wind_speed: number | null;
  wind_direction: number | null;
  visibility: number | null;
  clouds: number | null;
  sunrise: number | null;
  sunset: number | null;
  timezone: number | null;
  dt: number | null;
};

export type ForecastHour = {
  dt: number | null;
  dt_txt?: string | null;
  temperature: number | null;
  feels_like: number | null;
  weather: string;
  weather_main: string;
  icon: string;
  wind_speed: number | null;
  wind_direction: number | null;
  humidity: number | null;
  pressure: number | null;
  clouds: number | null;
};

export type ForecastDay = {
  date: string;
  min_temp: number | null;
  max_temp: number | null;
  hours: ForecastHour[];
};

export type LocationItem = {
  id: number;
  city_name: string;
  country: string;
  latitude: number;
  longitude: number;
  is_favorite: boolean;
  created_at: string;
  weather?: WeatherCurrent | null;
};

export type Preferences = {
  session_id: string;
  temperature_unit: 'C' | 'F';
  theme: 'light' | 'dark' | 'auto';
  default_location: number | null;
  updated_at: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  message?: string | null;
  error?: string | { message?: string } | null;
};

// -----------------------------
// Helpers
// -----------------------------
function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID();
  }
  return 'sess_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = 'session_id';
    let sid = window.localStorage.getItem(key);
    if (!sid) {
      sid = generateSessionId();
      window.localStorage.setItem(key, sid);
    }
    return sid;
  } catch {
    return null;
  }
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  let payload: ApiResponse<any> | null = null;
  try {
    payload = (await res.json()) as ApiResponse<any>;
  } catch {
    // ignore JSON parse errors
  }
  if (!res.ok || !payload || payload.success === false) {
    throw handleApiError(payload, res.status, res.statusText);
  }
  return payload.data as T;
}

export function handleApiError(payload: ApiResponse<any> | null, status: number, statusText: string): Error {
  if (payload && payload.error) {
    const msg = typeof payload.error === 'string' ? payload.error : payload.error?.message;
    return new Error(msg || `API error (${status})`);
  }
  return new Error(`HTTP ${status}: ${statusText || 'Request failed'}`);
}

function qs(params: Record<string, any>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.append(k, String(v));
  });
  return sp.toString();
}

// -----------------------------
// API Methods
// -----------------------------
export async function getCurrentWeather(lat: number, lon: number): Promise<{ data: WeatherCurrent; cached: boolean; cache_age: string; }> {
  const url = `${API_BASE_URL}/weather/current/?${qs({ lat, lon })}`;
  try {
    return await request(url);
  } catch (err) {
    // Fallback to Open-Meteo if backend is unreachable
    const fb = await fallbackFetchOpenMeteo(lat, lon, 1);
    const current: WeatherCurrent = mapOpenMeteoToCurrent(fb);
    return { data: current, cached: false, cache_age: 'just now' };
  }
}

export async function getForecast(lat: number, lon: number, days = 7): Promise<ForecastDay[]> {
  const url = `${API_BASE_URL}/weather/forecast/?${qs({ lat, lon, days })}`;
  try {
    // Backend wraps response as { data: days[], cached, cache_age }
    const wrapped = await request<{ data: ForecastDay[]; cached: boolean; cache_age: string }>(url);
    return wrapped.data;
  } catch (err) {
    const fb = await fallbackFetchOpenMeteo(lat, lon, Math.max(1, Math.min(days, 7)));
    return mapOpenMeteoToForecastDays(fb);
  }
}

export async function searchLocation(query: string): Promise<Array<{ name: string; country?: string; state?: string; lat: number; lon: number }>> {
  const url = `${API_BASE_URL}/locations/search/?${qs({ q: query })}`;
  try {
    const data = await request<{ results: any[] }>(url);
    const results = data.results || [];
    if (Array.isArray(results) && results.length > 0) return results;
    // If backend returns no results, try client-side fallbacks
    const om = await fallbackGeocodeOpenMeteo(query, 5);
    if (om.length > 0) return om;
    const nom = await fallbackGeocodeNominatim(query, 5);
    return nom;
  } catch (err) {
    // Fallback to Open-Meteo geocoding, then Nominatim
    const om = await fallbackGeocodeOpenMeteo(query, 5);
    if (om.length > 0) return om;
    const nom = await fallbackGeocodeNominatim(query, 5);
    return nom;
  }
}

export async function saveLocation(location: { city?: string; country?: string; lat: number; lon: number; session_id?: string | null; }): Promise<{ location: LocationItem; created: boolean }> {
  const session_id = location.session_id ?? getSessionId();
  const body = JSON.stringify({ ...location, session_id });
  const url = `${API_BASE_URL}/locations/save/`;
  return request(url, { method: 'POST', body });
}

export async function getUserLocations(sessionId?: string | null): Promise<LocationItem[]> {
  const sid = sessionId ?? getSessionId();
  const url = `${API_BASE_URL}/locations/?${qs({ session_id: sid })}`;
  const data = await request<{ locations: LocationItem[] }>(url);
  return data.locations;
}

export async function deleteLocation(id: number, sessionId?: string | null): Promise<boolean> {
  const sid = sessionId ?? getSessionId();
  const url = `${API_BASE_URL}/locations/${id}/?${qs({ session_id: sid })}`;
  await request(url, { method: 'DELETE' });
  return true;
}

export async function toggleFavorite(id: number, sessionId?: string | null): Promise<LocationItem> {
  const sid = sessionId ?? getSessionId();
  const url = `${API_BASE_URL}/locations/${id}/favorite/`;
  const data = await request<{ location: LocationItem }>(url, { method: 'POST', body: JSON.stringify({ session_id: sid }) });
  return data.location;
}

export async function getPreferences(sessionId?: string | null): Promise<Preferences> {
  const sid = sessionId ?? getSessionId();
  const url = `${API_BASE_URL}/preferences/?${qs({ session_id: sid })}`;
  const data = await request<{ preferences: Preferences }>(url);
  return data.preferences;
}

export async function updatePreferences(preferences: Partial<Preferences> & { session_id?: string | null }): Promise<Preferences> {
  const sid = preferences.session_id ?? getSessionId();
  const url = `${API_BASE_URL}/preferences/update/`;
  const data = await request<{ preferences: Preferences }>(url, { method: 'POST', body: JSON.stringify({ ...preferences, session_id: sid }) });
  return data.preferences;
}


// -----------------------------
// Client-side public API fallbacks (no backend)
// -----------------------------
async function fallbackFetchOpenMeteo(lat: number, lon: number, days: number): Promise<any> {
  const params: Record<string, any> = {
    latitude: lat,
    longitude: lon,
    timezone: 'auto',
    hourly: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'surface_pressure',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'visibility',
      'cloudcover',
    ].join(','),
    daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset',
    forecast_days: Math.max(1, Math.min(days, 7)),
  };
  const url = `https://api.open-meteo.com/v1/forecast?${qs(params)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Open-Meteo request failed');
  return res.json();
}

function mapOpenMeteoToCurrent(data: any): WeatherCurrent {
  const hourly = data?.hourly || {};
  const daily = data?.daily || {};
  const idx = 0;
  const getNum = (arr: any[], i: number) => (Array.isArray(arr) && i < arr.length && arr[i] != null ? Number(arr[i]) : null);
  const wc = getNum(hourly.weather_code || [], idx) || 0;
  const cond = mapOMCode(wc);
  const sunrise = (daily.sunrise || [])[0];
  const sunset = (daily.sunset || [])[0];
  const toTs = (iso: any) => {
    try {
      if (!iso) return null;
      return Math.floor(new Date(String(iso)).getTime() / 1000);
    } catch {
      return null;
    }
  };
  return {
    temperature: getNum(hourly.temperature_2m || [], idx),
    feels_like: getNum(hourly.apparent_temperature || [], idx),
    humidity: getNum(hourly.relative_humidity_2m || [], idx),
    pressure: getNum(hourly.surface_pressure || [], idx),
    weather: cond.description,
    weather_main: cond.main,
    icon: cond.icon,
    wind_speed: getNum(hourly.wind_speed_10m || [], idx),
    wind_direction: getNum(hourly.wind_direction_10m || [], idx),
    visibility: getNum(hourly.visibility || [], idx),
    clouds: getNum(hourly.cloudcover || [], idx),
    sunrise: toTs(sunrise),
    sunset: toTs(sunset),
    timezone: 0,
    dt: Math.floor(Date.now() / 1000),
  };
}

function mapOpenMeteoToForecastDays(data: any): ForecastDay[] {
  const hourly = data?.hourly || {};
  const daily = data?.daily || {};
  const times: any[] = hourly.time || [];
  const byDate: Record<string, number[]> = {};
  times.forEach((t, i) => {
    try {
      const d = new Date(String(t));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      (byDate[key] ||= []).push(i);
    } catch {}
  });
  const out: ForecastDay[] = [];
  const getNum = (arr: any[], i: number) => (Array.isArray(arr) && i < arr.length && arr[i] != null ? Number(arr[i]) : null);
  const mapHour = (i: number) => {
    const wc = getNum(hourly.weather_code || [], i) || 0;
    const cond = mapOMCode(wc);
    let ts: number | null = null;
    try { ts = Math.floor(new Date(String(times[i])).getTime() / 1000); } catch {}
    return {
      dt: ts,
      dt_txt: String(times[i] ?? ''),
      temperature: getNum(hourly.temperature_2m || [], i),
      feels_like: getNum(hourly.apparent_temperature || [], i),
      weather: cond.description,
      weather_main: cond.main,
      icon: cond.icon,
      wind_speed: getNum(hourly.wind_speed_10m || [], i),
      wind_direction: getNum(hourly.wind_direction_10m || [], i),
      humidity: getNum(hourly.relative_humidity_2m || [], i),
      pressure: getNum(hourly.surface_pressure || [], i),
      clouds: getNum(hourly.cloudcover || [], i),
    };
  };
  const dates = Object.keys(byDate).sort();
  dates.forEach((dateKey, di) => {
    const idxs = byDate[dateKey];
    const hours = idxs.map(mapHour);
    const minTemp = getNum(daily.temperature_2m_min || [], di);
    const maxTemp = getNum(daily.temperature_2m_max || [], di);
    out.push({ date: dateKey, min_temp: minTemp, max_temp: maxTemp, hours });
  });
  return out;
}

function mapOMCode(code: number): { description: string; main: string; icon: string } {
  const m: Record<number, [string, string, string]> = {
    0: ['clear sky', 'Clear', '01d'],
    1: ['mainly clear', 'Clear', '02d'],
    2: ['partly cloudy', 'Clouds', '03d'],
    3: ['overcast', 'Clouds', '04d'],
    45: ['fog', 'Fog', '50d'],
    48: ['depositing rime fog', 'Fog', '50d'],
    51: ['light drizzle', 'Drizzle', '09d'],
    53: ['moderate drizzle', 'Drizzle', '09d'],
    55: ['dense drizzle', 'Drizzle', '09d'],
    56: ['freezing drizzle', 'Drizzle', '09d'],
    57: ['dense freezing drizzle', 'Drizzle', '09d'],
    61: ['slight rain', 'Rain', '10d'],
    63: ['moderate rain', 'Rain', '10d'],
    65: ['heavy rain', 'Rain', '10d'],
    66: ['light freezing rain', 'Rain', '10d'],
    67: ['heavy freezing rain', 'Rain', '10d'],
    71: ['slight snow fall', 'Snow', '13d'],
    73: ['moderate snow fall', 'Snow', '13d'],
    75: ['heavy snow fall', 'Snow', '13d'],
    77: ['snow grains', 'Snow', '13d'],
    80: ['slight rain showers', 'Rain', '09d'],
    81: ['moderate rain showers', 'Rain', '09d'],
    82: ['violent rain showers', 'Rain', '09d'],
    85: ['slight snow showers', 'Snow', '13d'],
    86: ['heavy snow showers', 'Snow', '13d'],
    95: ['thunderstorm', 'Thunderstorm', '11d'],
    96: ['thunderstorm with hail', 'Thunderstorm', '11d'],
    99: ['thunderstorm with heavy hail', 'Thunderstorm', '11d'],
  };
  const [description, main, icon] = m[Number(code) || 0] || ['clear sky', 'Clear', '01d'];
  return { description, main, icon };
}

async function fallbackGeocodeOpenMeteo(query: string, limit: number): Promise<Array<{ name: string; country?: string; state?: string; lat: number; lon: number }>> {
  const params = { name: query, count: Math.max(1, Math.min(limit, 10)), language: 'en', format: 'json' };
  const url = `https://geocoding-api.open-meteo.com/v1/search?${qs(params)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Open-Meteo geocoding failed');
    const payload = await res.json();
    const out: Array<{ name: string; country?: string; state?: string; lat: number; lon: number }> = [];
    (payload?.results || []).forEach((item: any) => {
      out.push({
        name: item?.name,
        country: item?.country,
        state: item?.admin1,
        lat: item?.latitude,
        lon: item?.longitude,
      });
    });
    return out.slice(0, Math.max(1, Math.min(limit, 10)));
  } catch {
    return [];
  }
}

async function fallbackGeocodeNominatim(query: string, limit: number): Promise<Array<{ name: string; country?: string; state?: string; lat: number; lon: number }>> {
  const params = { q: query, format: 'jsonv2', addressdetails: 1, limit: Math.max(1, Math.min(limit, 10)) } as any;
  const url = `https://nominatim.openstreetmap.org/search?${qs(params)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'WeatherApp/1.0 (+https://example.com)' } as any });
    if (!res.ok) throw new Error('Nominatim failed');
    const data = await res.json();
    const out: Array<{ name: string; country?: string; state?: string; lat: number; lon: number }> = [];
    (data || []).forEach((item: any) => {
      const address = item?.address || {};
      const name = item?.name || String(item?.display_name || '').split(',')[0];
      const country = address?.country || address?.country_code;
      const state = address?.state || address?.region;
      const lat = item?.lat != null ? Number(item.lat) : null;
      const lon = item?.lon != null ? Number(item.lon) : null;
      if (name && lat != null && lon != null) out.push({ name: String(name), country: country ? String(country).toUpperCase() : undefined, state, lat, lon });
    });
    return out.slice(0, Math.max(1, Math.min(limit, 10)));
  } catch {
    return [];
  }
}

