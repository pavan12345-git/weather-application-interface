"use client"

import type React from "react"

import { useState, useCallback, useEffect, useRef } from "react"
import { Search, X, Loader2, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

interface SearchResult {
  id: string
  city: string
  country: string
  flag: string
  lat: number
  lon: number
}

interface SearchInterfaceProps {
  onSelectLocation?: (location: SearchResult) => void
  onClose?: () => void
}

export default function SearchInterface({ onSelectLocation, onClose }: SearchInterfaceProps) {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isGeoLoading, setIsGeoLoading] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout>()

  // Mock search data
  const mockCities: SearchResult[] = [
    { id: "1", city: "San Francisco", country: "United States", flag: "🇺🇸", lat: 37.7749, lon: -122.4194 },
    { id: "2", city: "New York", country: "United States", flag: "🇺🇸", lat: 40.7128, lon: -74.006 },
    { id: "3", city: "Los Angeles", country: "United States", flag: "🇺🇸", lat: 34.0522, lon: -118.2437 },
    { id: "4", city: "London", country: "United Kingdom", flag: "🇬🇧", lat: 51.5074, lon: -0.1278 },
    { id: "5", city: "Paris", country: "France", flag: "🇫🇷", lat: 48.8566, lon: 2.3522 },
    { id: "6", city: "Tokyo", country: "Japan", flag: "🇯🇵", lat: 35.6762, lon: 139.6503 },
    { id: "7", city: "Sydney", country: "Australia", flag: "🇦🇺", lat: -33.8688, lon: 151.2093 },
    { id: "8", city: "Dubai", country: "United Arab Emirates", flag: "🇦🇪", lat: 25.2048, lon: 55.2708 },
  ]

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentSearches")
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 5))
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [])

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    setSelectedIndex(-1)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (!value.trim()) {
      setResults([])
      return
    }

    debounceTimer.current = setTimeout(() => {
      setIsLoading(true)
      // Simulate API call
      setTimeout(() => {
        const filtered = mockCities.filter(
          (city) =>
            city.city.toLowerCase().includes(value.toLowerCase()) ||
            city.country.toLowerCase().includes(value.toLowerCase()),
        )
        setResults(filtered.slice(0, 5))
        setIsLoading(false)
      }, 300)
    }, 300)
  }, [])

  const handleSelectResult = (result: SearchResult) => {
    // Add to recent searches
    const updated = [result, ...recentSearches.filter((r) => r.id !== result.id)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem("recentSearches", JSON.stringify(updated))

    onSelectLocation?.(result)
    setQuery("")
    setResults([])
  }

  const handleClearRecent = () => {
    setRecentSearches([])
    localStorage.removeItem("recentSearches")
  }

  const handleUseLocation = async () => {
    setIsGeoLoading(true)
    try {
      const position = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err),
          { timeout: 10000 },
        )
      })

      // Find nearest city (mock)
      const nearest = mockCities.reduce((prev, curr) => {
        const prevDist = Math.hypot(prev.lat - position.latitude, prev.lon - position.longitude)
        const currDist = Math.hypot(curr.lat - position.latitude, curr.lon - position.longitude)
        return currDist < prevDist ? curr : prev
      })

      handleSelectResult(nearest)
      toast({
        title: "Location found",
        description: `Using ${nearest.city}, ${nearest.country}`,
      })
    } catch (error: any) {
      let message = "Unable to get your location"
      if (error.code === 1) {
        message = "Permission denied. Please enable location access."
      } else if (error.code === 2) {
        message = "Location unavailable. Please try again."
      } else if (error.code === 3) {
        message = "Location request timed out. Please try again."
      }
      toast({
        title: "Location error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsGeoLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelectResult(results[selectedIndex])
      }
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for a city..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10 py-6 text-lg rounded-lg"
            autoFocus
          />
          {query && (
            <button
              onClick={() => {
                setQuery("")
                setResults([])
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {(results.length > 0 || isLoading) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 p-4 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectResult(result)}
                    className={`w-full px-4 py-3 text-left transition-colors border-b border-border last:border-b-0 ${
                      index === selectedIndex ? "bg-secondary" : "hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">
                          {result.flag} {result.city}
                        </p>
                        <p className="text-sm text-muted-foreground">{result.country}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {result.lat.toFixed(2)}°, {result.lon.toFixed(2)}°
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">No results found for "{query}"</div>
            )}
          </div>
        )}
      </div>

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Recent Searches</h3>
            <button onClick={handleClearRecent} className="text-xs text-primary hover:underline">
              Clear All
            </button>
          </div>
          <div className="space-y-2">
            {recentSearches.map((search) => (
              <button
                key={search.id}
                onClick={() => handleSelectResult(search)}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-left"
              >
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-medium">
                    {search.flag} {search.city}
                  </p>
                  <p className="text-xs text-muted-foreground">{search.country}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Geolocation Section */}
      {!query && (
        <div>
          <Button
            onClick={handleUseLocation}
            disabled={isGeoLoading}
            variant="outline"
            className="w-full gap-2 py-6 text-base bg-transparent"
          >
            {isGeoLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Getting your location...
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5" />
                Use My Location
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
