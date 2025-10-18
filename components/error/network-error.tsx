"use client"

import { Button } from "@/components/ui/button"

interface NetworkErrorProps {
  onRetry?: () => void
}

export function NetworkError({ onRetry }: NetworkErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-4">
      <div className="text-5xl">📡❌</div>
      <h3 className="text-xl font-semibold text-foreground">No Internet Connection</h3>
      <p className="text-muted-foreground text-center max-w-sm">
        You're offline. Check your connection and try again. Cached data may be available.
      </p>
      {onRetry && (
        <Button onClick={onRetry} className="mt-4 bg-primary hover:bg-primary/90">
          Try Again
        </Button>
      )}
    </div>
  )
}
