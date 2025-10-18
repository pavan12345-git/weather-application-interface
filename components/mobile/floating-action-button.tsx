"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FloatingActionButtonProps {
  onClick: () => void
  className?: string
}

export default function FloatingActionButton({ onClick, className }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        "fixed bottom-24 right-4 md:hidden z-40 w-14 h-14 rounded-full shadow-lg hover:shadow-xl animate-pulse-slow",
        className,
      )}
    >
      <Plus className="w-6 h-6" />
    </Button>
  )
}
