"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Team } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Users,
  UserPlus,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertCircle,
  Phone,
} from "lucide-react"

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"name_asc" | "name_desc" | "newest" | "oldest">("name_asc")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)
  const { user } = useAuth()
  const supabase = getSupabaseClient()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // Teams mit Trainer-Informationen abrufen
        const { data, error } = await supabase.from("teams").select(`
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

        if (error) {
          throw error
        }

        setTeams(data as Team[])
        setFilteredTeams(data as Team[])
      } catch (error) {
        console.error("Fehler beim Laden der Teams:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [supabase])

  useEffect(() => {
    // Filter und Sortierung anwenden
    let result = [...teams]

    // Suche anwenden
    if (searchQuery) {
      result = result.filter(
        (team) =>
          team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.beschreibung?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.trainer?.vorname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.trainer?.nachname.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Sortierung anwenden
    switch (sortOrder) {
      case "name_asc":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "name_desc":
        result.sort((a, b) => b.name.localeCompare(a.name))
        break
      case "newest":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "oldest":
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
    }

    setFilteredTeams(result)
  }, [teams, searchQuery, sortOrder])

  const handleDeleteClick = (team: Team) => {
    setTeamToDelete(team)
    setDeleteDialogOpen(true)
    setError(null) // Clear any previous errors
  }

  const handleDeleteConfirm = async () => {
    if (!teamToDelete) return

    try {
      // Prüfen, ob das Team in Spielen verwendet wird
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("id")
        .or(`team_heim_id.eq.${teamToDelete.id},team_gast_id.eq.${teamToDelete.id}`)
        .limit(1)

      if (matchesError) throw matchesError

      if (matchesData && matchesData.length > 0) {
        throw new Error(
          "Dieses Team kann nicht gelöscht werden, da es in Spielen verwendet wird. Bitte entfernen Sie zuerst alle Spiele, die mit diesem Team verbunden sind.",
        )
      }

      // Prüfen, ob das Team in Turnieren verwendet wird
      const { data: tournamentData, error: tournamentError } = await supabase
        .from("tournament_teams")
        .select("id")
        .eq("team_id", teamToDelete.id)
        .limit(1)

      if (tournamentError) throw tournamentError

      if (tournamentData && tournamentData.length > 0) {
        throw new Error(
          "Dieses Team kann nicht gelöscht werden, da es in Turnieren verwendet wird. Bitte entfernen Sie zuerst alle Turnierbeteiligungen dieses Teams.",
        )
      }

      // Prüfen, ob das Team Spieler hat
      const { data: spielerData, error: spielerError } = await supabase
        .from("team_spieler")
        .select("id")
        .eq("team_id", teamToDelete.id)
        .limit(1)

      if (spielerError) throw spielerError

      if (spielerData && spielerData.length > 0) {
        throw new Error(
          "Dieses Team kann nicht gelöscht werden, da ihm noch Spieler zugeordnet sind. Bitte entfernen Sie zuerst alle Spieler aus diesem Team.",
        )
      }

      // Wenn keine Abhängigkeiten bestehen, Team löschen
      const { error } = await supabase.from("teams").delete().eq("id", teamToDelete.id)

      if (error) {
        throw error
      }

      setTeams(teams.filter((team) => team.id !== teamToDelete.id))
      setDeleteDialogOpen(false)
      setTeamToDelete(null)
    } catch (error: any) {
      console.error("Fehler beim Löschen des Teams:", error)
      setError(error.message || "Ein Fehler ist aufgetreten beim Löschen des Teams.")
      // Dialog offen lassen, damit der Benutzer die Fehlermeldung sehen kann
    }
  }

  const getTeamLogo = (team: Team) => {
    if (team.logo_url) {
      return team.logo_url
    }
    // Placeholder-Logo mit dem ersten Buchstaben des Teamnamens
    return `/placeholder.svg?height=100&width=100&query=soccer team ${team.name.charAt(0)}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Teams</h1>
        {(user?.rolle === "Admin" || user?.rolle === "Trainer") && (
          <Button
            asChild
            className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
          >
            <Link href="/teams/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Neues Team erstellen
            </Link>
          </Button>
        )}
      </div>

      <div className="bg-secondary/30 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Teams durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
          <div className="flex-shrink-0 w-full md:w-64">
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
              <SelectTrigger className="bg-background/50">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sortieren nach" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">
                  <div className="flex items-center">
                    <SortAsc className="mr-2 h-4 w-4" />
                    Name (A-Z)
                  </div>
                </SelectItem>
                <SelectItem value="name_desc">
                  <div className="flex items-center">
                    <SortDesc className="mr-2 h-4 w-4" />
                    Name (Z-A)
                  </div>
                </SelectItem>
                <SelectItem value="newest">Neueste zuerst</SelectItem>
                <SelectItem value="oldest">Älteste zuerst</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredTeams.length === 0 ? (
        <div className="text-center py-12 bg-secondary/20 rounded-lg">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium">Keine Teams gefunden</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery
              ? "Es wurden keine Teams gefunden, die Ihren Suchkriterien entsprechen."
              : "Es wurden noch keine Teams erstellt."}
          </p>
          {(user?.rolle === "Admin" || user?.rolle === "Trainer") && (
            <div className="mt-6">
              <Button
                asChild
                className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
              >
                <Link href="/teams/new">Neues Team erstellen</Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <Card
              key={team.id}
              className="overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-200"
            >
              {user?.rolle === "Admin" && (
                <div className="absolute top-2 right-2 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-background/80 hover:bg-background"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/teams/${team.id}/edit`} className="flex items-center">
                          <Pencil className="mr-2 h-4 w-4" />
                          Bearbeiten
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(team)}
                        className="flex items-center text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              <div className="relative h-40 bg-gradient-to-b from-primary-900/50 to-background/50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={getTeamLogo(team) || "/placeholder.svg"}
                    alt={`${team.name} Logo`}
                    className="h-24 w-24 object-contain"
                  />
                </div>
              </div>

              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">{team.name}</CardTitle>
                <CardDescription className="line-clamp-2 h-10">
                  {team.beschreibung || "Keine Beschreibung verfügbar"}
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-2">
                {team.trainer && (
                  <div className="flex items-center mt-2">
                    <Avatar className="h-8 w-8 mr-2 border border-primary/20">
                      <AvatarImage src={team.trainer.profilbild_url || ""} alt={team.trainer.vorname} />
                      <AvatarFallback className="bg-primary-900/50">{`${team.trainer.vorname.charAt(0)}${team.trainer.nachname.charAt(0)}`}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Trainer</p>
                      <p className="text-xs text-muted-foreground">{`${team.trainer.vorname} ${team.trainer.nachname}`}</p>
                    </div>

                    {user?.rolle === "Admin" && team.trainer.telefonnummer && (
                      <div className="ml-auto flex items-center text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 mr-1" />
                        {team.trainer.telefonnummer}
                      </div>
                    )}
                  </div>
                )}

                {user?.rolle === "Admin" && (
                  <div className="mt-4">
                    <Badge variant={team.ist_aktiv ? "outline" : "secondary"} className="bg-background/50">
                      {team.ist_aktiv ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button asChild variant="secondary" className="w-full">
                  <Link href={`/teams/${team.id}`}>Details anzeigen</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border border-border/50 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Team löschen
            </DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie das Team "{teamToDelete?.name}" löschen möchten? Diese Aktion kann nicht
              rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="p-4 bg-destructive/20 text-destructive rounded-md">
              <p>{error}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
