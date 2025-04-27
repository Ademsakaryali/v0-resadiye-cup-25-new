"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AddPlayerToTeamForm } from "@/components/teams/add-player-form"
import { AlertCircle, UserPlus, Pencil, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Team } from "@/lib/types"
import Link from "next/link"

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false)

  const teamId = params.id as string

  useEffect(() => {
    const fetchTeamAndPlayers = async () => {
      try {
        setLoading(true)
        setError(null)

        // Team-Daten abrufen
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("*, trainer:trainer_id(*)")
          .eq("id", teamId)
          .single()

        if (teamError) throw teamError

        setTeam(teamData)

        // Spieler des Teams abrufen
        const { data: playersData, error: playersError } = await supabase
          .from("team_spieler")
          .select("*, spieler:spieler_id(*)")
          .eq("team_id", teamId)
          .order("trikot_nummer", { ascending: true })

        if (playersError) throw playersError

        setPlayers(playersData)
      } catch (error: any) {
        console.error("Fehler beim Laden der Team-Daten:", error)
        setError("Fehler beim Laden der Team-Daten: " + error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamAndPlayers()
  }, [teamId, supabase])

  const handleAddPlayerSuccess = () => {
    setAddPlayerDialogOpen(false)
    // Team und Spieler neu laden
    router.refresh()
  }

  const handleAddPlayerError = (message: string) => {
    setError(message)
  }

  const getInitials = (name: string) => {
    if (!name) return ""
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Team nicht gefunden.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="text-muted-foreground">{team.beschreibung || "Keine Beschreibung vorhanden"}</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" asChild>
            <Link href={`/teams/${teamId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Team bearbeiten
            </Link>
          </Button>
          <Dialog open={addPlayerDialogOpen} onOpenChange={setAddPlayerDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Spieler hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Spieler zum Team hinzufügen</DialogTitle>
              </DialogHeader>
              <AddPlayerToTeamForm
                teamId={teamId}
                existingPlayerIds={players.map((p) => p.spieler_id)}
                onSuccess={handleAddPlayerSuccess}
                onError={handleAddPlayerError}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Spieler
            </CardTitle>
            <CardDescription>Alle Spieler des Teams</CardDescription>
          </CardHeader>
          <CardContent>
            {players.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Keine Spieler im Team. Fügen Sie Spieler hinzu, um sie hier zu sehen.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center p-3 border rounded-md">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback>
                        {getInitials(`${player.spieler.vorname} ${player.spieler.nachname}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {player.spieler.vorname} {player.spieler.nachname}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        #{player.trikot_nummer} • {player.position}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team-Informationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Trainer</h3>
              {team.trainer ? (
                <div className="flex items-center mt-2">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback>{getInitials(`${team.trainer.vorname} ${team.trainer.nachname}`)}</AvatarFallback>
                  </Avatar>
                  <span>
                    {team.trainer.vorname} {team.trainer.nachname}
                  </span>
                </div>
              ) : (
                <p>Kein Trainer zugewiesen</p>
              )}
            </div>

            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Anzahl Spieler</h3>
              <p>{players.length}</p>
            </div>

            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Erstellt am</h3>
              <p>{new Date(team.created_at).toLocaleDateString("de-DE")}</p>
            </div>

            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Zuletzt aktualisiert</h3>
              <p>{new Date(team.updated_at).toLocaleDateString("de-DE")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
