"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

type Role = "Admin" | "Trainer" | "Spieler" | "Gast"

/**
 * Hook zum Schutz von Routen, die Authentifizierung erfordern
 * Leitet nicht authentifizierte Benutzer zur Login-Seite weiter
 */
export function useRequireAuth(redirectTo = "/login") {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, redirectTo, router])

  return { user, loading }
}

/**
 * Hook zum Schutz von Routen, die bestimmte Benutzerrollen erfordern
 * Leitet Benutzer mit unzureichenden Berechtigungen zur Startseite weiter
 */
export function useRequireRole(allowedRoles: Role[], redirectTo = "/") {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !allowedRoles.includes(user.rolle as Role))) {
      router.push(redirectTo)
    }
  }, [user, loading, allowedRoles, redirectTo, router])

  return { user, loading, hasRequiredRole: user ? allowedRoles.includes(user.rolle as Role) : false }
}

/**
 * Hook zum Schutz von Routen, die nur für Administratoren zugänglich sein sollen
 * Leitet nicht-Administratoren zur Startseite weiter
 */
export function useRequireAdmin(redirectTo = "/") {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.rolle !== "Admin")) {
      router.push(redirectTo)
    }
  }, [user, loading, redirectTo, router])

  return { user, loading, isAdmin: user?.rolle === "Admin" }
}

/**
 * Hook zum Schutz von Routen, die nur für nicht authentifizierte Benutzer zugänglich sein sollen
 * Leitet bereits authentifizierte Benutzer zur Startseite weiter
 */
export function useRequireNoAuth(redirectTo = "/") {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo)
    }
  }, [user, loading, redirectTo, router])

  return { user, loading }
}
