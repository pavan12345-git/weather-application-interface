"use client"

import { Button } from "@/components/ui/button"

interface LocationNotFoundProps {
  onBack?: () => void
}

export function LocationNotFound({ onBack }: LocationNotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-4">
      <div className="text-5xl">📍❓</div>
      <h3 className="text-xl font-semibold text-foreground">Location Not Found</h3>
      <p className="text-muted-foreground text-center max-w-sm">
        We couldn't find the location you're looking for. Try a different search term.
      </p>
      {onBack && (
        <Button onClick={onBack} variant="outline" className="mt-4 bg-transparent">
          Back to Search
        </Button>
      )}
    </div>
  )
}
