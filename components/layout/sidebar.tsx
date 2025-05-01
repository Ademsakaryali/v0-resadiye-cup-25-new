"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { useLayout } from "@/context/layout-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getSupabaseClient } from "@/lib/supabase/client"
import {
  Home,
  Users,
  Trophy,
  Calendar,
  Settings,
  Menu,
  X,
  FileText,
  User,
  Shield,
  UserPlus,
  ChevronRight,
  Table,
  BarChart2,
} from "lucide-react"

// Definiere die Navigationsstruktur für alle Benutzer
const publicNavigationItems = [
  {
    title: "Hauptseite",
    href: "/",
    icon: Home,
  },
  {
    title: "Turniere",
    href: "/tournaments",
    icon: Trophy,
  },
  {
    title: "Teams",
    href: "/teams",
    icon: Shield,
  },
  {
    title: "Spieler",
    href: "/spieler",
    icon: Users,
  },
  // Statistiken-Menüpunkt entfernt
]

// Definiere die Navigationsstruktur für Spieler
const playerNavigationItems = [
  {
    title: "Profil",
    href: "/profile",
    icon: User,
  },
]

// Definiere die Navigationsstruktur für Trainer (ohne "Mein Team" - wird dynamisch hinzugefügt)
// "Blanketts" wurde für Trainer entfernt
const trainerNavigationItems = [
  {
    title: "Profil",
    href: "/profile",
    icon: User,
  },
  // Blanketts-Menüpunkt für Trainer entfernt
]

// Definiere die Navigationsstruktur für Administratoren
const adminNavigationItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: Settings,
  },
  {
    title: "Profil",
    href: "/profile",
    icon: User,
  },
  {
    title: "Benutzer",
    href: "/users",
    icon: UserPlus,
  },
  {
    title: "Blanketts",
    href: "/admin/blanketts",
    icon: FileText,
  },
]

// Definiere die Navigationsstruktur für Turnier-spezifische Navigation
const getTournamentNavigationItems = (tournamentId: string) => [
  {
    title: "Turnierübersicht",
    href: `/tournaments/${tournamentId}`,
    icon: Trophy,
  },
  {
    title: "Turniermannschaften",
    href: `/tournaments/${tournamentId}/teams`,
    icon: Shield,
  },
  {
    title: "Turnierspieler",
    href: `/tournaments/${tournamentId}/players`,
    icon: Users,
  },
  {
    title: "Turnierstatistiken",
    href: `/tournaments/${tournamentId}/statistics`,
    icon: BarChart2,
  },
  {
    title: "Tabellen",
    href: `/tournaments/${tournamentId}/standings`,
    icon: Table,
  },
  {
    title: "Spiele",
    href: `/tournaments/${tournamentId}/schedule`,
    icon: Calendar,
  },
]

type NavItemProps = {
  item: {
    title: string
    href: string
    icon: React.ElementType
  }
  isActive: boolean
  onClick?: () => void
}

// Extrahiere NavItem als separate Komponente für bessere Wartbarkeit
const NavItem = ({ item, isActive, onClick }: NavItemProps) => {
  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors",
          isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white",
        )}
        onClick={onClick}
      >
        <item.icon className="mr-3 h-5 w-5" />
        <span>{item.title}</span>
        {isActive && <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />}
      </Link>
    </li>
  )
}

