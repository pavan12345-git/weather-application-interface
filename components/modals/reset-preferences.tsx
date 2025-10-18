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

interface ResetPreferencesProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ResetPreferences({ open, onOpenChange, onConfirm }: ResetPreferencesProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset All Preferences to Default?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>This will reset all your settings to their default values.</p>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              <li>Temperature unit: Fahrenheit</li>
              <li>Theme: System</li>
              <li>Date format: MM/DD/YYYY</li>
              <li>Time format: 12-hour</li>
              <li>Notifications: Enabled</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
            Reset Preferences
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
