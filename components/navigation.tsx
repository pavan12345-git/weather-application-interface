"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavigationProps {
  tempUnit: "C" | "F"
  onTempUnitChange: (unit: "C" | "F") => void
}

export default function Navigation({ tempUnit, onTempUnitChange }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const pathname = usePathname()

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  const isActive = (path: string) => pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-bold text-lg hidden sm:inline">WeatherHub</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                isActive("/") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Home
            </Link>
            <Link
              href="/forecast"
              className={`text-sm font-medium transition-colors ${
                isActive("/forecast") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              7-Day Forecast
            </Link>
            <Link
              href="/locations"
              className={`text-sm font-medium transition-colors ${
                isActive("/locations") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              My Locations
            </Link>

            <Link
              href="/settings"
              className={`text-sm font-medium transition-colors ${
                isActive("/settings") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Settings
            </Link>

            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <Button
                variant={tempUnit === "F" ? "default" : "ghost"}
                size="sm"
                onClick={() => onTempUnitChange("F")}
                className="text-xs"
              >
                °F
              </Button>
              <Button
                variant={tempUnit === "C" ? "default" : "ghost"}
                size="sm"
                onClick={() => onTempUnitChange("C")}
                className="text-xs"
              >
                °C
              </Button>
            </div>

            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-lg">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            <Button variant="ghost" size="sm">
              Profile
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-lg">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="rounded-lg">
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-3 border-t border-border pt-4">
            <Link
              href="/"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/") ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
              }`}
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/forecast"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/forecast") ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
              }`}
              onClick={() => setIsOpen(false)}
            >
              7-Day Forecast
            </Link>
            <Link
              href="/locations"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/locations") ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
              }`}
              onClick={() => setIsOpen(false)}
            >
              My Locations
            </Link>

            <Link
              href="/settings"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/settings") ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
              }`}
              onClick={() => setIsOpen(false)}
            >
              Settings
            </Link>

            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <Button
                variant={tempUnit === "F" ? "default" : "ghost"}
                size="sm"
                onClick={() => onTempUnitChange("F")}
                className="text-xs flex-1"
              >
                °F
              </Button>
              <Button
                variant={tempUnit === "C" ? "default" : "ghost"}
                size="sm"
                onClick={() => onTempUnitChange("C")}
                className="text-xs flex-1"
              >
                °C
              </Button>
            </div>
            <Button variant="ghost" className="w-full justify-start">
              Profile
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
