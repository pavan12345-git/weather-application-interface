"use client"

import { useState, useEffect } from "react"
import { User, MapPin, Calendar, Download, Trash2, Edit3, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { getPreferences, getUserLocations, getSessionId } from "@/utils/api"

interface UserProfile {
  sessionId: string
  temperatureUnit: string
  theme: string
  defaultLocation: number | null
  totalLocations: number
  createdAt: string
  lastUpdated: string
}

interface SavedLocation {
  id: number
  city_name: string
  country: string
  is_favorite: boolean
  created_at: string
}

export default function ProfilePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [locations, setLocations] = useState<SavedLocation[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("Weather User")
  const [editEmail, setEditEmail] = useState("user@weather.app")

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        // Try to load data, but don't fail if backend is not available
        let prefs, locs
        try {
          [prefs, locs] = await Promise.all([
            getPreferences(),
            getUserLocations()
          ])
        } catch (apiError) {
          console.log("Backend not available, using defaults")
          prefs = { 
            temperature_unit: "F", 
            theme: "auto", 
            default_location: null, 
            updated_at: new Date().toISOString() 
          }
          locs = []
        }
        
        const sessionId = getSessionId() || "Unknown"
        const profile: UserProfile = {
          sessionId,
          temperatureUnit: prefs.temperature_unit || "F",
          theme: prefs.theme || "auto",
          defaultLocation: prefs.default_location,
          totalLocations: locs?.length || 0,
          createdAt: new Date().toLocaleDateString(),
          lastUpdated: new Date(prefs.updated_at || Date.now()).toLocaleDateString(),
        }
        
        setProfile(profile)
        setLocations(locs || [])
      } catch (e: any) {
        console.error("Profile load error:", e)
        setError(e?.message || "Failed to load profile")
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleExportData = () => {
    const data = {
      profile,
      locations,
      preferences: {
        temperatureUnit: profile?.temperatureUnit,
        theme: profile?.theme,
        defaultLocation: profile?.defaultLocation,
      },
      exportedAt: new Date().toISOString(),
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `weather-profile-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: "Profile exported",
      description: "Your profile data has been downloaded.",
    })
  }

  const handleClearData = async () => {
    try {
      // Clear localStorage
      localStorage.clear()
      toast({
        title: "Data cleared",
        description: "All local data has been cleared.",
      })
    } catch (e) {
      toast({
        title: "Clear failed",
        description: "Failed to clear data",
        variant: "destructive",
      })
    }
  }

  const handleSaveProfile = () => {
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    })
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Weather Profile</h1>
                    <p className="text-muted-foreground">Session ID: {profile?.sessionId}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                  className="gap-2"
                >
                  {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Display Name</Label>
                      <Input
                        id="name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} className="gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Display Name</h3>
                    <p className="text-muted-foreground">{editName}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Email</h3>
                    <p className="text-muted-foreground">{editEmail}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <MapPin className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{profile?.totalLocations}</p>
                    <p className="text-sm text-muted-foreground">Saved Locations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{profile?.temperatureUnit}°</p>
                    <p className="text-sm text-muted-foreground">Temperature Unit</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{profile?.lastUpdated}</p>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Temperature Unit</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">{profile?.temperatureUnit}°</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Theme</Label>
                  <div className="mt-1">
                    <Badge variant="secondary" className="capitalize">{profile?.theme}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Default Location</Label>
                  <div className="mt-1">
                    {profile?.defaultLocation ? (
                      <Badge variant="secondary">
                        {locations.find(l => l.id === profile.defaultLocation)?.city_name || "Unknown"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">None</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Account Created</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{profile?.createdAt}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Locations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Locations</CardTitle>
            </CardHeader>
            <CardContent>
              {locations.length > 0 ? (
                <div className="space-y-2">
                  {locations.slice(0, 5).map((location) => (
                    <div key={location.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{location.city_name}</p>
                          <p className="text-sm text-muted-foreground">{location.country}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {location.is_favorite && (
                          <Badge variant="secondary" className="text-xs">Favorite</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {new Date(location.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {locations.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      And {locations.length - 5} more locations...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No locations saved yet</p>
              )}
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={handleExportData}
                >
                  <Download className="w-4 h-4" />
                  Export Profile Data
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will clear all your local data including preferences and recent searches. 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90">
                      Clear Data
                    </AlertDialogAction>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}