"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Search, Filter, BarChart2, Users, UserPlus, ChevronRight, Calendar } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function SpielerPage() {
  const [spieler, setSpieler] = useState<any[]>([])
  const [filteredSpieler, setFilteredSpieler] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [teamFilter, setTeamFilter] = useState<string>("all")
  const [positionFilter, setPositionFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")
  const [activeTab, setActiveTab] = useState<string>("grid")

  const supabase = getSupabaseClient()
  const { user } = useAuth()

  useEffect(() => {
    const fetchSpieler = async () => {
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

        // Spieler mit Teams abrufen
        const { data: spielerData, error: spielerError } = await supabase
          .from("users")
          .select(
            `
            id, 
            vorname, 
            nachname, 
            geburtsdatum, 
            profilbild_url,
            team_spieler (
              team_id,
              position,
              trikot_nummer,
              team:team_id (
                id,
                name,
                logo_url
              )
            )
          `,
          )
          .eq("rolle", "Spieler")
          .order("nachname")

        if (spielerError) throw spielerError

        // Daten verarbeiten
        const processedData = (spielerData || []).map((spieler) => {
          const teams = spieler.team_spieler.map((ts: any) => ({
            id: ts.team_id,
            name: ts.team?.name || "Unbekannt",
            logo_url: ts.team?.logo_url,
            position: ts.position,
            trikot_nummer: ts.trikot_nummer,
          }))

          return {
            ...spieler,
            teams,
            // Hauptteam für Filterung (erstes Team)
            hauptteam: teams.length > 0 ? teams[0] : null,
          }
        })

        setSpieler(processedData)
        setFilteredSpieler(processedData)
      } catch (error: any) {
        console.error("Fehler beim Laden der Spieler:", error)
        setError(error.message || "Ein Fehler ist aufgetreten beim Laden der Spieler.")
      } finally {
        setLoading(false)
      }
    }

    fetchSpieler()
  }, [supabase])

  useEffect(() => {
    // Filter und Sortierung anwenden
    let result = [...spieler]

    // Suche anwenden
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (s) =>
          s.vorname.toLowerCase().includes(query) ||
          s.nachname.toLowerCase().includes(query) ||
          s.teams.some((t: any) => t.name.toLowerCase().includes(query)),
      )
    }

    // Team-Filter anwenden
    if (teamFilter !== "all") {
      result = result.filter((s) => s.teams.some((t: any) => t.id === teamFilter))
    }

    // Positions-Filter anwenden
    if (positionFilter !== "all") {
      result = result.filter((s) => s.teams.some((t: any) => t.position === positionFilter))
    }

    // Sortierung anwenden
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return `${a.nachname} ${a.vorname}`.localeCompare(`${b.nachname} ${b.vorname}`)
        case "team":
          const teamA = a.teams.length > 0 ? a.teams[0].name : "ZZZ" // Spieler ohne Team am Ende
          const teamB = b.teams.length > 0 ? b.teams[0].name : "ZZZ"
          return teamA.localeCompare(teamB)
        case "position":
          const posA = a.teams.length > 0 ? a.teams[0].position || "ZZZ" : "ZZZ"
          const posB = b.teams.length > 0 ? b.teams[0].position || "ZZZ" : "ZZZ"
          return posA.localeCompare(posB)
        case "age":
          const ageA = a.geburtsdatum ? calculateAge(a.geburtsdatum) : -1
          const ageB = b.geburtsdatum ? calculateAge(b.geburtsdatum) : -1
          return ageB - ageA // Absteigend nach Alter
        default:
          return `${a.nachname} ${a.vorname}`.localeCompare(`${b.nachname} ${b.vorname}`)
      }
    })

    setFilteredSpieler(result)
  }, [spieler, searchQuery, teamFilter, positionFilter, sortBy])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nicht angegeben"
    return new Date(dateString).toLocaleDateString("de-DE")
  }

  const calculateAge = (dateString: string | null) => {
    if (!dateString) return null
    const birthDate = new Date(dateString)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const getInitials = (vorname: string, nachname: string) => {
    return `${vorname?.charAt(0) || ""}${nachname?.charAt(0) || ""}`
  }

  const getPositionBadge = (position: string | null) => {
    if (!position) return null

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
        <Alert className="bg-red-900/20 border-red-800 text-red-300">
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white neon-text">Spieler</h1>
          <p className="text-gray-400 mt-1">Alle registrierten Spieler im Überblick</p>
        </div>

        <div className="flex gap-2">
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/spieler/statistics">
              <BarChart2 className="mr-2 h-4 w-4" />
              Statistiken
            </Link>
          </Button>
          {user?.rolle === "Admin" && (
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/users/new">
                <UserPlus className="mr-2 h-4 w-4" />
                Spieler erstellen
              </Link>
            </Button>
          )}
        </div>
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
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sortieren nach" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white">
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="position">Position</SelectItem>
                  <SelectItem value="age">Alter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Ansichtsumschalter */}
      <Tabs defaultValue="grid" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-gray-800 border border-gray-700">
          <TabsTrigger
            value="grid"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:neon-text"
          >
            Karten
          </TabsTrigger>
          <TabsTrigger
            value="table"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:neon-text"
          >
            Tabelle
          </TabsTrigger>
        </TabsList>

        {/* Karten-Ansicht */}
        <TabsContent value="grid" className="mt-4">
          {filteredSpieler.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
              <Users className="mx-auto h-12 w-12 text-gray-500" />
              <h3 className="mt-2 text-lg font-medium text-white">Keine Spieler gefunden</h3>
              <p className="mt-1 text-sm text-gray-400">
                Es wurden keine Spieler gefunden, die den Filterkriterien entsprechen.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSpieler.map((spieler) => (
                <Link href={`/spieler/${spieler.id}`} key={spieler.id}>
                  <Card className="bg-gray-900/80 border-gray-800 hover:bg-gray-800/80 transition-all duration-200 h-full">
                    <CardHeader className="pb-2">
                      <div className="flex justify-center">
                        <Avatar className="h-20 w-20 border border-gray-700">
                          <AvatarImage src={spieler.profilbild_url || ""} alt={spieler.vorname} />
                          <AvatarFallback className="bg-gray-800 text-blue-400 text-xl">
                            {getInitials(spieler.vorname, spieler.nachname)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <CardTitle className="text-center text-lg text-white mt-2">
                        {spieler.vorname} {spieler.nachname}
                      </CardTitle>
                      {spieler.geburtsdatum && (
                        <CardDescription className="text-center text-gray-400 flex items-center justify-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {calculateAge(spieler.geburtsdatum)} Jahre
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {spieler.teams.length > 0 ? (
                        <div className="space-y-2">
                          {spieler.teams.map((team: any) => (
                            <div key={team.id} className="flex items-center gap-2">
                              <div className="h-8 w-8 flex-shrink-0">
                                <img
                                  src={team.logo_url || "/placeholder.svg?height=40&width=40&query=soccer team"}
                                  alt={team.name}
                                  className="h-full w-full object-contain"
                                />
                              </div>
                              <div className="flex-grow">
                                <p className="text-sm text-white">{team.name}</p>
                                <div className="flex items-center gap-1">
                                  {team.position && getPositionBadge(team.position)}
                                  {team.trikot_nummer && (
                                    <span className="text-xs text-gray-400">#{team.trikot_nummer}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <Badge className="border-gray-700 text-gray-300">Vereinslos</Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tabellen-Ansicht */}
        <TabsContent value="table" className="mt-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-800">
                <TableRow>
                  <TableHead className="text-gray-300">Name</TableHead>
                  <TableHead className="text-gray-300">Team</TableHead>
                  <TableHead className="text-gray-300">Position</TableHead>
                  <TableHead className="text-gray-300">Alter</TableHead>
                  <TableHead className="text-gray-300 text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSpieler.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                      <Users className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                      Keine Spieler gefunden, die den Filterkriterien entsprechen.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSpieler.map((spieler) => (
                    <TableRow key={spieler.id} className="hover:bg-gray-800/50 border-gray-800">
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2 border border-gray-700">
                            <AvatarImage src={spieler.profilbild_url || ""} alt={spieler.vorname} />
                            <AvatarFallback className="bg-gray-800 text-blue-400 text-xs">
                              {getInitials(spieler.vorname, spieler.nachname)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-white">
                              {spieler.vorname} {spieler.nachname}
                            </div>
                            {spieler.geburtsdatum && (
                              <div className="text-xs text-gray-400">{formatDate(spieler.geburtsdatum)}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {spieler.teams.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {spieler.teams.map((team: any) => (
                              <div key={team.id} className="flex items-center">
                                <div className="h-5 w-5 mr-1">
                                  <img
                                    src={team.logo_url || "/placeholder.svg?height=20&width=20&query=soccer team"}
                                    alt={team.name}
                                    className="h-full w-full object-contain"
                                  />
                                </div>
                                <span className="text-sm text-gray-300">{team.name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Badge className="border-gray-700 text-gray-300">Vereinslos</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {spieler.teams.length > 0 && spieler.teams[0].position
                          ? getPositionBadge(spieler.teams[0].position)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {spieler.geburtsdatum ? (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-blue-400" />
                            <span>{calculateAge(spieler.geburtsdatum)} Jahre</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          asChild
                          size="sm"
                          className="border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-blue-400"
                        >
                          <Link href={`/spieler/${spieler.id}`}>
                            Details
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
