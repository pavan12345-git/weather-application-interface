export function WeatherCardSkeleton() {
  return (
    <div className="space-y-4 p-6 rounded-lg bg-card border border-border">
      {/* Icon skeleton */}
      <div className="flex items-center justify-between">
        <div className="w-24 h-24 rounded-full bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-6 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-4 pt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            <div className="h-6 w-20 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ForecastSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-32 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-lg bg-card border border-border space-y-3"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full mx-auto" />
            <div className="h-4 w-12 bg-muted animate-pulse rounded mx-auto" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded mx-auto" />
            <div className="h-3 w-14 bg-muted animate-pulse rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function LocationGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-4 rounded-lg bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-5 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="w-12 h-12 bg-muted animate-pulse rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-1">
                <div className="h-3 w-10 bg-muted animate-pulse rounded" />
                <div className="h-4 w-12 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
