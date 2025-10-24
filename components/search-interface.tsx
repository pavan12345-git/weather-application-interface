"use client"

import type React from "react"

import { useState, useCallback, useEffect, useRef } from "react"
import { Search, X, Loader2, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { searchLocation } from "@/utils/api"

interface SearchResult {
  id?: string
  city?: string
  country?: string
  flag?: string
  lat: number
  lon: number
  name?: string
  state?: string
}

interface SearchInterfaceProps {
  onSelectLocation?: (location: { name: string; country?: string; state?: string; lat: number; lon: number }) => void
  onClose?: () => void
}

export default function SearchInterface({ onSelectLocation, onClose }: SearchInterfaceProps) {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Array<{ name: string; country?: string; state?: string; lat: number; lon: number }>>([])
  const [recentSearches, setRecentSearches] = useState<Array<{ name: string; country?: string; state?: string; lat: number; lon: number }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isGeoLoading, setIsGeoLoading] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const stored = localStorage.getItem("recentSearches")
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 5))
      } catch {}
    }
  }, [])

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

    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await searchLocation(value)
        setResults(res)
      } catch {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)
  }, [])

  const handleSelectResult = (result: { name: string; country?: string; state?: string; lat: number; lon: number }) => {
    const updated = [result, ...recentSearches.filter((r) => r.name !== result.name)].slice(0, 5)
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

      // Reverse geocoding is handled in pages; we pass raw coords here
      handleSelectResult({ name: `${position.latitude.toFixed(2)}, ${position.longitude.toFixed(2)}` as string, lat: position.latitude, lon: position.longitude })
      toast({
        title: "Location found",
        description: `Using your current coordinates`,
      })
    } catch (error: any) {
      let message = "Unable to get your location"
      if (error.code === 1) message = "Permission denied. Please enable location access."
      else if (error.code === 2) message = "Location unavailable. Please try again."
      else if (error.code === 3) message = "Location request timed out. Please try again."
      toast({ title: "Location error", description: message, variant: "destructive" })
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
                    key={`${result.name}-${result.lat}-${result.lon}`}
                    onClick={() => handleSelectResult(result)}
                    className={`w-full px-4 py-3 text-left transition-colors border-b border-border last:border-b-0 ${
                      index === selectedIndex ? "bg-secondary" : "hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{result.name}</p>
                        <p className="text-sm text-muted-foreground">{[result.state, result.country].filter(Boolean).join(", ")}</p>
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
                key={`${search.name}-${search.lat}-${search.lon}`}
                onClick={() => handleSelectResult(search)}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-left"
              >
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-medium">{search.name}</p>
                  <p className="text-xs text-muted-foreground">{[search.state, search.country].filter(Boolean).join(", ")}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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
