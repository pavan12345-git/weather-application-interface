"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomSheetModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export default function BottomSheetModal({ isOpen, onClose, title, children, className }: BottomSheetModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)

  useEffect(() => {
    if (!isOpen) return

    const handleTouchStart = (e: TouchEvent) => {
      startYRef.current = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY
      const diff = currentY - startYRef.current

      if (diff > 50 && sheetRef.current) {
        onClose()
      }
    }

    document.addEventListener("touchstart", handleTouchStart)
    document.addEventListener("touchmove", handleTouchMove)

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50 animate-in fade-in duration-200" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl animate-in slide-in-from-bottom duration-300",
          className,
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 rounded-full bg-muted" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="font-semibold">{title}</h2>
            <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4 pb-8">{children}</div>
      </div>
    </div>
  )
}
