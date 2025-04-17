"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useLayout } from "@/context/layout-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, ChevronLeft, LogOut, Menu } from "lucide-react"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { sidebarExpanded, toggleSidebar, isMobile } = useLayout()

  // Funktion, um den aktuellen Seitentitel zu ermitteln
  const getPageTitle = () => {
    if (pathname === "/") return "Hauptseite"
    if (pathname.startsWith("/teams")) return "Teams"
    if (pathname.startsWith("/tournaments")) return "Turniere"
    if (pathname.startsWith("/blanketts")) return "Blanketts"
    if (pathname.startsWith("/users")) return "Benutzerverwaltung"
    if (pathname.startsWith("/setup")) return "Setup"
    if (pathname.startsWith("/spieler")) return "Spieler"
    if (pathname.startsWith("/admin/dashboard")) return "Admin Dashboard"
    return "Resadiye Cup"
  }

  // Funktion, um zu prüfen, ob wir uns auf einer Unterseite befinden
  const isSubPage = () => {
    const segments = pathname.split("/").filter(Boolean)
    return segments.length > 1
  }

  // Funktion, um den Pfad zur übergeordneten Seite zu ermitteln
  const getParentPath = () => {
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length <= 1) return "/"
    return `/${segments[0]}`
  }

  const getInitials = () => {
    if (!user) return "G"
    return `${user.vorname.charAt(0)}${user.nachname.charAt(0)}`
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* Desktop Toggle Button - nur anzeigen, wenn nicht mobil */}
          {!isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden lg:flex">
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Zurück-Button für Unterseiten */}
          {isSubPage() && (
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href={getParentPath()}>
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
          )}

          {/* Seitentitel */}
          <h1 className={cn("text-xl font-semibold", isMobile ? "ml-8 lg:ml-0" : "")}>{getPageTitle()}</h1>
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profilbild_url || ""} alt={user.vorname} />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{`${user.vorname} ${user.nachname}`}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Abmelden</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/login">Anmelden</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
