"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Trophy,
  Users,
  UserCog,
  Settings,
  Menu,
  LogOut,
  Home,
  FileText,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

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
    { name: "Hauptseite", href: "/", icon: Home, roles: ["Admin", "Trainer", "Spieler"] },
    { name: "Teams", href: "/teams", icon: Users, roles: ["Admin", "Trainer", "Spieler"] },
    { name: "Spieler", href: "/spieler", icon: User, roles: ["Admin", "Trainer", "Spieler"] },
    { name: "Turniere", href: "/tournaments", icon: Trophy, roles: ["Admin", "Trainer", "Spieler"] },
    { name: "Blanketts", href: "/blanketts", icon: FileText, roles: ["Admin"] },
    { name: "Benutzerverwaltung", href: "/users", icon: UserCog, roles: ["Admin"] },
    { name: "Setup", href: "/setup", icon: Settings, roles: ["Admin"] },
    { name: "Dashboard", href: "/admin/dashboard", icon: Settings, roles: ["Admin"] },
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

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const sidebarContent = (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-card/95 backdrop-blur-sm transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-64",
        className,
      )}
    >
      <div className="flex h-16 items-center border-b px-4">
        {!isCollapsed ? (
          <Link href="/" className="flex items-center space-x-2">
            <img src="/abstract-geometric-logo.png" alt="Logo" className="h-8 w-8" />
            <span className="text-lg font-semibold">Resadiye Cup</span>
          </Link>
        ) : (
          <Link href="/" className="mx-auto">
            <img src="/abstract-geometric-logo.png" alt="Logo" className="h-8 w-8" />
          </Link>
        )}
      </div>

      <ScrollArea className="flex-1 h-[calc(100vh-4rem-4rem)]">
        <nav className="flex flex-col gap-1 p-2">
          {filteredNavigation.map((item) => (
            <Button
              key={item.name}
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className={cn(
                "justify-start h-10",
                isCollapsed ? "w-10 p-0 mx-auto" : "px-3",
                isActive(item.href) && "bg-secondary/50",
              )}
              asChild
            >
              <Link href={item.href}>
                <item.icon className={cn("h-5 w-5", isCollapsed ? "" : "mr-3")} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            </Button>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t p-4 h-16 flex items-center justify-between">
        {user ? (
          <>
            {!isCollapsed ? (
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={user.profilbild_url || ""} alt={user.vorname} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate max-w-[120px]">{`${user.vorname} ${user.nachname}`}</span>
                  <span className="text-xs text-muted-foreground">{user.rolle}</span>
                </div>
                <Button variant="ghost" size="icon" className="ml-2" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <Avatar className="h-8 w-8 mb-1">
                  <AvatarImage src={user.profilbild_url || ""} alt={user.vorname} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            {!isCollapsed ? (
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Anmelden</Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="icon" className="mx-auto">
                <Link href="/login">
                  <LogOut className="h-4 w-4 rotate-180" />
                </Link>
              </Button>
            )}
          </>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCollapse}
        className="absolute top-4 -right-4 h-8 w-8 rounded-full border bg-background shadow-md hidden lg:flex"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
    </div>
  )

  // Mobile view uses a sheet
  if (isMobile) {
    return (
      <>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden fixed left-4 top-4 z-40"
              onClick={() => setIsOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px]">
            <div className="flex flex-col h-full">
              <div className="w-full flex h-full flex-col border-r bg-card/95 backdrop-blur-sm">
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
                        onClick={() => setIsOpen(false)}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-5 w-5 mr-3" />
                          <span>{item.name}</span>
                        </Link>
                      </Button>
                    ))}
                  </nav>
                </ScrollArea>

                <div className="border-t p-4 h-16 flex items-center justify-between">
                  {user ? (
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarImage src={user.profilbild_url || ""} alt={user.vorname} />
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate max-w-[120px]">{`${user.vorname} ${user.nachname}`}</span>
                        <span className="text-xs text-muted-foreground">{user.rolle}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="ml-2" onClick={() => signOut()}>
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/login">Anmelden</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Desktop view
  return <div className="fixed left-0 top-0 z-40 h-screen">{sidebarContent}</div>
}
