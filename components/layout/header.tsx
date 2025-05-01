"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Bell, User, LogOut, ChevronDown, Settings } from "lucide-react"
import { useLayout } from "@/context/layout-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Hilfsfunktion zum Generieren des Seitentitels basierend auf dem Pfad
function getPageTitle(pathname: string): string {
  const pathSegments = pathname.split("/").filter(Boolean)

  if (pathSegments.length === 0) {
    return "Hauptseite"
  }

  const mainPath = pathSegments[0]
  const pathTitles: Record<string, string> = {
    tournaments: "Turniere",
    teams: "Mannschaften",
    spieler: "Spieler",
    spiele: "Spielplan",
    blanketts: "Blanketts",
    users: "Benutzer",
    admin: "Administration",
    profile: "Profil",
  }

  return pathTitles[mainPath] || mainPath.charAt(0).toUpperCase() + mainPath.slice(1)
}

export function Header() {
  const { toggleSidebar } = useLayout()
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [pageTitle, setPageTitle] = useState("Hauptseite")

  useEffect(() => {
    setMounted(true)
    setPageTitle(getPageTitle(pathname))
  }, [pathname])

  if (!mounted) return null

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : user?.vorname && user?.nachname
      ? `${user.vorname[0]}${user.nachname[0]}`.toUpperCase()
      : "GU"

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-gray-950 border-gray-800 px-4 shadow-sm">
      <div className="flex items-center">
        <Button
          size="icon"
          onClick={toggleSidebar}
          className="mr-2 lg:hidden text-gray-300 hover:text-white hover:bg-gray-800"
          aria-label="Menü öffnen"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold text-white">{pageTitle}</h1>
      </div>

      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <Button
              size="icon"
              aria-label="Benachrichtigungen"
              className="relative text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-gray-800">
                  <Avatar className="h-8 w-8 border border-gray-700">
                    <AvatarImage src={user.profilbild_url || ""} alt={user.email || user.vorname || "Benutzer"} />
                    <AvatarFallback className="bg-blue-600 text-white">{userInitials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block">
                    {user.vorname && user.nachname ? `${user.vorname} ${user.nachname}` : user.email}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-700">
                <DropdownMenuLabel className="text-gray-300">Mein Konto</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem asChild className="text-gray-200 focus:bg-gray-800 focus:text-white">
                  <Link href="/profile" className="flex w-full cursor-pointer items-center">
                    <User className="mr-2 h-4 w-4 text-blue-400" />
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>
                {user.rolle === "Admin" && (
                  <DropdownMenuItem asChild className="text-gray-200 focus:bg-gray-800 focus:text-white">
                    <Link href="/admin/dashboard" className="flex w-full cursor-pointer items-center">
                      <Settings className="mr-2 h-4 w-4 text-blue-400" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem onClick={signOut} className="text-red-400 focus:bg-gray-800 focus:text-red-300">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Abmelden</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/login">Anmelden</Link>
          </Button>
        )}
      </div>
    </header>
  )
}
