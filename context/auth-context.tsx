"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { User } from "@/lib/types"
import { useRouter } from "next/navigation"

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Überprüfen, ob ein Benutzer im localStorage gespeichert ist
        const storedUser = localStorage.getItem("currentUser")

        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error("Fehler beim Abrufen des Benutzers:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      // Direkte Abfrage der Datenbank nach dem Benutzer
      const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

      if (error || !data) {
        return { error: { message: "Ungültige E-Mail oder Passwort" } }
      }

      // In einer echten Anwendung würde hier eine Passwortüberprüfung stattfinden
      // Für diese Demo akzeptieren wir jeden Benutzer mit der richtigen E-Mail

      // Benutzer im localStorage speichern
      localStorage.setItem("currentUser", JSON.stringify(data))
      setUser(data as User)

      return { error: null }
    } catch (error) {
      console.error("Fehler beim Anmelden:", error)
      return { error }
    }
  }

  const signOut = async () => {
    // Benutzer aus dem localStorage entfernen
    localStorage.removeItem("currentUser")
    setUser(null)
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth muss innerhalb eines AuthProviders verwendet werden")
  }
  return context
}
