"use client"

import { useState } from "react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Share2, Sun, Wind, Droplets, Moon, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

  // Mock forecast data
  const mockForecastData: ForecastData = {
    city: "San Francisco",
    coordinates: { lat: 37.7749, lng: -122.4194 },
    currentDate: "October 18, 2025",
    currentTime: "2:30 PM",
    tempUnit: "F",
    forecast: [
      {
        day: "Today",
        date: "Oct 18",
        high: 72,
        low: 58,
        condition: "Partly Cloudy",
        icon: "⛅",
        precipitation: 10,
        windSpeed: 12,
        hourly: Array.from({ length: 24 }, (_, i) => ({
          time: `${i}:00`,
          temp: 72 - Math.floor(Math.random() * 8),
          icon: "⛅",
        })),
      },
      {
        day: "Tomorrow",
        date: "Oct 19",
        high: 75,
        low: 60,
        condition: "Sunny",
        icon: "☀️",
        precipitation: 0,
        windSpeed: 8,
        hourly: Array.from({ length: 24 }, (_, i) => ({
          time: `${i}:00`,
          temp: 75 - Math.floor(Math.random() * 10),
          icon: "☀️",
        })),
      },
      {
        day: "Monday",
        date: "Oct 20",
        high: 70,
        low: 55,
        condition: "Rainy",
        icon: "🌧️",
        precipitation: 80,
        windSpeed: 18,
        hourly: Array.from({ length: 24 }, (_, i) => ({
          time: `${i}:00`,
          temp: 70 - Math.floor(Math.random() * 6),
          icon: "🌧️",
        })),
      },
      {
        day: "Tuesday",
        date: "Oct 21",
        high: 68,
        low: 54,
        condition: "Cloudy",
        icon: "☁️",
        precipitation: 20,
        windSpeed: 10,
        hourly: Array.from({ length: 24 }, (_, i) => ({
          time: `${i}:00`,
          temp: 68 - Math.floor(Math.random() * 7),
          icon: "☁️",
        })),
      },
      {
        day: "Wednesday",
        date: "Oct 22",
        high: 73,
        low: 59,
        condition: "Sunny",
        icon: "☀️",
        precipitation: 5,
        windSpeed: 9,
        hourly: Array.from({ length: 24 }, (_, i) => ({
          time: `${i}:00`,
          temp: 73 - Math.floor(Math.random() * 9),
          icon: "☀️",
        })),
      },
      {
        day: "Thursday",
        date: "Oct 23",
        high: 71,
        low: 57,
        condition: "Partly Cloudy",
        icon: "⛅",
        precipitation: 15,
        windSpeed: 11,
        hourly: Array.from({ length: 24 }, (_, i) => ({
          time: `${i}:00`,
          temp: 71 - Math.floor(Math.random() * 8),
          icon: "⛅",
        })),
      },
      {
        day: "Friday",
        date: "Oct 24",
        high: 76,
        low: 61,
        condition: "Sunny",
        icon: "☀️",
        precipitation: 0,
        windSpeed: 7,
        hourly: Array.from({ length: 24 }, (_, i) => ({
          time: `${i}:00`,
          temp: 76 - Math.floor(Math.random() * 11),
          icon: "☀️",
        })),
      },
    ],
    sunrise: "6:45 AM",
    sunset: "5:30 PM",
    moonPhase: "Waxing Gibbous",
    airQuality: "Good",
    uvIndex: 6,
    alerts: [
      {
        message: "Wind Advisory: Strong winds expected Monday afternoon",
        severity: "warning",
        period: "Mon 2 PM - 8 PM",
      },
    ],
  }

  const convertTemp = (temp: number) => {
    if (tempUnit === "C") {
      return Math.round((temp - 32) * (5 / 9))
    }
    return temp
  }

  const chartData = mockForecastData.forecast.map((day) => ({
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation tempUnit={tempUnit} onTempUnitChange={setTempUnit} />

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{mockForecastData.city}</h1>
            <p className="text-muted-foreground">
              {mockForecastData.coordinates.lat.toFixed(2)}°, {mockForecastData.coordinates.lng.toFixed(2)}°
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {mockForecastData.currentDate} at {mockForecastData.currentTime}
            </p>
          </div>
          <Button variant="outline" size="lg" className="gap-2 bg-transparent">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>

        {mockForecastData.alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {mockForecastData.alerts.map((alert, idx) => (
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
          {mockForecastData.forecast.map((day, idx) => (
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
                <span className="font-semibold">{mockForecastData.sunrise}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sunset</span>
                <span className="font-semibold">{mockForecastData.sunset}</span>
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
              <p className="font-semibold">{mockForecastData.moonPhase}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Air Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-green-600 dark:text-green-400">{mockForecastData.airQuality}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">UV Index</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full ${getUVIndexColor(mockForecastData.uvIndex)} flex items-center justify-center text-white font-bold`}
                >
                  {mockForecastData.uvIndex}
                </div>
                <span className="text-sm text-muted-foreground">
                  {mockForecastData.uvIndex <= 2 && "Low"}
                  {mockForecastData.uvIndex > 2 && mockForecastData.uvIndex <= 5 && "Moderate"}
                  {mockForecastData.uvIndex > 5 && mockForecastData.uvIndex <= 7 && "High"}
                  {mockForecastData.uvIndex > 7 && "Very High"}
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
