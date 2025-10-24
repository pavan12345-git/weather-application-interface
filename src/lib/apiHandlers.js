export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

function cToF(c) {
  if (c === null || c === undefined) return null;
  const n = Number(c);
  if (Number.isNaN(n)) return null;
  return (n * 9) / 5 + 32;
}

function formatTimestamp(seconds, timezoneOffsetSec = 0, opts) {
  if (seconds == null) return null;
  try {
    const date = new Date((Number(seconds) + Number(timezoneOffsetSec || 0)) * 1000);
    return new Intl.DateTimeFormat(undefined, opts || { hour: '2-digit', minute: '2-digit' }).format(date);
  } catch {
    return null;
  }
}

export function handleWeatherResponse(resp, options) {
  // resp is expected from getCurrentWeather(): { data, cached, cache_age }
  const toUnit = options?.toUnit || 'C';
  const w = resp?.data || {};
  const tz = w?.timezone || 0;

  const temperature = toUnit === 'F' ? cToF(w.temperature) : w.temperature;
  const feels_like = toUnit === 'F' ? cToF(w.feels_like) : w.feels_like;

  return {
    temperature,
    feels_like,
    humidity: w.humidity ?? null,
    pressure: w.pressure ?? null,
    description: w.weather || '',
    main: w.weather_main || '',
    icon: w.icon || '',
    wind_speed: w.wind_speed ?? null,
    wind_direction: w.wind_direction ?? null,
    visibility: w.visibility ?? null,
    clouds: w.clouds ?? null,
    sunrise_local: formatTimestamp(w.sunrise, tz, { hour: '2-digit', minute: '2-digit' }),
    sunset_local: formatTimestamp(w.sunset, tz, { hour: '2-digit', minute: '2-digit' }),
    observed_local: formatTimestamp(w.dt, tz, { hour: '2-digit', minute: '2-digit' }),
    cached: Boolean(resp?.cached),
    cache_age: resp?.cache_age || '',
    unit: toUnit,
  };
}

export function handleForecastResponse(days, options) {
  // days is ForecastDay[] returned by getForecast()
  const toUnit = options?.toUnit || 'C';

  const fmtDay = (d) => {
    try {
      const date = new Date(d.date + 'T00:00:00Z');
      return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: '2-digit' }).format(date);
    } catch {
      return d.date;
    }
  };

  return (days || []).map((d) => ({
    date: d.date,
    label: fmtDay(d),
    min_temp: toUnit === 'F' ? cToF(d.min_temp) : d.min_temp,
    max_temp: toUnit === 'F' ? cToF(d.max_temp) : d.max_temp,
    hours: (d.hours || []).map((h) => ({
      dt: h.dt ?? null,
      time: h.dt ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(h.dt * 1000)) : null,
      temperature: toUnit === 'F' ? cToF(h.temperature) : h.temperature,
      feels_like: toUnit === 'F' ? cToF(h.feels_like) : h.feels_like,
      weather: h.weather || '',
      main: h.weather_main || '',
      icon: h.icon || '',
      wind_speed: h.wind_speed ?? null,
      wind_direction: h.wind_direction ?? null,
      humidity: h.humidity ?? null,
      pressure: h.pressure ?? null,
      clouds: h.clouds ?? null,
    })),
    unit: toUnit,
  }));
}

export function handleLocationResponse(locations) {
  const arr = Array.isArray(locations) ? locations.slice() : [];
  arr.sort((a, b) => (b.is_favorite === a.is_favorite ? 0 : b.is_favorite ? 1 : -1) || new Date(b.created_at) - new Date(a.created_at));
  return arr.map((loc) => ({
    ...loc,
    displayName: [loc.city_name, loc.country].filter(Boolean).join(', '),
  }));
}

export function handleError(error) {
  const defaultMsg = 'Something went wrong. Please try again.';
  try {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      return 'You appear to be offline.';
    }
    const msg = error?.message || '';
    if (/timeout/i.test(msg)) return 'The request timed out. Please retry.';
    if (/401|403/.test(msg)) return 'You are not authorized to perform this action.';
    if (/404/.test(msg)) return 'Requested resource was not found.';
    if (/429/.test(msg)) return 'Too many requests. Please wait and try again.';
    if (/network/i.test(msg)) return 'Network error. Check your connection and try again.';
    if (/invalid|validation/i.test(msg)) return 'Some inputs are invalid. Please review and try again.';
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[API Error]', error);
    }
    return msg || defaultMsg;
  } catch {
    return defaultMsg;
  }
}

export async function isApiAvailable() {
  try {
    const res = await fetch(`${API_BASE_URL}/health/`, { credentials: 'include' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function retryRequest(fn, retries = 3, baseDelayMs = 300) {
  let attempt = 0;
  let lastError;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
      attempt += 1;
    }
  }
  throw lastError;
}

// --------------------------
// Usage Examples (copy/paste)
// --------------------------
// import { getCurrentWeather } from '@/utils/api';
// import { handleWeatherResponse, handleError } from '@/lib/apiHandlers';
// try {
//   const raw = await getCurrentWeather(51.5074, -0.1278);
//   const weather = handleWeatherResponse(raw, { toUnit: 'C' });
//   // render weather
// } catch (e) {
//   const message = handleError(e);
// }

// import { getForecast } from '@/utils/api';
// import { handleForecastResponse } from '@/lib/apiHandlers';
// const days = await getForecast(51.5074, -0.1278, 5);
// const view = handleForecastResponse(days, { toUnit: 'C' });

// import { getUserLocations } from '@/utils/api';
// import { handleLocationResponse } from '@/lib/apiHandlers';
// const rawLocs = await getUserLocations();
// const locs = handleLocationResponse(rawLocs);


