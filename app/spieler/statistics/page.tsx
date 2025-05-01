"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  ArrowLeft,
  AlertCircle,
  Search,
  Filter,
  Award,
  TrendingUp,
  BarChart3,
  Users,
  Zap,
  FileDown,
  FileSpreadsheet,
  FileSpreadsheetIcon as FileCsv,
  FileJson,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"

// Typen für die Spielerstatistiken
type PlayerStats = {
  id: string
  first_name: string
  last_name: string
  profile_image_url?: string
  team_name: string
  team_logo_url?: string
  team_id: string
  position?: string
  jersey_number?: number
  goals: number
  matches_played: number
  minutes_played: number
  yellow_cards: number
  red_cards: number
  assists: number
  clean_sheets?: number // Nur für Torhüter
  goals_per_match: number
  minutes_per_goal: number | null
}

const exportData = (filteredPlayers: PlayerStats[], format: string) => {
  // Kopie der gefilterten Spieler erstellen, um die Daten zu formatieren
  const dataToExport = filteredPlayers.map((player) => ({
    Vorname: player.first_name,
    Nachname: player.last_name,
    Team: player.team_name,
    Position: player.position || "Keine Position",
    Trikotnummer: player.jersey_number || "-",
    Tore: player.goals,
    Vorlagen: player.assists,
    Spiele: player.matches_played,
    Spielminuten: player.minutes_played,
    GelbeKarten: player.yellow_cards,
    RoteKarten: player.red_cards,
    ToreProSpiel: player.goals_per_match,
    MinutenProTor: player.minutes_per_goal || "-",
  }))

  if (dataToExport.length === 0) {
    toast({
      title: "Keine Daten zum Exportieren",
      description: "Es sind keine Daten vorhanden, die exportiert werden können.",
    })
    return
  }

  let content = ""
  let fileName = ""
  let mimeType = ""

  switch (format) {
    case "csv":
      // CSV-Header erstellen
      const headers = Object.keys(dataToExport[0])
      content = headers.join(",") + "\n"

      // CSV-Zeilen erstellen
      dataToExport.forEach((item) => {
        const row = headers
          .map((header) => {
            const value = item[header as keyof typeof item]
            // Werte mit Kommas in Anführungszeichen setzen
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value
          })
          .join(",")
        content += row + "\n"
      })

      fileName = "spielerstatistiken.csv"
      mimeType = "text/csv;charset=utf-8"
      break

    case "json":
      content = JSON.stringify(dataToExport, null, 2)
      fileName = "spielerstatistiken.json"
      mimeType = "application/json"
      break

    case "excel":
      // Einfaches CSV-Format für Excel mit Semikolon als Trennzeichen
      const excelHeaders = Object.keys(dataToExport[0])
      content = excelHeaders.join(";") + "\n"

      dataToExport.forEach((item) => {
        const row = excelHeaders
          .map((header) => {
            const value = item[header as keyof typeof item]
            // Werte mit Semikolons in Anführungszeichen setzen
            return typeof value === "string" && value.includes(";") ? `"${value}"` : value
          })
          .join(";")
        content += row + "\n"
      })

      fileName = "spielerstatistiken.csv"
      mimeType = "text/csv;charset=utf-8"
      break

    default:
      toast({
        title: "Fehler beim Export",
        description: "Das ausgewählte Format wird nicht unterstützt.",
      })
      return
  }

  // Blob erstellen und Download auslösen
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  toast({
    title: "Export erfolgreich",
    description: `Die Daten wurden erfolgreich als ${format.toUpperCase()}-Datei exportiert.`,
  })
}

