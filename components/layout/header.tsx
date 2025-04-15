"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
// Füge den Import für die Setup-Seite hinzu
import { Menu, X, Trophy, Users, UserCog, LogOut, Settings } from "lucide-react"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const isActive = (path: string) => pathname === path

  const navigation = [
    { name: "Turniere", href: "/", icon: Trophy },
    { name: "Teams", href: "/teams", icon: Users },
  ]

  // Nur für Admins sichtbar
  // Füge die Setup-Seite zum Admin-Menü hinzu
  const adminNavigation = [
    { name: "Benutzerverwaltung", href: "/users", icon: UserCog },
    { name: "Setup", href: "/setup", icon: Settings },
  ]

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  const getInitials = () => {
    if (!user) return "G"
    return `${user.vorname.charAt(0)}${user.nachname.charAt(0)}`
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-primary">Resadiye Cup</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  isActive(item.href)
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300"
                }`}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Link>
            ))}

            {user?.rolle === "Admin" &&
              adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    isActive(item.href)
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300"
                  }`}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              ))}
          </nav>

          <div className="hidden md:flex items-center">
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
              <Link href="/login">
                <Button variant="default">Anmelden</Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">Menü öffnen</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive(item.href)
                    ? "border-primary text-primary bg-primary-50"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                }`}
                onClick={closeMenu}
              >
                <div className="flex items-center">
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.name}
                </div>
              </Link>
            ))}

            {user?.rolle === "Admin" &&
              adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive(item.href)
                      ? "border-primary text-primary bg-primary-50"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={closeMenu}
                >
                  <div className="flex items-center">
                    <item.icon className="mr-2 h-5 w-5" />
                    {item.name}
                  </div>
                </Link>
              ))}
          </div>

          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profilbild_url || ""} alt={user.vorname} />
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{`${user.vorname} ${user.nachname}`}</div>
                    <div className="text-sm font-medium text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <button
                    onClick={() => {
                      signOut()
                      closeMenu()
                    }}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <LogOut className="mr-2 h-5 w-5" />
                      Abmelden
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-3 space-y-1 px-2">
                <Link
                  href="/login"
                  className="block w-full px-4 py-2 text-base font-medium text-center text-white bg-primary rounded-md hover:bg-primary-dark"
                  onClick={closeMenu}
                >
                  Anmelden
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
