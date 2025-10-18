"use client"

import type React from "react"

import { useState } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  onSearch: (city: string) => void
  recentSearches: string[]
}

export default function SearchBar({ onSearch, recentSearches }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const handleSearch = (city: string) => {
    onSearch(city)
    setQuery("")
    setIsOpen(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      handleSearch(query)
    }
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for a city..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-10 pr-4"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Dropdown */}
      {isOpen && recentSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground px-2">Recent Searches</p>
            {recentSearches.map((city) => (
              <button
                key={city}
                onClick={() => handleSearch(city)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors"
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
