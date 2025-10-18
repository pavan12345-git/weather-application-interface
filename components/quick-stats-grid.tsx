"use client"

import { Droplets, Wind, Sun, Eye } from "lucide-react"
import { Card } from "@/components/ui/card"

interface QuickStatsGridProps {
  weather: {
    humidity: number
    windSpeed: number
    uvIndex: number
    visibility: number
  }
  tempUnit: "C" | "F"
  convertTemp: (temp: number) => number
}

export default function QuickStatsGrid({ weather }: QuickStatsGridProps) {
  const stats = [
    {
      label: "Humidity",
      value: `${weather.humidity}%`,
      icon: Droplets,
      color: "text-blue-500",
    },
    {
      label: "Wind Speed",
      value: `${weather.windSpeed} mph`,
      icon: Wind,
      color: "text-cyan-500",
    },
    {
      label: "UV Index",
      value: weather.uvIndex,
      icon: Sun,
      color: "text-yellow-500",
    },
    {
      label: "Visibility",
      value: `${weather.visibility} mi`,
      icon: Eye,
      color: "text-purple-500",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card
            key={stat.label}
            className="p-6 flex flex-col items-center justify-center text-center space-y-3 hover:shadow-lg transition-shadow"
          >
            <Icon className={`w-8 h-8 ${stat.color}`} />
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
