"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Tournament, BlankettSettings } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, Calendar, CheckCircle, AlertCircle, Clock } from "lucide-react"

export default function BlankettSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [settings, setSettings] = useState<BlankettSettings | null>(null)
  const [formData, setFormData] = useState({
    min_spieler: 11,
    max_spieler: 20,
    ohne_anmeldung: false,
    countdown_aktiv: false,
    countdown_datum: "",
    countdown_zeit: "12:00", // Neue Standardzeit: 12:00 Uhr
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Turnier abrufen
        const { data: tournamentData, error: tournamentError } = await supabase
          .from("tournaments")
          .select("*")
          .eq("id", params.id)
          .single()

        if (tournamentError) throw tournamentError

        setTournament(tournamentData)

        // Blankett-Einstellungen abrufen
        const { data: settingsData, error: settingsError } = await supabase
          .from("blankett_settings")
          .select("*")
          .eq("tournament_id", params.id)
          .maybeSingle()

        if (settingsError) throw settingsError

        if (settingsData) {
          // Datum und Zeit aus dem ISO-String extrahieren
          let countdownDate = ""
          let countdownTime = "12:00"

          if (settingsData.countdown_datum) {
            const date = new Date(settingsData.countdown_datum)
            countdownDate = date.toISOString().split("T")[0]

            // Zeit im Format HH:MM extrahieren
            const hours = date.getHours().toString().padStart(2, "0")
            const minutes = date.getMinutes().toString().padStart(2, "0")
            countdownTime = `${hours}:${minutes}`
          }

          setSettings(settingsData)
          setFormData({
            min_spieler: settingsData.min_spieler,
            max_spieler: settingsData.max_spieler,
            ohne_anmeldung: settingsData.ohne_anmeldung,
            countdown_aktiv: settingsData.countdown_aktiv,
            countdown_datum: countdownDate,
            countdown_zeit: countdownTime,
          })
        } else {
          // Standardwerte setzen
          const defaultCountdownDate = new Date(tournamentData.start_datum)
          defaultCountdownDate.setDate(defaultCountdownDate.getDate() - 7) // 7 Tage vor Turnierbeginn

          setFormData({
            min_spieler: 11,
            max_spieler: 20,
            ohne_anmeldung: false,
            countdown_aktiv: true,
            countdown_datum: defaultCountdownDate.toISOString().split("T")[0],
            countdown_zeit: "12:00",
          })
        }
      } catch (error: any) {
        console.error("Fehler beim Laden der Daten:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, params.id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target

    if (type === "number") {
      setFormData({
        ...formData,
        [name]: Number.parseInt(value),
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      if (formData.min_spieler > formData.max_spieler) {
        throw new Error("Die Mindestanzahl an Spielern kann nicht größer sein als die Maximalanzahl.")
      }

      if (formData.countdown_aktiv && !formData.countdown_datum) {
        throw new Error("Bitte geben Sie ein Datum für den Countdown an.")
      }

      // Datum und Zeit kombinieren
      let countdownDate = null
      if (formData.countdown_aktiv) {
        const [hours, minutes] = formData.countdown_zeit.split(":").map(Number)
        countdownDate = new Date(formData.countdown_datum)
        countdownDate.setHours(hours, minutes, 0, 0)
      }

      if (settings) {
        // Einstellungen aktualisieren
        const { error } = await supabase
          .from("blankett_settings")
          .update({
            min_spieler: formData.min_spieler,
            max_spieler: formData.max_spieler,
            ohne_anmeldung: formData.ohne_anmeldung,
            countdown_aktiv: formData.countdown_aktiv,
            countdown_datum: countdownDate ? countdownDate.toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", settings.id)

        if (error) throw error
      } else {
        // Neue Einstellungen erstellen
        const { error } = await supabase.from("blankett_settings").insert({
          tournament_id: params.id,
          min_spieler: formData.min_spieler,
          max_spieler: formData.max_spieler,
          ohne_anmeldung: formData.ohne_anmeldung,
          countdown_aktiv: formData.countdown_aktiv,
          countdown_datum: countdownDate ? countdownDate.toISOString() : null,
        })

        if (error) throw error
      }

      setSuccess("Einstellungen erfolgreich gespeichert.")
    } catch (error: any) {
      console.error("Fehler beim Speichern der Einstellungen:", error)
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unbekannt"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">Turnier nicht gefunden</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Das angeforderte Turnier existiert nicht oder wurde gelöscht.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/blanketts">Zurück zur Blankett-Übersicht</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <RequireAuth allowedRoles={["Admin"]}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <Button variant="ghost" asChild className="mb-2">
            <Link href="/blanketts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Blankett-Übersicht
            </Link>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Erfolg</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Blankett-Einstellungen: {tournament.name}</CardTitle>
            <CardDescription className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(tournament.start_datum)} - {formatDate(tournament.end_datum)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_spieler">Mindestanzahl Spieler</Label>
                    <Input
                      id="min_spieler"
                      name="min_spieler"
                      type="number"
                      min="1"
                      max="99"
                      value={formData.min_spieler}
                      onChange={handleInputChange}
                      className="bg-white dark:bg-gray-800"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Die Mindestanzahl an Spielern, die ein Team für das Blankett angeben muss.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_spieler">Maximalanzahl Spieler</Label>
                    <Input
                      id="max_spieler"
                      name="max_spieler"
                      type="number"
                      min="1"
                      max="99"
                      value={formData.max_spieler}
                      onChange={handleInputChange}
                      className="bg-white dark:bg-gray-800"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Die Maximalanzahl an Spielern, die ein Team für das Blankett angeben kann.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ohne_anmeldung"
                      checked={formData.ohne_anmeldung}
                      onCheckedChange={(checked) => handleCheckboxChange("ohne_anmeldung", checked as boolean)}
                    />
                    <Label htmlFor="ohne_anmeldung">Blankett ohne Anmeldung aufrufbar</Label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 pl-6">
                    Wenn aktiviert, können Teams das Blankett auch ohne Anmeldung ausfüllen.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="countdown_aktiv"
                      checked={formData.countdown_aktiv}
                      onCheckedChange={(checked) => handleCheckboxChange("countdown_aktiv", checked as boolean)}
                    />
                    <Label htmlFor="countdown_aktiv">Countdown aktivieren</Label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 pl-6">
                    Wenn aktiviert, wird ein Countdown angezeigt, bis zu dem das Blankett eingereicht werden muss.
                  </p>
                </div>

                {formData.countdown_aktiv && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="countdown_datum">Countdown-Datum</Label>
                      <Input
                        id="countdown_datum"
                        name="countdown_datum"
                        type="date"
                        value={formData.countdown_datum}
                        onChange={handleInputChange}
                        className="bg-white dark:bg-gray-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="countdown_zeit">Countdown-Uhrzeit</Label>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-gray-400" />
                        <Input
                          id="countdown_zeit"
                          name="countdown_zeit"
                          type="time"
                          value={formData.countdown_zeit}
                          onChange={handleInputChange}
                          className="bg-white dark:bg-gray-800"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Die genaue Uhrzeit, bis zu der das Blankett eingereicht werden muss.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <CardFooter className="px-0 pt-6">
                <Button type="submit" disabled={isSubmitting} className="ml-auto bg-primary-600 hover:bg-primary-700">
                  {isSubmitting ? "Wird gespeichert..." : "Einstellungen speichern"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  )
}
