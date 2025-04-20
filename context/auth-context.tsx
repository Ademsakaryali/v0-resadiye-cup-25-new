"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { User, Team } from "@/lib/types"
import { useRouter, usePathname } from "next/navigation"

type AuthContextType = {
  user: User | null
  loading: boolean
  trainerTeam: Team | null
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [trainerTeam, setTrainerTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseClient()

  // Funktion zum Laden des Teams eines Trainers
  const loadTrainerTeam = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("trainer_id", userId)
        .eq("ist_aktiv", true)
        .single()

      if (error) {
        console.error("Fehler beim Laden des Trainer-Teams:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Fehler beim Laden des Trainer-Teams:", error)
      return null
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Überprüfen, ob ein Benutzer im localStorage gespeichert ist
        const storedUser = localStorage.getItem("currentUser")

        // Standardmäßig "Angemeldet bleiben" auf true setzen (24 Stunden)
        const rememberMe = localStorage.getItem("rememberMe") !== "false"

        // Prüfen, ob die Session abgelaufen ist
        const sessionExpiry = localStorage.getItem("sessionExpiry")
        const isSessionValid = sessionExpiry && new Date(sessionExpiry) > new Date()

        if (storedUser && (rememberMe || isSessionValid)) {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)

          // Wenn der Benutzer ein Trainer ist, lade sein Team
          if (parsedUser.rolle === "Trainer") {
            const team = await loadTrainerTeam(parsedUser.id)
            setTrainerTeam(team)

            // Wenn der Trainer ein Team hat und wir auf der Login-Seite oder Startseite sind,
            // leiten wir ihn direkt zu seinem Team weiter
            if (team && (pathname === "/login" || pathname === "/")) {
              router.push(`/teams/${team.id}`)
            }
          }
        } else if (storedUser && !rememberMe && !isSessionValid) {
          // Wenn "Angemeldet bleiben" nicht aktiviert war und die Session abgelaufen ist, entfernen wir den Benutzer
          localStorage.removeItem("currentUser")
          localStorage.removeItem("sessionExpiry")
        }
      } catch (error) {
        console.error("Fehler beim Abrufen des Benutzers:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  const signIn = async (email: string, password: string, rememberMe = true) => {
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

      // Session-Ablaufzeit berechnen (24 Stunden ab jetzt)
      const expiryDate = new Date()
      expiryDate.setHours(expiryDate.getHours() + 24)

      // Benutzer und Session-Informationen im localStorage speichern
      localStorage.setItem("currentUser", JSON.stringify(data))
      localStorage.setItem("rememberMe", rememberMe.toString())
      localStorage.setItem("sessionExpiry", expiryDate.toISOString())

      setUser(data as User)

      // Wenn der Benutzer ein Trainer ist, lade sein Team
      if (data.rolle === "Trainer") {
        const team = await loadTrainerTeam(data.id)
        setTrainerTeam(team)

        // Wenn der Trainer ein Team hat, leite ihn zu seinem Team weiter
        if (team) {
          router.push(`/teams/${team.id}`)
          return { error: null }
        }
      }

      // Für andere Benutzerrollen zur Hauptseite weiterleiten
      router.push("/")
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
    localStorage.removeItem("sessionExpiry")
    setUser(null)
    setTrainerTeam(null)
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, trainerTeam, loading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth muss innerhalb eines AuthProviders verwendet werden")
  }
  return context
}
