"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Team } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardFooter } from "@/components/ui/card"
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
  AlertTriangle,
  Loader2,
  Grid,
  List,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Loading } from "@/components/ui/loading"

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"name_asc" | "name_desc" | "newest" | "oldest">("name_asc")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const { user } = useAuth()
  const supabase = getSupabaseClient()
  const [error, setError] = useState<string | null>(null)
  const [teamSizes, setTeamSizes] = useState<Record<string, number>>({})

  // Füge diese Zustandsvariablen hinzu
  const [deleteWithDependencies, setDeleteWithDependencies] = useState(false)
  const [dependencies, setDependencies] = useState<{
    matches: boolean
    tournaments: boolean
    players: boolean
    changeRequests: boolean
  }>({
    matches: false,
    tournaments: false,
    players: false,
    changeRequests: false,
  })
  const [isDeleting, setIsDeleting] = useState(false)

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

        // Kadergrößen für jedes Team abrufen
        const teamSizesObj: Record<string, number> = {}
        for (const team of data) {
          const { count, error: countError } = await supabase
            .from("team_spieler")
            .select("*", { count: "exact", head: true })
            .eq("team_id", team.id)

          if (!countError) {
            teamSizesObj[team.id] = count || 0
          }
        }
        setTeamSizes(teamSizesObj)
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

  // Ersetze die handleDeleteClick-Funktion
  const handleDeleteClick = async (team: Team) => {
    setTeamToDelete(team)
    setError(null)
    setDeleteWithDependencies(false)
    setIsDeleting(false)

    // Prüfen auf Abhängigkeiten
    try {
      // Prüfen, ob das Team in Spielen verwendet wird
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("*")
        .or(`team_heim_id.eq.${team.id},team_gast_id.eq.${team.id}`)
        .limit(1)

      if (matchesError) throw matchesError

      // Prüfen, ob das Team in Turnieren verwendet wird
      const { data: tournamentData, error: tournamentError } = await supabase
        .from("tournament_teams")
        .select("*")
        .eq("team_id", team.id)
        .limit(1)

      if (tournamentError) throw tournamentError

      // Prüfen, ob das Team Spieler hat
      const { data: spielerData, error: spielerError } = await supabase
        .from("team_spieler")
        .select("*")
        .eq("team_id", team.id)
        .limit(1)

      if (spielerError) throw spielerError

      // Prüfen, ob das Team Änderungsanfragen hat
      const { data: changeRequestsData, error: changeRequestsError } = await supabase
        .from("team_change_requests")
        .select("*")
        .eq("team_id", team.id)
        .limit(1)

      if (changeRequestsError) throw changeRequestsError

      setDependencies({
        matches: matchesData && matchesData.length > 0,
        tournaments: tournamentData && tournamentData.length > 0,
        players: spielerData && spielerData.length > 0,
        changeRequests: changeRequestsData && changeRequestsData.length > 0,
      })

      setDeleteDialogOpen(true)
    } catch (error: any) {
      console.error("Fehler beim Prüfen der Abhängigkeiten:", error)
      setError("Fehler beim Prüfen der Abhängigkeiten: " + error.message)
      setDeleteDialogOpen(true)
    }
  }

  // Ersetze die handleDeleteConfirm-Funktion
  const handleDeleteConfirm = async () => {
    if (!teamToDelete) return

    setIsDeleting(true)
    setError(null)

    try {
      const hasDependencies =
        dependencies.matches || dependencies.tournaments || dependencies.players || dependencies.changeRequests

      if (hasDependencies && !deleteWithDependencies) {
        throw new Error(
          "Dieses Team hat Abhängigkeiten. Bitte aktivieren Sie die Option zum Löschen aller abhängigen Daten.",
        )
      }

      if (deleteWithDependencies) {
        // Löschen aller abhängigen Daten in der richtigen Reihenfolge

        // 1. Spiele löschen
        if (dependencies.matches) {
          const { error: matchesError } = await supabase
            .from("matches")
            .delete()
            .or(`team_heim_id.eq.${teamToDelete.id},team_gast_id.eq.${teamToDelete.id}`)

          if (matchesError) throw matchesError
        }

        // 2. Turnier-Team-Verknüpfungen löschen
        if (dependencies.tournaments) {
          const { error: tournamentError } = await supabase
            .from("tournament_teams")
            .delete()
            .eq("team_id", teamToDelete.id)

          if (tournamentError) throw tournamentError
        }

        // 3. Spieler-Team-Verknüpfungen löschen
        if (dependencies.players) {
          const { error: spielerError } = await supabase.from("team_spieler").delete().eq("team_id", teamToDelete.id)

          if (spielerError) throw spielerError
        }

        // 4. Team-Änderungsanfragen löschen
        if (dependencies.changeRequests) {
          const { error: changeRequestsError } = await supabase
            .from("team_change_requests")
            .delete()
            .eq("team_id", teamToDelete.id)

          if (changeRequestsError) throw changeRequestsError
        }
      }

      // 5. Team löschen
      const { error } = await supabase.from("teams").delete().eq("id", teamToDelete.id)
      if (error) throw error

      setTeams(teams.filter((team) => team.id !== teamToDelete.id))
      setDeleteDialogOpen(false)
      setTeamToDelete(null)
    } catch (error: any) {
      console.error("Fehler beim Löschen des Teams:", error)
      setError(error.message || "Ein Fehler ist aufgetreten beim Löschen des Teams.")
    } finally {
      setIsDeleting(false)
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
    return <Loading fullPage size="lg" text="Teams werden geladen..." />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
        {user?.rolle === "Admin" && (
          <Button asChild className="bg-primary-600 hover:bg-primary-700">
            <Link href="/teams/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Neues Team erstellen
            </Link>
          </Button>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-4">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Teams durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-900"
            />
          </div>
          <div className="flex gap-2">
            <div className="w-full md:w-48">
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
                <SelectTrigger className="bg-white dark:bg-gray-900">
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
            <div className="flex border rounded-md overflow-hidden">
              <Button
                className={viewMode === "grid" ? "" : "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="rounded-none border-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                className={viewMode === "list" ? "" : "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="rounded-none border-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {filteredTeams.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-800">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium">Keine Teams gefunden</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchQuery
              ? "Es wurden keine Teams gefunden, die Ihren Suchkriterien entsprechen."
              : "Es wurden noch keine Teams erstellt."}
          </p>
          {user?.rolle === "Admin" && (
            <div className="mt-6">
              <Button asChild className="bg-primary-600 hover:bg-primary-700">
                <Link href="/teams/new">Neues Team erstellen</Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Tabs defaultValue={viewMode} value={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "list")}>
          <TabsContent value="grid" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTeams.map((team) => (
                <Card
                  key={team.id}
                  className="overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 hover:shadow-md transition-all duration-200"
                >
                  {user?.rolle === "Admin" && (
                    <div className="absolute top-2 right-2 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 h-7 w-7 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800"
                            size="icon"
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
                            className="flex items-center text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  <div className="flex items-center p-3 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex-shrink-0 h-10 w-10 mr-3">
                      <img
                        src={getTeamLogo(team) || "/placeholder.svg"}
                        alt={`${team.name} Logo`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium truncate">{team.name}</h3>
                      {team.trainer && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          Trainer: {team.trainer.vorname} {team.trainer.nachname}
                        </p>
                      )}
                    </div>
                    <div className="ml-2 flex flex-col items-end">
                      <Badge className="text-xs border">{teamSizes[team.id] || 0} Spieler</Badge>
                      {user?.rolle === "Admin" && (
                        <Badge
                          className={
                            team.ist_aktiv ? "border" : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }
                          className="mt-1 text-xs"
                        >
                          {team.ist_aktiv ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardFooter className="p-2">
                    <Button
                      asChild
                      className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 w-full"
                      size="sm"
                    >
                      <Link href={`/teams/${team.id}`}>Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <div className="bg-white dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Trainer</TableHead>
                    <TableHead className="hidden md:table-cell">Kadergröße</TableHead>
                    {user?.rolle === "Admin" && <TableHead className="hidden md:table-cell">Status</TableHead>}
                    <TableHead className="w-[100px]">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 mr-3">
                            <img
                              src={getTeamLogo(team) || "/placeholder.svg"}
                              alt={`${team.name} Logo`}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span className="font-medium">{team.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {team.trainer && (
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={team.trainer.profilbild_url || ""} alt={team.trainer.vorname} />
                              <AvatarFallback className="text-xs">{`${team.trainer.vorname.charAt(0)}${team.trainer.nachname.charAt(0)}`}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{`${team.trainer.vorname} ${team.trainer.nachname}`}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className="text-xs border">{teamSizes[team.id] || 0} Spieler</Badge>
                      </TableCell>
                      {user?.rolle === "Admin" && (
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            className={
                              team.ist_aktiv
                                ? "border"
                                : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }
                            className="text-xs"
                          >
                            {team.ist_aktiv ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            asChild
                            className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Link href={`/teams/${team.id}`}>
                              <Search className="h-4 w-4" />
                            </Link>
                          </Button>
                          {user?.rolle === "Admin" && (
                            <>
                              <Button
                                asChild
                                className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <Link href={`/teams/${team.id}/edit`}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                size="icon"
                                onClick={() => handleDeleteClick(team)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Team löschen
            </DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie das Team "{teamToDelete?.name}" löschen möchten? Diese Aktion kann nicht
              rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>

          {(dependencies.matches ||
            dependencies.tournaments ||
            dependencies.players ||
            dependencies.changeRequests) && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-md mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400">
                    Dieses Team hat abhängige Daten
                  </h4>
                  <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc pl-5">
                    {dependencies.matches && <li>Spiele, in denen dieses Team teilnimmt</li>}
                    {dependencies.tournaments && <li>Turniere, an denen dieses Team teilnimmt</li>}
                    {dependencies.players && <li>Spieler, die diesem Team zugeordnet sind</li>}
                    {dependencies.changeRequests && <li>Änderungsanfragen für dieses Team</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-md">
              <p>{error}</p>
            </div>
          )}

          {(dependencies.matches ||
            dependencies.tournaments ||
            dependencies.players ||
            dependencies.changeRequests) && (
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="delete-dependencies"
                checked={deleteWithDependencies}
                onCheckedChange={(checked) => setDeleteWithDependencies(checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="delete-dependencies"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Team und alle zugehörigen Daten löschen
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Dies löscht das Team und alle damit verbundenen Spiele, Turnierbeteiligungen, Spielerzuordnungen und
                  Änderungsanfragen.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              className="border bg-background hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Abbrechen
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteConfirm}
              disabled={
                isDeleting ||
                ((dependencies.matches ||
                  dependencies.tournaments ||
                  dependencies.players ||
                  dependencies.changeRequests) &&
                  !deleteWithDependencies)
              }
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird gelöscht...
                </>
              ) : (
                "Löschen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
