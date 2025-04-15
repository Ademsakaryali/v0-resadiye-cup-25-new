"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Team, User, BlankettEntry } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  Calendar,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Shield,
  Trophy,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"

interface TeamWithDetails extends Team {
  spieler?: User[]
  tournaments?: {
    id: string
    name: string
    start_datum: string
    end_datum: string
    ort?: string
    gruppe?: string
  }[]
  blanketts?: BlankettEntry[]
}

export default function TeamDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [team, setTeam] = useState<TeamWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        // Team mit Trainer-Informationen abrufen
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select(`
            *,
            trainer:trainer_id (
              id,
              vorname,
              nachname,
              email,
              telefonnummer,
              profilbild_url
            )
          `)
          .eq("id", params.id)
          .single()

        if (teamError) throw teamError

        // Spieler des Teams abrufen
        const { data: spielerData, error: spielerError } = await supabase
          .from("team_spieler")
          .select(`
            trikot_nummer,
            position,
            spieler:spieler_id (
              id,
              vorname,
              nachname,
              email,
              geburtsdatum,
              profilbild_url
            )
          `)
          .eq("team_id", params.id)

        if (spielerError) throw spielerError

        // Turniere des Teams abrufen
        const { data: tournamentData, error: tournamentError } = await supabase
          .from("tournament_teams")
          .select(`
            gruppe,
            tournament:tournament_id (
              id,
              name,
              start_datum,
              end_datum,
              ort
            )
          `)
          .eq("team_id", params.id)

        if (tournamentError) throw tournamentError

        // Blanketts des Teams abrufen
        const { data: blankettData, error: blankettError } = await supabase
          .from("blankett_entries")
          .select(`
            id,
            tournament_id,
            status,
            eingereicht_am,
            genehmigt_am,
            tournament:tournament_id (
              id,
              name
            )
          `)
          .eq("team_id", params.id)

        if (blankettError) throw blankettError

        // Daten zusammenführen
        const teamWithDetails: TeamWithDetails = {
          ...teamData,
          spieler: spielerData.map((item: any) => ({
            ...item.spieler,
            trikot_nummer: item.trikot_nummer,
            position: item.position,
          })),
          tournaments: tournamentData.map((item: any) => ({
            ...item.tournament,
            gruppe: item.gruppe,
          })),
          blanketts: blankettData,
        }

        setTeam(teamWithDetails)
      } catch (error) {
        console.error("Fehler beim Laden der Team-Details:", error)
        router.push("/teams")
      } finally {
        setLoading(false)
      }
    }

    fetchTeamDetails()
  }, [supabase, params.id, router])

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

  const getTeamLogo = (team: Team) => {
    if (team.logo_url) {
      return team.logo_url
    }
    return `/placeholder.svg?height=200&width=200&query=soccer team ${team.name.charAt(0)}`
  }

  const getBlankettStatusBadge = (status: string) => {
    switch (status) {
      case "entwurf":
        return (
          <Badge variant="outline" className="bg-background/50 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Entwurf
          </Badge>
        )
      case "eingereicht":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> Eingereicht
          </Badge>
        )
      case "genehmigt":
        return (
          <Badge variant="default" className="bg-green-600 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Genehmigt
          </Badge>
        )
      case "abgelehnt":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Abgelehnt
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const canManageBlankett = () => {
    if (!user) return false
    if (user.rolle === "Admin") return true
    if (user.rolle === "Trainer" && team?.trainer_id === user.id) return true
    return false
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <Button variant="ghost" asChild className="flex items-center">
          <Link href="/teams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Teamübersicht
          </Link>
        </Button>

        <div className="flex flex-wrap gap-2">
          {canManageBlankett() && team.tournaments && team.tournaments.length > 0 && (
            <Button
              asChild
              className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
            >
              <Link href={`/teams/${team.id}/blankett`}>
                <FileText className="mr-2 h-4 w-4" />
                Mannschaftsblankett
              </Link>
            </Button>
          )}

          {user?.rolle === "Admin" && (
            <Button asChild>
              <Link href={`/teams/${team.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Team bearbeiten
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="relative h-48 bg-gradient-to-b from-primary-900/50 to-background/50 flex items-center justify-center">
              <img
                src={getTeamLogo(team) || "/placeholder.svg"}
                alt={`${team.name} Logo`}
                className="h-32 w-32 object-contain"
              />
            </div>

            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold">{team.name}</CardTitle>
                  {user?.rolle === "Admin" && (
                    <Badge variant={team.ist_aktiv ? "outline" : "secondary"} className="mt-2 bg-background/50">
                      {team.ist_aktiv ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {team.beschreibung && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Beschreibung</h3>
                  <p className="text-sm">{team.beschreibung}</p>
                </div>
              )}

              {team.trainer && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Trainer</h3>
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3 border border-primary/20">
                      <AvatarImage src={team.trainer.profilbild_url || ""} alt={team.trainer.vorname} />
                      <AvatarFallback className="bg-primary-900/50">{`${team.trainer.vorname.charAt(0)}${team.trainer.nachname.charAt(0)}`}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{`${team.trainer.vorname} ${team.trainer.nachname}`}</p>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Mail className="h-3 w-3 mr-1" />
                        {team.trainer.email}
                      </div>
                      {user?.rolle === "Admin" && team.trainer.telefonnummer && (
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {team.trainer.telefonnummer}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Erstellt am</h3>
                <p className="text-sm">{formatDate(team.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Blanketts Sektion */}
          {team.blanketts && team.blanketts.length > 0 && (
            <Card className="border border-border/50 bg-card/50 backdrop-blur-sm mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Mannschaftsblanketts</CardTitle>
                <CardDescription>Übersicht der Mannschaftsblanketts für Turniere</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {team.blanketts.map((blankett) => (
                    <div key={blankett.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/30">
                      <div>
                        <p className="font-medium">{blankett.tournament?.name}</p>
                        <div className="flex items-center mt-1">{getBlankettStatusBadge(blankett.status)}</div>
                      </div>
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/teams/${team.id}/blankett/${blankett.id}`}>Details</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="spieler" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-4 bg-secondary/30">
              <TabsTrigger value="spieler" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Spieler
              </TabsTrigger>
              <TabsTrigger value="turniere" className="flex items-center">
                <Trophy className="mr-2 h-4 w-4" />
                Turniere
              </TabsTrigger>
            </TabsList>

            <TabsContent value="spieler">
              <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Spielerliste</CardTitle>
                  <CardDescription>
                    {team.spieler && team.spieler.length > 0
                      ? `${team.spieler.length} Spieler im Team`
                      : "Keine Spieler im Team"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {team.spieler && team.spieler.length > 0 ? (
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
                          {team.spieler.map((spieler) => (
                            <TableRow key={spieler.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8 border border-primary/20">
                                    <AvatarImage src={spieler.profilbild_url || ""} alt={spieler.vorname} />
                                    <AvatarFallback className="bg-primary-900/50">{`${spieler.vorname.charAt(0)}${spieler.nachname.charAt(0)}`}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{`${spieler.vorname} ${spieler.nachname}`}</p>
                                    <p className="text-xs text-muted-foreground">{spieler.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Shield className="h-4 w-4 mr-1 text-muted-foreground" />
                                  {spieler.position || "Unbekannt"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-background/50">
                                  {spieler.trikot_nummer || "-"}
                                </Badge>
                              </TableCell>
                              <TableCell>{spieler.geburtsdatum ? calculateAge(spieler.geburtsdatum) : "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-lg font-medium">Keine Spieler</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Diesem Team sind noch keine Spieler zugeordnet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="turniere">
              <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Turniere</CardTitle>
                  <CardDescription>
                    {team.tournaments && team.tournaments.length > 0
                      ? `${team.tournaments.length} Turniere mit Beteiligung des Teams`
                      : "Keine Turnierbeteiligung"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {team.tournaments && team.tournaments.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {team.tournaments.map((tournament) => (
                        <Link href={`/tournaments/${tournament.id}`} key={tournament.id}>
                          <div className="p-4 rounded-lg border border-border/50 bg-card hover:bg-card/80 transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{tournament.name}</h3>
                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  <span>
                                    {formatDate(tournament.start_datum)} - {formatDate(tournament.end_datum)}
                                  </span>
                                </div>
                                {tournament.ort && (
                                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    <span>{tournament.ort}</span>
                                  </div>
                                )}
                              </div>
                              <Badge className="bg-primary/10 text-primary-foreground border-primary/20">
                                Gruppe {tournament.gruppe || "-"}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-lg font-medium">Keine Turniere</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Dieses Team nimmt derzeit an keinen Turnieren teil.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
