"use client"

import { useState, useEffect } from "react"

/**
 * Hook zum Abfragen von Media Queries
 * Ermöglicht responsive Anpassungen basierend auf Bildschirmgröße
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener("change", handler)

    return () => {
      mediaQuery.removeEventListener("change", handler)
    }
  }, [query])

  return matches
}

/**
 * Vordefinierte Breakpoints für gängige Bildschirmgrößen
 */
export const useIsMobile = () => useMediaQuery("(max-width: 639px)")
export const useIsTablet = () => useMediaQuery("(min-width: 640px) and (max-width: 1023px)")
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)")
export const useIsLargeDesktop = () => useMediaQuery("(min-width: 1280px)")
