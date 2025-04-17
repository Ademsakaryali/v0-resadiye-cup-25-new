"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useLayout } from "@/context/layout-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  Users,
  UserCog,
  Menu,
  ChevronLeft,
  LogOut,
  FileText,
  Shield,
  Trophy,
  UserCircle,
  Users2,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { sidebarExpanded, toggleSidebar, isMobile } = useLayout()
  const [isOpen, setIsOpen] = useState(false)

  // Schließe die mobile Sidebar, wenn sich der Pfad ändert
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [pathname, isMobile])

  const toggleMobileSidebar = () => {
    setIsOpen(!isOpen)
  }

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  const menuItems = [
    {
      title: "Hauptseite",
      icon: LayoutDashboard,
      path: "/",
      roles: ["Admin", "Trainer", "Spieler"],
    },
    {
      title: "Teams",
      icon: Users,
      path: "/teams",
      roles: ["Admin", "Trainer", "Spieler"],
    },
    {
      title: "Spieler",
      icon: UserCircle,
      path: "/spieler",
      roles: ["Admin", "Trainer"],
    },
    {
      title: "Spiele",
      icon: Users2,
      path: "/spiele",
      roles: ["Admin", "Trainer", "Spieler"],
    },
    {
      title: "Turniere",
      icon: Trophy,
      path: "/tournaments",
      roles: ["Admin", "Trainer", "Spieler"],
    },
    {
      title: "Blanketts",
      icon: FileText,
      path: "/blanketts",
      roles: ["Admin"],
    },
    {
      title: "Benutzer",
      icon: UserCog,
      path: "/users",
      roles: ["Admin"],
    },
    {
      title: "Admin Dashboard",
      icon: Shield,
      path: "/admin/dashboard",
      roles: ["Admin"],
    },
  ]

  // Filtere Menüpunkte basierend auf der Benutzerrolle
  const filteredMenuItems = menuItems.filter((item) => {
    if (!user) return item.roles.includes("Spieler") // Zeige grundlegende Menüpunkte für nicht angemeldete Benutzer
    return item.roles.includes(user.rolle)
  })

  // Füge "Mein Team" für Trainer hinzu
  if (user?.rolle === "Trainer" && user?.team_id) {
    filteredMenuItems.push({
      title: "Mein Team",
      icon: Users,
      path: `/teams/${user.team_id}`,
      roles: ["Trainer"],
    })
  }

  return (
    <>
      {/* Mobile Menü-Button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-background/80 backdrop-blur-sm"
          onClick={toggleMobileSidebar}
        >
          {isOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay für Mobile */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={toggleMobileSidebar}
        ></div>
      )}

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "h-screen flex-shrink-0 transition-all duration-300 ease-in-out",
          sidebarExpanded ? "w-64" : "w-16",
          isMobile && "hidden lg:block",
        )}
      >
        <div
          className={cn(
            "fixed top-0 left-0 z-40 h-full bg-card/95 backdrop-blur-sm border-r border-border/40 transition-all duration-300 ease-in-out",
            sidebarExpanded ? "w-64" : "w-16",
          )}
        >
          <div className="flex flex-col h-full">
            {/* Logo und Titel */}
            <div className="flex items-center justify-between p-4 border-b border-border/40 h-14">
              <Link href="/" className="flex items-center gap-2">
                <img src="/abstract-geometric-logo.png" alt="Logo" className="h-6 w-6" />
                {sidebarExpanded && <span className="font-bold text-lg">Resadiye Cup</span>}
              </Link>
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden lg:flex">
                <ChevronLeft className={cn("h-5 w-5 transition-transform", !sidebarExpanded && "rotate-180")} />
              </Button>
            </div>

            {/* Menüpunkte */}
            <ScrollArea className="flex-1 py-2">
              <nav className="space-y-1 px-2">
                {filteredMenuItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      "flex items-center gap-3 rounded-md text-sm transition-colors",
                      sidebarExpanded ? "px-3 py-2" : "justify-center py-2",
                      isActive(item.path) ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50",
                    )}
                    title={!sidebarExpanded ? item.title : undefined}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarExpanded && <span>{item.title}</span>}
                  </Link>
                ))}
              </nav>
            </ScrollArea>

            {/* Benutzerbereich */}
            <div className="border-t border-border/40 p-4">
              {user ? (
                <div className={cn("flex items-center", sidebarExpanded ? "justify-between" : "justify-center")}>
                  {sidebarExpanded ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {user.profilbild_url ? (
                            <img
                              src={user.profilbild_url || "/placeholder.svg"}
                              alt={`${user.vorname} ${user.nachname}`}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <UserCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate max-w-[140px]">
                            {user.vorname} {user.nachname}
                          </span>
                          <span className="text-xs text-muted-foreground">{user.rolle}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut} title="Abmelden">
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={signOut} title="Abmelden">
                      <LogOut className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className={cn(sidebarExpanded ? "w-full" : "w-8 h-8 p-0 mx-auto")}
                  title={!sidebarExpanded ? "Anmelden" : undefined}
                >
                  <Link href="/login">{sidebarExpanded ? "Anmelden" : <UserCircle className="h-5 w-5" />}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-card/95 backdrop-blur-sm border-r border-border/40 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:hidden",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo und Titel */}
          <div className="flex items-center justify-between p-4 border-b border-border/40 h-14">
            <Link href="/" className="flex items-center gap-2">
              <img src="/abstract-geometric-logo.png" alt="Logo" className="h-6 w-6" />
              <span className="font-bold text-lg">Resadiye Cup</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={toggleMobileSidebar}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>

          {/* Menüpunkte */}
          <ScrollArea className="flex-1 py-2">
            <nav className="space-y-1 px-2">
              {filteredMenuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={toggleMobileSidebar}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive(item.path) ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>
          </ScrollArea>

          {/* Benutzerbereich */}
          <div className="border-t border-border/40 p-4">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {user.profilbild_url ? (
                      <img
                        src={user.profilbild_url || "/placeholder.svg"}
                        alt={`${user.vorname} ${user.nachname}`}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate max-w-[140px]">
                      {user.vorname} {user.nachname}
                    </span>
                    <span className="text-xs text-muted-foreground">{user.rolle}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut} title="Abmelden">
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
      </aside>
    </>
  )
}
