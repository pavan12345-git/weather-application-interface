"use client"

import { Button } from "@/components/ui/button"

interface PermissionDeniedProps {
  onManualEntry?: () => void
}

export function PermissionDenied({ onManualEntry }: PermissionDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-4">
      <div className="text-5xl">🚫📍</div>
      <h3 className="text-xl font-semibold text-foreground">Location Access Denied</h3>
      <p className="text-muted-foreground text-center max-w-sm">
        Enable location access in your browser settings to use location-based features.
      </p>
      {onManualEntry && (
        <Button onClick={onManualEntry} className="mt-4 bg-primary hover:bg-primary/90">
          Enter Location Manually
        </Button>
      )}
    </div>
  )
}
