"use client"

import { useState } from "react"
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
import { Star, Trash2, ArrowRight, Plus, Cloud, Droplets, Wind } from "lucide-react"

interface Location {
  id: string
  city: string
  country: string
  temperature: number
  condition: string
  icon: string
  humidity: number
  windSpeed: number
  isFavorite: boolean
  lastUpdated: string
}

export default function LocationsPage() {
  const [tempUnit, setTempUnit] = useState<"C" | "F">("F")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"a-z" | "recent" | "favorites">("a-z")
  const [locations, setLocations] = useState<Location[]>([
    {
      id: "1",
      city: "San Francisco",
      country: "USA",
      temperature: 72,
      condition: "Partly Cloudy",
      icon: "⛅",
      humidity: 65,
      windSpeed: 12,
      isFavorite: true,
      lastUpdated: "5 min ago",
    },
    {
      id: "2",
      city: "New York",
      country: "USA",
      temperature: 68,
      condition: "Rainy",
      icon: "🌧️",
      humidity: 80,
      windSpeed: 18,
      isFavorite: false,
      lastUpdated: "10 min ago",
    },
    {
      id: "3",
      city: "Los Angeles",
      country: "USA",
      temperature: 85,
      condition: "Sunny",
      icon: "☀️",
      humidity: 45,
      windSpeed: 8,
      isFavorite: true,
      lastUpdated: "2 min ago",
    },
    {
      id: "4",
      city: "London",
      country: "UK",
      temperature: 55,
      condition: "Cloudy",
      icon: "☁️",
      humidity: 70,
      windSpeed: 15,
      isFavorite: false,
      lastUpdated: "15 min ago",
    },
  ])
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const convertTemp = (temp: number) => {
    if (tempUnit === "C") {
      return Math.round((temp - 32) * (5 / 9))
    }
    return temp
  }

  const filteredLocations = locations
    .filter(
      (loc) =>
        loc.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.country.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "a-z") {
        return a.city.localeCompare(b.city)
      } else if (sortBy === "recent") {
        return 0 // In production, sort by actual timestamp
      } else if (sortBy === "favorites") {
        return b.isFavorite ? 1 : -1
      }
      return 0
    })

  const handleToggleFavorite = (id: string) => {
    setLocations((prev) => prev.map((loc) => (loc.id === id ? { ...loc, isFavorite: !loc.isFavorite } : loc)))
  }

  const handleDeleteLocation = (id: string) => {
    setLocations((prev) => prev.filter((loc) => loc.id !== id))
    setDeleteId(null)
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
          <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="w-5 h-5" />
            Add Location
          </Button>
        </div>

        {locations.length > 0 ? (
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
                      <div className="text-5xl mb-2">{location.icon}</div>
                      <div className="text-3xl font-bold">{convertTemp(location.temperature)}°</div>
                      <p className="text-sm text-muted-foreground mt-1">{location.condition}</p>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        <span>Humidity: {location.humidity}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Wind className="w-4 h-4 text-slate-500" />
                        <span>Wind: {location.windSpeed} mph</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <p className="text-xs text-muted-foreground">Last updated: {location.lastUpdated}</p>
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
            <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
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

      <Footer />
    </div>
  )
}
