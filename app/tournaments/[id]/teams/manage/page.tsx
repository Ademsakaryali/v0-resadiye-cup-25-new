"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Tournament, Team } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AlertCircle, ArrowLeft, Search, Check, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ManageTournamentTeamsPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Turnier laden
        const { data: tournamentData, error: tournamentError } = await supabase
          .from("tournaments")
          .select("*")
          .eq("id", params.id)
          .single()

        if (tournamentError) {
          throw tournamentError
        }

        setTournament(tournamentData as Tournament)

        // Alle Teams laden
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("*, trainer:trainer_id(*)")
          .eq("ist_aktiv", true)
          .order("name")

        if (teamsError) {
          throw teamsError
        }

        setAllTeams(teamsData as Team[])
        setFilteredTeams(teamsData as Team[])

        // Bereits ausgewählte Teams laden
        const { data: tournamentTeamsData, error: tournamentTeamsError } = await supabase
          .from("tournament_teams")
          .select("team_id")
          .eq("tournament_id", params.id)

        if (tournamentTeamsError) {
          throw tournamentTeamsError
        }

        const selectedTeamIds = tournamentTeamsData.map((item) => item.team_id)
        setSelectedTeams(selectedTeamIds)
      } catch (error: any) {
        console.error("Fehler beim Laden der Daten:", error)
        setError(error.message || "Ein Fehler ist aufgetreten beim Laden der Daten.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, supabase])

  useEffect(() => {
    // Filterung der Teams basierend auf der Suchanfrage
    if (searchQuery.trim() === "") {
      setFilteredTeams(allTeams)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = allTeams.filter(
        (team) =>
          team.name.toLowerCase().includes(query) ||
          team.beschreibung?.toLowerCase().includes(query) ||
          team.trainer?.vorname.toLowerCase().includes(query) ||
          team.trainer?.nachname.toLowerCase().includes(query),
      )
      setFilteredTeams(filtered)
    }
  }, [searchQuery, allTeams])

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeams((prev) => {
      if (prev.includes(teamId)) {
        return prev.filter((id) => id !== teamId)
      } else {
        return [...prev, teamId]
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      // Zuerst alle bestehenden Zuordnungen löschen
      const { error: deleteError } = await supabase.from("tournament_teams").delete().eq("tournament_id", params.id)

      if (deleteError) {
        throw deleteError
      }

      // Dann neue Zuordnungen erstellen
      if (selectedTeams.length > 0) {
        const teamEntries = selectedTeams.map((teamId) => ({
          tournament_id: params.id,
          team_id: teamId,
        }))

        const { error: insertError } = await supabase.from("tournament_teams").insert(teamEntries)

        if (insertError) {
          throw insertError
        }
      }

      router.push(`/tournaments/${params.id}`)
    } catch (error: any) {
      console.error("Fehler beim Speichern der Teams:", error)
      setError(error.message || "Ein Fehler ist aufgetreten beim Speichern der Teams.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 mb-4" asChild>
          <Link href="/tournaments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Turnierübersicht
          </Link>
        </Button>
        <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Turnier konnte nicht geladen werden.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <RequireAuth allowedRoles={["Admin"]}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 mb-4" asChild>
            <Link href={`/tournaments/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Turnier
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Teams verwalten</h1>
          <p className="text-muted-foreground mt-1">Wählen Sie die Teams aus, die an diesem Turnier teilnehmen.</p>
        </div>

        {error && (
          <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Teams suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
        </div>

        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle>Ausgewählte Teams ({selectedTeams.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTeams.length === 0 ? (
              <p className="text-muted-foreground italic">Keine Teams ausgewählt</p>
            ) : (
              <div className="space-y-2">
                {allTeams
                  .filter((team) => selectedTeams.includes(team.id))
                  .map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between p-3 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md overflow-hidden bg-background/50 flex items-center justify-center">
                          <img
                            src={
                              team.logo_url ||
                              `/placeholder.svg?height=32&width=32&query=team ${team.name.charAt(0) || "/placeholder.svg"}`
                            }
                            alt={`${team.name} Logo`}
                            className="h-6 w-6 object-contain"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{team.name}</p>
                          {team.trainer && (
                            <p className="text-xs text-muted-foreground">
                              Trainer: {team.trainer.vorname} {team.trainer.nachname}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 h-8 w-8 p-0 text-destructive"
                        onClick={() => handleTeamToggle(team.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle>Verfügbare Teams</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTeams.length === 0 ? (
              <p className="text-muted-foreground italic">Keine Teams gefunden</p>
            ) : (
              <div className="space-y-2">
                {filteredTeams
                  .filter((team) => !selectedTeams.includes(team.id))
                  .map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between p-3 rounded-md hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md overflow-hidden bg-background/50 flex items-center justify-center">
                          <img
                            src={
                              team.logo_url ||
                              `/placeholder.svg?height=32&width=32&query=team ${team.name.charAt(0) || "/placeholder.svg"}`
                            }
                            alt={`${team.name} Logo`}
                            className="h-6 w-6 object-contain"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{team.name}</p>
                          {team.trainer && (
                            <p className="text-xs text-muted-foreground">
                              Trainer: {team.trainer.vorname} {team.trainer.nachname}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        className="border bg-background hover:bg-gray-100 dark:hover:bg-gray-800 h-8 w-8 p-0"
                        onClick={() => handleTeamToggle(team.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button className="border bg-background hover:bg-gray-100 dark:hover:bg-gray-800" asChild>
            <Link href={`/tournaments/${params.id}`}>Abbrechen</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <LoadingSpinner className="mr-2" />
                Wird gespeichert...
              </>
            ) : (
              "Änderungen speichern"
            )}
          </Button>
        </div>
      </div>
    </RequireAuth>
  )
}