export default function PlayerStatisticsPage() {
  const [players, setPlayers] = useState<PlayerStats[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [positionFilter, setPositionFilter] = useState<string>("all")
  const [teamFilter, setTeamFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("goals")
  const [teams, setTeams] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<string>("scorers")

  const supabase = getSupabaseClient()
  const { user } = useAuth()

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true)

        // Teams abrufen für Filter
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("id, name, logo_url")
          .eq("ist_aktiv", true)
          .order("name")

        if (teamsError) throw teamsError
        setTeams(teamsData || [])

        // Spielerstatistiken abrufen
        const { data: statsData, error: statsError } = await supabase.from("player_statistics_view").select("*")

        if (statsError) throw statsError

        // Daten verarbeiten und berechnete Felder hinzufügen
        const processedData = (statsData || []).map((player: any) => ({
          ...player,
          goals_per_match: player.matches_played > 0 ? (player.goals / player.matches_played).toFixed(2) : 0,
          minutes_per_goal: player.goals > 0 ? Math.round(player.minutes_played / player.goals) : null,
        }))

        setPlayers(processedData)
        setFilteredPlayers(processedData)
      } catch (error: any) {
        console.error("Fehler beim Laden der Spielerstatistiken:", error)
        setError(error.message || "Ein Fehler ist aufgetreten beim Laden der Statistiken.")
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [supabase])

  useEffect(() => {
    // Filter und Sortierung anwenden
    let result = [...players]

    // Suche anwenden
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (player) =>
          player.first_name.toLowerCase().includes(query) ||
          player.last_name.toLowerCase().includes(query) ||
          player.team_name.toLowerCase().includes(query),
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

    // Sortierung anwenden
    result.sort((a, b) => {
      switch (sortBy) {
        case "goals":
          return b.goals - a.goals
        case "assists":
          return b.assists - a.assists
        case "matches":
          return b.matches_played - a.matches_played
        case "minutes":
          return b.minutes_played - a.minutes_played
        case "yellow_cards":
          return b.yellow_cards - a.yellow_cards
        case "red_cards":
          return b.red_cards - a.red_cards
        case "goals_per_match":
          return Number.parseFloat(b.goals_per_match.toString()) - Number.parseFloat(a.goals_per_match.toString())
        case "minutes_per_goal":
          if (a.minutes_per_goal === null) return 1
          if (b.minutes_per_goal === null) return -1
          return a.minutes_per_goal - b.minutes_per_goal
        case "name":
          return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
        default:
          return b.goals - a.goals
      }
    })

    setFilteredPlayers(result)
  }, [players, searchQuery, positionFilter, teamFilter, sortBy])

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`
  }

  const getPositionBadge = (position?: string) => {
    if (!position) return <Badge className="border-gray-700 text-gray-300">Keine Position</Badge>

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
        return <Badge className="border-gray-700 text-gray-300">{position}</Badge>
    }
  }

  const getTopPlayers = (category: string, count = 5) => {
    const sortedPlayers = [...players].sort((a, b) => {
      switch (category) {
        case "goals":
          return b.goals - a.goals
        case "assists":
          return b.assists - a.assists
        case "matches":
          return b.matches_played - a.matches_played
        case "minutes":
          return b.minutes_played - a.minutes_played
        case "yellow_cards":
          return b.yellow_cards - a.yellow_cards
        case "red_cards":
          return b.red_cards - a.red_cards
        case "goals_per_match":
          return Number.parseFloat(b.goals_per_match.toString()) - Number.parseFloat(a.goals_per_match.toString())
        case "clean_sheets":
          return (b.clean_sheets || 0) - (a.clean_sheets || 0)
        default:
          return b.goals - a.goals
      }
    })

    // Für Torhüter-spezifische Statistiken nur Torhüter filtern
    if (category === "clean_sheets") {
      return sortedPlayers.filter((player) => player.position === "Torwart").slice(0, count)
    }

    return sortedPlayers.slice(0, count)
  }

  const renderStatBar = (value: number, maxValue: number, color = "bg-blue-500") => {
    const percentage = Math.min((value / maxValue) * 100, 100)
    return (
      <div className="w-full bg-gray-800 rounded-full h-2.5 mt-1">
        <div className={`${color} h-2.5 rounded-full neon-border`} style={{ width: `${percentage}%` }}></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="default" className="dark-card">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild className="bg-gray-800 hover:bg-gray-700 text-white">
            <Link href="/">Zurück zur Startseite</Link>
          </Button>
        </div>
      </div>
    )
  }

  const maxGoals = Math.max(...players.map((p) => p.goals), 1)
  const maxAssists = Math.max(...players.map((p) => p.assists), 1)
  const maxMatches = Math.max(...players.map((p) => p.matches_played), 1)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button asChild className="mb-4 text-gray-300 hover:text-blue-400 hover:bg-gray-800 transition-colors">
          <Link href="/spieler">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Spielerübersicht
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-white neon-text">Spielerstatistiken</h1>
        <p className="text-gray-400 mt-1">Detaillierte Statistiken zu allen Spielern, Toren, Spielen und mehr</p>
      </div>

      {/* Filter und Suche */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Spieler durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-700 text-white"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="border-gray-700 text-gray-200 bg-gray-800 hover:bg-gray-700">
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 border-gray-800 text-gray-200">
              <DropdownMenuItem
                onClick={() => exportData(filteredPlayers, "csv")}
                className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
              >
                <FileCsv className="mr-2 h-4 w-4 text-blue-400" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportData(filteredPlayers, "excel")}
                className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-500" />
                Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportData(filteredPlayers, "json")}
                className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
              >
                <FileJson className="mr-2 h-4 w-4 text-yellow-500" />
                JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="w-full sm:w-48">
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Team" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white">
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
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Position" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white">
                  <SelectItem value="all">Alle Positionen</SelectItem>
                  <SelectItem value="Torwart">Torwart</SelectItem>
                  <SelectItem value="Abwehr">Abwehr</SelectItem>
                  <SelectItem value="Mittelfeld">Mittelfeld</SelectItem>
                  <SelectItem value="Sturm">Sturm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <div className="flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sortieren nach" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white">
                  <SelectItem value="goals">Tore</SelectItem>
                  <SelectItem value="assists">Vorlagen</SelectItem>
                  <SelectItem value="matches">Spiele</SelectItem>
                  <SelectItem value="minutes">Spielminuten</SelectItem>
                  <SelectItem value="yellow_cards">Gelbe Karten</SelectItem>
                  <SelectItem value="red_cards">Rote Karten</SelectItem>
                  <SelectItem value="goals_per_match">Tore pro Spiel</SelectItem>
                  <SelectItem value="minutes_per_goal">Minuten pro Tor</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs für verschiedene Statistik-Ansichten */}
      <Tabs defaultValue="scorers" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-gray-800 border border-gray-700">
          <TabsTrigger
            value="scorers"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:neon-text"
          >
            <Award className="h-4 w-4 mr-2" />
            Torschützen
          </TabsTrigger>
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:neon-text"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger
            value="detailed"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:neon-text"
          >
            <Users className="h-4 w-4 mr-2" />
            Detailstatistik
          </TabsTrigger>
        </TabsList>

        {/* Torschützen-Tab */}
        <TabsContent value="scorers" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top-Torschützen */}
            <Card className="dark-card neon-border col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-500" />
                  Top-Torschützen
                </CardTitle>
                <CardDescription className="text-gray-400">Die besten Torschützen aller Teams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {getTopPlayers("goals", 5).map((player, index) => (
                    <div key={player.id} className="flex items-center">
                      <div className="flex-shrink-0 w-8 text-center">
                        <span className={`font-bold ${index < 3 ? "text-blue-400 neon-text" : "text-gray-400"}`}>
                          {index + 1}.
                        </span>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <Avatar className="h-10 w-10 border border-gray-700">
                          <AvatarImage src={player.profile_image_url || ""} alt={player.first_name} />
                          <AvatarFallback className="bg-gray-800 text-blue-400">
                            {getInitials(player.first_name, player.last_name)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="ml-4 flex-grow">
                        <Link
                          href={`/spieler/${player.id}`}
                          className="text-white hover:text-blue-400 transition-colors"
                        >
                          <h4 className="font-medium">
                            {player.first_name} {player.last_name}
                          </h4>
                        </Link>
                        <div className="flex items-center text-sm text-gray-400">
                          <img
                            src={player.team_logo_url || "/placeholder.svg?height=20&width=20&query=soccer team"}
                            alt={player.team_name}
                            className="h-4 w-4 mr-1"
                          />
                          {player.team_name}
                          {player.position && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-800">{player.position}</span>
                          )}
                        </div>
                        <div className="mt-1">{renderStatBar(player.goals, maxGoals, "bg-blue-600")}</div>
                      </div>
                      <div className="flex-shrink-0 ml-4 text-right">
                        <span className="text-2xl font-bold text-blue-400 neon-text">{player.goals}</span>
                        <p className="text-xs text-gray-400">Tore</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top-Vorlagengeber */}
            <Card className="dark-card neon-border">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-blue-500" />
                  Top-Vorlagengeber
                </CardTitle>
                <CardDescription className="text-gray-400">Die besten Vorlagengeber</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getTopPlayers("assists", 5).map((player, index) => (
                    <div key={player.id} className="flex items-center">
                      <div className="flex-shrink-0 w-6 text-center">
                        <span className={`font-bold ${index < 3 ? "text-blue-400 neon-text" : "text-gray-400"}`}>
                          {index + 1}.
                        </span>
                      </div>
                      <div className="ml-2 flex-grow">
                        <Link
                          href={`/spieler/${player.id}`}
                          className="text-white hover:text-blue-400 transition-colors"
                        >
                          <h4 className="font-medium text-sm">
                            {player.first_name} {player.last_name}
                          </h4>
                        </Link>
                        <div className="flex items-center text-xs text-gray-400">{player.team_name}</div>
                      </div>
                      <div className="flex-shrink-0 ml-2 text-right">
                        <span className="text-lg font-bold text-blue-400">{player.assists}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
