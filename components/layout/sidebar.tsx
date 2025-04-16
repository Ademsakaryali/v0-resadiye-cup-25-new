"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Users, UserCog, Settings, Home, FileText, User, GamepadIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`)

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home, roles: ["Admin", "Trainer", "Spieler"] },
    { name: "Teams", href: "/teams", icon: Users, roles: ["Admin", "Trainer", "Spieler"] },
    { name: "Spieler", href: "/spieler", icon: User, roles: ["Admin", "Trainer", "Spieler"] },
    { name: "Turniere", href: "/tournaments", icon: Trophy, roles: ["Admin", "Trainer", "Spieler"] },
    { name: "Spiele", href: "/spiele", icon: GamepadIcon, roles: ["Admin", "Trainer", "Spieler"] },
    { name: "Blanketts", href: "/blanketts", icon: FileText, roles: ["Admin"] },
    { name: "Benutzerverwaltung", href: "/users", icon: UserCog, roles: ["Admin"] },
    { name: "Setup", href: "/setup", icon: Settings, roles: ["Admin"] },
  ]

  // Filtere die Navigation basierend auf der Benutzerrolle
  const filteredNavigation = navigation.filter((item) => {
    if (!user) return item.roles.includes("Spieler") // Für nicht angemeldete Benutzer
    return item.roles.includes(user.rolle)
  })

  const getInitials = () => {
    if (!user) return "G"
    return `${user.vorname.charAt(0)}${user.nachname.charAt(0)}`
  }

  return (
    <div
      className={cn(
        "w-64 h-screen flex-shrink-0 fixed left-0 top-0 z-40 bg-card/95 backdrop-blur-sm border-r",
        className,
      )}
    >
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/" className="flex items-center space-x-2">
          <img src="/abstract-geometric-logo.png" alt="Logo" className="h-8 w-8" />
          <span className="text-lg font-semibold">Resadiye Cup</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 h-[calc(100vh-4rem-4rem)]">
        <nav className="flex flex-col gap-1 p-2">
          {filteredNavigation.map((item) => (
            <Button
              key={item.name}
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className={cn("justify-start h-10 px-3", isActive(item.href) && "bg-secondary/50")}
              asChild
            >
              <Link href={item.href}>
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.name}</span>
              </Link>
            </Button>
          ))}
        </nav>
      </ScrollArea>

      {user ? (
        <div className="border-t p-4 h-16">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-3">
              <AvatarImage src={user.profilbild_url || ""} alt={user.vorname} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{`${user.vorname} ${user.nachname}`}</span>
              <span className="text-xs text-muted-foreground">{user.rolle}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t p-4 h-16">
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Anmelden</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
