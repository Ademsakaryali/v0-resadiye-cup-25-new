"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loading } from "@/components/ui/loading"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Search, Filter, AlertCircle, UserPlus, Users } from "lucide-react"

export default function PlayersPage() {
  const [players, setPlayers] = useState<any[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [positionFilter, setPositionFilter] = useState<string>("all")
  const [teamFilter, setTeamFilter] = useState<string>("all")
  const [teams, setTeams] = useState<any[]>([])

  const supabase = getSupabaseClient()
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true)

        // Teams abrufen für Filter
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("id, name")
          .eq("ist_aktiv", true)
          .order("name")

        if (teamsError) throw teamsError
        setTeams(teamsData || [])

        // Spieler abrufen
        const { data, error } = await supabase.from("players_with_teams_view").select("*").order("last_name")

        if (error) throw error
        setPlayers(data || [])
        setFilteredPlayers(data || [])
      } catch (error: any) {
        console.error("Fehler beim Laden der Spieler:", error)
        setError(error.message || "Ein Fehler ist aufgetreten beim Laden der Spieler.")
      } finally {
        setLoading(false)
      }
    }

    fetchPlayers()
  }, [supabase])

  useEffect(() => {
    // Filter anwenden
    let result = [...players]

    // Suche anwenden
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (player) =>
          player.first_name.toLowerCase().includes(query) ||
          player.last_name.toLowerCase().includes(query) ||
          player.team_name?.toLowerCase().includes(query),
      )
    }

    // Position-Filter anwenden
    if (positionFilter !== "all") {
      result = result.filter((player) => player.position === positionFilter)
    }

    // Team-Filter anwenden
    if (teamFilter !== "all") {
      result = result.filter((player) => player.team_id === teamFilter)
    }

    setFilteredPlayers(result)
  }, [players, searchQuery, positionFilter, teamFilter])

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`
  }

  const getPositionBadge = (position?: string) => {
    if (!position) return <Badge className="border border-gray-200 dark:border-gray-800">Keine Position</Badge>

    switch (position) {
      case "Torwart":
        return <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">{position}</Badge>
      case "Abwehr":
        return <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">{position}</Badge>
      case "Mittelfeld":
        return <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">{position}</Badge>
      case "Sturm":
        return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30">{position}</Badge>
      default:
        return <Badge className="border border-gray-200 dark:border-gray-800">{position}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Loading fullPage text="Spieler werden geladen..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert className="bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Spieler</h1>
          <p className="text-gray-500 dark:text-gray-400">Alle registrierten Spieler und ihre Teamzugehörigkeit</p>
        </div>
        {user?.rolle === "Admin" && (
          <Button onClick={() => router.push("/users/new")} className="mt-4 md:mt-0">
            <UserPlus className="mr-2 h-4 w-4" />
            Neuer Spieler
          </Button>
        )}
      </div>

      {/* Filter und Suche */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Spieler durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="w-full sm:w-48">
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Team" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Position" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Positionen</SelectItem>
                  <SelectItem value="Torwart">Torwart</SelectItem>
                  <SelectItem value="Abwehr">Abwehr</SelectItem>
                  <SelectItem value="Mittelfeld">Mittelfeld</SelectItem>
                  <SelectItem value="Sturm">Sturm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Spielerliste */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">Keine Spieler gefunden</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Es wurden keine Spieler gefunden, die den Filterkriterien entsprechen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlayers.map((player) => (
            <Link key={player.id} href={`/spieler/${player.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={player.profile_image_url || ""} alt={player.first_name} />
                      <AvatarFallback>{getInitials(player.first_name, player.last_name)}</AvatarFallback>
                    </Avatar>
                    {player.position && <div>{getPositionBadge(player.position)}</div>}
                  </div>
                  <CardTitle className="mt-2">
                    {player.first_name} {player.last_name}
                  </CardTitle>
                  <CardDescription>
                    {player.team_name || "Kein Team"}{" "}
                    {player.jersey_number && <span className="text-gray-500">#{player.jersey_number}</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>Alter: {player.age || "Nicht angegeben"}</p>
                    {player.nationality && <p>Nationalität: {player.nationality}</p>}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="w-full flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <span>Spiele: {player.matches_played || 0}</span>
                    <span>Tore: {player.goals || 0}</span>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
