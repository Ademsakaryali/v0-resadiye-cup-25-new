"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { User } from "@/lib/types"
import { useRouter } from "next/navigation"

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>
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
        const rememberMe = localStorage.getItem("rememberMe") === "true"

        if (storedUser && rememberMe) {
          setUser(JSON.parse(storedUser))
        } else if (storedUser && !rememberMe) {
          // Wenn "Angemeldet bleiben" nicht aktiviert war, entfernen wir den Benutzer
          localStorage.removeItem("currentUser")
          localStorage.removeItem("rememberMe")
        }
      } catch (error) {
        console.error("Fehler beim Abrufen des Benutzers:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const signIn = async (email: string, password: string, rememberMe = false) => {
    try {
      // Benutzer anhand der E-Mail-Adresse suchen
      const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

      if (error || !data) {
        return { error: { message: "Ungültige E-Mail oder Passwort" } }
      }

      // Passwort überprüfen
      // In einer echten Anwendung würde hier bcrypt.compare verwendet werden
      // Da wir in diesem Beispiel das Passwort als Klartext speichern, vergleichen wir direkt
      if (data.password_hash !== password) {
        return { error: { message: "Ungültige E-Mail oder Passwort" } }
      }

      // Benutzer im localStorage speichern
      localStorage.setItem("currentUser", JSON.stringify(data))
      localStorage.setItem("rememberMe", rememberMe.toString())
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
    localStorage.removeItem("rememberMe")
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
