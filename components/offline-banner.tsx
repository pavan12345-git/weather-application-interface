"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (isOnline || isDismissed) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-50 dark:bg-yellow-950 border-b border-yellow-200 dark:border-yellow-800 z-40">
      <div className="flex items-center justify-between gap-4 px-4 py-3 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-xl">📡❌</span>
          <div>
            <p className="font-semibold text-yellow-900 dark:text-yellow-100">You're offline</p>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">Showing cached data</p>
          </div>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
          aria-label="Dismiss offline banner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
