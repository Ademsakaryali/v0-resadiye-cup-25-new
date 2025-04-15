"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Team, Tournament, BlankettEntry, BlankettSettings } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, Calendar, Clock, FileText, Info, Trophy } from "lucide-react"

export default function TeamBlankettPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<Team | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<string>("")
  const [blanketts, setBlanketts] = useState<BlankettEntry[]>([])
  const [settings, setSettings] = useState<Record<string, BlankettSettings>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
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

        // Turniere abrufen, an denen das Team teilnimmt
        const { data: tournamentData, error: tournamentError } = await supabase
          .from("tournament_teams")
          .select(`
            tournament:tournament_id (
              id,
              name,
              start_datum,
              end_datum,
              ist_aktiv
            )
          `)
          .eq("team_id", params.id)

        if (tournamentError) throw tournamentError

        const activeTeamTournaments = tournamentData
          .map((item: any) => item.tournament)
          .filter((tournament: Tournament) => tournament.ist_aktiv)

        setTournaments(activeTeamTournaments)

        // Blanketts des Teams abrufen
        const { data: blankettData, error: blankettError } = await supabase
          .from("blankett_entries")
          .select("*")
          .eq("team_id", params.id)

        if (blankettError) throw blankettError

        setBlanketts(blankettData)

        // Blankett-Einstellungen für alle Turniere abrufen
        if (activeTeamTournaments.length > 0) {
          const tournamentIds = activeTeamTournaments.map((t: Tournament) => t.id)
          const { data: settingsData, error: settingsError } = await supabase
            .from("blankett_settings")
            .select("*")
            .in("tournament_id", tournamentIds)

          if (settingsError) throw settingsError

          const settingsMap: Record<string, BlankettSettings> = {}
          settingsData.forEach((setting: BlankettSettings) => {
            settingsMap[setting.tournament_id] = setting
          })
          setSettings(settingsMap)

          // Wenn es nur ein Turnier gibt, wähle es automatisch aus
          if (activeTeamTournaments.length === 1) {
            setSelectedTournament(activeTeamTournaments[0].id)
          }
        }
      } catch (error: any) {
        console.error("Fehler beim Laden der Daten:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, params.id, router, user])

  const getExistingBlankett = (tournamentId: string) => {
    return blanketts.find((b) => b.tournament_id === tournamentId)
  }

  const handleCreateBlankett = async () => {
    if (!selectedTournament || !team) return

    try {
      // Prüfen, ob bereits ein Blankett existiert
      const existingBlankett = getExistingBlankett(selectedTournament)

      if (existingBlankett) {
        // Zum bestehenden Blankett navigieren
        router.push(`/teams/${team.id}/blankett/${existingBlankett.id}`)
        return
      }

      // Neues Blankett erstellen
      const { data, error } = await supabase
        .from("blankett_entries")
        .insert({
          team_id: team.id,
          tournament_id: selectedTournament,
          status: "entwurf",
        })
        .select()

      if (error) throw error

      // Zum neuen Blankett navigieren
      router.push(`/teams/${team.id}/blankett/${data[0].id}`)
    } catch (error: any) {
      console.error("Fehler beim Erstellen des Blanketts:", error)
      setError(error.message)
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

  const getCountdownText = (tournamentId: string) => {
    const setting = settings[tournamentId]
    if (!setting || !setting.countdown_aktiv || !setting.countdown_datum) {
      return null
    }

    const countdownDate = new Date(setting.countdown_datum)
    const now = new Date()

    if (now > countdownDate) {
      return "Die Frist für die Einreichung ist abgelaufen."
    }

    const diffTime = Math.abs(countdownDate.getTime() - now.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    return `Noch ${diffDays} Tage und ${diffHours} Stunden bis zur Frist am ${formatDate(setting.countdown_datum)}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">Team nicht gefunden</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Das angeforderte Team existiert nicht oder wurde gelöscht.
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/teams/${team.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Team
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Mannschaftsblankett</h1>
        <p className="text-muted-foreground mt-2">
          Hier können Sie Mannschaftsblanketts für Turniere erstellen und verwalten.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Team: {team.name}</CardTitle>
          <CardDescription>
            Wählen Sie ein Turnier aus, um ein Mannschaftsblankett zu erstellen oder zu bearbeiten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tournaments.length === 0 ? (
            <Alert className="bg-secondary/30 border-secondary">
              <Info className="h-4 w-4" />
              <AlertTitle>Keine aktiven Turniere</AlertTitle>
              <AlertDescription>
                Dieses Team nimmt derzeit an keinen aktiven Turnieren teil. Bitte melden Sie das Team zuerst für ein
                Turnier an.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Turnier auswählen</label>
                <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Turnier auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.map((tournament: Tournament) => (
                      <SelectItem key={tournament.id} value={tournament.id}>
                        <div className="flex items-center">
                          <Trophy className="mr-2 h-4 w-4" />
                          {tournament.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTournament && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-md bg-secondary/30">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        {formatDate(tournaments.find((t) => t.id === selectedTournament)?.start_datum || "")} -
                        {formatDate(tournaments.find((t) => t.id === selectedTournament)?.end_datum || "")}
                      </span>
                    </div>
                    {getExistingBlankett(selectedTournament) && (
                      <Badge variant="outline" className="bg-background/50">
                        Blankett vorhanden
                      </Badge>
                    )}
                  </div>

                  {settings[selectedTournament] && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Blankett-Einstellungen</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded-md bg-secondary/20">
                          <span className="text-muted-foreground">Min. Spieler:</span>{" "}
                          {settings[selectedTournament].min_spieler}
                        </div>
                        <div className="p-2 rounded-md bg-secondary/20">
                          <span className="text-muted-foreground">Max. Spieler:</span>{" "}
                          {settings[selectedTournament].max_spieler}
                        </div>
                      </div>
                      {getCountdownText(selectedTournament) && (
                        <div className="flex items-center p-2 rounded-md bg-secondary/20 text-sm">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          {getCountdownText(selectedTournament)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleCreateBlankett}
            disabled={!selectedTournament || tournaments.length === 0}
            className="ml-auto bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
          >
            {getExistingBlankett(selectedTournament) ? (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Blankett bearbeiten
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Blankett erstellen
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {blanketts.length > 0 && (
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Vorhandene Blanketts</CardTitle>
            <CardDescription>Übersicht aller Mannschaftsblanketts für dieses Team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {blanketts.map((blankett) => {
                const tournament = tournaments.find((t) => t.id === blankett.tournament_id)
                return (
                  <div key={blankett.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/30">
                    <div>
                      <p className="font-medium">{tournament?.name || "Unbekanntes Turnier"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            blankett.status === "entwurf"
                              ? "outline"
                              : blankett.status === "eingereicht"
                                ? "secondary"
                                : blankett.status === "genehmigt"
                                  ? "default"
                                  : "destructive"
                          }
                        >
                          {blankett.status.charAt(0).toUpperCase() + blankett.status.slice(1)}
                        </Badge>
                        {blankett.eingereicht_am && (
                          <span className="text-xs text-muted-foreground">
                            Eingereicht am: {formatDate(blankett.eingereicht_am)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/teams/${team.id}/blankett/${blankett.id}`}>Bearbeiten</Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
