"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Team, Tournament, BlankettEntry, BlankettSettings, BlankettSpieler, User } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  UserIcon,
  Shield,
  Edit2,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function BlankettDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [team, setTeam] = useState<Team | null>(null)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [blankett, setBlankett] = useState<BlankettEntry | null>(null)
  const [settings, setSettings] = useState<BlankettSettings | null>(null)
  const [blankettSpieler, setBlankettSpieler] = useState<BlankettSpieler[]>([])
  const [verfuegbareSpieler, setVerfuegbareSpieler] = useState<User[]>([])
  const [selectedSpieler, setSelectedSpieler] = useState<string>("")
  const [trikotNummer, setTrikotNummer] = useState<string>("")
  const [position, setPosition] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingSpieler, setEditingSpieler] = useState<BlankettSpieler | null>(null)
  const [countdown, setCountdown] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    expired: boolean
  } | null>(null)

  // Neue Felder für die Erstellung eines neuen Spielers
  const [neuerVorname, setNeuerVorname] = useState<string>("")
  const [neuerNachname, setNeuerNachname] = useState<string>("")
  const [neuesGeburtsdatum, setNeuesGeburtsdatum] = useState<string>("")
  const [neueTrikotNummer, setNeueTrikotNummer] = useState<string>("")
  const [neuePosition, setNeuePosition] = useState<string>("")
  const [addDialogTab, setAddDialogTab] = useState<string>("existierend")

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Blankett abrufen
        const { data: blankettData, error: blankettError } = await supabase
          .from("blankett_entries")
          .select("*")
          .eq("id", params.blankettId)
          .single()

        if (blankettError) throw blankettError

        setBlankett(blankettData)

        // Team abrufen
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("*, trainer:trainer_id(*)")
          .eq("id", blankettData.team_id)
          .single()

        if (teamError) throw teamError

        setTeam(teamData)

        // Prüfen, ob der Benutzer berechtigt ist
        if (user?.rolle !== "Admin" && (user?.rolle !== "Trainer" || user.id !== teamData.trainer_id)) {
          router.push(`/teams/${blankettData.team_id}`)
          return
        }

        // Turnier abrufen
        const { data: tournamentData, error: tournamentError } = await supabase
          .from("tournaments")
          .select("*")
          .eq("id", blankettData.tournament_id)
          .single()

        if (tournamentError) throw tournamentError

        setTournament(tournamentData)

        // Blankett-Einstellungen abrufen
        const { data: settingsData, error: settingsError } = await supabase
          .from("blankett_settings")
          .select("*")
          .eq("tournament_id", blankettData.tournament_id)
          .single()

        if (settingsError && settingsError.code !== "PGRST116") {
          // PGRST116 bedeutet "keine Ergebnisse gefunden"
          throw settingsError
        }

        if (settingsData) {
          setSettings(settingsData)
        }

        // Blankett-Spieler abrufen
        const { data: spielerData, error: spielerError } = await supabase
          .from("blankett_spieler")
          .select(`
            *,
            spieler:spieler_id (*)
          `)
          .eq("blankett_id", params.blankettId)
          .order("trikot_nummer", { ascending: true })

        if (spielerError) throw spielerError

        setBlankettSpieler(spielerData)

        // Verfügbare Spieler abrufen (die noch nicht im Blankett sind)
        const spielerIds = spielerData.map((s: BlankettSpieler) => s.spieler_id)
        const { data: verfuegbareData, error: verfuegbareError } = await supabase
          .from("users")
          .select("*")
          .eq("rolle", "Spieler")
          .eq("ist_aktiv", true)
          .not("id", "in", spielerIds.length > 0 ? `(${spielerIds.join(",")})` : "(0)")
          .order("nachname", { ascending: true })

        if (verfuegbareError) throw verfuegbareError

        setVerfuegbareSpieler(verfuegbareData)
      } catch (error: any) {
        console.error("Fehler beim Laden der Daten:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, params.blankettId, router, user, params.id])

  // Countdown-Timer aktualisieren
  useEffect(() => {
    if (!settings || !settings.countdown_aktiv || !settings.countdown_datum) {
      setCountdown(null)
      return
    }

    const countdownDate = new Date(settings.countdown_datum).getTime()

    const updateCountdown = () => {
      const now = new Date().getTime()
      const distance = countdownDate - now

      if (distance < 0) {
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true,
        })
        return
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setCountdown({
        days,
        hours,
        minutes,
        seconds,
        expired: false,
      })
    }

    // Initial update
    updateCountdown()

    // Update every second
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [settings])

  const handleAddSpieler = async () => {
    if (!selectedSpieler || !trikotNummer || !position || !blankett) {
      setError("Bitte füllen Sie alle Felder aus.")
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Prüfen, ob die Trikotnummer bereits vergeben ist
      const trikotExists = blankettSpieler.some((s) => s.trikot_nummer.toString() === trikotNummer)

      if (trikotExists) {
        setError("Diese Trikotnummer ist bereits vergeben.")
        return
      }

      // Prüfen, ob die maximale Anzahl an Spielern erreicht ist
      if (settings && blankettSpieler.length >= settings.max_spieler) {
        setError(`Die maximale Anzahl von ${settings.max_spieler} Spielern ist erreicht.`)
        return
      }

      // Spieler zum Blankett hinzufügen
      const { data, error } = await supabase
        .from("blankett_spieler")
        .insert({
          blankett_id: blankett.id,
          spieler_id: selectedSpieler,
          trikot_nummer: Number.parseInt(trikotNummer),
          position: position,
        })
        .select(`
          *,
          spieler:spieler_id (*)
        `)

      if (error) throw error

      // Blankett aktualisieren
      await supabase.from("blankett_entries").update({ updated_at: new Date().toISOString() }).eq("id", blankett.id)

      // Spielerliste aktualisieren
      setBlankettSpieler([...blankettSpieler, data[0]])

      // Verfügbare Spieler aktualisieren
      setVerfuegbareSpieler(verfuegbareSpieler.filter((s) => s.id !== selectedSpieler))

      // Formular zurücksetzen
      setSelectedSpieler("")
      setTrikotNummer("")
      setPosition("")
      setShowAddDialog(false)

      setSuccess("Spieler erfolgreich hinzugefügt.")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Fehler beim Hinzufügen des Spielers:", error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddNeuerSpieler = async () => {
    if (!neuerVorname || !neuerNachname || !neuesGeburtsdatum || !neueTrikotNummer || !neuePosition || !blankett) {
      setError("Bitte füllen Sie alle Felder aus.")
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Prüfen, ob die Trikotnummer bereits vergeben ist
      const trikotExists = blankettSpieler.some((s) => s.trikot_nummer.toString() === neueTrikotNummer)

      if (trikotExists) {
        setError("Diese Trikotnummer ist bereits vergeben.")
        return
      }

      // Prüfen, ob die maximale Anzahl an Spielern erreicht ist
      if (settings && blankettSpieler.length >= settings.max_spieler) {
        setError(`Die maximale Anzahl von ${settings.max_spieler} Spielern ist erreicht.`)
        return
      }

      // Alter berechnen für E-Mail
      const geburtsdatum = new Date(neuesGeburtsdatum)
      const heute = new Date()
      let alter = heute.getFullYear() - geburtsdatum.getFullYear()
      const m = heute.getMonth() - geburtsdatum.getMonth()
      if (m < 0 || (m === 0 && heute.getDate() < geburtsdatum.getDate())) {
        alter--
      }

      // E-Mail und Passwort generieren
      const email = `${neuerVorname.toLowerCase()}${neuerNachname.toLowerCase()}${alter}@resadiyecup.com`
      const passwort = `${neuerVorname.substring(0, 2).toLowerCase()}${neuerNachname.substring(0, 2).toLowerCase()}5454`

      // Neuen Spieler erstellen - WICHTIG: password_hash direkt setzen
      const { data: neuerSpielerData, error: neuerSpielerError } = await supabase
        .from("users")
        .insert({
          vorname: neuerVorname,
          nachname: neuerNachname,
          email: email,
          geburtsdatum: neuesGeburtsdatum,
          rolle: "Spieler",
          ist_aktiv: true,
          password_hash: passwort, // Passwort direkt in password_hash speichern
        })
        .select()

      if (neuerSpielerError) throw neuerSpielerError

      // Spieler zum Blankett hinzufügen
      const { data: blankettSpielerData, error: blankettSpielerError } = await supabase
        .from("blankett_spieler")
        .insert({
          blankett_id: blankett.id,
          spieler_id: neuerSpielerData[0].id,
          trikot_nummer: Number.parseInt(neueTrikotNummer),
          position: neuePosition,
        })
        .select(`
        *,
        spieler:spieler_id (*)
      `)

      if (blankettSpielerError) throw blankettSpielerError

      // Blankett aktualisieren
      await supabase.from("blankett_entries").update({ updated_at: new Date().toISOString() }).eq("id", blankett.id)

      // Spielerliste aktualisieren
      setBlankettSpieler([...blankettSpieler, blankettSpielerData[0]])

      // Formular zurücksetzen
      setNeuerVorname("")
      setNeuerNachname("")
      setNeuesGeburtsdatum("")
      setNeueTrikotNummer("")
      setNeuePosition("")
      setShowAddDialog(false)

      setSuccess("Neuer Spieler erfolgreich erstellt und hinzugefügt.")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Fehler beim Erstellen des neuen Spielers:", error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEditSpieler = (spieler: BlankettSpieler) => {
    setEditingSpieler(spieler)
    setTrikotNummer(spieler.trikot_nummer.toString())
    setPosition(spieler.position)
    setShowEditDialog(true)
  }

  const handleUpdateSpieler = async () => {
    if (!editingSpieler || !trikotNummer || !position || !blankett) {
      setError("Bitte füllen Sie alle Felder aus.")
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Prüfen, ob die Trikotnummer bereits vergeben ist (außer für den aktuellen Spieler)
      const trikotExists = blankettSpieler.some(
        (s) => s.trikot_nummer.toString() === trikotNummer && s.id !== editingSpieler.id,
      )

      if (trikotExists) {
        setError("Diese Trikotnummer ist bereits vergeben.")
        return
      }

      // Spieler aktualisieren
      const { error } = await supabase
        .from("blankett_spieler")
        .update({
          trikot_nummer: Number.parseInt(trikotNummer),
          position: position,
        })
        .eq("id", editingSpieler.id)

      if (error) throw error

      // Blankett aktualisieren
      await supabase.from("blankett_entries").update({ updated_at: new Date().toISOString() }).eq("id", blankett.id)

      // Spielerliste aktualisieren
      setBlankettSpieler(
        blankettSpieler.map((s) =>
          s.id === editingSpieler.id
            ? {
                ...s,
                trikot_nummer: Number.parseInt(trikotNummer),
                position: position,
              }
            : s,
        ),
      )

      // Dialog schließen und Formular zurücksetzen
      setShowEditDialog(false)
      setEditingSpieler(null)
      setTrikotNummer("")
      setPosition("")

      setSuccess("Spieler erfolgreich aktualisiert.")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Fehler beim Aktualisieren des Spielers:", error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveSpieler = async (spielerId: string) => {
    if (!blankett) return

    try {
      setSaving(true)
      setError(null)

      // Spieler aus dem Blankett entfernen
      const { error } = await supabase
        .from("blankett_spieler")
        .delete()
        .eq("blankett_id", blankett.id)
        .eq("spieler_id", spielerId)

      if (error) throw error

      // Blankett aktualisieren
      await supabase.from("blankett_entries").update({ updated_at: new Date().toISOString() }).eq("id", blankett.id)

      // Spieler aus der Liste entfernen
      const removedSpieler = blankettSpieler.find((s) => s.spieler_id === spielerId)
      setBlankettSpieler(blankettSpieler.filter((s) => s.spieler_id !== spielerId))

      // Spieler wieder zu den verfügbaren hinzufügen
      if (removedSpieler && removedSpieler.spieler) {
        setVerfuegbareSpieler([...verfuegbareSpieler, removedSpieler.spieler])
      }

      setSuccess("Spieler erfolgreich entfernt.")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Fehler beim Entfernen des Spielers:", error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBlankett = async () => {
    if (!blankett || !team || !tournament) return

    try {
      setSaving(true)
      setError(null)

      // Blankett speichern
      const { error } = await supabase
        .from("blankett_entries")
        .update({
          status: blankett.status === "entwurf" ? "eingereicht" : blankett.status, // Automatisch auf "eingereicht" setzen, wenn es ein Entwurf war
          updated_at: new Date().toISOString(),
        })
        .eq("id", blankett.id)

      if (error) throw error

      // Blankett-Status aktualisieren, wenn es ein Entwurf war
      if (blankett.status === "entwurf") {
        setBlankett({
          ...blankett,
          status: "eingereicht",
        })
      }

      // Benachrichtigung für Administratoren erstellen, nur wenn der Benutzer kein Admin ist
      if (user?.rolle !== "Admin") {
        try {
          // Prüfen, ob die Tabelle existiert
          const { data: tableExists, error: tableCheckError } = await supabase
            .from("notifications")
            .select("id")
            .limit(1)

          // Wenn die Tabelle existiert, Benachrichtigung erstellen
          if (!tableCheckError) {
            const notificationData = {
              user_id: null, // Für alle Admins
              type: "blankett_saved",
              message: `Team ${team.name} hat ein Blankett für ${tournament.name} gespeichert.`,
              blankett_id: blankett.id,
              is_read: false,
              created_at: new Date().toISOString(),
            }

            const { error: notificationError } = await supabase.from("notifications").insert(notificationData)

            if (notificationError) {
              console.error("Fehler beim Erstellen der Benachrichtigung:", notificationError)
            }
          } else {
            console.log("Notifications-Tabelle existiert nicht, überspringe Benachrichtigung")
          }
        } catch (notificationError) {
          console.error("Fehler beim Erstellen der Benachrichtigung:", notificationError)
          // Fehler bei der Benachrichtigung sollten den Speichervorgang nicht blockieren
        }
      }

      setSuccess("Blankett erfolgreich gespeichert.")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Fehler beim Speichern des Blanketts:", error)
      setError(error.message)
    } finally {
      setSaving(false)
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!blankett || !team || !tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">Blankett nicht gefunden</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Das angeforderte Blankett existiert nicht oder wurde gelöscht.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/teams">Zurück zur Teamübersicht</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Prüfen, ob das Blankett bearbeitet werden kann
  // Für Administratoren immer bearbeitbar, für Trainer nur wenn es ein Entwurf oder abgelehnt ist
  let isEditable = user?.rolle === "Admin" || blankett.status === "entwurf" || blankett.status === "abgelehnt"

  // Prüfen, ob die Frist abgelaufen ist
  const isFristAbgelaufen = countdown?.expired || false

  // Prüfen, ob der Benutzer ein Administrator ist
  const isAdmin = user?.rolle === "Admin"

  // Ändern Sie die isEditable-Bedingung, um Trainern zu erlauben, auch genehmigte Blanketts zu bearbeiten,
  // solange die Frist nicht abgelaufen ist
  isEditable =
    user?.rolle === "Admin" ||
    blankett.status === "entwurf" ||
    blankett.status === "abgelehnt" ||
    blankett.status === "eingereicht" ||
    (blankett.status === "genehmigt" && !isFristAbgelaufen)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/teams/${team.id}/blankett`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Blankett-Übersicht
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Mannschaftsblankett</h1>
            <p className="text-muted-foreground mt-1">
              {team.name} - {tournament.name}
            </p>
          </div>
          <Badge
            className={`self-start ${
              blankett.status === "genehmigt"
                ? "bg-green-600"
                : blankett.status === "abgelehnt"
                  ? "bg-destructive"
                  : blankett.status === "eingereicht"
                    ? "bg-secondary"
                    : "bg-background/50 border"
            }`}
          >
            {blankett.status === "genehmigt" && <CheckCircle className="h-3 w-3 mr-1" />}
            {blankett.status === "abgelehnt" && <AlertCircle className="h-3 w-3 mr-1" />}
            {blankett.status.charAt(0).toUpperCase() + blankett.status.slice(1)}
          </Badge>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-600 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Erfolg</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Admin-Hinweis */}
      {isAdmin && blankett.status !== "entwurf" && (
        <Alert className="mb-6 border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20">
          <Shield className="h-4 w-4" />
          <AlertTitle>Administrator-Modus</AlertTitle>
          <AlertDescription>
            Als Administrator können Sie dieses Blankett bearbeiten, auch wenn es bereits eingereicht wurde.
          </AlertDescription>
        </Alert>
      )}

      {!isAdmin && blankett.status === "genehmigt" && !isFristAbgelaufen && (
        <Alert className="mb-6 border-green-600 text-green-600 bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Genehmigtes Blankett</AlertTitle>
          <AlertDescription>
            Dieses Blankett wurde bereits genehmigt, kann aber noch bis zum Ablauf der Frist bearbeitet werden.
          </AlertDescription>
        </Alert>
      )}

      {/* Countdown-Timer */}
      {settings && settings.countdown_aktiv && settings.countdown_datum && countdown && (
        <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-300">Frist für Einreichung</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Deadline: {formatDate(settings.countdown_datum)}
                  </p>
                </div>
              </div>

              {countdown.expired ? (
                <div className="text-red-600 dark:text-red-400 font-bold">Frist abgelaufen!</div>
              ) : (
                <div className="grid grid-flow-col gap-2 text-center auto-cols-max">
                  <div className="flex flex-col p-2 bg-white dark:bg-gray-800 rounded-md text-blue-800 dark:text-blue-200">
                    <span className="font-mono text-xl font-bold">{countdown.days.toString().padStart(2, "0")}</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">Tage</span>
                  </div>
                  <div className="flex flex-col p-2 bg-white dark:bg-gray-800 rounded-md text-blue-800 dark:text-blue-200">
                    <span className="font-mono text-xl font-bold">{countdown.hours.toString().padStart(2, "0")}</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">Std</span>
                  </div>
                  <div className="flex flex-col p-2 bg-white dark:bg-gray-800 rounded-md text-blue-800 dark:text-blue-200">
                    <span className="font-mono text-xl font-bold">{countdown.minutes.toString().padStart(2, "0")}</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">Min</span>
                  </div>
                  <div className="flex flex-col p-2 bg-white dark:bg-gray-800 rounded-md text-blue-800 dark:text-blue-200">
                    <span className="font-mono text-xl font-bold">{countdown.seconds.toString().padStart(2, "0")}</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">Sek</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Turnierinformationen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center p-2 rounded-md bg-secondary/20 text-sm">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  {formatDate(tournament.start_datum)} - {formatDate(tournament.end_datum)}
                </span>
              </div>
              <div className="flex items-center p-2 rounded-md bg-secondary/20 text-sm">
                <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  Spieler: Min. {settings?.min_spieler || "?"} / Max. {settings?.max_spieler || "?"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {blankett.eingereicht_am && (
                <div className="flex items-center p-2 rounded-md bg-secondary/20 text-sm">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Eingereicht am: {formatDate(blankett.eingereicht_am)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm mb-6">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Spielerliste</CardTitle>
            <CardDescription>
              {blankettSpieler.length} von {settings?.max_spieler || "?"} Spielern
            </CardDescription>
          </div>

          {isEditable && (!isFristAbgelaufen || isAdmin) && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-background/50">
                  <Plus className="mr-2 h-4 w-4" />
                  Spieler hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Spieler hinzufügen</DialogTitle>
                  <DialogDescription>
                    Fügen Sie einen existierenden Spieler hinzu oder erstellen Sie einen neuen Spieler.
                  </DialogDescription>
                </DialogHeader>

                <Tabs value={addDialogTab} onValueChange={setAddDialogTab} className="mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="existierend">Existierender Spieler</TabsTrigger>
                    <TabsTrigger value="neu">Neuer Spieler</TabsTrigger>
                  </TabsList>

                  <TabsContent value="existierend" className="mt-4">
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="spieler-dialog">Spieler</Label>
                        <Select value={selectedSpieler} onValueChange={setSelectedSpieler}>
                          <SelectTrigger id="spieler-dialog">
                            <SelectValue placeholder="Spieler auswählen" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {verfuegbareSpieler.length === 0 ? (
                              <div className="p-2 text-center text-muted-foreground">Keine verfügbaren Spieler</div>
                            ) : (
                              verfuegbareSpieler.map((spieler) => (
                                <SelectItem key={spieler.id} value={spieler.id}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={spieler.profilbild_url || ""} alt={spieler.vorname} />
                                      <AvatarFallback>
                                        {getInitials(`${spieler.vorname} ${spieler.nachname}`)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>
                                      {spieler.vorname} {spieler.nachname}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="trikot-dialog">Trikotnummer</Label>
                          <Input
                            id="trikot-dialog"
                            type="number"
                            min="1"
                            max="99"
                            value={trikotNummer}
                            onChange={(e) => setTrikotNummer(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="position-dialog">Position</Label>
                          <Select value={position} onValueChange={setPosition}>
                            <SelectTrigger id="position-dialog">
                              <SelectValue placeholder="Position auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Torwart">Torwart</SelectItem>
                              <SelectItem value="Abwehr">Abwehr</SelectItem>
                              <SelectItem value="Mittelfeld">Mittelfeld</SelectItem>
                              <SelectItem value="Sturm">Sturm</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        Abbrechen
                      </Button>
                      <Button
                        onClick={handleAddSpieler}
                        disabled={!selectedSpieler || !trikotNummer || !position || saving}
                      >
                        {saving ? "Wird hinzugefügt..." : "Hinzufügen"}
                      </Button>
                    </DialogFooter>
                  </TabsContent>

                  <TabsContent value="neu" className="mt-4">
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vorname-neu">Vorname</Label>
                          <Input
                            id="vorname-neu"
                            value={neuerVorname}
                            onChange={(e) => setNeuerVorname(e.target.value)}
                            placeholder="Max"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nachname-neu">Nachname</Label>
                          <Input
                            id="nachname-neu"
                            value={neuerNachname}
                            onChange={(e) => setNeuerNachname(e.target.value)}
                            placeholder="Mustermann"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="geburtsdatum-neu">Geburtsdatum</Label>
                        <Input
                          id="geburtsdatum-neu"
                          type="date"
                          value={neuesGeburtsdatum}
                          onChange={(e) => setNeuesGeburtsdatum(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="trikot-neu">Trikotnummer</Label>
                          <Input
                            id="trikot-neu"
                            type="number"
                            min="1"
                            max="99"
                            value={neueTrikotNummer}
                            onChange={(e) => setNeueTrikotNummer(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="position-neu">Position</Label>
                          <Select value={neuePosition} onValueChange={setNeuePosition}>
                            <SelectTrigger id="position-neu">
                              <SelectValue placeholder="Position auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Torwart">Torwart</SelectItem>
                              <SelectItem value="Abwehr">Abwehr</SelectItem>
                              <SelectItem value="Mittelfeld">Mittelfeld</SelectItem>
                              <SelectItem value="Sturm">Sturm</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="bg-secondary/20 p-3 rounded-md text-sm">
                        <p className="font-medium mb-1">Hinweis:</p>
                        <p>E-Mail und Passwort werden automatisch generiert:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>E-Mail: vornamennachnamealter@resadiyecup.com</li>
                          <li>Passwort: erste 2 Buchstaben Vorname + erste 2 Buchstaben Nachname + 5454</li>
                        </ul>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        Abbrechen
                      </Button>
                      <Button
                        onClick={handleAddNeuerSpieler}
                        disabled={
                          !neuerVorname ||
                          !neuerNachname ||
                          !neuesGeburtsdatum ||
                          !neueTrikotNummer ||
                          !neuePosition ||
                          saving
                        }
                      >
                        {saving ? "Wird erstellt..." : "Spieler erstellen & hinzufügen"}
                      </Button>
                    </DialogFooter>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {blankettSpieler.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">Keine Spieler hinzugefügt</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Fügen Sie Spieler hinzu, um das Blankett zu vervollständigen.
              </p>
              {isEditable && (!isFristAbgelaufen || isAdmin) && (
                <Button variant="outline" className="mt-4" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Spieler hinzufügen
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Nr.</TableHead>
                    <TableHead>Spieler</TableHead>
                    <TableHead>Position</TableHead>
                    {isEditable && (!isFristAbgelaufen || isAdmin) && (
                      <TableHead className="w-24 text-right">Aktionen</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blankettSpieler.map((spieler) => (
                    <TableRow key={spieler.id}>
                      <TableCell className="font-bold text-center">{spieler.trikot_nummer}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={spieler.spieler?.profilbild_url || ""} alt={spieler.spieler?.vorname} />
                            <AvatarFallback>
                              {getInitials(`${spieler.spieler?.vorname} ${spieler.spieler?.nachname}`)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {spieler.spieler?.vorname} {spieler.spieler?.nachname}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {spieler.spieler?.geburtsdatum && formatDate(spieler.spieler.geburtsdatum)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-1 text-muted-foreground" />
                          {spieler.position}
                        </div>
                      </TableCell>
                      {isEditable && (!isFristAbgelaufen || isAdmin) && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditSpieler(spieler)}
                              disabled={saving}
                              className="h-8 w-8"
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSpieler(spieler.spieler_id)}
                              disabled={saving}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog zum Bearbeiten eines Spielers */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spieler bearbeiten</DialogTitle>
            <DialogDescription>Ändern Sie die Trikotnummer oder Position des Spielers.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {editingSpieler && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/20">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={editingSpieler.spieler?.profilbild_url || ""}
                    alt={editingSpieler.spieler?.vorname}
                  />
                  <AvatarFallback>
                    {getInitials(`${editingSpieler.spieler?.vorname} ${editingSpieler.spieler?.nachname}`)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {editingSpieler.spieler?.vorname} {editingSpieler.spieler?.nachname}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {editingSpieler.spieler?.geburtsdatum && formatDate(editingSpieler.spieler.geburtsdatum)}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trikot-edit">Trikotnummer</Label>
                <Input
                  id="trikot-edit"
                  type="number"
                  min="1"
                  max="99"
                  value={trikotNummer}
                  onChange={(e) => setTrikotNummer(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position-edit">Position</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger id="position-edit">
                    <SelectValue placeholder="Position auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Torwart">Torwart</SelectItem>
                    <SelectItem value="Abwehr">Abwehr</SelectItem>
                    <SelectItem value="Mittelfeld">Mittelfeld</SelectItem>
                    <SelectItem value="Sturm">Sturm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdateSpieler} disabled={!trikotNummer || !position || saving}>
              {saving ? "Wird aktualisiert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col sm:flex-row gap-3 justify-end mt-8">
        <Button asChild variant="outline">
          <Link href={`/teams/${team.id}/blankett`}>Zurück</Link>
        </Button>

        {isEditable && (!isFristAbgelaufen || isAdmin) && (
          <Button
            onClick={handleSaveBlankett}
            disabled={saving}
            className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
          >
            <Save className="mr-2 h-4 w-4" />
            Blankett speichern
          </Button>
        )}
      </div>
    </div>
  )
}
