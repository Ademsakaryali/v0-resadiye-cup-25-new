"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Tournament } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"
import { ArrowLeft, Users } from "lucide-react"
import { getTeamPlayers, getTournamentTeams } from "@/lib/supabase-helpers"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function TournamentPlayersPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const supabase = getSupabaseClient()
  const [players, setPlayers] = useState<any[]>([])

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
        const teams = await getTournamentTeams(tournamentId)

        // Für jedes Team die Spieler abrufen und zusammenführen
        const allPlayers = []
        for (const team of teams) {
          const teamPlayers = await getTeamPlayers(team.id)
          const playersWithTeam = teamPlayers.map((player) => ({
            ...player,
            team: team,
          }))
          allPlayers.push(...playersWithTeam)
        }

        setPlayers(allPlayers)
      } catch (error: any) {
        console.error("Fehler beim Laden der Turnierdaten:", error)
        setError(error.message || "Ein Fehler ist aufgetreten beim Laden der Turnierdaten.")
      } finally {
        setLoading(false)
      }
    }

    fetchTournamentData()
  }, [params.id, supabase])

  if (loading) {
    return <Loading fullPage text="Spieler werden geladen..." />
  }

  if (error || !tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-4 text-gray-300 hover:text-blue-400">
          <Link href={`/tournaments/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Turnier
          </Link>
        </Button>
        <div className="bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Fehler</h2>
          <p>{error || "Turnier konnte nicht geladen werden."}</p>
        </div>
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

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Spieler im Turnier: {tournament.name}</h1>
        <p className="text-gray-400">Übersicht aller teilnehmenden Spieler</p>
      </div>

      {players.length === 0 ? (
        <Card className="border-gray-800 bg-gray-900/80">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-blue-500/70 mb-4" />
            <h3 className="text-lg font-medium text-white">Keine Spieler gefunden</h3>
            <p className="text-sm text-gray-400 mt-1 text-center">
              In diesem Turnier sind noch keine Spieler registriert.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-800">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800/50">
              <tr>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Spieler
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Team
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden sm:table-cell"
                >
                  Position
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Trikotnummer
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900/30 divide-y divide-gray-800">
              {players.map((player) => (
                <tr key={`${player.team_id}-${player.spieler_id}`} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3 border border-gray-700">
                        <AvatarImage
                          src={player.spieler.profilbild_url || ""}
                          alt={`${player.spieler.vorname} ${player.spieler.nachname}`}
                        />
                        <AvatarFallback className="bg-blue-500/20 text-blue-400">
                          {player.spieler.vorname?.[0]}
                          {player.spieler.nachname?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-white">
                          <Link
                            href={`/spieler/${player.spieler_id}`}
                            className="hover:text-blue-400 transition-colors"
                          >
                            {player.spieler.vorname} {player.spieler.nachname}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-md overflow-hidden bg-gray-800 flex items-center justify-center border border-gray-700 mr-2">
                        <img
                          src={
                            player.team.logo_url ||
                            `/placeholder.svg?height=24&width=24&query=team ${player.team.name.charAt(0) || "T"}`
                          }
                          alt={`${player.team.name} Logo`}
                          className="h-5 w-5 object-contain"
                        />
                      </div>
                      <Link
                        href={`/teams/${player.team.id}`}
                        className="text-gray-300 hover:text-blue-400 transition-colors"
                      >
                        {player.team.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap hidden sm:table-cell">
                    {player.position && (
                      <Badge
                        className={`
                      ${player.position === "Torwart" ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30" : ""}
                      ${player.position === "Abwehr" ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30" : ""}
                      ${player.position === "Mittelfeld" ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : ""}
                      ${player.position === "Sturm" ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : ""}
                      ${!["Torwart", "Abwehr", "Mittelfeld", "Sturm"].includes(player.position) ? "border-gray-700 text-gray-300" : ""}
                    `}
                      >
                        {player.position}
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="w-8 h-8 flex items-center justify-center bg-blue-500/20 rounded-full font-bold text-blue-400">
                      {player.trikot_nummer || "-"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
