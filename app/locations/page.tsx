"use client"

import { useEffect, useMemo, useState } from "react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Star, Trash2, ArrowRight, Plus, Cloud, Droplets, Wind, Loader2, Search } from "lucide-react"
import { getUserLocations, deleteLocation as apiDeleteLocation, toggleFavorite as apiToggleFavorite, searchLocation, saveLocation, getCurrentWeather } from "@/utils/api"
import { handleWeatherResponse } from "@/lib/apiHandlers"

interface UiLocation {
  id: number
  city: string
  country: string
  latitude: number
  longitude: number
  temperature: number | null
  condition: string
  icon: string
  humidity: number | null
  windSpeed: number | null
  isFavorite: boolean
  lastUpdated: string
}

export default function LocationsPage() {
  const [tempUnit, setTempUnit] = useState<"C" | "F">("F")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"a-z" | "recent" | "favorites">("a-z")
  const [locations, setLocations] = useState<UiLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [addQuery, setAddQuery] = useState("")
  const [addResults, setAddResults] = useState<Array<{ name: string; country?: string; state?: string; lat: number; lon: number }>>([])
  const [addSearching, setAddSearching] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getUserLocations()
        if (!mounted) return
        const items: UiLocation[] = (data || []).map((loc) => {
          const weather = loc.weather || null
          // Backend weather is in C; canonical UI temp is F
          const tempF = weather?.temperature != null ? Math.round((Number(weather.temperature) * 9) / 5 + 32) : null
          return {
            id: loc.id,
            city: loc.city_name,
            country: loc.country || "",
            latitude: loc.latitude,
            longitude: loc.longitude,
            temperature: tempF,
            condition: weather?.weather || "",
            icon: weather?.icon || "",
            humidity: weather?.humidity ?? null,
            windSpeed: weather?.wind_speed != null ? Math.round(Number(weather.wind_speed) * 2.237) : null,
            isFavorite: !!loc.is_favorite,
            lastUpdated: weather?.dt ? new Date(weather.dt * 1000).toLocaleString() : "",
          }
        })
        setLocations(items)

        // Hydrate missing weather in background
        const missing = items.filter((i) => i.temperature == null)
        for (const m of missing) {
          try {
            const raw = await getCurrentWeather(m.latitude, m.longitude)
            const w = handleWeatherResponse(raw, { toUnit: "F" })
            const temp = w.temperature != null ? Math.round(Number(w.temperature)) : null
            setLocations((prev) => prev.map((l) => (l.id === m.id ? {
              ...l,
              temperature: temp,
              condition: w.description || l.condition,
              icon: w.icon || l.icon,
              humidity: w.humidity ?? l.humidity,
              windSpeed: w.wind_speed != null ? Math.round(Number(w.wind_speed) * 2.237) : l.windSpeed,
              lastUpdated: w.observed_local || l.lastUpdated,
            } : l)))
          } catch {}
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load locations")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const convertTemp = (temp: number | null) => {
    if (temp == null) return "—"
    if (tempUnit === "C") {
      return Math.round((temp - 32) * (5 / 9))
    }
    return Math.round(temp)
  }

  const filteredLocations = useMemo(() => {
    const q = searchQuery.toLowerCase()
    const out = locations
      .filter((loc) => loc.city.toLowerCase().includes(q) || loc.country.toLowerCase().includes(q))
      .slice()
    out.sort((a, b) => {
      if (sortBy === "a-z") return a.city.localeCompare(b.city)
      if (sortBy === "recent") return 0
      if (sortBy === "favorites") return Number(b.isFavorite) - Number(a.isFavorite)
      return 0
    })
    return out
  }, [locations, searchQuery, sortBy])

  const handleToggleFavorite = async (id: number) => {
    try {
      const updated = await apiToggleFavorite(id)
      setLocations((prev) => prev.map((loc) => (loc.id === id ? { ...loc, isFavorite: !!updated.is_favorite } : loc)))
    } catch {}
  }

  const handleDeleteLocation = async (id: number) => {
    try {
      await apiDeleteLocation(id)
      setLocations((prev) => prev.filter((loc) => loc.id !== id))
    } catch {}
    setDeleteId(null)
  }

  const handleAddSearch = async (q: string) => {
    setAddQuery(q)
    if (!q.trim()) {
      setAddResults([])
      return
    }
    setAddSearching(true)
    try {
      const results = await searchLocation(q)
      setAddResults(results)
    } catch {
      setAddResults([])
    } finally {
      setAddSearching(false)
    }
  }

  const handleAddSelect = async (r: { name: string; country?: string; lat: number; lon: number }) => {
    try {
      const resp = await saveLocation({ city: r.name, country: r.country, lat: r.lon ? Number(r.lat) : r.lat, lon: r.lon })
      const loc = resp.location

      // Fetch current weather immediately and add fully populated card
      let temp: number | null = null
      let condition = ""
      let icon = ""
      let humidity: number | null = null
      let wind: number | null = null
      let lastUpdated = ""
      try {
        const raw = await getCurrentWeather(Number(loc.latitude), Number(loc.longitude))
        const w = handleWeatherResponse(raw, { toUnit: "F" })
        temp = w.temperature != null ? Math.round(Number(w.temperature)) : null
        condition = w.description || ""
        icon = w.icon || ""
        humidity = w.humidity ?? null
        wind = w.wind_speed != null ? Math.round(Number(w.wind_speed) * 2.237) : null
        lastUpdated = w.observed_local || ""
      } catch {}

      setLocations((prev) => [
        ...prev,
        {
          id: loc.id,
          city: loc.city_name,
          country: loc.country || "",
          latitude: Number(loc.latitude),
          longitude: Number(loc.longitude),
          temperature: temp,
          condition,
          icon,
          humidity,
          windSpeed: wind,
          isFavorite: !!loc.is_favorite,
          lastUpdated,
        },
      ])
      setIsAdding(false)
      setAddQuery("")
      setAddResults([])
    } catch {}
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation tempUnit={tempUnit} onTempUnitChange={setTempUnit} />

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">My Locations</h1>
            <p className="text-muted-foreground mt-1">
              {locations.length} location{locations.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setIsAdding(true)}>
            <Plus className="w-5 h-5" />
            Add Location
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading locations...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-24 text-destructive">{error}</div>
        ) : locations.length > 0 ? (
          <>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <Input
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a-z">A-Z</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                  <SelectItem value="favorites">Favorites First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLocations.map((location) => (
                <Card key={location.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold">{location.city}</h3>
                        <p className="text-sm text-muted-foreground">{location.country}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleFavorite(location.id)}
                          className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        >
                          <Star
                            className={`w-5 h-5 ${location.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                          />
                        </button>
                        <button
                          onClick={() => setDeleteId(location.id)}
                          className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-destructive" />
                        </button>
                      </div>
                    </div>

                    <div className="text-center py-4 border-y mb-4">
                      <div className="text-5xl mb-2">
                        {location.icon ? (
                          <img src={`https://openweathermap.org/img/wn/${location.icon}@2x.png`} alt="" className="inline-block" />
                        ) : (
                          <Cloud className="w-12 h-12 mx-auto text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-3xl font-bold">{convertTemp(location.temperature)}°</div>
                      <p className="text-sm text-muted-foreground mt-1">{location.condition || "—"}</p>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        <span>Humidity: {location.humidity != null ? `${location.humidity}%` : "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Wind className="w-4 h-4 text-slate-500" />
                        <span>Wind: {location.windSpeed != null ? `${Math.round(location.windSpeed)} mph` : "—"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <p className="text-xs text-muted-foreground">Last updated: {location.lastUpdated || "—"}</p>
                      <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <Cloud className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No locations saved yet</h2>
            <p className="text-muted-foreground mb-6">Add your first location to get started</p>
            <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setIsAdding(true)}>
              <Plus className="w-5 h-5" />
              Add Location
            </Button>
          </div>
        )}
      </main>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Location</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove this location? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteLocation(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Location Modal (lightweight inline) */}
      <AlertDialog open={isAdding} onOpenChange={(open) => !open && setIsAdding(false)}>
        <AlertDialogContent>
          <AlertDialogTitle>Add a location</AlertDialogTitle>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search for a city..."
                value={addQuery}
                onChange={(e) => handleAddSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto border rounded-md">
              {addSearching ? (
                <div className="flex items-center justify-center gap-2 p-4 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </div>
              ) : addResults.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No results</div>
              ) : (
                addResults.map((r) => (
                  <button
                    key={`${r.name}-${r.lat}-${r.lon}`}
                    className="w-full text-left px-4 py-2 hover:bg-secondary border-b last:border-b-0"
                    onClick={() => handleAddSelect(r)}
                  >
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{[r.state, r.country].filter(Boolean).join(", ")}</div>
                  </button>
                ))
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Close</AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  )
}
