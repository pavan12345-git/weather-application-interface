"use client"

import { useState } from "react"
import { Save, AlertCircle, Download, Trash2, RotateCcw, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
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

export default function SettingsPage() {
  const { toast } = useToast()
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

  // Display Preferences
  const [tempUnit, setTempUnit] = useState<"C" | "F">("F")
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("auto")
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY")
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h")

  // Default Location
  const [defaultLocation, setDefaultLocation] = useState("San Francisco")
  const locations = ["San Francisco", "New York", "Los Angeles"]

  // Notifications
  const [weatherAlerts, setWeatherAlerts] = useState(true)
  const [dailySummary, setDailySummary] = useState(false)
  const [summaryTime, setSummaryTime] = useState("08:00")
  const [email, setEmail] = useState("user@example.com")

  const handleChange = () => {
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    setHasChanges(false)
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 3000)
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    })
  }

  const handleClearCache = () => {
    toast({
      title: "Cache cleared",
      description: "Application cache has been cleared.",
    })
  }

  const handleExportData = () => {
    const data = {
      settings: {
        tempUnit,
        theme,
        dateFormat,
        timeFormat,
        defaultLocation,
        weatherAlerts,
        dailySummary,
        summaryTime,
      },
      exportedAt: new Date().toISOString(),
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `weather-app-data-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: "Data exported",
      description: "Your data has been downloaded as JSON.",
    })
  }

  const handleDeleteLocations = () => {
    toast({
      title: "Locations deleted",
      description: "All saved locations have been removed.",
    })
  }

  const handleResetDefaults = () => {
    setTempUnit("F")
    setTheme("auto")
    setDateFormat("MM/DD/YYYY")
    setTimeFormat("12h")
    setDefaultLocation("San Francisco")
    setWeatherAlerts(true)
    setDailySummary(false)
    setSummaryTime("08:00")
    setEmail("user@example.com")
    setHasChanges(false)
    toast({
      title: "Settings reset",
      description: "All settings have been restored to defaults.",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`gap-2 transition-all ${showSaved ? "bg-green-500 hover:bg-green-500" : ""}`}
          >
            {showSaved ? (
              <>
                <span>Saved</span>
                <span>✓</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save Changes</span>
              </>
            )}
          </Button>
        </div>

        <div className="space-y-6">
          {/* Display Preferences Card */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Display Preferences</h2>

            <div className="space-y-6">
              {/* Temperature Unit Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Temperature Unit</Label>
                  <p className="text-sm text-muted-foreground mt-1">Choose between Celsius and Fahrenheit</p>
                </div>
                <div className="flex items-center gap-3 bg-muted rounded-lg p-1">
                  <Button
                    variant={tempUnit === "F" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setTempUnit("F")
                      handleChange()
                    }}
                    className="text-sm"
                  >
                    °F
                  </Button>
                  <Button
                    variant={tempUnit === "C" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setTempUnit("C")
                      handleChange()
                    }}
                    className="text-sm"
                  >
                    °C
                  </Button>
                </div>
              </div>

              <div className="border-t border-border pt-6" />

              {/* Theme Selector */}
              <div>
                <Label className="text-base font-medium mb-4 block">Theme</Label>
                <RadioGroup
                  value={theme}
                  onValueChange={(value: any) => {
                    setTheme(value)
                    handleChange()
                  }}
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="font-normal cursor-pointer">
                      ☀️ Light
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="font-normal cursor-pointer">
                      🌙 Dark
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="auto" />
                    <Label htmlFor="auto" className="font-normal cursor-pointer">
                      📱 Auto
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="border-t border-border pt-6" />

              {/* Date Format */}
              <div>
                <Label htmlFor="date-format" className="text-base font-medium mb-2 block">
                  Date Format
                </Label>
                <Select
                  value={dateFormat}
                  onValueChange={(value) => {
                    setDateFormat(value)
                    handleChange()
                  }}
                >
                  <SelectTrigger id="date-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t border-border pt-6" />

              {/* Time Format */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Time Format</Label>
                  <p className="text-sm text-muted-foreground mt-1">Choose between 12-hour and 24-hour format</p>
                </div>
                <div className="flex items-center gap-3 bg-muted rounded-lg p-1">
                  <Button
                    variant={timeFormat === "12h" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setTimeFormat("12h")
                      handleChange()
                    }}
                    className="text-sm"
                  >
                    12h
                  </Button>
                  <Button
                    variant={timeFormat === "24h" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setTimeFormat("24h")
                      handleChange()
                    }}
                    className="text-sm"
                  >
                    24h
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Default Location Card */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Default Location</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="location" className="text-base font-medium mb-2 block">
                  Select Default Location
                </Label>
                <Select
                  value={defaultLocation}
                  onValueChange={(value) => {
                    setDefaultLocation(value)
                    handleChange()
                  }}
                >
                  <SelectTrigger id="location">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">This location will be shown when you open the app</p>
            </div>
          </Card>

          {/* Notifications Card */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Notifications</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Weather Alerts</Label>
                  <p className="text-sm text-muted-foreground mt-1">Get notified about severe weather</p>
                </div>
                <Switch
                  checked={weatherAlerts}
                  onCheckedChange={(checked) => {
                    setWeatherAlerts(checked)
                    handleChange()
                  }}
                />
              </div>

              <div className="border-t border-border pt-6" />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Daily Summary</Label>
                  <p className="text-sm text-muted-foreground mt-1">Receive daily weather summary</p>
                </div>
                <Switch
                  checked={dailySummary}
                  onCheckedChange={(checked) => {
                    setDailySummary(checked)
                    handleChange()
                  }}
                />
              </div>

              {dailySummary && (
                <div className="border-t border-border pt-6">
                  <Label htmlFor="summary-time" className="text-base font-medium mb-2 block">
                    Summary Time
                  </Label>
                  <Input
                    id="summary-time"
                    type="time"
                    value={summaryTime}
                    onChange={(e) => {
                      setSummaryTime(e.target.value)
                      handleChange()
                    }}
                  />
                </div>
              )}

              <div className="border-t border-border pt-6" />

              <div>
                <Label htmlFor="email" className="text-base font-medium mb-2 block">
                  Email Address
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      handleChange()
                    }}
                    placeholder="your@email.com"
                  />
                  <span className="inline-flex items-center px-3 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 text-xs font-medium rounded-md whitespace-nowrap">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Data & Privacy Card */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Data & Privacy</h2>
            <div className="space-y-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                    <AlertCircle className="w-4 h-4" />
                    Clear Cache
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Cache?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all cached weather data. You can always fetch it again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogAction onClick={handleClearCache}>Clear</AlertDialogAction>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent"
                onClick={handleExportData}
              >
                <Download className="w-4 h-4" />
                Export My Data
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive bg-transparent"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete All Locations
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete All Locations?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. All your saved locations will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogAction onClick={handleDeleteLocations} className="bg-destructive hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                    <RotateCcw className="w-4 h-4" />
                    Reset to Defaults
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset to Defaults?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset all settings to their default values.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogAction onClick={handleResetDefaults}>Reset</AlertDialogAction>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>

          {/* About Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">About</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">App Version</p>
                <p className="font-medium">v1.0.0</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Powered by</p>
                <p className="font-medium">OpenWeatherMap API</p>
              </div>
              <div className="border-t border-border pt-4 flex flex-wrap gap-3">
                <a href="#" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  📄 Documentation
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a href="#" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  💻 GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a href="#" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  🐛 Report Bug
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
