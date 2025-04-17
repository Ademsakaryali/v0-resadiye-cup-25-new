"use client"

import { useLayout } from "@/context/layout-context"

export function Footer() {
  const { sidebarExpanded, isMobile } = useLayout()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t py-4 px-6 bg-background">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">&copy; {currentYear} Resadiye Cup. Alle Rechte vorbehalten.</p>
        <div className="text-sm text-muted-foreground">Version 1.0.0</div>
      </div>
    </footer>
  )
}