// Komponente für einen Navigationsbereich mit Titel
const NavSection = ({
  title,
  items,
  pathname,
  onClick,
}: {
  title: string
  items: Array<{
    title: string
    href: string
    icon: React.ElementType
  }>
  pathname: string
  onClick?: () => void
}) => {
  if (items.length === 0) return null

  return (
    <div className="mt-6 pt-6 border-t border-gray-800">
      <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return <NavItem key={item.href} item={item} isActive={isActive} onClick={onClick} />
        })}
      </ul>
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const params = useParams()
  const { isSidebarOpen, toggleSidebar } = useLayout()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null)
  const [trainerTeam, setTrainerTeam] = useState<{ id: string; name: string } | null>(null)
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)

  // Funktion zum Abrufen des Teams des Trainers
  const fetchTrainerTeam = async () => {
    if (user?.rolle !== "Trainer" || !user?.id) return

    try {
      setIsLoadingTeam(true)
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("teams")
        .select("id, name")
        .eq("trainer_id", user.id)
        .eq("ist_aktiv", true)
        .single()

      if (error) {
        console.error("Fehler beim Abrufen des Trainer-Teams:", error)
        return
      }

      if (data) {
        setTrainerTeam(data)
      }
    } catch (error) {
      console.error("Fehler beim Abrufen des Trainer-Teams:", error)
    } finally {
      setIsLoadingTeam(false)
    }
  }

  useEffect(() => {
    setMounted(true)

    // Prüfe, ob wir uns auf einer Turnierseite befinden
    if (params && params.id && pathname.includes("/tournaments/")) {
      setActiveTournamentId(params.id as string)
    } else {
      setActiveTournamentId(null)
    }

    // Rufe das Team des Trainers ab, wenn der Benutzer ein Trainer ist
    if (user?.rolle === "Trainer") {
      fetchTrainerTeam()
    }
  }, [pathname, params, user])

  if (!mounted) return null

  // Generiere Turnier-Navigation, wenn wir auf einer Turnierseite sind
  const tournamentNavItems = activeTournamentId ? getTournamentNavigationItems(activeTournamentId) : []

  // Bestimme rollenspezifische Navigationsitems
  let roleSpecificItems: Array<{
    title: string
    href: string
    icon: React.ElementType
  }> = []
  let roleSectionTitle = ""

  if (user) {
    if (user.rolle === "Admin") {
      roleSpecificItems = adminNavigationItems
      roleSectionTitle = "Administrator"
    } else if (user.rolle === "Trainer") {
      // Kopiere die Basis-Navigationsitems für Trainer
      roleSpecificItems = [...trainerNavigationItems]

      // Füge "Mein Team" hinzu, wenn ein Team gefunden wurde
      if (trainerTeam) {
        roleSpecificItems.unshift({
          title: "Mein Team",
          href: `/teams/${trainerTeam.id}`,
          icon: Shield,
        })
      }

      roleSectionTitle = "Trainer"
    } else if (user.rolle === "Spieler") {
      roleSpecificItems = playerNavigationItems
      roleSectionTitle = "Spieler"
    }
  }

  const handleItemClick = () => {
    if (window.innerWidth < 1024) {
      toggleSidebar()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleSidebar} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out lg:relative lg:z-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-blue-400">Resadiye Cup</span>
          </Link>
          <Button
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
            aria-label={isSidebarOpen ? "Sidebar schließen" : "Sidebar öffnen"}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <nav className="px-2 py-4">
            {/* Öffentliche Navigation */}
            <ul className="space-y-1">
              {publicNavigationItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))
                return <NavItem key={item.href} item={item} isActive={isActive} onClick={handleItemClick} />
              })}
            </ul>

            {/* Rollenspezifische Navigation */}
            {roleSpecificItems.length > 0 && (
              <NavSection
                title={roleSectionTitle}
                items={roleSpecificItems}
                pathname={pathname}
                onClick={handleItemClick}
              />
            )}

            {/* Turnier-spezifische Navigation */}
            {tournamentNavItems.length > 0 && (
              <NavSection
                title="Turnier Navigation"
                items={tournamentNavItems}
                pathname={pathname}
                onClick={handleItemClick}
              />
            )}
          </nav>
        </ScrollArea>
      </aside>

      {/* Mobile Toggle Button */}
      <Button
        size="icon"
        onClick={toggleSidebar}
        className="fixed bottom-4 right-4 z-30 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg lg:hidden"
        aria-label={isSidebarOpen ? "Sidebar schließen" : "Sidebar öffnen"}
      >
        <Menu className="h-6 w-6" />
      </Button>
    </>
  )
}
