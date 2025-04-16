"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, ChevronLeft, LogOut } from "lucide-react"

export function Header() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

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
    <header className="h-16 border-b bg-card/95 backdrop-blur-sm fixed top-0 left-0 right-0 z-30 lg:left-64 lg:w-[calc(100%-16rem)] transition-all duration-300">
      <div className="flex h-full items-center justify-between px-6 lg:px-6">
        <div className="flex items-center">
          {isSubPage() && (
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href={getParentPath()}>
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <h1 className="text-xl font-semibold ml-8 lg:ml-0">{getPageTitle()}</h1>
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
