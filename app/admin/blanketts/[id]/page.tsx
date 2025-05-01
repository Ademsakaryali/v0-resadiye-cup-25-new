"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/context/auth-context"
import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Trash2,
  AlertCircle,
  CheckCircle,
  UserIcon,
  Shield,
  Lock,
  Unlock,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AdminBlankettPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [team, setTeam] = useState(null)
  const [tournament, setTournament] = useState(null)
  const [blankett, setBlankett] = useState(null)
  const [settings, setSettings] = useState(null)
  const [blankettSpieler, setBlankettSpieler] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showLockDialog, setShowLockDialog] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Blankett abrufen
        const { data: blankettData, error: blankettError } = await supabase
          .from("blankett_entries")
          .select("*")
          .eq("id", params.id)
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
          .eq("blankett_id", params.id)
          .order("trikot_nummer", { ascending: true })

        if (spielerError) throw spielerError

        setBlankettSpieler(spielerData)
      } catch (error) {
        console.error("Fehler beim Laden der Daten:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, params.id, router])

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

  const handleApproveBlankett = async () => {
    if (!blankett) return

    try {
      setSaving(true)
      setError(null)

      // Blankett genehmigen
      const { error } = await supabase
        .from("blankett_entries")
        .update({
          status: "genehmigt",
          genehmigt_am: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", blankett.id)

      if (error) throw error

      // Spieler in den offiziellen Mannschaftskader übernehmen
      for (const spieler of blankettSpieler) {
        // Prüfen, ob der Spieler bereits im Kader ist
        const { data: existingData, error: existingError } = await supabase
          .from("team_spieler")
          .select("*")
          .eq("team_id", blankett.team_id)
          .eq("spieler_id", spieler.spieler_id)
          .maybeSingle()

        if (existingError) throw existingError

        // Wenn der Spieler noch nicht im Kader ist, hinzufügen
        if (!existingData) {
          const { error: insertError } = await supabase.from("team_spieler").insert({
            team_id: blankett.team_id,
            spieler_id: spieler.spieler_id,
            position: spieler.position,
            trikot_nummer: spieler.trikot_nummer,
          })

          if (insertError) throw insertError
        } else {
          // Wenn der Spieler bereits im Kader ist, aktualisieren
          const { error: updateError } = await supabase
            .from("team_spieler")
            .update({
              position: spieler.position,
              trikot_nummer: spieler.trikot_nummer,
            })
            .eq("id", existingData.id)

          if (updateError) throw updateError
        }
      }

      // Blankett aktualisieren
      setBlankett({
        ...blankett,
        status: "genehmigt",
        genehmigt_am: new Date().toISOString(),
      })

      setSuccess("Blankett erfolgreich genehmigt und Spieler in den Mannschaftskader übernommen.")
      setShowSubmitDialog(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Fehler beim Genehmigen des Blanketts:", error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRejectBlankett = async () => {
    if (!blankett) return

    try {
      setSaving(true)
      setError(null)

      // Blankett ablehnen
      const { error } = await supabase
        .from("blankett_entries")
        .update({
          status: "abgelehnt",
          genehmigt_am: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", blankett.id)

      if (error) throw error

      // Blankett aktualisieren
      setBlankett({
        ...blankett,
        status: "abgelehnt",
        genehmigt_am: null,
      })

      setSuccess("Blankett erfolgreich abgelehnt.")
      setShowRejectDialog(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Fehler beim Ablehnen des Blanketts:", error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBlankett = async () => {
    if (!blankett) return

    try {
      setSaving(true)
      setError(null)

      // Zuerst alle Blankett-Spieler löschen
      const { error: spielerError } = await supabase.from("blankett_spieler").delete().eq("blankett_id", blankett.id)

      if (spielerError) throw spielerError

      // Dann das Blankett löschen
      const { error } = await supabase.from("blankett_entries").delete().eq("id", blankett.id)

      if (error) throw error

      setSuccess("Blankett erfolgreich gelöscht.")
      setShowDeleteDialog(false)
      setTimeout(() => {
        router.push("/admin/dashboard")
      }, 2000)
    } catch (error) {
      console.error("Fehler beim Löschen des Blanketts:", error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleLockBlankett = async () => {
    if (!blankett) return

    try {
      setSaving(true)
      setError(null)

      const newIsLocked = !blankett.is_locked

      // Blankett sperren/entsperren
      const { error } = await supabase
        .from("blankett_entries")
        .update({
          is_locked: newIsLocked,
          updated_at: new Date().toISOString(),
        })
        .eq("id", blankett.id)

      if (error) throw error

      // Blankett aktualisieren
      setBlankett({
        ...blankett,
        is_locked: newIsLocked,
      })

      setSuccess(newIsLocked ? "Blankett erfolgreich gesperrt." : "Blankett erfolgreich entsperrt.")
      setShowLockDialog(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Fehler beim Sperren/Entsperren des Blanketts:", error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Unbekannt"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  const getInitials = (name) => {
    if (!name) return ""
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Prüfen, ob die Frist abgelaufen ist
  const isFristAbgelaufen = countdown?.expired || false

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
              <Link href="/admin/dashboard">Zurück zum Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <RequireAuth allowedRoles={["Admin"]}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6">
          <Button asChild className="mb-4">
            <Link href="/admin/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Dashboard
            </Link>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Mannschaftsblankett (Admin)</h1>
              <p className="text-muted-foreground mt-1">
                {team.name} - {tournament.name}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Badge
                className={`${
                  blankett.status === "genehmigt"
                    ? "bg-green-600"
                    : blankett.status === "abgelehnt"
                      ? "bg-destructive"
                      : "bg-secondary"
                }`}
              >
                {blankett.status === "genehmigt" && <CheckCircle className="h-3 w-3 mr-1" />}
                {blankett.status === "abgelehnt" && <AlertCircle className="h-3 w-3 mr-1" />}
                {blankett.status.charAt(0).toUpperCase() + blankett.status.slice(1)}
              </Badge>
              {blankett.is_locked && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  <Lock className="h-3 w-3 mr-1" />
                  Gesperrt
                </Badge>
              )}
            </div>
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
                      <span className="font-mono text-xl font-bold">
                        {countdown.minutes.toString().padStart(2, "0")}
                      </span>
                      <span className="text-xs text-blue-600 dark:text-blue-400">Min</span>
                    </div>
                    <div className="flex flex-col p-2 bg-white dark:bg-gray-800 rounded-md text-blue-800 dark:text-blue-200">
                      <span className="font-mono text-xl font-bold">
                        {countdown.seconds.toString().padStart(2, "0")}
                      </span>
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
                {blankett.genehmigt_am && (
                  <div className="flex items-center p-2 rounded-md bg-secondary/20 text-sm">
                    <CheckCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Genehmigt am: {formatDate(blankett.genehmigt_am)}</span>
                  </div>
                )}
                <div className="flex items-center p-2 rounded-md bg-secondary/20 text-sm">
                  <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    Trainer: {team.trainer?.vorname} {team.trainer?.nachname}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Spielerliste</CardTitle>
            <CardDescription>
              {blankettSpieler.length} von {settings?.max_spieler || "?"} Spielern
            </CardDescription>
          </CardHeader>
          <CardContent>
            {blankettSpieler.length === 0 ? (
              <div className="text-center py-8">
                <UserIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium">Keine Spieler hinzugefügt</h3>
                <p className="mt-1 text-sm text-muted-foreground">Dieses Blankett enthält keine Spieler.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Nr.</TableHead>
                      <TableHead>Spieler</TableHead>
                      <TableHead>Position</TableHead>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-end mt-8">
          <Button asChild>
            <Link href="/admin/dashboard">Zurück</Link>
          </Button>

          <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
            <DialogTrigger asChild>
              <Button className={blankett.is_locked ? "bg-green-600" : "bg-yellow-600"}>
                {blankett.is_locked ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                {blankett.is_locked ? "Entsperren" : "Sperren"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{blankett.is_locked ? "Blankett entsperren" : "Blankett sperren"}</DialogTitle>
                <DialogDescription>
                  {blankett.is_locked
                    ? "Sind Sie sicher, dass Sie das Blankett entsperren möchten? Der Trainer kann es dann wieder bearbeiten."
                    : "Sind Sie sicher, dass Sie das Blankett sperren möchten? Der Trainer kann es dann nicht mehr bearbeiten."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setShowLockDialog(false)}>Abbrechen</Button>
                <Button
                  onClick={handleToggleLockBlankett}
                  disabled={saving}
                  className={blankett.is_locked ? "bg-green-600" : "bg-yellow-600"}
                >
                  {saving
                    ? blankett.is_locked
                      ? "Wird entsperrt..."
                      : "Wird gesperrt..."
                    : blankett.is_locked
                      ? "Entsperren"
                      : "Sperren"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button className="bg-destructive text-destructive-foreground">
                <Trash2 className="mr-2 h-4 w-4" />
                Blankett löschen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Blankett löschen</DialogTitle>
                <DialogDescription>
                  Sind Sie sicher, dass Sie dieses Blankett löschen möchten? Diese Aktion kann nicht rückgängig gemacht
                  werden.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setShowDeleteDialog(false)}>Abbrechen</Button>
                <Button className="bg-destructive" onClick={handleDeleteBlankett} disabled={saving}>
                  {saving ? "Wird gelöscht..." : "Löschen"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <ThumbsUp className="mr-2 h-4 w-4" />
                Genehmigen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Blankett genehmigen</DialogTitle>
                <DialogDescription>
                  Sind Sie sicher, dass Sie dieses Blankett genehmigen möchten? Die Spieler werden in den offiziellen
                  Mannschaftskader übernommen.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setShowSubmitDialog(false)}>Abbrechen</Button>
                <Button className="bg-green-600" onClick={handleApproveBlankett} disabled={saving}>
                  {saving ? "Wird genehmigt..." : "Genehmigen"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <ThumbsDown className="mr-2 h-4 w-4" />
                Ablehnen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Blankett ablehnen</DialogTitle>
                <DialogDescription>Sind Sie sicher, dass Sie dieses Blankett ablehnen möchten?</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setShowRejectDialog(false)}>Abbrechen</Button>
                <Button className="bg-red-600" onClick={handleRejectBlankett} disabled={saving}>
                  {saving ? "Wird abgelehnt..." : "Ablehnen"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </RequireAuth>
  )
}
