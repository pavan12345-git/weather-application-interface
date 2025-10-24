"use client"

import { useEffect, useState } from "react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Share2, Sun, Wind, Droplets, Moon, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCurrentWeather, getForecast } from "@/utils/api"
import { handleForecastResponse, handleWeatherResponse } from "@/lib/apiHandlers"
import { ForecastSkeleton } from "@/components/loading/weather-skeleton"

interface DailyForecast {
  day: string
  date: string
  high: number
  low: number
  condition: string
  icon: string
  precipitation: number
  windSpeed: number
  hourly: Array<{
    time: string
    temp: number
    icon: string
  }>
}

interface ForecastData {
  city: string
  coordinates: { lat: number; lng: number }
  currentDate: string
  currentTime: string
  tempUnit: "C" | "F"
  forecast: DailyForecast[]
  sunrise: string
  sunset: string
  moonPhase: string
  airQuality: string
  uvIndex: number
  alerts: Array<{
    message: string
    severity: "warning" | "alert"
    period: string
  }>
}

export default function ForecastPage() {
  const [tempUnit, setTempUnit] = useState<"C" | "F">("F")
  const [expandedDay, setExpandedDay] = useState<number | null>(null)
  const [viewData, setViewData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const mapToDailyForecast = (days: Array<{ date: string; label: string; min_temp: number | null; max_temp: number | null; hours: Array<{ dt: number | null; time: string | null; temperature: number | null; main?: string; icon?: string; wind_speed: number | null }> }>): DailyForecast[] => {
    const today = new Date()
    const todayKey = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`
    return days.map((d, idx) => {
      const dateObj = new Date(d.date + "T00:00:00Z")
      const isToday = d.date === todayKey
      const labelDay = isToday ? "Today" : idx === 1 ? "Tomorrow" : new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(dateObj)
      const labelDate = new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit" }).format(dateObj)
      const midHour = d.hours[Math.min(12, Math.max(0, Math.floor((d.hours.length || 1) / 2) - 1))] || d.hours[0]
      const condition = (midHour as any)?.weather || (midHour as any)?.main || ""
      const windMph = (() => {
        try {
          const speeds = (d.hours || []).map((h) => Number(h.wind_speed || 0) * 2.237).filter((n) => !Number.isNaN(n))
          if (!speeds.length) return 0
          const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length
          return Math.round(avg)
        } catch {
          return 0
        }
      })()
      const hourly = (d.hours || []).slice(0, 24).map((h) => ({
        time: h.time ? String(h.time) : (h.dt ? new Date((h.dt as number) * 1000).getHours() + ":00" : ""),
        temp: Math.round(Number(h.temperature ?? 0)),
        icon: "",
      }))
      return {
        day: labelDay,
        date: labelDate,
        high: Math.round(Number(d.max_temp ?? 0)),
        low: Math.round(Number(d.min_temp ?? 0)),
        condition,
        icon: "",
        precipitation: 0,
        windSpeed: windMph,
        hourly,
      }
    })
  }

  useEffect(() => {
    const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
      // Try Open-Meteo reverse geocoding first
      try {
        const params = new URLSearchParams({
          latitude: String(lat),
          longitude: String(lon),
          language: "en",
          format: "json",
        })
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
        const params = new URLSearchParams({
          lat: String(lat),
          lon: String(lon),
          format: "jsonv2",
          addressdetails: "1",
          zoom: "10",
        })
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
          headers: { "User-Agent": "WeatherApp/1.0 (+https://example.com)" } as any,
        })
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

      // Final fallback: return empty string so caller can decide
      return ""
    }

    const fetchUvIndex = async (lat: number, lon: number): Promise<number> => {
      try {
        const params = new URLSearchParams({
          latitude: String(lat),
          longitude: String(lon),
          timezone: "auto",
          daily: "uv_index_max",
        })
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
        if (!res.ok) return 0
        const j = await res.json()
        const arr = (j?.daily?.uv_index_max as Array<number | null>) || []
        const v = arr[0]
        return typeof v === "number" && !Number.isNaN(v) ? Math.round(v) : 0
      } catch {
        return 0
      }
    }

    const categorizeAQI = (aqi: number): string => {
      if (aqi <= 50) return "Good"
      if (aqi <= 100) return "Moderate"
      if (aqi <= 150) return "Unhealthy for Sensitive Groups"
      if (aqi <= 200) return "Unhealthy"
      if (aqi <= 300) return "Very Unhealthy"
      return "Hazardous"
    }

    const fetchAirQuality = async (lat: number, lon: number): Promise<{ label: string; aqi: number }> => {
      try {
        const params = new URLSearchParams({
          latitude: String(lat),
          longitude: String(lon),
          timezone: "auto",
          hourly: "us_aqi",
        })
        const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`)
        if (!res.ok) return { label: "", aqi: 0 }
        const j = await res.json()
        const arr = (j?.hourly?.us_aqi as Array<number | null>) || []
        const v = arr[0]
        const aqi = typeof v === "number" && !Number.isNaN(v) ? Math.round(v) : 0
        return { label: categorizeAQI(aqi), aqi }
      } catch {
        return { label: "", aqi: 0 }
      }
    }

    const computeMoonPhase = (date: Date): string => {
      const synodic = 29.53058867
      const ref = Date.parse("2000-01-06T18:14:00Z")
      const days = (date.getTime() - ref) / 86400000
      const phase = days / synodic
      const frac = phase - Math.floor(phase)
      const idx = Math.floor(frac * 8 + 0.5) & 7
      const names = [
        "New Moon",
        "Waxing Crescent",
        "First Quarter",
        "Waxing Gibbous",
        "Full Moon",
        "Waning Gibbous",
        "Last Quarter",
        "Waning Crescent",
      ]
      return names[idx] || ""
    }

    const load = async (lat: number, lon: number, label: string) => {
      try {
        setLoading(true)
        setError(null)
        const [currentRaw, forecastRaw, uvIdx, aq] = await Promise.all([
          getCurrentWeather(lat, lon),
          getForecast(lat, lon, 7),
          fetchUvIndex(lat, lon),
          fetchAirQuality(lat, lon),
        ])
        const currentView = handleWeatherResponse(currentRaw, { toUnit: "F" })
        const daysF = handleForecastResponse(forecastRaw, { toUnit: "F" }) as any
        const mappedDays = mapToDailyForecast(daysF)
        const now = new Date()
        const currentDate = new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(now)
        const currentTime = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now)

        const vd: ForecastData = {
          city: label,
          coordinates: { lat, lng: lon },
          currentDate,
          currentTime,
          tempUnit: "F",
          forecast: mappedDays,
          sunrise: currentView.sunrise_local || "",
          sunset: currentView.sunset_local || "",
          moonPhase: computeMoonPhase(now),
          airQuality: aq.label,
          uvIndex: uvIdx,
          alerts: [],
        }
        setViewData(vd)
      } catch (e: any) {
        setError(e?.message || "Failed to load forecast")
      } finally {
        setLoading(false)
      }
    }

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          ;(async () => {
            const label = (await reverseGeocode(latitude, longitude)) || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
            load(latitude, longitude, label)
          })()
        },
        () => {
          // Fallback: San Francisco if permission denied
          load(37.7749, -122.4194, "San Francisco")
        },
        { timeout: 10000 }
      )
    } else {
      // No geolocation support: fallback city
      load(37.7749, -122.4194, "San Francisco")
    }
  }, [])

  const convertTemp = (temp: number) => {
    if (tempUnit === "C") {
      return Math.round((temp - 32) * (5 / 9))
    }
    return temp
  }

  const chartData = (viewData?.forecast || []).map((day) => ({
    day: day.day.slice(0, 3),
    high: convertTemp(day.high),
    low: convertTemp(day.low),
    avg: Math.round((convertTemp(day.high) + convertTemp(day.low)) / 2),
  }))

  const getUVIndexColor = (index: number) => {
    if (index <= 2) return "bg-green-500"
    if (index <= 5) return "bg-yellow-500"
    if (index <= 7) return "bg-orange-500"
    return "bg-red-500"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation tempUnit={tempUnit} onTempUnitChange={setTempUnit} />
        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto">
          <ForecastSkeleton />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation tempUnit={tempUnit} onTempUnitChange={setTempUnit} />

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{viewData?.city || (error ? "Unable to detect location" : "...")}</h1>
            <p className="text-muted-foreground">
              {viewData ? `${viewData.coordinates.lat.toFixed(2)}°, ${viewData.coordinates.lng.toFixed(2)}°` : ""}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {viewData?.currentDate} at {viewData?.currentTime}
            </p>
          </div>
          <Button variant="outline" size="lg" className="gap-2 bg-transparent">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>

        {viewData && viewData.alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {viewData.alerts.map((alert, idx) => (
              <Alert key={idx} className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <strong>{alert.message}</strong> ({alert.period})
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {(viewData?.forecast || []).map((day, idx) => (
            <Card
              key={idx}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setExpandedDay(expandedDay === idx ? null : idx)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{day.day}</CardTitle>
                    <p className="text-sm text-muted-foreground">{day.date}</p>
                  </div>
                  <span className="text-3xl">{day.icon}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">{day.condition}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-2xl font-bold">{convertTemp(day.high)}°</span>
                    <span className="text-lg text-muted-foreground">{convertTemp(day.low)}°</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span>{day.precipitation}% chance</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Wind className="w-4 h-4 text-slate-500" />
                    <span>{day.windSpeed} mph</span>
                  </div>
                </div>

                {expandedDay === idx && (
                  <div className="pt-3 border-t mt-3 space-y-2 animate-in fade-in">
                    <p className="text-xs font-semibold text-muted-foreground">Hourly Breakdown</p>
                    <div className="grid grid-cols-6 gap-1">
                      {day.hourly.slice(0, 12).map((hour, hIdx) => (
                        <div key={hIdx} className="text-center text-xs">
                          <p className="text-muted-foreground">{hour.time.split(":")[0]}</p>
                          <p className="text-lg">{hour.icon}</p>
                          <p className="font-semibold">{convertTemp(hour.temp)}°</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>7-Day Temperature Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area type="monotone" dataKey="high" stroke="hsl(var(--chart-1))" fill="url(#colorHigh)" />
                <Area type="monotone" dataKey="low" stroke="hsl(var(--chart-2))" fill="url(#colorLow)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sun className="w-5 h-5 text-yellow-500" />
                Sunrise & Sunset
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sunrise</span>
                <span className="font-semibold">{viewData?.sunrise || ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sunset</span>
                <span className="font-semibold">{viewData?.sunset || ""}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Moon className="w-5 h-5 text-slate-400" />
                Moon Phase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{viewData?.moonPhase || ""}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Air Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-green-600 dark:text-green-400">{viewData?.airQuality || ""}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">UV Index</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full ${getUVIndexColor(viewData?.uvIndex || 0)} flex items-center justify-center text-white font-bold`}
                >
                  {viewData?.uvIndex || 0}
                </div>
                <span className="text-sm text-muted-foreground">
                  {(viewData?.uvIndex || 0) <= 2 && "Low"}
                  {(viewData?.uvIndex || 0) > 2 && (viewData?.uvIndex || 0) <= 5 && "Moderate"}
                  {(viewData?.uvIndex || 0) > 5 && (viewData?.uvIndex || 0) <= 7 && "High"}
                  {(viewData?.uvIndex || 0) > 7 && "Very High"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
