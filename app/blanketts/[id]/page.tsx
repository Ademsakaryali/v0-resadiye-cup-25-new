"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Team, Tournament, BlankettEntry, BlankettSettings, BlankettSpieler } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Calendar, CheckCircle, AlertCircle, Shield, ThumbsUp, ThumbsDown, Info } from "lucide-react"

export default function AdminBlankettDetailPage() {
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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

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
          .maybeSingle()

        if (settingsError) throw settingsError

        setSettings(settingsData)

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
              profilbild_url
            )
          `)
          .eq("blankett_id", params.id)

        if (blankettSpielerError) throw blankettSpielerError

        setBlankettSpieler(blankettSpielerData)
      } catch (error: any) {
        console.error("Fehler beim Laden der Daten:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, params.id])

  const handleApproveBlankett = async () => {
    if (!blankett || !team || !tournament) return

    try {
      setIsSubmitting(true)

      // Blankett genehmigen
      const { error: updateError } = await supabase
        .from("blankett_entries")
        .update({
          status: "genehmigt",
          genehmigt_am: new Date().toISOString(),
        })
        .eq("id", blankett.id)

      if (updateError) throw updateError

      // Spieler aus dem Blankett in die team_spieler Tabelle übertragen
      for (const bs of blankettSpieler) {
        // Prüfen, ob der Spieler bereits im Team ist
        const { data: existingPlayer, error: checkError } = await supabase
          .from("team_spieler")
          .select("id")
          .eq("team_id", team.id)
          .eq("spieler_id", bs.spieler_id)
          .maybeSingle()

        if (checkError) throw checkError

        if (existingPlayer) {
          // Spieler aktualisieren
          const { error: updatePlayerError } = await supabase
            .from("team_spieler")
            .update({
              trikot_nummer: bs.trikot_nummer,
              position: bs.position,
            })
            .eq("team_id", team.id)
            .eq("spieler_id", bs.spieler_id)

          if (updatePlayerError) throw updatePlayerError
        } else {
          // Spieler hinzufügen
          const { error: insertPlayerError } = await supabase.from("team_spieler").insert({
            team_id: team.id,
            spieler_id: bs.spieler_id,
            trikot_nummer: bs.trikot_nummer,
            position: bs.position,
          })

          if (insertPlayerError) throw insertPlayerError
        }
      }

      // Blankett aktualisieren
      setBlankett({
        ...blankett,
        status: "genehmigt",
        genehmigt_am: new Date().toISOString(),
      })

      setSuccess("Blankett erfolgreich genehmigt und Spieler zum Team hinzugefügt.")
      setShowApproveDialog(false)
    } catch (error: any) {
      console.error("Fehler beim Genehmigen des Blanketts:", error)
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectBlankett = async () => {
    if (!blankett) return

    try {
      setIsSubmitting(true)

      // Blankett ablehnen
      const { error } = await supabase
        .from("blankett_entries")
        .update({
          status: "abgelehnt",
          genehmigt_am: null,
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
    } catch (error: any) {
      console.error("Fehler beim Ablehnen des Blanketts:", error)
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
          <Badge variant="outline" className="bg-background/50">
            Entwurf
          </Badge>
        )
      case "eingereicht":
        return <Badge variant="secondary">Eingereicht</Badge>
      case "genehmigt":
        return (
          <Badge variant="default" className="bg-green-600">
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

  const canApproveBlankett = () => {
    if (!blankett) return false
    return blankett.status === "eingereicht"
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
              <Link href="/blanketts">Zurück zur Blankett-Übersicht</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <RequireAuth allowedRoles={["Admin"]}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/blanketts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Blankett-Übersicht
            </Link>
          </Button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Mannschaftsblankett</h1>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-muted-foreground">Status: {getStatusBadge(blankett.status)}</p>
                {blankett.eingereicht_am && (
                  <p className="text-xs text-muted-foreground">Eingereicht am: {formatDate(blankett.eingereicht_am)}</p>
                )}
                {blankett.genehmigt_am && (
                  <p className="text-xs text-muted-foreground">Genehmigt am: {formatDate(blankett.genehmigt_am)}</p>
                )}
              </div>
            </div>
            {canApproveBlankett() && (
              <div className="flex gap-2">
                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                    >
                      <ThumbsDown className="mr-2 h-4 w-4" />
                      Ablehnen
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border border-border/50 backdrop-blur-sm">
                    <DialogHeader>
                      <DialogTitle>Blankett ablehnen</DialogTitle>
                      <DialogDescription>
                        Sind Sie sicher, dass Sie das Blankett ablehnen möchten? Das Team muss das Blankett erneut
                        einreichen.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Grund für die Ablehnung (optional)</label>
                        <Textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Geben Sie einen Grund für die Ablehnung an..."
                          className="bg-background/50"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                        Abbrechen
                      </Button>
                      <Button variant="destructive" onClick={handleRejectBlankett} disabled={isSubmitting}>
                        {isSubmitting ? "Wird abgelehnt..." : "Blankett ablehnen"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Genehmigen
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border border-border/50 backdrop-blur-sm">
                    <DialogHeader>
                      <DialogTitle>Blankett genehmigen</DialogTitle>
                      <DialogDescription>
                        Sind Sie sicher, dass Sie das Blankett genehmigen möchten? Die Spieler werden dem Team
                        zugeordnet.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                        Abbrechen
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={handleApproveBlankett}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Wird genehmigt..." : "Blankett genehmigen"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
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
          <Alert className="mb-6 bg-green-900/20 border-green-600/30 text-green-500">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Erfolg</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="border border-border/50 bg-card/50 backdrop-blur-sm lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl">Informationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Team</h3>
                <p className="text-base font-medium">{team.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Trainer</h3>
                {team.trainer ? (
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2 border border-primary/20">
                      <AvatarImage src={team.trainer.profilbild_url || ""} alt={team.trainer.vorname} />
                      <AvatarFallback className="bg-primary-900/50">{`${team.trainer.vorname.charAt(0)}${team.trainer.nachname.charAt(0)}`}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{`${team.trainer.vorname} ${team.trainer.nachname}`}</p>
                      <p className="text-xs text-muted-foreground">{team.trainer.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Kein Trainer zugewiesen</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Turnier</h3>
                <p className="text-base font-medium">{tournament.name}</p>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    {formatDate(tournament.start_datum)} - {formatDate(tournament.end_datum)}
                  </span>
                </div>
              </div>
              {settings && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Blankett-Einstellungen</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 rounded-md bg-secondary/20">
                      <span className="text-muted-foreground">Min. Spieler:</span> {settings.min_spieler}
                    </div>
                    <div className="p-2 rounded-md bg-secondary/20">
                      <span className="text-muted-foreground">Max. Spieler:</span> {settings.max_spieler}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/50 bg-card/50 backdrop-blur-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Spielerliste</CardTitle>
              <CardDescription>
                {blankettSpieler.length} Spieler im Blankett
                {settings && <span className="text-muted-foreground"> (min. {settings.min_spieler})</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blankettSpieler.length === 0 ? (
                <div className="text-center py-8">
                  <Info className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-medium">Keine Spieler</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Diesem Blankett sind noch keine Spieler zugeordnet.
                  </p>
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blankettSpieler.map((bs) => (
                        <TableRow key={bs.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-primary/20">
                                <AvatarImage src={bs.spieler?.profilbild_url || ""} alt={bs.spieler?.vorname} />
                                <AvatarFallback className="bg-primary-900/50">{`${bs.spieler?.vorname.charAt(0)}${bs.spieler?.nachname.charAt(0)}`}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{`${bs.spieler?.vorname} ${bs.spieler?.nachname}`}</p>
                                <p className="text-xs text-muted-foreground">{bs.spieler?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Shield className="h-4 w-4 mr-1 text-muted-foreground" />
                              {bs.position}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-background/50">
                              {bs.trikot_nummer}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {bs.spieler?.geburtsdatum ? calculateAge(bs.spieler.geburtsdatum) : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RequireAuth>
  )
}
