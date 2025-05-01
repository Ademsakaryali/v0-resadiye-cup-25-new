"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type LayoutContextType = {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  isMobile: boolean
  isTablet: boolean
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 640
      const tablet = window.innerWidth >= 640 && window.innerWidth < 1024
      setIsMobile(mobile)
      setIsTablet(tablet)

      // Auf Desktop standardmäßig erweitert, auf Mobil und Tablet geschlossen
      setSidebarOpen(!(mobile || tablet))
    }

    // Initial call
    checkScreenSize()

    // Event-Listener für Größenänderungen
    window.addEventListener("resize", checkScreenSize)

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev)
  }

  return (
    <LayoutContext.Provider value={{ isSidebarOpen, toggleSidebar, isMobile, isTablet }}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider")
  }
  return context
}
