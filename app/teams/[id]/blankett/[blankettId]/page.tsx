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
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Send,
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
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
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
    if (!blankett) return

    try {
      setSaving(true)
      setError(null)

      // Blankett speichern
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
      setSaving(false)
    }
  }

  const handleSubmitBlankett = async () => {
    if (!blankett || !settings) return

    // Prüfen, ob die Mindestanzahl an Spielern erreicht ist
    if (settings.min_spieler > blankettSpieler.length) {
      setError(`Es müssen mindestens ${settings.min_spieler} Spieler hinzugefügt werden.`)
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      // Blankett einreichen
      const { error } = await supabase
        .from("blankett_entries")
        .update({
          status: "eingereicht",
          eingereicht_am: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", blankett.id)

      if (error) throw error

      // Blankett aktualisieren
      setBlankett({
        ...blankett,
        status: "eingereicht",
        eingereicht_am: new Date().toISOString(),
      })

      setSuccess("Blankett erfolgreich eingereicht.")
      setShowSubmitDialog(false)
      setTimeout(() => {
        router.push(`/teams/${team?.id}`)
      }, 2000)
    } catch (error: any) {
      console.error("Fehler beim Einreichen des Blanketts:", error)
      setError(error.message)
    } finally {
      setSubmitting(false)
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
  const isEditable = user?.rolle === "Admin" || blankett.status === "entwurf" || blankett.status === "abgelehnt"

  // Prüfen, ob die Frist abgelaufen ist
  const isFristAbgelaufen = countdown?.expired || false

  // Prüfen, ob der Benutzer ein Administrator ist
  const isAdmin = user?.rolle === "Admin"

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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Spieler hinzufügen</DialogTitle>
                  <DialogDescription>
                    Wählen Sie einen Spieler aus und weisen Sie ihm eine Trikotnummer und Position zu.
                  </DialogDescription>
                </DialogHeader>

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
          <>
            <Button
              onClick={handleSaveBlankett}
              variant="outline"
              disabled={saving}
              className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
            >
              <Save className="mr-2 h-4 w-4" />
              Speichern
            </Button>

            <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
              <DialogTrigger asChild>
                <Button
                  disabled={blankettSpieler.length < (settings?.min_spieler || 0) || submitting}
                  className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Blankett einreichen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Blankett einreichen</DialogTitle>
                  <DialogDescription>
                    Sind Sie sicher, dass Sie das Blankett einreichen möchten? Nach dem Einreichen kann es nicht mehr
                    bearbeitet werden.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="rounded-md bg-secondary/20 p-3 text-sm">
                    <p>
                      <strong>Team:</strong> {team.name}
                    </p>
                    <p>
                      <strong>Turnier:</strong> {tournament.name}
                    </p>
                    <p>
                      <strong>Spieler:</strong> {blankettSpieler.length} von {settings?.max_spieler || "?"}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleSubmitBlankett}
                    disabled={submitting}
                    className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                  >
                    {submitting ? "Wird eingereicht..." : "Ja, einreichen"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  )
}
