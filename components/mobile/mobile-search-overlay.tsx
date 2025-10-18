"use client"

import { useState, useEffect } from "react"
import { X, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface MobileSearchOverlayProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (query: string) => void
  recentSearches?: string[]
}

export default function MobileSearchOverlay({
  isOpen,
  onClose,
  onSearch,
  recentSearches = [],
}: MobileSearchOverlayProps) {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsFocused(true)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery)
      setQuery("")
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background md:hidden animate-in fade-in slide-in-from-bottom-full duration-300">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search locations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0"
          />
          <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {recentSearches.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Recent</p>
              {recentSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => handleSearch(search)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
