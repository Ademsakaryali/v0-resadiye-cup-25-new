"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type LayoutContextType = {
  sidebarExpanded: boolean
  toggleSidebar: () => void
  isMobile: boolean
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      // Auf Desktop standardmäßig erweitert, auf Mobil geschlossen
      setSidebarExpanded(!mobile)
    }

    // Initial call
    checkIfMobile()

    // Event-Listener für Größenänderungen
    window.addEventListener("resize", checkIfMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const toggleSidebar = () => {
    setSidebarExpanded((prev) => !prev)
  }

  return (
    <LayoutContext.Provider value={{ sidebarExpanded, toggleSidebar, isMobile }}>{children}</LayoutContext.Provider>
  )
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider")
  }
  return context
}
