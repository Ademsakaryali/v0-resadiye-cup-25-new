"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Tournament, Team, Match } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft, Trophy, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type TeamStanding = {
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

type SortField = "points" | "goalDifference" | "goalsFor" | "played" | "won" | "team"
type SortDirection = "asc" | "desc"

export default function TournamentStandingsPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [standings, setStandings] = useState<TeamStanding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>("points")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const params = useParams()
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const tournamentId = params.id as string

        // Turnier-Daten abrufen
        const { data: tournamentData, error: tournamentError } = await supabase
          .from("tournaments")
          .select("*")
          .eq("id", tournamentId)
          .single()

        if (tournamentError) throw tournamentError
        if (!tournamentData) throw new Error("Turnier nicht gefunden")

        setTournament(tournamentData as Tournament)

        // Teams des Turniers abrufen
        const { data: tournamentTeamsData, error: teamsError } = await supabase
          .from("tournament_teams")
          .select("team_id")
          .eq("tournament_id", tournamentId)

        if (teamsError) throw teamsError

        if (!tournamentTeamsData || tournamentTeamsData.length === 0) {
          setStandings([])
          setLoading(false)
          return
        }

        const teamIds = tournamentTeamsData.map((item) => item.team_id)

        // Teams abrufen
        const { data: teamsData, error: teamsDataError } = await supabase
          .from("teams")
          .select("*, trainer:trainer_id(*)")
          .in("id", teamIds)

        if (teamsDataError) throw teamsDataError

        // Spiele des Turniers abrufen
        const { data: matchesData, error: matchesError } = await supabase
          .from("matches")
          .select("*")
          .eq("tournament_id", tournamentId)
          .eq("status", "beendet")

        if (matchesError) throw matchesError

        // Tabelle berechnen
        const teamStandings = calculateStandings(teamsData as Team[], matchesData as Match[])
        setStandings(teamStandings)
      } catch (error: any) {
        console.error("Fehler beim Laden der Turnierdaten:", error)
        setError(error.message || "Ein Fehler ist aufgetreten beim Laden der Turnierdaten.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, supabase])

  const calculateStandings = (teams: Team[], matches: Match[]): TeamStanding[] => {
    const standings: Record<string, TeamStanding> = {}

    // Initialisiere Standings für jedes Team
    teams.forEach((team) => {
      standings[team.id] = {
        team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      }
    })

    // Berechne Statistiken basierend auf Spielen
    matches.forEach((match) => {
      const homeTeamId = match.team_heim_id
      const awayTeamId = match.team_gast_id

      // Überprüfe, ob beide Teams in der Tabelle sind
      if (!standings[homeTeamId] || !standings[awayTeamId]) return

      // Heimteam-Statistiken aktualisieren
      standings[homeTeamId].played += 1
      standings[homeTeamId].goalsFor += match.tore_heim
      standings[homeTeamId].goalsAgainst += match.tore_gast

      // Auswärtsteam-Statistiken aktualisieren
      standings[awayTeamId].played += 1
      standings[awayTeamId].goalsFor += match.tore_gast
      standings[awayTeamId].goalsAgainst += match.tore_heim

      // Ergebnis bestimmen und Punkte vergeben
      if (match.tore_heim > match.tore_gast) {
        // Heimteam gewinnt
        standings[homeTeamId].won += 1
        standings[homeTeamId].points += 3
        standings[awayTeamId].lost += 1
      } else if (match.tore_heim < match.tore_gast) {
        // Auswärtsteam gewinnt
        standings[awayTeamId].won += 1
        standings[awayTeamId].points += 3
        standings[homeTeamId].lost += 1
      } else {
        // Unentschieden
        standings[homeTeamId].drawn += 1
        standings[homeTeamId].points += 1
        standings[awayTeamId].drawn += 1
        standings[awayTeamId].points += 1
      }
    })

    // Tordifferenz berechnen
    Object.values(standings).forEach((standing) => {
      standing.goalDifference = standing.goalsFor - standing.goalsAgainst
    })

    return Object.values(standings)
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Wenn das gleiche Feld erneut angeklickt wird, ändere die Sortierrichtung
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Wenn ein neues Feld angeklickt wird, setze das Feld und die Standardrichtung
      setSortField(field)
      setSortDirection(field === "team" ? "asc" : "desc")
    }
  }

  const getSortedStandings = () => {
    return [...standings].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "team":
          comparison = a.team.name.localeCompare(b.team.name)
          break
        case "points":
          comparison = a.points - b.points
          break
        case "goalDifference":
          comparison = a.goalDifference - b.goalDifference
          break
        case "goalsFor":
          comparison = a.goalsFor - b.goalsFor
          break
        case "played":
          comparison = a.played - b.played
          break
        case "won":
          comparison = a.won - b.won
          break
        default:
          comparison = a.points - b.points
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1 text-blue-400" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1 text-blue-400" />
    )
  }

  const getTeamLogo = (team: Team) => {
    if (team.logo_url) {
      return team.logo_url
    }
    return `/placeholder.svg?height=32&width=32&query=team ${team.name.charAt(0) || "T"}`
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
          <AlertDescription>{error || "Turnier konnte nicht geladen werden."}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" asChild className="mb-4 text-gray-300 hover:text-blue-400">
        <Link href={`/tournaments/${tournament.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Turnier
        </Link>
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
            <Trophy className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white neon-text">{tournament.name} - Tabelle</h1>
          </div>
        </div>
      </div>

      <Card className="border border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl text-white">Turniertabelle</CardTitle>
        </CardHeader>
        <CardContent>
          {standings.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="mx-auto h-12 w-12 text-gray-500" />
              <h3 className="mt-2 text-lg font-medium text-white">Keine Daten verfügbar</h3>
              <p className="mt-1 text-sm text-gray-400">
                Es wurden noch keine Spiele ausgetragen oder es sind keine Teams für dieses Turnier registriert.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-gray-200">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-8">
                      Pos
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("team")}
                    >
                      <div className="flex items-center">Team {getSortIcon("team")}</div>
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer w-16"
                      onClick={() => handleSort("played")}
                    >
                      <div className="flex items-center justify-center">Sp {getSortIcon("played")}</div>
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer w-16"
                      onClick={() => handleSort("won")}
                    >
                      <div className="flex items-center justify-center">S {getSortIcon("won")}</div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider w-16">
                      U
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider w-16">
                      N
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider w-24">
                      Tore
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer w-16"
                      onClick={() => handleSort("goalDifference")}
                    >
                      <div className="flex items-center justify-center">TD {getSortIcon("goalDifference")}</div>
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer w-16"
                      onClick={() => handleSort("points")}
                    >
                      <div className="flex items-center justify-center">Pkt {getSortIcon("points")}</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedStandings().map((standing, index) => (
                    <tr
                      key={standing.team.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-center font-medium">
                        <span
                          className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-sm ${
                            index < 3 ? "bg-blue-900/50 text-blue-400 neon-border" : "bg-gray-800 text-gray-300"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-md overflow-hidden bg-gray-800 flex items-center justify-center mr-3">
                            <img
                              src={getTeamLogo(standing.team) || "/placeholder.svg"}
                              alt={`${standing.team.name} Logo`}
                              className="h-6 w-6 object-contain"
                            />
                          </div>
                          <Link
                            href={`/teams/${standing.team.id}`}
                            className="font-medium text-white hover:text-blue-400 transition-colors"
                          >
                            {standing.team.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">{standing.played}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-green-400">{standing.won}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-gray-400">{standing.drawn}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-red-400">{standing.lost}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {standing.goalsFor}:{standing.goalsAgainst}
                      </td>
                      <td
                        className={`px-4 py-3 whitespace-nowrap text-center font-medium ${
                          standing.goalDifference > 0
                            ? "text-green-400"
                            : standing.goalDifference < 0
                              ? "text-red-400"
                              : "text-gray-400"
                        }`}
                      >
                        {standing.goalDifference > 0 ? "+" : ""}
                        {standing.goalDifference}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center font-bold text-blue-400 neon-text">
                        {standing.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
