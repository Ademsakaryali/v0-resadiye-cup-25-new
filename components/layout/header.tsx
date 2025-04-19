"use client"

import Link from "next/link"

import { useAuth } from "@/context/auth-context"
import { useLayout } from "@/context/layout-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut } from "lucide-react"

export const Header = () => {
  const { user, signOut } = useAuth()
  const { sidebarExpanded, toggleSidebar, isMobile } = useLayout()

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="flex h-14 items-center px-6">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2 lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="ml-auto flex items-center space-x-4">
          {user ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.profilbild_url || ""} alt={user.vorname} />
                <AvatarFallback>{`${user.vorname.charAt(0)}${user.nachname.charAt(0)}`}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden md:block">{user.vorname}</span>
              <Button variant="ghost" size="icon" onClick={signOut} title="Abmelden">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button asChild variant="outline">
              <Link href="/login">Anmelden</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
