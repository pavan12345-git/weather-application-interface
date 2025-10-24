"use client"

import { useState } from "react"
import { getCurrentWeather, getForecast, searchLocation } from "@/utils/api"
import { handleWeatherResponse, handleForecastResponse } from "@/lib/apiHandlers"
import Navigation from "@/components/navigation"
import HeroWeatherCard from "@/components/hero-weather-card"
import QuickStatsGrid from "@/components/quick-stats-grid"
import HourlyForecast from "@/components/hourly-forecast"
import SearchBar from "@/components/search-bar"
import EmptyState from "@/components/empty-state"
import Footer from "@/components/footer"

interface WeatherData {
  city: string
  temperature: number
  condition: string
  feelsLike: number
  humidity: number
  windSpeed: number
  uvIndex: number
  visibility: number
  weatherType: "sunny" | "rainy" | "cloudy" | "night"
  hourlyForecast: Array<{
    time: string
    temp: number
    icon: string
  }>
}

export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [tempUnit, setTempUnit] = useState<"C" | "F">("F")
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  async function fetchWeatherByCoords(lat: number, lon: number, label?: string) {
    try {
      const currentRaw = await getCurrentWeather(lat, lon)
      const current = handleWeatherResponse(currentRaw, { toUnit: "F" })
      const days = await getForecast(lat, lon, 3) // Get 3 days to ensure we have 24 hours
      const forecast = handleForecastResponse(days, { toUnit: "F" })
      
      // Debug: Log forecast structure
      console.log('Forecast data:', forecast)
      console.log('First day hours:', forecast?.[0]?.hours?.length)
      
      // Build 24-hour forecast from all available hours across days
      let allHours: any[] = []
      
      // Collect hours from all forecast days
      forecast?.forEach((day: any) => {
        if (day.hours && Array.isArray(day.hours)) {
          allHours = allHours.concat(day.hours)
        }
      })
      
      // Take first 24 hours and format them
      let hours = allHours.slice(0, 24).map((h: any) => {
        let time = ""
        if (h.time) {
          time = h.time
        } else if (h.dt) {
          const date = new Date(h.dt * 1000)
          time = date.getHours().toString().padStart(2, '0') + ":00"
        } else if (h.dt_txt) {
          // Parse dt_txt format like "2024-01-01 12:00:00"
          const date = new Date(h.dt_txt)
          time = date.getHours().toString().padStart(2, '0') + ":00"
        }
        
        const temp = Math.round(h.temperature ?? current.temperature ?? 0)
        const icon = h.icon || getWeatherIcon(h.main || h.weather_main || current.main)
        
        return {
          time,
          temp,
          icon,
        }
      })
      
      // If we don't have 24 hours, generate them with current weather data
      if (hours.length < 24) {
        console.log(`Only got ${hours.length} hours, generating 24 hours`)
        const currentHour = new Date().getHours()
        hours = Array.from({ length: 24 }, (_, i) => {
          const hour = (currentHour + i) % 24
          return {
            time: hour.toString().padStart(2, '0') + ":00",
            temp: Math.round(current.temperature ?? 0),
            icon: getWeatherIcon(current.main || "Clear"),
          }
        })
      }

      const mapped: WeatherData = {
        city: label || "",
        temperature: Math.round(current.temperature ?? 0),
        condition: current.description || "",
        feelsLike: Math.round(current.feels_like ?? 0),
        humidity: current.humidity ?? 0,
        windSpeed: Math.round((current.wind_speed ?? 0) * 2.237), // m/s -> mph
        uvIndex: 0,
        visibility: current.visibility ?? 0,
        weatherType: (current.main || "cloudy").toLowerCase() as any,
        hourlyForecast: hours,
      }
      setWeather(mapped)
      if (label) setRecentSearches((prev) => [label, ...prev.filter((c) => c !== label)].slice(0, 5))
    } catch (e) {
      // noop; could integrate toast here
    }
  }

  // Helper function to get weather icons
  function getWeatherIcon(condition: string): string {
    const iconMap: Record<string, string> = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️',
      'Dust': '🌪️',
      'Sand': '🌪️',
      'Ash': '🌋',
      'Squall': '💨',
      'Tornado': '🌪️',
    }
    return iconMap[condition] || '☀️'
  }

  const handleSearch = async (city: string) => {
    try {
      const results = await searchLocation(city)
      if (results && results.length > 0) {
        const r = results[0]
        const labelParts = [r.name, (r as any).state, r.country].filter(Boolean) as string[]
        const label = labelParts.join(", ") || city
        await fetchWeatherByCoords(Number(r.lat), Number(r.lon), label)
      }
    } catch {}
  }

  const handleUseLocation = async () => {
    if (!navigator.geolocation) {
      await handleSearch("San Francisco")
      return
    }
    const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
      // Try Open-Meteo reverse geocoding first
      try {
        const params = new URLSearchParams({ latitude: String(lat), longitude: String(lon), language: "en", format: "json" })
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?${params.toString()}`)
        if (res.ok) {
          const j = await res.json()
          const results = (j?.results as Array<{ name?: string; admin1?: string; country?: string }> | undefined) || []
          if (Array.isArray(results) && results.length > 0) {
            const r = results[0]
            const parts = [r?.name, r?.admin1, r?.country].filter(Boolean) as string[]
            const composed = parts.join(", ")
            if (composed) return composed
          }
        }
      } catch {}
      // Fallback to Nominatim reverse geocoding
      try {
        const params = new URLSearchParams({ lat: String(lat), lon: String(lon), format: "jsonv2", addressdetails: "1", zoom: "10" })
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, { headers: { "User-Agent": "WeatherApp/1.0 (+https://example.com)" } as any })
        if (res.ok) {
          const j = await res.json()
          const address = j?.address || {}
          const city = address.city || address.town || address.village || address.municipality || address.suburb || address.county
          const state = address.state || address.region
          const country = address.country || address.country_code
          const parts = [city, state, country].filter(Boolean).map((v: string) => String(v)) as string[]
          const composed = parts.join(", ")
          if (composed) return composed
        }
      } catch {}
      return ""
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const label = (await reverseGeocode(latitude, longitude)) || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
        await fetchWeatherByCoords(latitude, longitude, label)
      },
      async () => {
        await handleSearch("San Francisco")
      },
      { timeout: 10000 }
    )
  }

  const convertTemp = (temp: number) => {
    if (tempUnit === "C") {
      return Math.round((temp - 32) * (5 / 9))
    }
    return temp
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation tempUnit={tempUnit} onTempUnitChange={setTempUnit} />

      <main className="flex-1">
        {!weather ? (
          <EmptyState onSearch={handleSearch} onUseLocation={handleUseLocation} recentSearches={recentSearches} />
        ) : (
          <div className="space-y-6 p-4 md:p-8 max-w-6xl mx-auto">
            <SearchBar onSearch={handleSearch} recentSearches={recentSearches} />

            <HeroWeatherCard weather={weather} tempUnit={tempUnit} convertTemp={convertTemp} />

            <QuickStatsGrid weather={weather} tempUnit={tempUnit} convertTemp={convertTemp} />

            <HourlyForecast forecast={weather.hourlyForecast} tempUnit={tempUnit} convertTemp={convertTemp} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
