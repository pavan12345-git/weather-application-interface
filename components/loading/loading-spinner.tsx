interface LoadingSpinnerProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingSpinner({ message = "Fetching weather data...", size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className={`relative ${sizeClasses[size]}`}>
        <div className="absolute inset-0 rounded-full border-4 border-muted" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-xl">☁️</div>
      </div>
      {message && <p className={`text-muted-foreground ${textSizeClasses[size]}`}>{message}</p>}
    </div>
  )
}
