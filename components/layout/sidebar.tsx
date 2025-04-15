"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Users, UserCog, Settings, Menu, LogOut, Home, FileText, ChevronRight, ChevronLeft } from "lucide-react"
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
      if (window.innerWidth < 1024) {
        setIsCollapsed(true)
      }
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`)

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Turniere", href: "/tournaments", icon: Trophy },
    { name: "Teams", href: "/teams", icon: Users },
    { name: "Blanketts", href: "/blanketts", icon: FileText },
  ]

  // Nur für Admins sichtbar
  const adminNavigation = [
    { name: "Benutzerverwaltung", href: "/users", icon: UserCog },
    { name: "Setup", href: "/setup", icon: Settings },
  ]

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
        "flex h-full flex-col border-r bg-card/50 backdrop-blur-sm",
        isCollapsed ? "w-[70px]" : "w-[240px]",
        className,
      )}
    >
      <div className="flex h-14 items-center border-b px-3 py-4">
        {!isCollapsed && <h2 className="text-lg font-semibold">Resadiye Cup</h2>}
        <Button
          variant="ghost"
          size="icon"
          className={cn("ml-auto h-8 w-8", isCollapsed && "mx-auto")}
          onClick={toggleCollapse}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-2">
          {navigation.map((item) => (
            <Button
              key={item.name}
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className={cn(
                "justify-start",
                isCollapsed ? "h-10 w-10 p-0" : "h-10 px-3",
                isActive(item.href) && "bg-secondary/50",
              )}
              asChild
            >
              <Link href={item.href}>
                <item.icon className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "mr-2")} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            </Button>
          ))}

          {user?.rolle === "Admin" && (
            <>
              {!isCollapsed && (
                <div className="my-2 px-3">
                  <div className="text-xs font-medium text-muted-foreground">Administration</div>
                </div>
              )}
              {adminNavigation.map((item) => (
                <Button
                  key={item.name}
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={cn(
                    "justify-start",
                    isCollapsed ? "h-10 w-10 p-0" : "h-10 px-3",
                    isActive(item.href) && "bg-secondary/50",
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "mr-2")} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                </Button>
              ))}
            </>
          )}
        </nav>
      </ScrollArea>
      {user && (
        <div className={cn("flex items-center border-t p-3", isCollapsed ? "flex-col gap-2" : "flex-row gap-3")}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profilbild_url || ""} alt={user.vorname} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="truncate text-sm font-medium">{`${user.vorname} ${user.nachname}`}</div>
              <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", isCollapsed && "mt-2")}
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )

  // Mobile view uses a sheet
  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden fixed left-4 top-4 z-40"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="left" className="p-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Desktop view
  return sidebarContent
}
