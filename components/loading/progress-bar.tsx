"use client"

import { useEffect, useState } from "react"

interface ProgressBarProps {
  isLoading: boolean
}

export function ProgressBar({ isLoading }: ProgressBarProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      setProgress(100)
      const timer = setTimeout(() => setProgress(0), 500)
      return () => clearTimeout(timer)
    }

    setProgress(10)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev
        return prev + Math.random() * 30
      })
    }, 200)

    return () => clearInterval(interval)
  }, [isLoading])

  if (progress === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
      <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
    </div>
  )
}
