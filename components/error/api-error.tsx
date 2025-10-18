"use client"

import { Button } from "@/components/ui/button"

interface ApiErrorProps {
  onRetry?: () => void
  onGoBack?: () => void
  message?: string
}

export function ApiError({ onRetry, onGoBack, message = "Unable to fetch weather data" }: ApiErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-4">
      <div className="text-5xl">☁️❌</div>
      <h3 className="text-xl font-semibold text-foreground">{message}</h3>
      <p className="text-muted-foreground text-center max-w-sm">
        We encountered an issue while fetching the weather data. Please try again or go back.
      </p>
      <div className="flex gap-3 pt-4">
        {onRetry && (
          <Button onClick={onRetry} className="bg-primary hover:bg-primary/90">
            Retry
          </Button>
        )}
        {onGoBack && (
          <Button onClick={onGoBack} variant="outline">
            Go Back
          </Button>
        )}
      </div>
    </div>
  )
}
