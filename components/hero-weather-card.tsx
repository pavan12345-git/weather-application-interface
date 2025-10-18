"use client"

import { Cloud, CloudRain, Sun, Moon } from "lucide-react"

interface HeroWeatherCardProps {
  weather: {
    city: string
    temperature: number
    condition: string
    feelsLike: number
    weatherType: "sunny" | "rainy" | "cloudy" | "night"
  }
  tempUnit: "C" | "F"
  convertTemp: (temp: number) => number
}

export default function HeroWeatherCard({ weather, tempUnit, convertTemp }: HeroWeatherCardProps) {
  const getGradient = () => {
    switch (weather.weatherType) {
      case "sunny":
        return "from-yellow-400 via-orange-400 to-red-400"
      case "rainy":
        return "from-slate-400 via-slate-500 to-slate-700"
      case "cloudy":
        return "from-gray-300 via-gray-400 to-gray-600"
      case "night":
        return "from-purple-900 via-indigo-900 to-slate-900"
      default:
        return "from-blue-400 to-cyan-500"
    }
  }

  const getWeatherIcon = () => {
    switch (weather.weatherType) {
      case "sunny":
        return <Sun className="w-24 h-24 text-yellow-300" />
      case "rainy":
        return <CloudRain className="w-24 h-24 text-slate-300" />
      case "cloudy":
        return <Cloud className="w-24 h-24 text-gray-300" />
      case "night":
        return <Moon className="w-24 h-24 text-purple-200" />
      default:
        return <Cloud className="w-24 h-24 text-blue-300" />
    }
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getGradient()} p-8 md:p-12 text-white shadow-2xl`}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold text-balance">{weather.city}</h2>

        <div className="flex justify-center">{getWeatherIcon()}</div>

        <div className="space-y-2">
          <div className="text-6xl md:text-7xl font-bold">
            {convertTemp(weather.temperature)}°{tempUnit}
          </div>
          <p className="text-xl md:text-2xl font-semibold opacity-90">{weather.condition}</p>
          <p className="text-lg opacity-80">
            Feels like {convertTemp(weather.feelsLike)}°{tempUnit}
          </p>
        </div>
      </div>
    </div>
  )
}
