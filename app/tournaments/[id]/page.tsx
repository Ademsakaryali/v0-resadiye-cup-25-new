"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Tournament, Team, Match } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft, Calendar, MapPin, Trophy, Users, Clock, Pencil, AlertCircle, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function TournamentDetailsPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        const tournamentId = params.id as string

        // Turnier-Daten abrufen
        const { data: tournamentData, error: tournamentError } = await supabase
          .from("tournaments")
          .select("*")
          .eq("id", tournamentId)
          .single()

        if (tournamentError) {
          throw tournamentError
        }

        if (!tournamentData) {
          throw new Error("Turnier nicht gefunden")
        }

        setTournament(tournamentData as Tournament)

        // Teams des Turniers abrufen
        const { data: tournamentTeamsData, error: teamsError } = await supabase
          .from("tournament_teams")
          .select("team_id")
          .eq("tournament_id", tournamentId)

        if (teamsError) {
          throw teamsError
        }

        if (tournamentTeamsData && tournamentTeamsData.length > 0) {
          const teamIds = tournamentTeamsData.map((item) => item.team_id)
          const { data: teamsData, error: teamsDataError } = await supabase
            .from("teams")
            .select("*, trainer:trainer_id(*)")
            .in("id", teamIds)

          if (teamsDataError) {
            throw teamsDataError
          }

          setTeams(teamsData as Team[])
        }

        // Spiele des Turniers abrufen
        const { data: matchesData, error: matchesError } = await supabase
          .from("matches")
          .select("*, team_heim:team_heim_id(*), team_gast:team_gast_id(*)")
          .eq("tournament_id", tournamentId)
          .order("datum", { ascending: true })

        if (matchesError) {
          throw matchesError
        }

        setMatches(matchesData as Match[])
      } catch (error: any) {
        console.error("Fehler beim Laden der Turnierdaten:", error)
        setError(error.message || "Ein Fehler ist aufgetreten beim Laden der Turnierdaten.")
      } finally {
        setLoading(false)
      }
    }

    fetchTournamentData()
  }, [params.id, supabase])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "dd. MMMM yyyy", { locale: de })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "dd.MM.yyyy HH:mm", { locale: de })
  }

  const getTournamentStatus = () => {
    if (!tournament) return "Unbekannt"

    if (!tournament.ist_aktiv) return "Inaktiv"

    const now = new Date()
    const startDate = new Date(tournament.start_datum)
    const endDate = new Date(tournament.end_datum)

    if (now < startDate) return "Bevorstehend"
    if (now > endDate) return "Abgeschlossen"
    return "Aktiv"
  }

  const getTournamentStatusBadge = () => {
    const status = getTournamentStatus()
    switch (status) {
      case "Aktiv":
        return <Badge className="bg-green-600">Aktiv</Badge>
      case "Bevorstehend":
        return <Badge className="bg-blue-600">Bevorstehend</Badge>
      case "Abgeschlossen":
        return <Badge variant="outline">Abgeschlossen</Badge>
      case "Inaktiv":
        return <Badge variant="secondary">Inaktiv</Badge>
      default:
        return <Badge variant="outline">Unbekannt</Badge>
    }
  }

  const getMatchStatusBadge = (match: Match) => {
    switch (match.status) {
      case "geplant":
        return <Badge variant="outline">Geplant</Badge>
      case "live":
        return <Badge className="bg-red-600">Live</Badge>
      case "beendet":
        return <Badge variant="secondary">Beendet</Badge>
      case "abgesagt":
        return <Badge variant="destructive">Abgesagt</Badge>
      default:
        return <Badge variant="outline">Unbekannt</Badge>
    }
  }

  const getTournamentLogo = () => {
    if (tournament?.logo_url) {
      return tournament.logo_url
    }
    return `/placeholder.svg?height=100&width=100&query=trophy tournament ${tournament?.name.charAt(0) || "T"}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/tournaments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Turnierübersicht
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error || "Turnier konnte nicht geladen werden."}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/tournaments">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Turnierübersicht
        </Link>
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center">
            <img
              src={getTournamentLogo() || "/placeholder.svg"}
              alt={`${tournament.name} Logo`}
              className="h-12 w-12 object-contain"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{tournament.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getTournamentStatusBadge()}
              <span className="text-sm text-muted-foreground">
                {formatDate(tournament.start_datum)} - {formatDate(tournament.end_datum)}
              </span>
            </div>
          </div>
        </div>

        {user?.rolle === "Admin" && (
          <Button asChild>
            <Link href={`/tournaments/${tournament.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Turnier bearbeiten
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-2 border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Über das Turnier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tournament.beschreibung ? (
                <p>{tournament.beschreibung}</p>
              ) : (
                <p className="text-muted-foreground italic">Keine Beschreibung verfügbar</p>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Zeitraum</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(tournament.start_datum)} - {formatDate(tournament.end_datum)}
                    </p>
                  </div>
                </div>

                {tournament.ort && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Ort</p>
                      <p className="text-sm text-muted-foreground">{tournament.ort}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Teams</p>
                    <p className="text-sm text-muted-foreground">{teams.length} Teams</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-muted-foreground">{getTournamentStatus()}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Aktionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user?.rolle === "Admin" && (
                <>
                  <Button asChild className="w-full justify-between">
                    <Link href={`/tournaments/${tournament.id}/teams/manage`}>
                      Teams verwalten
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-between">
                    <Link href={`/tournaments/${tournament.id}/matches/manage`}>
                      Spiele verwalten
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href={`/tournaments/${tournament.id}/schedule`}>
                  Spielplan anzeigen
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href={`/tournaments/${tournament.id}/standings`}>
                  Tabelle anzeigen
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="teams" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="matches">Spiele</TabsTrigger>
        </TabsList>

        <TabsContent value="teams">
          {teams.length === 0 ? (
            <div className="text-center py-12 bg-secondary/20 rounded-lg">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">Keine Teams gefunden</h3>
              <p className="mt-1 text-sm text-muted-foreground">Diesem Turnier wurden noch keine Teams hinzugefügt.</p>
              {user?.rolle === "Admin" && (
                <div className="mt-6">
                  <Button asChild>
                    <Link href={`/tournaments/${tournament.id}/teams/manage`}>Teams hinzufügen</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <Card
                  key={team.id}
                  className="overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-200"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md overflow-hidden bg-primary/10 flex items-center justify-center">
                        <img
                          src={
                            team.logo_url ||
                            `/placeholder.svg?height=40&width=40&query=team ${team.name.charAt(0) || "/placeholder.svg"}`
                          }
                          alt={`${team.name} Logo`}
                          className="h-8 w-8 object-contain"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        {team.trainer && (
                          <CardDescription>
                            Trainer: {team.trainer.vorname} {team.trainer.nachname}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="secondary" size="sm" className="w-full">
                      <Link href={`/teams/${team.id}`}>Team anzeigen</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="matches">
          {matches.length === 0 ? (
            <div className="text-center py-12 bg-secondary/20 rounded-lg">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">Keine Spiele gefunden</h3>
              <p className="mt-1 text-sm text-muted-foreground">Für dieses Turnier wurden noch keine Spiele geplant.</p>
              {user?.rolle === "Admin" && (
                <div className="mt-6">
                  <Button asChild>
                    <Link href={`/tournaments/${tournament.id}/matches/manage`}>Spiele hinzufügen</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <Card key={match.id} className="overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                        <div className="flex flex-col items-center">
                          <div className="h-10 w-10 rounded-md overflow-hidden bg-primary/10 flex items-center justify-center">
                            <img
                              src={
                                match.team_heim?.logo_url ||
                                `/placeholder.svg?height=40&width=40&query=team ${match.team_heim?.name.charAt(0) || "/placeholder.svg"}`
                              }
                              alt={`${match.team_heim?.name} Logo`}
                              className="h-8 w-8 object-contain"
                            />
                          </div>
                          <span className="text-sm font-medium mt-1 text-center">
                            {match.team_heim?.name || "Unbekannt"}
                          </span>
                        </div>

                        <div className="flex flex-col items-center">
                          {match.status === "beendet" ? (
                            <div className="text-xl font-bold">
                              {match.tore_heim} : {match.tore_gast}
                            </div>
                          ) : (
                            <div className="text-xl font-bold">vs.</div>
                          )}
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{formatDateTime(match.datum)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center">
                          <div className="h-10 w-10 rounded-md overflow-hidden bg-primary/10 flex items-center justify-center">
                            <img
                              src={
                                match.team_gast?.logo_url ||
                                `/placeholder.svg?height=40&width=40&query=team ${match.team_gast?.name.charAt(0) || "/placeholder.svg"}`
                              }
                              alt={`${match.team_gast?.name} Logo`}
                              className="h-8 w-8 object-contain"
                            />
                          </div>
                          <span className="text-sm font-medium mt-1 text-center">
                            {match.team_gast?.name || "Unbekannt"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getMatchStatusBadge(match)}
                        {match.ort && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{match.ort}</span>
                          </div>
                        )}
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/matches/${match.id}`}>Details</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
