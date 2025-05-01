"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

type RequireAuthProps = {
  children: React.ReactNode
  allowedRoles?: Array<"Admin" | "Trainer" | "Spieler">
  allowUnauthenticated?: boolean
}

export function RequireAuth({ children, allowedRoles, allowUnauthenticated = false }: RequireAuthProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Wenn nicht authentifiziert und nicht erlaubt für unauthentifizierte Benutzer
      if (!user && !allowUnauthenticated) {
        router.push("/login")
      }
      // Wenn authentifiziert, aber nicht die erforderliche Rolle hat
      else if (user && allowedRoles && !allowedRoles.includes(user.rolle)) {
        router.push("/")
      }
    }
  }, [user, loading, router, allowedRoles, allowUnauthenticated])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  // Erlaube Zugriff für nicht authentifizierte Benutzer, wenn allowUnauthenticated=true
  if (!user && allowUnauthenticated) {
    return <>{children}</>
  }

  // Verweigere Zugriff für nicht authentifizierte Benutzer
  if (!user && !allowUnauthenticated) {
    return null
  }

  // Verweigere Zugriff für Benutzer ohne erforderliche Rolle
  if (allowedRoles && !allowedRoles.includes(user.rolle)) {
    return null
  }

  return <>{children}</>
}
