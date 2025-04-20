"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Team, Tournament, BlankettEntry, BlankettSettings, User, BlankettSpieler } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Info,
  Users,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Shield,
  UserPlus,
  ExternalLink,
} from "lucide-react"

export default function BlankettDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<Team | null>(null)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [blankett, setBlankett] = useState<BlankettEntry | null>(null)
  const [settings, setSettings] = useState<BlankettSettings | null>(null)
  const [blankettSpieler, setBlankettSpieler] = useState<BlankettSpieler[]>([])
  const [teamSpieler, setTeamSpieler] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedSpielerId, setSelectedSpielerId] = useState<string>("")
  const [trikotNummer, setTrikotNummer] = useState<string>("")
  const [position, setPosition] = useState<string>("")
  const [availableSpieler, setAvailableSpieler] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<string>("existing")
  const [newSpielerData, setNewSpielerData] = useState({
    vorname: "",
    nachname: "",
    email: "",
    geburtsdatum: "",
    telefonnummer: "",
    profilbild_url: "",
  })
  const [isCreatingSpieler, setIsCreatingSpieler] = useState(false)
  const [countdown, setCountdown] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    expired: boolean
  } | null>(null)

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
          .eq("id", params.id)
          .single()

        if (teamError) throw teamError

        // Prüfen, ob der Benutzer berechtigt ist
        if (user?.rolle !== "Admin" && (user?.rolle !== "Trainer" || user.id !== teamData.trainer_id)) {
          router.push(`/teams/${params.id}`)
          return
        }

        setTeam(teamData)

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
          .maybeSingle()

        if (settingsError) throw settingsError

        // Wenn keine Einstellungen vorhanden sind, Standardeinstellungen verwenden
        if (!settingsData) {
          setSettings({
            id: "",
            tournament_id: blankettData.tournament_id,
            min_spieler: 11,
            max_spieler: 20,
            ohne_anmeldung: false,
            countdown_aktiv: false,
            countdown_datum: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        } else {
          setSettings(settingsData)
        }

        // Blankett-Spieler abrufen
        const { data: blankettSpielerData, error: blankettSpielerError } = await supabase
          .from("blankett_spieler")
          .select(`
            *,
            spieler:spieler_id (
              id,
              vorname,
              nachname,
              email,
              geburtsdatum,
              telefonnummer,
              profilbild_url
            )
          `)
          .eq("blankett_id", params.blankettId)

        if (blankettSpielerError) throw blankettSpielerError

        setBlankettSpieler(blankettSpielerData)

        // Team-Spieler abrufen
        const { data: teamSpielerData, error: teamSpielerError } = await supabase
          .from("team_spieler")
          .select(`
            spieler:spieler_id (
              id,
              vorname,
              nachname,
              email,
              geburtsdatum,
              telefonnummer,
              profilbild_url
            )
          `)
          .eq("team_id", params.id)

        if (teamSpielerError) throw teamSpielerError

        const spielerList = teamSpielerData.map((item: any) => item.spieler)
        setTeamSpieler(spielerList)

        // Verfügbare Spieler berechnen (Spieler im Team, die noch nicht im Blankett sind)
        updateAvailableSpieler(spielerList, blankettSpielerData)
      } catch (error: any) {
        console.error("Fehler beim Laden der Daten:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, params.id, params.blankettId, router, user])

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

  const updateAvailableSpieler = (allSpieler: User[], blankettSpielerList: BlankettSpieler[]) => {
    const blankettSpielerIds = blankettSpielerList.map((bs) => bs.spieler_id)
    const available = allSpieler.filter((spieler) => !blankettSpielerIds.includes(spieler.id))
    setAvailableSpieler(available)
  }

  const handleNewSpielerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewSpielerData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateSpieler = async () => {
    if (!blankett) return

    setIsCreatingSpieler(true)
    setError(null)

    try {
      // Validierung
      if (!newSpielerData.vorname || !newSpielerData.nachname) {
        throw new Error("Bitte geben Sie mindestens Vor- und Nachname ein.")
      }

      if (!trikotNummer || !position) {
        throw new Error("Bitte geben Sie Trikotnummer und Position an.")
      }

      // Prüfen, ob die Trikotnummer bereits vergeben ist
      const existingWithNumber = blankettSpieler.find((bs) => bs.trikot_nummer.toString() === trikotNummer)
      if (existingWithNumber) {
        throw new Error(`Die Trikotnummer ${trikotNummer} ist bereits vergeben.`)
      }

      // Spieler erstellen
      const { data: spielerData, error: spielerError } = await supabase
        .from("users")
        .insert({
          vorname: newSpielerData.vorname,
          nachname: newSpielerData.nachname,
          email: newSpielerData.email || null,
          geburtsdatum: newSpielerData.geburtsdatum || null,
          telefonnummer: newSpielerData.telefonnummer || null,
          profilbild_url: newSpielerData.profilbild_url || null,
          rolle: "Spieler",
          ist_aktiv: true,
          password_hash: "$2a$10$GQKrHGJHQoLgDQPYxvOHWuZ7vC0MpYSBFPlOqZcaPBNKwaUnMJDE2", // Standard-Passwort: "spieler123"
        })
        .select()

      if (spielerError) throw spielerError

      const newSpielerId = spielerData[0].id

      // Spieler zum Team hinzufügen
      const { error: teamSpielerError } = await supabase.from("team_spieler").insert({
        team_id: team?.id,
        spieler_id: newSpielerId,
      })

      if (teamSpielerError) throw teamSpielerError

      // Spieler zum Blankett hinzufügen
      const { data: blankettSpielerData, error: blankettSpielerError } = await supabase
        .from("blankett_spieler")
        .insert({
          blankett_id: blankett.id,
          spieler_id: newSpielerId,
          trikot_nummer: Number.parseInt(trikotNummer),
          position: position,
        })
        .select(`
          *,
          spieler:spieler_id (
            id,
            vorname,
            nachname,
            email,
            geburtsdatum,
            telefonnummer,
            profilbild_url
          )
        `)

      if (blankettSpielerError) throw blankettSpielerError

      // Blankett-Spieler und Team-Spieler aktualisieren
      const newSpieler = {
        id: newSpielerId,
        vorname: newSpielerData.vorname,
        nachname: newSpielerData.nachname,
        email: newSpielerData.email || "",
        geburtsdatum: newSpielerData.geburtsdatum || "",
        telefonnummer: newSpielerData.telefonnummer || "",
        profilbild_url: newSpielerData.profilbild_url || "",
        rolle: "Spieler",
        ist_aktiv: true,
      }

      setTeamSpieler([...teamSpieler, newSpieler])
      setBlankettSpieler([...blankettSpieler, blankettSpielerData[0]])

      // Dialog schließen und Formular zurücksetzen
      setShowAddDialog(false)
      setNewSpielerData({
        vorname: "",
        nachname: "",
        email: "",
        geburtsdatum: "",
        telefonnummer: "",
        profilbild_url: "",
      })
      setTrikotNummer("")
      setPosition("")
      setActiveTab("existing")

      setSuccess("Spieler erfolgreich erstellt und hinzugefügt.")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Fehler beim Erstellen des Spielers:", error)
      setError(error.message)
    } finally {
      setIsCreatingSpieler(false)
    }
  }

  const handleAddSpieler = async () => {
    if (!selectedSpielerId || !trikotNummer || !position || !blankett) {
      setError("Bitte füllen Sie alle Felder aus.")
      return
    }

    try {
      // Prüfen, ob die Trikotnummer bereits vergeben ist
      const existingWithNumber = blankettSpieler.find((bs) => bs.trikot_nummer.toString() === trikotNummer)
      if (existingWithNumber) {
        setError(`Die Trikotnummer ${trikotNummer} ist bereits vergeben.`)
        return
      }

      // Spieler zum Blankett hinzufügen
      const { data, error } = await supabase
        .from("blankett_spieler")
        .insert({
          blankett_id: blankett.id,
          spieler_id: selectedSpielerId,
          trikot_nummer: Number.parseInt(trikotNummer),
          position: position,
        })
        .select(`
          *,
          spieler:spieler_id (
            id,
            vorname,
            nachname,
            email,
            geburtsdatum,
            profilbild_url
          )
        `)

      if (error) throw error

      // Blankett-Spieler aktualisieren
      setBlankettSpieler([...blankettSpieler, data[0]])

      // Verfügbare Spieler aktualisieren
      setAvailableSpieler(availableSpieler.filter((spieler) => spieler.id !== selectedSpielerId))

      // Dialog schließen und Formular zurücksetzen
      setShowAddDialog(false)
      setSelectedSpielerId("")
      setTrikotNummer("")
      setPosition("")

      setSuccess("Spieler erfolgreich hinzugefügt.")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Fehler beim Hinzufügen des Spielers:", error)
      setError(error.message)
    }
  }

  const handleRemoveSpieler = async (spielerId: string) => {
    if (!blankett) return

    try {
      // Spieler aus dem Blankett entfernen
      const { error } = await supabase
        .from("blankett_spieler")
        .delete()
        .eq("blankett_id", blankett.id)
        .eq("spieler_id", spielerId)

      if (error) throw error

      // Blankett-Spieler aktualisieren
      const updatedBlankettSpieler = blankettSpieler.filter((bs) => bs.spieler_id !== spielerId)
      setBlankettSpieler(updatedBlankettSpieler)

      // Verfügbare Spieler aktualisieren
      const removedSpieler = teamSpieler.find((spieler) => spieler.id === spielerId)
      if (removedSpieler) {
        setAvailableSpieler([...availableSpieler, removedSpieler])
      }

      setSuccess("Spieler erfolgreich entfernt.")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Fehler beim Entfernen des Spielers:", error)
      setError(error.message)
    }
  }

  const handleSaveBlankett = async () => {
    if (!blankett) return

    try {
      setIsSaving(true)

      // Blankett speichern (Status bleibt "entwurf")
      const { error } = await supabase
        .from("blankett_entries")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", blankett.id)

      if (error) throw error

      setSuccess("Blankett erfolgreich gespeichert.")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Fehler beim Speichern des Blanketts:", error)
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmitBlankett = async () => {
    if (!blankett || !settings) return

    try {
      setIsSubmitting(true)

      // Prüfen, ob die Mindestanzahl an Spielern erreicht ist
      if (blankettSpieler.length < settings.min_spieler) {
        throw new Error(`Es müssen mindestens ${settings.min_spieler} Spieler im Blankett sein.`)
      }

      // Blankett einreichen
      const { error } = await supabase
        .from("blankett_entries")
        .update({
          status: "eingereicht",
          eingereicht_am: new Date().toISOString(),
        })
        .eq("id", blankett.id)

      if (error) throw error

      // Benachrichtigung senden
      try {
        await fetch("/api/notifications/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "blankett_submitted",
            blankett_id: blankett.id,
          }),
        })
      } catch (notificationError) {
        console.error("Fehler beim Senden der Benachrichtigung:", notificationError)
        // Wir werfen hier keinen Fehler, da die Benachrichtigung optional ist
      }

      // Blankett aktualisieren
      setBlankett({
        ...blankett,
        status: "eingereicht",
        eingereicht_am: new Date().toISOString(),
      })

      setSuccess("Blankett erfolgreich eingereicht.")
    } catch (error: any) {
      console.error("Fehler beim Einreichen des Blanketts:", error)
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

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "Unbekannt"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return "Unbekannt"
    const birthDate = new Date(birthDateString)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDifference = today.getMonth() - birthDate.getMonth()

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "entwurf":
        return (
          <Badge variant="outline" className="bg-white/50 dark:bg-gray-800/50">
            Entwurf
          </Badge>
        )
      case "eingereicht":
        return <Badge variant="secondary">Eingereicht</Badge>
      case "genehmigt":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle className="h-3 w-3 mr-1" /> Genehmigt
          </Badge>
        )
      case "abgelehnt":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" /> Abgelehnt
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const canEditBlankett = () => {
    if (!blankett) return false
    return blankett.status === "entwurf" || blankett.status === "abgelehnt"
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
              <Link href={`/teams/${params.id}`}>Zurück zum Team</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="mb-4">
        <Button variant="ghost" asChild className="mb-2">
          <Link href={`/teams/${team.id}/blankett`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Blankett-Übersicht
          </Link>
        </Button>
      </div>

      {/* Countdown-Banner mit digitalem Timer */}
      {settings && settings.countdown_aktiv && settings.countdown_datum && countdown && (
        <Card className="mb-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="flex items-center mb-2 sm:mb-0">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-300">Frist für Einreichung</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Deadline: {formatDateTime(settings.countdown_datum)}
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

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Erfolg</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Mannschaftsblankett</h2>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">Status: {getStatusBadge(blankett.status)}</p>
              {blankett.eingereicht_am && (
                <p className="text-xs text-muted-foreground">Eingereicht am: {formatDate(blankett.eingereicht_am)}</p>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {tournament.name} | {team.name}
          </p>
        </div>
        {canEditBlankett() && (
          <div className="flex gap-2">
            <Button onClick={handleSaveBlankett} variant="outline" disabled={isSaving} className="text-sm">
              <Save className="mr-2 h-4 w-4" />
              Speichern
            </Button>
            <Button
              onClick={handleSubmitBlankett}
              disabled={isSubmitting || (settings && blankettSpieler.length < settings.min_spieler)}
              className="bg-primary-600 hover:bg-primary-700 text-sm"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Einreichen
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Informationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Team</h3>
              <p className="text-base font-medium">{team.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Turnier</h3>
              <p className="text-base font-medium">{tournament.name}</p>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  {formatDate(tournament.start_datum)} - {formatDate(tournament.end_datum)}
                </span>
              </div>
            </div>
            {settings && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Blankett-Einstellungen</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">Min. Spieler:</span> {settings.min_spieler}
                  </div>
                  <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">Max. Spieler:</span> {settings.max_spieler}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Spielerliste</CardTitle>
              <CardDescription>
                {blankettSpieler.length} von {settings?.max_spieler || "unbegrenzt"} Spielern
                {settings && <span className="text-gray-500 dark:text-gray-400"> (min. {settings.min_spieler})</span>}
              </CardDescription>
            </div>
            {canEditBlankett() && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-gray-100 dark:bg-gray-800"
                    disabled={settings && blankettSpieler.length >= settings.max_spieler}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Spieler hinzufügen
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Spieler zum Blankett hinzufügen</DialogTitle>
                    <DialogDescription>
                      Fügen Sie einen bestehenden Spieler hinzu oder erstellen Sie einen neuen Spieler.
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="existing">Bestehender Spieler</TabsTrigger>
                      <TabsTrigger value="new">Neuer Spieler</TabsTrigger>
                    </TabsList>

                    <TabsContent value="existing" className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Spieler</label>
                        <Select value={selectedSpielerId} onValueChange={setSelectedSpielerId}>
                          <SelectTrigger className="bg-white dark:bg-gray-800">
                            <SelectValue placeholder="Spieler auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSpieler.length === 0 ? (
                              <div className="p-2 text-center text-gray-500 dark:text-gray-400">
                                Keine verfügbaren Spieler
                              </div>
                            ) : (
                              availableSpieler.map((spieler) => (
                                <SelectItem key={spieler.id} value={spieler.id}>
                                  {`${spieler.vorname} ${spieler.nachname}`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Trikotnummer</label>
                        <Input
                          type="number"
                          min="1"
                          max="99"
                          value={trikotNummer}
                          onChange={(e) => setTrikotNummer(e.target.value)}
                          className="bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Position</label>
                        <Select value={position} onValueChange={setPosition}>
                          <SelectTrigger className="bg-white dark:bg-gray-800">
                            <SelectValue placeholder="Position auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Torwart">Torwart</SelectItem>
                            <SelectItem value="Verteidiger">Verteidiger</SelectItem>
                            <SelectItem value="Mittelfeld">Mittelfeld</SelectItem>
                            <SelectItem value="Stürmer">Stürmer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                          Abbrechen
                        </Button>
                        <Button onClick={handleAddSpieler} disabled={!selectedSpielerId || !trikotNummer || !position}>
                          Hinzufügen
                        </Button>
                      </DialogFooter>
                    </TabsContent>

                    <TabsContent value="new" className="space-y-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vorname">Vorname *</Label>
                          <Input
                            id="vorname"
                            name="vorname"
                            value={newSpielerData.vorname}
                            onChange={handleNewSpielerChange}
                            required
                            className="bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nachname">Nachname *</Label>
                          <Input
                            id="nachname"
                            name="nachname"
                            value={newSpielerData.nachname}
                            onChange={handleNewSpielerChange}
                            required
                            className="bg-white dark:bg-gray-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">E-Mail</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={newSpielerData.email}
                          onChange={handleNewSpielerChange}
                          className="bg-white dark:bg-gray-800"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="geburtsdatum">Geburtsdatum</Label>
                          <Input
                            id="geburtsdatum"
                            name="geburtsdatum"
                            type="date"
                            value={newSpielerData.geburtsdatum}
                            onChange={handleNewSpielerChange}
                            className="bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="telefonnummer">Telefonnummer</Label>
                          <Input
                            id="telefonnummer"
                            name="telefonnummer"
                            value={newSpielerData.telefonnummer}
                            onChange={handleNewSpielerChange}
                            className="bg-white dark:bg-gray-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profilbild_url">Profilbild URL</Label>
                        <Input
                          id="profilbild_url"
                          name="profilbild_url"
                          type="url"
                          value={newSpielerData.profilbild_url}
                          onChange={handleNewSpielerChange}
                          placeholder="https://beispiel.com/bild.jpg"
                          className="bg-white dark:bg-gray-800"
                        />
                        {newSpielerData.profilbild_url && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                              <Image
                                src={newSpielerData.profilbild_url || "/placeholder.svg"}
                                alt="Profilbild Vorschau"
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/diverse-group-city.png"
                                }}
                              />
                            </div>
                            <a
                              href={newSpielerData.profilbild_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 flex items-center"
                            >
                              Vorschau <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-trikot">Trikotnummer *</Label>
                          <Input
                            id="new-trikot"
                            type="number"
                            min="1"
                            max="99"
                            value={trikotNummer}
                            onChange={(e) => setTrikotNummer(e.target.value)}
                            required
                            className="bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-position">Position *</Label>
                          <Select value={position} onValueChange={setPosition}>
                            <SelectTrigger id="new-position" className="bg-white dark:bg-gray-800">
                              <SelectValue placeholder="Position auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Torwart">Torwart</SelectItem>
                              <SelectItem value="Verteidiger">Verteidiger</SelectItem>
                              <SelectItem value="Mittelfeld">Mittelfeld</SelectItem>
                              <SelectItem value="Stürmer">Stürmer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                          Abbrechen
                        </Button>
                        <Button
                          onClick={handleCreateSpieler}
                          disabled={
                            isCreatingSpieler ||
                            !newSpielerData.vorname ||
                            !newSpielerData.nachname ||
                            !trikotNummer ||
                            !position
                          }
                        >
                          {isCreatingSpieler ? (
                            <>
                              <LoadingSpinner className="mr-2 h-4 w-4" />
                              Wird erstellt...
                            </>
                          ) : (
                            <>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Spieler erstellen
                            </>
                          )}
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
              <div className="text-center py-6">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">Keine Spieler</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Diesem Blankett sind noch keine Spieler zugeordnet.
                </p>
                {canEditBlankett() && (
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
                      <TableHead>Spieler</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Trikotnummer</TableHead>
                      <TableHead>Alter</TableHead>
                      {canEditBlankett() && <TableHead className="w-[80px]">Aktionen</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blankettSpieler.map((bs) => (
                      <TableRow key={bs.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
                              <AvatarImage src={bs.spieler?.profilbild_url || ""} alt={bs.spieler?.vorname} />
                              <AvatarFallback className="bg-gray-100 dark:bg-gray-800">{`${bs.spieler?.vorname.charAt(0)}${bs.spieler?.nachname.charAt(0)}`}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{`${bs.spieler?.vorname} ${bs.spieler?.nachname}`}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{bs.spieler?.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 mr-1 text-gray-400" />
                            {bs.position}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-white/50 dark:bg-gray-800/50">
                            {bs.trikot_nummer}
                          </Badge>
                        </TableCell>
                        <TableCell>{bs.spieler?.geburtsdatum ? calculateAge(bs.spieler.geburtsdatum) : "-"}</TableCell>
                        {canEditBlankett() && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => handleRemoveSpieler(bs.spieler_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
      </div>

      {settings && blankettSpieler.length < settings.min_spieler && canEditBlankett() && (
        <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Hinweis</AlertTitle>
          <AlertDescription>
            Sie müssen mindestens {settings.min_spieler} Spieler hinzufügen, um das Blankett einreichen zu können.
            Aktuell haben Sie {blankettSpieler.length} Spieler hinzugefügt.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
