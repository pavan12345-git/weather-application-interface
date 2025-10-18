"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface GeolocationPromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAllow: () => void
}

export function GeolocationPrompt({ open, onOpenChange, onAllow }: GeolocationPromptProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span>📍</span>
            Enable Location Access?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Allow access to your location to get weather for your current area.</p>
            <p className="text-sm text-muted-foreground">
              We'll only use this to fetch weather data and won't store your location.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel>Not Now</AlertDialogCancel>
          <AlertDialogAction onClick={onAllow} className="bg-primary hover:bg-primary/90">
            Allow
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
