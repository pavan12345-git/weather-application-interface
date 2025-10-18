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

interface ClearCacheConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ClearCacheConfirmation({ open, onOpenChange, onConfirm }: ClearCacheConfirmationProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span>⚠️</span>
            Clear All Cached Data?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>This will remove all cached weather data and recent searches.</p>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              <li>Cached weather information</li>
              <li>Recent search history</li>
              <li>Saved preferences</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
            Clear Cache
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
