"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startYRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startYRef.current = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (container.scrollTop !== 0 || isRefreshing) return

      const currentY = e.touches[0].clientY
      const distance = currentY - startYRef.current

      if (distance > 0) {
        setPullDistance(Math.min(distance, 100))
      }
    }

    const handleTouchEnd = async () => {
      if (pullDistance > 60 && !isRefreshing) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
        }
      }
      setPullDistance(0)
    }

    container.addEventListener("touchstart", handleTouchStart)
    container.addEventListener("touchmove", handleTouchMove)
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [pullDistance, isRefreshing, onRefresh])

  return (
    <div ref={containerRef} className="relative overflow-y-auto">
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance / 100,
        }}
      >
        {isRefreshing ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        ) : (
          <span className="text-sm text-muted-foreground">
            {pullDistance > 60 ? "Release to refresh" : "Pull to refresh"}
          </span>
        )}
      </div>

      <div style={{ transform: `translateY(${pullDistance}px)` }} className="transition-transform duration-200">
        {children}
      </div>
    </div>
  )
}
