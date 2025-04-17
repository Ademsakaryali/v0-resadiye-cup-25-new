"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Tournament } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Trophy,
  PlusCircle,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertCircle,
  Calendar,
  MapPin,
} from "lucide-react"

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"name_asc" | "name_desc" | "newest" | "oldest" | "date_asc" | "date_desc">(
    "date_asc",
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null)
  const { user } = useAuth()
  const supabase = getSupabaseClient()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const { data, error } = await supabase.from("tournaments").select("*")

        if (error) {
          throw error
        }

        setTournaments(data as Tournament[])
        setFilteredTournaments(data as Tournament[])
      } catch (error) {
        console.error("Fehler beim Laden der Turniere:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
  }, [supabase])

  useEffect(() => {
    // Filter und Sortierung anwenden
    let result = [...tournaments]

    // Suche anwenden
    if (searchQuery) {
      result = result.filter(
        (tournament) =>
          tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tournament.beschreibung?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tournament.ort?.toLowerCase().includes(searchQuery.toLowerCase()),
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
      case "date_asc":
        result.sort((a, b) => new Date(a.start_datum).getTime() - new Date(b.start_datum).getTime())
        break
      case "date_desc":
        result.sort((a, b) => new Date(b.start_datum).getTime() - new Date(a.start_datum).getTime())
        break
    }

    setFilteredTournaments(result)
  }, [tournaments, searchQuery, sortOrder])

  const handleDeleteClick = (tournament: Tournament) => {
    setTournamentToDelete(tournament)
    setDeleteDialogOpen(true)
    setError(null) // Clear any previous errors
  }

  const handleDeleteConfirm = async () => {
    if (!tournamentToDelete) return

    try {
      // Prüfen, ob das Turnier Spiele hat
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("id")
        .eq("tournament_id", tournamentToDelete.id)
        .limit(1)

      if (matchesError) throw matchesError

      if (matchesData && matchesData.length > 0) {
        throw new Error(
          "Dieses Turnier kann nicht gelöscht werden, da es Spiele enthält. Bitte löschen Sie zuerst alle Spiele dieses Turniers.",
        )
      }

      // Prüfen, ob das Turnier Blanketts hat
      const { data: blankettsData, error: blankettsError } = await supabase
        .from("blankett_entries")
        .select("id")
        .eq("tournament_id", tournamentToDelete.id)
        .limit(1)

      if (blankettsError) throw blankettsError

      if (blankettsData && blankettsData.length > 0) {
        throw new Error(
          "Dieses Turnier kann nicht gelöscht werden, da es Blanketts enthält. Bitte löschen Sie zuerst alle Blanketts dieses Turniers.",
        )
      }

      // Prüfen, ob das Turnier Teams hat
      const { data: teamsData, error: teamsError } = await supabase
        .from("tournament_teams")
        .select("id")
        .eq("tournament_id", tournamentToDelete.id)
        .limit(1)

      if (teamsError) throw teamsError

      if (teamsData && teamsData.length > 0) {
        throw new Error(
          "Dieses Turnier kann nicht gelöscht werden, da ihm Teams zugeordnet sind. Bitte entfernen Sie zuerst alle Teams aus diesem Turnier.",
        )
      }

      // Wenn keine Abhängigkeiten bestehen, Turnier löschen
      const { error } = await supabase.from("tournaments").delete().eq("id", tournamentToDelete.id)

      if (error) {
        throw error
      }

      setTournaments(tournaments.filter((tournament) => tournament.id !== tournamentToDelete.id))
      setDeleteDialogOpen(false)
      setTournamentToDelete(null)
    } catch (error: any) {
      console.error("Fehler beim Löschen des Turniers:", error)
      setError(error.message || "Ein Fehler ist aufgetreten beim Löschen des Turniers.")
      // Dialog offen lassen, damit der Benutzer die Fehlermeldung sehen kann
    }
  }

  const getTournamentLogo = (tournament: Tournament) => {
    if (tournament.logo_url) {
      return tournament.logo_url
    }
    // Placeholder-Logo mit dem ersten Buchstaben des Turniernamens
    return `/placeholder.svg?height=100&width=100&query=trophy tournament ${tournament.name.charAt(0)}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  const isTournamentActive = (tournament: Tournament) => {
    const now = new Date()
    const startDate = new Date(tournament.start_datum)
    const endDate = new Date(tournament.end_datum)
    return tournament.ist_aktiv && now >= startDate && now <= endDate
  }

  const isTournamentUpcoming = (tournament: Tournament) => {
    const now = new Date()
    const startDate = new Date(tournament.start_datum)
    return tournament.ist_aktiv && now < startDate
  }

  const isTournamentPast = (tournament: Tournament) => {
    const now = new Date()
    const endDate = new Date(tournament.end_datum)
    return now > endDate
  }

  const getTournamentStatus = (tournament: Tournament) => {
    if (!tournament.ist_aktiv) return "Inaktiv"
    if (isTournamentActive(tournament)) return "Aktiv"
    if (isTournamentUpcoming(tournament)) return "Bevorstehend"
    if (isTournamentPast(tournament)) return "Abgeschlossen"
    return "Unbekannt"
  }

  const getTournamentStatusBadge = (tournament: Tournament) => {
    const status = getTournamentStatus(tournament)
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
        <h1 className="text-3xl font-bold">Turniere</h1>
        {user?.rolle === "Admin" && (
          <Button
            asChild
            className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
          >
            <Link href="/tournaments/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Neues Turnier erstellen
            </Link>
          </Button>
        )}
      </div>

      <div className="bg-secondary/30 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Turniere durchsuchen..."
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
                <SelectItem value="date_asc">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Datum (aufsteigend)
                  </div>
                </SelectItem>
                <SelectItem value="date_desc">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Datum (absteigend)
                  </div>
                </SelectItem>
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

      {filteredTournaments.length === 0 ? (
        <div className="text-center py-12 bg-secondary/20 rounded-lg">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium">Keine Turniere gefunden</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery
              ? "Es wurden keine Turniere gefunden, die Ihren Suchkriterien entsprechen."
              : "Es wurden noch keine Turniere erstellt."}
          </p>
          {user?.rolle === "Admin" && (
            <div className="mt-6">
              <Button
                asChild
                className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
              >
                <Link href="/tournaments/new">Neues Turnier erstellen</Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <Card
              key={tournament.id}
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
                        <Link href={`/tournaments/${tournament.id}/edit`} className="flex items-center">
                          <Pencil className="mr-2 h-4 w-4" />
                          Bearbeiten
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(tournament)}
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
                    src={getTournamentLogo(tournament) || "/placeholder.svg"}
                    alt={`${tournament.name} Logo`}
                    className="h-24 w-24 object-contain"
                  />
                </div>
              </div>

              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">{tournament.name}</CardTitle>
                <CardDescription className="line-clamp-2 h-10">
                  {tournament.beschreibung || "Keine Beschreibung verfügbar"}
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      {formatDate(tournament.start_datum)} - {formatDate(tournament.end_datum)}
                    </span>
                  </div>
                  {tournament.ort && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{tournament.ort}</span>
                    </div>
                  )}
                  <div className="pt-2">{getTournamentStatusBadge(tournament)}</div>
                </div>
              </CardContent>

              <CardFooter>
                <Button asChild variant="secondary" className="w-full">
                  <Link href={`/tournaments/${tournament.id}`}>Details anzeigen</Link>
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
              Turnier löschen
            </DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie das Turnier "{tournamentToDelete?.name}" löschen möchten? Diese Aktion kann
              nicht rückgängig gemacht werden.
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
