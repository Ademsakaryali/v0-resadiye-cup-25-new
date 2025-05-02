"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Tournament, Team } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"
import { ArrowLeft, Shield, Users } from "lucide-react"
import { getTeamPlayers } from "@/lib/supabase-helpers"

export default function TournamentTeamsPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
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

          // Für jedes Team die Spieleranzahl abrufen
          const teamsWithPlayerCount = await Promise.all(
            teamsData.map(async (team) => {
              const players = await getTeamPlayers(team.id)
              return {
                ...team,
                spieler_anzahl: players.length,
              }
            }),
          )

          setTeams(teamsWithPlayerCount as Team[])
        }
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
    return <Loading fullPage text="Teams werden geladen..." />
  }

  if (error || !tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          className="mb-4 text-gray-300 hover:text-blue-400 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
          asChild
        >
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
      <Button
        className="mb-4 text-gray-300 hover:text-blue-400 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
        asChild
      >
        <Link href={`/tournaments/${tournament.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Turnier
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Teams im Turnier: {tournament.name}</h1>
        <p className="text-gray-400">Übersicht aller teilnehmenden Mannschaften</p>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
          <Shield className="mx-auto h-12 w-12 text-gray-500" />
          <h3 className="mt-2 text-lg font-medium text-white">Keine Teams gefunden</h3>
          <p className="mt-1 text-sm text-gray-400">Diesem Turnier wurden noch keine Teams hinzugefügt.</p>
          {user?.rolle === "Admin" && (
            <div className="mt-6">
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
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
              className="overflow-hidden border-gray-800 bg-gray-900/80 backdrop-blur-sm hover:bg-gray-800/80 transition-all duration-200"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-800 flex items-center justify-center border border-gray-700">
                    <img
                      src={
                        team.logo_url || `/placeholder.svg?height=40&width=40&query=team ${team.name.charAt(0) || "T"}`
                      }
                      alt={`${team.name} Logo`}
                      className="h-8 w-8 object-contain"
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white">{team.name}</CardTitle>
                    {team.trainer && (
                      <p className="text-sm text-gray-400">
                        Trainer: {team.trainer.vorname} {team.trainer.nachname}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-gray-400 mb-3">
                  <Users className="mr-2 h-4 w-4 text-blue-400" />
                  <span>{team.spieler_anzahl || 0} Spieler</span>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-blue-400"
                >
                  <Link href={`/teams/${team.id}`}>Team anzeigen</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
