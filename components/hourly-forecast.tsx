"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface HourlyForecastProps {
  forecast: Array<{
    time: string
    temp: number
    icon: string
  }>
  tempUnit: "C" | "F"
  convertTemp: (temp: number) => number
}

export default function HourlyForecast({ forecast, tempUnit, convertTemp }: HourlyForecastProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">24-Hour Forecast</h3>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-4 scroll-smooth"
          style={{ scrollBehavior: "smooth" }}
        >
          {forecast.map((hour, index) => (
            <Card
              key={index}
              className="flex-shrink-0 w-24 p-4 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-lg transition-shadow"
            >
              <p className="text-sm font-semibold text-muted-foreground">{hour.time}</p>
              <p className="text-2xl">{hour.icon}</p>
              <p className="text-lg font-bold">
                {convertTemp(hour.temp)}°{tempUnit}
              </p>
            </Card>
          ))}
        </div>

        {/* Scroll buttons */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
