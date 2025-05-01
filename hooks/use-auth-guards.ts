"use client"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

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
  }, [user, loading, router, redirectTo])

  return { user, loading }
}

/**
 * Hook zum Schutz von Routen, die Admin-Rechte erfordern
 * Leitet nicht-Admin-Benutzer zur Startseite weiter
 */
export function useRequireAdmin(redirectTo = "/") {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.rolle !== "Admin")) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  return { user, loading, isAdmin: user?.rolle === "Admin" }
}

/**
 * Hook zum Schutz von Routen, die Trainer-Rechte erfordern
 * Leitet nicht-Trainer-Benutzer zur Startseite weiter
 */
export function useRequireTrainer(redirectTo = "/") {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.rolle !== "Trainer")) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  return { user, loading, isTrainer: user?.rolle === "Trainer" }
}
