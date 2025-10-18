"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SwipeableCardsProps {
  items: React.ReactNode[]
  onIndexChange?: (index: number) => void
}

export default function SwipeableCards({ items, onIndexChange }: SwipeableCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    setDragStart("touches" in e ? e.touches[0].clientX : e.clientX)
  }

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return

    const dragEnd = "changedTouches" in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX
    const diff = dragStart - dragEnd

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < items.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      }
    }

    setIsDragging(false)
  }

  useEffect(() => {
    onIndexChange?.(currentIndex)
  }, [currentIndex, onIndexChange])

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg"
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {items.map((item, index) => (
            <div key={index} className="w-full flex-shrink-0">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-200",
              index === currentIndex ? "bg-primary w-6" : "bg-muted",
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <div className="hidden md:flex items-center justify-between absolute inset-0 pointer-events-none">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          className="pointer-events-auto p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrentIndex(Math.min(items.length - 1, currentIndex + 1))}
          className="pointer-events-auto p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
