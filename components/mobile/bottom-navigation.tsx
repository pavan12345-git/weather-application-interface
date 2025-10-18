"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, MapPin, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export default function BottomNavigation() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/forecast", label: "Forecast", icon: Calendar },
    { href: "/locations", label: "Locations", icon: MapPin },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background border-t border-border">
      <div className="flex items-center justify-around h-20 safe-area-inset-bottom">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200",
                isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
