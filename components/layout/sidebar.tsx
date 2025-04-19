"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useLayout } from "@/context/layout-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
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
  Settings,
  Home,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut, trainerTeam } = useAuth()
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

  // Öffentliche Menüpunkte für alle Benutzer
  const publicMenuItems = [
    {
      title: "Hauptseite",
      icon: Home,
      path: "/",
    },
    {
      title: "Teams",
      icon: Users,
      path: "/teams",
    },
    {
      title: "Spieler",
      icon: UserCircle,
      path: "/spieler",
    },
    {
      title: "Spiele",
      icon: Users2,
      path: "/spiele",
    },
    {
      title: "Turniere",
      icon: Trophy,
      path: "/tournaments",
    },
  ]

  // Menüpunkte für Trainer
  const trainerMenuItems =
    user?.rolle === "Trainer"
      ? [
          {
            title: "Mein Team",
            icon: Users,
            path: `/teams/${trainerTeam?.id || user?.team_id}`,
            logo: trainerTeam?.logo_url,
          },
          {
            title: "Mein Profil",
            icon: UserCircle,
            path: "/profile",
          },
        ]
      : []

  // Menüpunkte für Administratoren
  const adminMenuItems =
    user?.rolle === "Admin"
      ? [
          {
            title: "Admin Dashboard",
            icon: Shield,
            path: "/admin/dashboard",
          },
          {
            title: "Benutzer",
            icon: UserCog,
            path: "/users",
          },
          {
            title: "Blanketts",
            icon: FileText,
            path: "/blanketts",
          },
          {
            title: "Einstellungen",
            icon: Settings,
            path: "/settings",
          },
        ]
      : []

  // Rendert einen Menüpunkt
  const renderMenuItem = (item) => (
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
      {item.logo && sidebarExpanded ? (
        <div className="h-5 w-5 rounded-full overflow-hidden flex-shrink-0">
          <img src={item.logo || "/placeholder.svg"} alt={item.title} className="h-full w-full object-cover" />
        </div>
      ) : (
        <item.icon className="h-5 w-5 flex-shrink-0" />
      )}
      {sidebarExpanded && <span>{item.title}</span>}
    </Link>
  )

  // Rendert eine Gruppe von Menüpunkten mit optionalem Titel
  const renderMenuGroup = (items, title) => {
    if (items.length === 0) return null

    return (
      <div className="space-y-1">
        {title && sidebarExpanded && (
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
        )}
        {items.map(renderMenuItem)}
      </div>
    )
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
              <nav className="space-y-4 px-2">
                {/* Öffentliche Menüpunkte */}
                {renderMenuGroup(publicMenuItems)}

                {/* Trainer-Menüpunkte */}
                {trainerMenuItems.length > 0 && (
                  <>
                    <Separator className={sidebarExpanded ? "mx-3" : "mx-auto w-4"} />
                    {renderMenuGroup(trainerMenuItems, "Trainer-Bereich")}
                  </>
                )}

                {/* Admin-Menüpunkte */}
                {adminMenuItems.length > 0 && (
                  <>
                    <Separator className={sidebarExpanded ? "mx-3" : "mx-auto w-4"} />
                    {renderMenuGroup(adminMenuItems, "Administration")}
                  </>
                )}
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
            <nav className="space-y-4 px-2">
              {/* Öffentliche Menüpunkte */}
              {renderMenuGroup(publicMenuItems)}

              {/* Trainer-Menüpunkte */}
              {trainerMenuItems.length > 0 && (
                <>
                  <Separator className="mx-3" />
                  {renderMenuGroup(trainerMenuItems, "Trainer-Bereich")}
                </>
              )}

              {/* Admin-Menüpunkte */}
              {adminMenuItems.length > 0 && (
                <>
                  <Separator className="mx-3" />
                  {renderMenuGroup(adminMenuItems, "Administration")}
                </>
              )}
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
