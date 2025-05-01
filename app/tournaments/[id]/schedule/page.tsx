"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { format, parseISO, isToday, isTomorrow, isYesterday, addDays } from "date-fns"
import { de } from "date-fns/locale"
import { ArrowLeft, Calendar, MapPin, Clock, Filter, ChevronDown, Search, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type Match = {
  id: string
  tournament_id: string
  team_heim_id: string
  team_gast_id: string
  datum: string
  ort: string
  status: "geplant" | "live" | "beendet" | "abgesagt"
  tore_heim: number
  tore_gast: number
  team_heim: {
    id: string
    name: string
    logo_url?: string
  }
  team_gast: {
    id: string
    name: string
    logo_url?: string
  }
}

type Tournament = {
  id: string
  name: string
  logo_url?: string
  start_datum: string
  end_datum: string
}

export default function TournamentSchedulePage() {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [teamFilter, setTeamFilter] = useState<string[]>([])
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [activeTab, setActiveTab] = useState("all")

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

  // Alle verfügbaren Teams für Filter
  const availableTeams = useMemo(() => {
    const teams = new Map()
    matches.forEach((match) => {
      if (match.team_heim) {
        teams.set(match.team_heim.id, match.team_heim)
      }
      if (match.team_gast) {
        teams.set(match.team_gast.id, match.team_gast)
      }
    })
    return Array.from(teams.values())
  }, [matches])

  // Gefilterte und sortierte Spiele
  const filteredMatches = useMemo(() => {
    return matches
      .filter((match) => {
        // Suche
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch =
          searchQuery === "" ||
          match.team_heim?.name.toLowerCase().includes(searchLower) ||
          match.team_gast?.name.toLowerCase().includes(searchLower) ||
          (match.ort && match.ort.toLowerCase().includes(searchLower))

        // Status Filter
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(match.status)

        // Team Filter
        const matchesTeam =
          teamFilter.length === 0 || teamFilter.includes(match.team_heim_id) || teamFilter.includes(match.team_gast_id)

        // Tab Filter
        if (activeTab === "today") {
          return matchesSearch && matchesStatus && matchesTeam && isToday(new Date(match.datum))
        } else if (activeTab === "tomorrow") {
          return matchesSearch && matchesStatus && matchesTeam && isTomorrow(new Date(match.datum))
        } else if (activeTab === "upcoming") {
          const matchDate = new Date(match.datum)
          return matchesSearch && matchesStatus && matchesTeam && matchDate > new Date() && !isToday(matchDate)
        } else if (activeTab === "past") {
          const matchDate = new Date(match.datum)
          const yesterday = addDays(new Date(), -1)
          return matchesSearch && matchesStatus && matchesTeam && matchDate <= yesterday
        }

        return matchesSearch && matchesStatus && matchesTeam
      })
      .sort((a, b) => {
        const dateA = new Date(a.datum).getTime()
        const dateB = new Date(b.datum).getTime()
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA
      })
  }, [matches, searchQuery, statusFilter, teamFilter, sortOrder, activeTab])

  // Gruppiere Spiele nach Datum
  const groupedMatches = useMemo(() => {
    const groups: { [key: string]: Match[] } = {}

    filteredMatches.forEach((match) => {
      const date = format(new Date(match.datum), "yyyy-MM-dd")
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(match)
    })

    return groups
  }, [filteredMatches])

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString)

    if (isToday(date)) {
      return "Heute"
    } else if (isTomorrow(date)) {
      return "Morgen"
    } else if (isYesterday(date)) {
      return "Gestern"
    }

    return format(date, "EEEE, d. MMMM yyyy", { locale: de })
  }

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm", { locale: de })
  }

  const getMatchStatusBadge = (status: string) => {
    switch (status) {
      case "geplant":
        return (
          <Badge variant="outline" className="border-gray-600 text-gray-300">
            Geplant
          </Badge>
        )
      case "live":
        return <Badge className="bg-red-600 text-white">Live</Badge>
      case "beendet":
        return (
          <Badge variant="secondary" className="bg-gray-700 text-gray-300">
            Beendet
          </Badge>
        )
      case "abgesagt":
        return <Badge variant="destructive">Abgesagt</Badge>
      default:
        return (
          <Badge variant="outline" className="border-gray-600 text-gray-300">
            Unbekannt
          </Badge>
        )
    }
  }

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }

  const toggleTeamFilter = (teamId: string) => {
    setTeamFilter((prev) => (prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]))
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter([])
    setTeamFilter([])
    setSortOrder("asc")
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
        <Button variant="ghost" asChild className="mb-4 text-gray-300 hover:text-blue-400">
          <Link href={`/tournaments/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Turnier
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error || "Turnier konnte nicht geladen werden."}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" asChild className="mb-4 text-gray-300 hover:text-blue-400">
        <Link href={`/tournaments/${params.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Turnier
        </Link>
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-800/80 flex items-center justify-center border border-gray-700">
            <img
              src={tournament.logo_url || `/placeholder.svg?height=48&width=48&query=tournament schedule`}
              alt={`${tournament.name} Logo`}
              className="h-10 w-10 object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white neon-text">Spielplan: {tournament.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-400">
                {format(new Date(tournament.start_datum), "dd.MM.yyyy", { locale: de })} -
                {format(new Date(tournament.end_datum), "dd.MM.yyyy", { locale: de })}
              </span>
            </div>
          </div>
        </div>

        {user?.rolle === "Admin" && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href={`/tournaments/${tournament.id}/matches/manage`}>Spiele verwalten</Link>
          </Button>
        )}
      </div>

      <div className="mb-6">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 bg-gray-800 border border-gray-700">
            <TabsTrigger
              value="all"
              className={cn(
                "data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400 data-[state=active]:neon-text",
                "text-gray-300 hover:text-white",
              )}
            >
              Alle Spiele
            </TabsTrigger>
            <TabsTrigger
              value="today"
              className={cn(
                "data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400 data-[state=active]:neon-text",
                "text-gray-300 hover:text-white",
              )}
            >
              Heute
            </TabsTrigger>
            <TabsTrigger
              value="tomorrow"
              className={cn(
                "data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400 data-[state=active]:neon-text",
                "text-gray-300 hover:text-white",
              )}
            >
              Morgen
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              className={cn(
                "data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400 data-[state=active]:neon-text",
                "text-gray-300 hover:text-white",
              )}
            >
              Kommende
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className={cn(
                "data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400 data-[state=active]:neon-text",
                "text-gray-300 hover:text-white",
              )}
            >
              Vergangene
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Suche nach Teams oder Orten..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500 focus:border-blue-500"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-500 hover:text-gray-300"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-gray-700 text-gray-200 bg-gray-800 hover:bg-gray-700">
                    <Filter className="mr-2 h-4 w-4" />
                    Status
                    {statusFilter.length > 0 && (
                      <Badge className="ml-2 bg-blue-600 text-white">{statusFilter.length}</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-800 text-gray-200">
                  <DropdownMenuLabel>Status Filter</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("geplant")}
                    onCheckedChange={() => toggleStatusFilter("geplant")}
                    className="hover:bg-gray-800 focus:bg-gray-800"
                  >
                    Geplant
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("live")}
                    onCheckedChange={() => toggleStatusFilter("live")}
                    className="hover:bg-gray-800 focus:bg-gray-800"
                  >
                    Live
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("beendet")}
                    onCheckedChange={() => toggleStatusFilter("beendet")}
                    className="hover:bg-gray-800 focus:bg-gray-800"
                  >
                    Beendet
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("abgesagt")}
                    onCheckedChange={() => toggleStatusFilter("abgesagt")}
                    className="hover:bg-gray-800 focus:bg-gray-800"
                  >
                    Abgesagt
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-gray-700 text-gray-200 bg-gray-800 hover:bg-gray-700">
                    <Filter className="mr-2 h-4 w-4" />
                    Teams
                    {teamFilter.length > 0 && (
                      <Badge className="ml-2 bg-blue-600 text-white">{teamFilter.length}</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-800 text-gray-200">
                  <DropdownMenuLabel>Team Filter</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <div className="max-h-[200px] overflow-y-auto">
                    {availableTeams.map((team) => (
                      <DropdownMenuCheckboxItem
                        key={team.id}
                        checked={teamFilter.includes(team.id)}
                        onCheckedChange={() => toggleTeamFilter(team.id)}
                        className="hover:bg-gray-800 focus:bg-gray-800"
                      >
                        {team.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-gray-700 text-gray-200 bg-gray-800 hover:bg-gray-700">
                    <ChevronDown className="mr-2 h-4 w-4" />
                    {sortOrder === "asc" ? "Aufsteigend" : "Absteigend"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-800 text-gray-200">
                  <DropdownMenuItem onClick={() => setSortOrder("asc")} className="hover:bg-gray-800 focus:bg-gray-800">
                    Aufsteigend
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortOrder("desc")}
                    className="hover:bg-gray-800 focus:bg-gray-800"
                  >
                    Absteigend
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {(searchQuery || statusFilter.length > 0 || teamFilter.length > 0 || sortOrder !== "asc") && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-gray-400 hover:text-blue-400 hover:bg-gray-800"
                >
                  <X className="mr-2 h-4 w-4" />
                  Filter zurücksetzen
                </Button>
              )}
            </div>
          </div>

          {Object.keys(groupedMatches).length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
              <Calendar className="mx-auto h-12 w-12 text-gray-500" />
              <h3 className="mt-2 text-lg font-medium text-white">Keine Spiele gefunden</h3>
              <p className="mt-1 text-sm text-gray-400">
                {searchQuery || statusFilter.length > 0 || teamFilter.length > 0
                  ? "Keine Spiele entsprechen den ausgewählten Filtern."
                  : "Für dieses Turnier wurden noch keine Spiele geplant."}
              </p>
              {(searchQuery || statusFilter.length > 0 || teamFilter.length > 0) && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-4 border-gray-700 text-gray-200 hover:bg-gray-800 hover:text-blue-400"
                >
                  Filter zurücksetzen
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedMatches).map(([date, dateMatches]) => (
                <div key={date} className="space-y-4">
                  <h2 className="text-xl font-semibold text-white neon-text">
                    {formatDate(date)}
                    <span className="text-sm font-normal text-gray-400 ml-2">
                      ({dateMatches.length} {dateMatches.length === 1 ? "Spiel" : "Spiele"})
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {dateMatches.map((match) => (
                      <Card key={match.id} className="overflow-hidden border-gray-800 bg-gray-900/80 backdrop-blur-sm">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                              <div className="flex flex-col items-center">
                                <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-800 flex items-center justify-center border border-gray-700">
                                  <img
                                    src={
                                      match.team_heim?.logo_url ||
                                      `/placeholder.svg?height=40&width=40&query=team ${match.team_heim?.name.charAt(0) || "T"}`
                                    }
                                    alt={`${match.team_heim?.name} Logo`}
                                    className="h-8 w-8 object-contain"
                                  />
                                </div>
                                <span className="text-sm font-medium mt-1 text-center text-gray-300">
                                  {match.team_heim?.name || "Unbekannt"}
                                </span>
                              </div>

                              <div className="flex flex-col items-center">
                                {match.status === "beendet" ? (
                                  <div className="text-xl font-bold text-white neon-text">
                                    {match.tore_heim} : {match.tore_gast}
                                  </div>
                                ) : (
                                  <div className="text-xl font-bold text-gray-400">vs.</div>
                                )}
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3 text-blue-400" />
                                  <span className="text-xs text-gray-400">{formatTime(match.datum)}</span>
                                </div>
                              </div>

                              <div className="flex flex-col items-center">
                                <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-800 flex items-center justify-center border border-gray-700">
                                  <img
                                    src={
                                      match.team_gast?.logo_url ||
                                      `/placeholder.svg?height=40&width=40&query=team ${match.team_gast?.name.charAt(0) || "T"}`
                                    }
                                    alt={`${match.team_gast?.name} Logo`}
                                    className="h-8 w-8 object-contain"
                                  />
                                </div>
                                <span className="text-sm font-medium mt-1 text-center text-gray-300">
                                  {match.team_gast?.name || "Unbekannt"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {getMatchStatusBadge(match.status)}
                              {match.ort && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-blue-400" />
                                  <span className="text-xs text-gray-400">{match.ort}</span>
                                </div>
                              )}
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="border-gray-700 text-gray-200 hover:bg-gray-800 hover:text-blue-400"
                              >
                                <Link href={`/matches/${match.id}`}>Details</Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Tabs>
      </div>
    </div>
  )
}
