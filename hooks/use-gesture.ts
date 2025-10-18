"use client"

import { useEffect, useRef } from "react"

interface GestureHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onLongPress?: () => void
}

const SWIPE_THRESHOLD = 50
const LONG_PRESS_DURATION = 500

export function useGesture(handlers: GestureHandlers) {
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const startTimeRef = useRef(0)
  const longPressTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      startXRef.current = e.touches[0].clientX
      startYRef.current = e.touches[0].clientY
      startTimeRef.current = Date.now()

      longPressTimeoutRef.current = setTimeout(() => {
        handlers.onLongPress?.()
      }, LONG_PRESS_DURATION)
    }

    const handleTouchEnd = (e: TouchEvent) => {
      clearTimeout(longPressTimeoutRef.current)

      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const diffX = startXRef.current - endX
      const diffY = startYRef.current - endY

      if (Math.abs(diffX) > SWIPE_THRESHOLD) {
        if (diffX > 0) {
          handlers.onSwipeLeft?.()
        } else {
          handlers.onSwipeRight?.()
        }
      }

      if (Math.abs(diffY) > SWIPE_THRESHOLD) {
        if (diffY > 0) {
          handlers.onSwipeUp?.()
        } else {
          handlers.onSwipeDown?.()
        }
      }
    }

    document.addEventListener("touchstart", handleTouchStart)
    document.addEventListener("touchend", handleTouchEnd)

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [handlers])
}
