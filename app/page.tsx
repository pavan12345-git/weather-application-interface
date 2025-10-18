"use client"

import { useState } from "react"
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

  // Mock weather data - in production, this would come from an API
  const mockWeatherData: Record<string, WeatherData> = {
    "San Francisco": {
      city: "San Francisco",
      temperature: 72,
      condition: "Partly Cloudy",
      feelsLike: 70,
      humidity: 65,
      windSpeed: 12,
      uvIndex: 6,
      visibility: 10,
      weatherType: "cloudy",
      hourlyForecast: Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        temp: 72 - Math.floor(Math.random() * 8),
        icon: "⛅",
      })),
    },
    "New York": {
      city: "New York",
      temperature: 68,
      condition: "Rainy",
      feelsLike: 65,
      humidity: 80,
      windSpeed: 18,
      uvIndex: 3,
      visibility: 5,
      weatherType: "rainy",
      hourlyForecast: Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        temp: 68 - Math.floor(Math.random() * 6),
        icon: "🌧️",
      })),
    },
    "Los Angeles": {
      city: "Los Angeles",
      temperature: 85,
      condition: "Sunny",
      feelsLike: 88,
      humidity: 45,
      windSpeed: 8,
      uvIndex: 9,
      visibility: 15,
      weatherType: "sunny",
      hourlyForecast: Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        temp: 85 - Math.floor(Math.random() * 10),
        icon: "☀️",
      })),
    },
  }

  const handleSearch = (city: string) => {
    const data = mockWeatherData[city]
    if (data) {
      setWeather(data)
      setRecentSearches((prev) => [city, ...prev.filter((c) => c !== city)].slice(0, 5))
    }
  }

  const handleUseLocation = () => {
    // In production, use geolocation API
    handleSearch("San Francisco")
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
