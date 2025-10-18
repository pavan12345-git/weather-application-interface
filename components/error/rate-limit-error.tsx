"use client"

import { useEffect, useState } from "react"

interface RateLimitErrorProps {
  retryAfter?: number
}

export function RateLimitError({ retryAfter = 60 }: RateLimitErrorProps) {
  const [countdown, setCountdown] = useState(retryAfter)

  useEffect(() => {
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-4">
      <div className="text-5xl">⏳</div>
      <h3 className="text-xl font-semibold text-foreground">Too Many Requests</h3>
      <p className="text-muted-foreground text-center max-w-sm">
        You've made too many requests. Please wait a moment before trying again.
      </p>
      <div className="text-2xl font-bold text-primary pt-4">{countdown}s</div>
    </div>
  )
}
