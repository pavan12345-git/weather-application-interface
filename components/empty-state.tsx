"use client"

import type React from "react"

import { MapPin, Cloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface EmptyStateProps {
  onSearch: (city: string) => void
  onUseLocation: () => void
  recentSearches: string[]
}

export default function EmptyState({ onSearch, onUseLocation, recentSearches }: EmptyStateProps) {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query)
      setQuery("")
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md">
        <div className="flex justify-center">
          <Cloud className="w-24 h-24 text-muted-foreground opacity-50" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Welcome to WeatherHub</h2>
          <p className="text-muted-foreground">Search for a city to get started with real-time weather updates</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="text"
            placeholder="Search for a city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-center"
          />
          <Button type="submit" className="w-full">
            Search
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">or</span>
          </div>
        </div>

        <Button onClick={onUseLocation} variant="outline" className="w-full gap-2 bg-transparent">
          <MapPin className="w-4 h-4" />
          Use My Location
        </Button>

        {recentSearches.length > 0 && (
          <div className="pt-4 space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Recent Searches</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {recentSearches.map((city) => (
                <Button key={city} variant="secondary" size="sm" onClick={() => onSearch(city)}>
                  {city}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
