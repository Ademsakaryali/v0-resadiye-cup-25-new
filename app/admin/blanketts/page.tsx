"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Tournament, BlankettSettings, BlankettEntry } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, CheckCircle, Clock, FileText, Settings, AlertCircle, Search, Filter, Trophy } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"

export default function AdminBlankettPage() {
  const { user } = useAuth()
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [settings, setSettings] = useState<Record<string, BlankettSettings>>({})
  const [blanketts, setBlanketts] = useState<BlankettEntry[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("alle")
  const [tournamentFilter, setTournamentFilter] = useState<string>("alle")
  const [filteredBlanketts, setFilteredBlanketts] = useState<BlankettEntry[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Aktive Turniere abrufen
        const { data: tournamentData, error: tournamentError } = await supabase
          .from("tournaments")
          .select("*")
          .eq("ist_aktiv", true)
          .order("start_datum", { ascending: true })

        if (tournamentError) throw tournamentError

        setTournaments(tournamentData)

        // Blankett-Einstellungen für alle Turniere abrufen
        const { data: settingsData, error: settingsError } = await supabase.from("blankett_settings").select("*")

        if (settingsError) throw settingsError

        const settingsMap: Record<string, BlankettSettings> = {}
        settingsData.forEach((setting: BlankettSettings) => {
          settingsMap[setting.tournament_id] = setting
        })
        setSettings(settingsMap)

        // Alle Blanketts abrufen
        const { data: blankettData, error: blankettError } = await supabase
          .from("blankett_entries")
          .select(`
            *,
            team:team_id (
              id,
              name,
              logo_url
            ),
            tournament:tournament_id (
              id,
              name
            )
          `)
          .order("updated_at", { ascending: false })

        if (blankettError) throw blankettError

        setBlanketts(blankettData)
        setFilteredBlanketts(blankettData)
      } catch (error) {
        console.error("Fehler beim Laden der Daten:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  useEffect(() => {
    // Blanketts filtern basierend auf der Suchanfrage und den Filtern
    let filtered = [...blanketts]

    // Suche anwenden
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (blankett) =>
          blankett.team?.name.toLowerCase().includes(query) || blankett.tournament?.name.toLowerCase().includes(query),
      )
    }

    // Status-Filter anwenden
    if (statusFilter !== "alle") {
      filtered = filtered.filter((blankett) => blankett.status === statusFilter)
    }

    // Turnier-Filter anwenden
    if (tournamentFilter !== "alle") {
      filtered = filtered.filter((blankett) => blankett.tournament_id === tournamentFilter)
    }

    setFilteredBlanketts(filtered)
  }, [searchQuery, statusFilter, tournamentFilter, blanketts])

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unbekannt"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "entwurf":
        return (
          <Badge variant="outline" className="bg-background/50">
            Entwurf
          </Badge>
        )
      case "eingereicht":
        return <Badge variant="secondary">Eingereicht</Badge>
      case "genehmigt":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" /> Genehmigt
          </Badge>
        )
      case "abgelehnt":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" /> Abgelehnt
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
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
    <RequireAuth allowedRoles={["Admin"]}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Mannschaftsblanketts</h1>
        </div>

        <Tabs defaultValue="blanketts" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4 sm:mb-6 bg-secondary/30">
            <TabsTrigger value="blanketts" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Blanketts
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              Einstellungen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blanketts">
            <div className="space-y-4">
              {/* Suchleiste und Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative col-span-1 sm:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Blanketts durchsuchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background/50"
                  />
                </div>

                <div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-background/50">
                      <div className="flex items-center">
                        <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="truncate">
                          {statusFilter === "alle"
                            ? "Status: Alle"
                            : `Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`}
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Status</SelectItem>
                      <SelectItem value="entwurf">Entwurf</SelectItem>
                      <SelectItem value="eingereicht">Eingereicht</SelectItem>
                      <SelectItem value="genehmigt">Genehmigt</SelectItem>
                      <SelectItem value="abgelehnt">Abgelehnt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select value={tournamentFilter} onValueChange={setTournamentFilter}>
                    <SelectTrigger className="bg-background/50">
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="truncate">
                          {tournamentFilter === "alle"
                            ? "Turnier: Alle"
                            : `Turnier: ${tournaments.find((t) => t.id === tournamentFilter)?.name?.substring(0, 15) || "..."}`}
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Turniere</SelectItem>
                      {tournaments.map((tournament) => (
                        <SelectItem key={tournament.id} value={tournament.id}>
                          {tournament.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">Alle Blanketts</CardTitle>
                  <CardDescription>Übersicht aller Mannschaftsblanketts</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredBlanketts.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-lg font-medium">Keine Blanketts gefunden</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {searchQuery || statusFilter !== "alle" || tournamentFilter !== "alle"
                          ? "Es wurden keine Blanketts gefunden, die Ihren Filterkriterien entsprechen."
                          : "Es wurden noch keine Blanketts erstellt."}
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* Desktop-Ansicht: Tabelle */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Team</TableHead>
                              <TableHead>Turnier</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Eingereicht am</TableHead>
                              <TableHead className="text-right">Aktionen</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredBlanketts.map((blankett) => (
                              <TableRow key={blankett.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {blankett.team?.logo_url && (
                                      <div className="w-6 h-6 rounded-full overflow-hidden bg-secondary/20 flex-shrink-0">
                                        <img
                                          src={blankett.team.logo_url || "/placeholder.svg"}
                                          alt={`${blankett.team?.name} Logo`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                    <span className="font-medium">{blankett.team?.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{blankett.tournament?.name}</TableCell>
                                <TableCell>{getStatusBadge(blankett.status)}</TableCell>
                                <TableCell>
                                  {blankett.eingereicht_am ? formatDate(blankett.eingereicht_am) : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button asChild size="sm" variant="outline">
                                    <Link href={`/admin/blanketts/${blankett.id}`}>Details</Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile-Ansicht: Karten */}
                      <div className="md:hidden space-y-3">
                        {filteredBlanketts.map((blankett) => (
                          <div
                            key={blankett.id}
                            className="p-3 rounded-lg border border-border/50 bg-card/30 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {blankett.team?.logo_url && (
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary/20 flex-shrink-0">
                                    <img
                                      src={blankett.team.logo_url || "/placeholder.svg"}
                                      alt={`${blankett.team?.name} Logo`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{blankett.team?.name}</div>
                                  <div className="text-sm text-muted-foreground">{blankett.tournament?.name}</div>
                                </div>
                              </div>
                              {getStatusBadge(blankett.status)}
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <div className="text-muted-foreground">
                                {blankett.eingereicht_am
                                  ? `Eingereicht: ${formatDate(blankett.eingereicht_am)}`
                                  : "Noch nicht eingereicht"}
                              </div>
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/admin/blanketts/${blankett.id}`}>Details</Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {tournaments.map((tournament) => (
                <Card key={tournament.id} className="border border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{tournament.name}</CardTitle>
                    <CardDescription className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(tournament.start_datum)} - {formatDate(tournament.end_datum)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {settings[tournament.id] ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="p-2 rounded-md bg-secondary/20">
                            <span className="text-muted-foreground">Min. Spieler:</span>{" "}
                            {settings[tournament.id].min_spieler}
                          </div>
                          <div className="p-2 rounded-md bg-secondary/20">
                            <span className="text-muted-foreground">Max. Spieler:</span>{" "}
                            {settings[tournament.id].max_spieler}
                          </div>
                          <div className="p-2 rounded-md bg-secondary/20">
                            <span className="text-muted-foreground">Ohne Anmeldung:</span>{" "}
                            {settings[tournament.id].ohne_anmeldung ? "Ja" : "Nein"}
                          </div>
                          <div className="p-2 rounded-md bg-secondary/20">
                            <span className="text-muted-foreground">Countdown aktiv:</span>{" "}
                            {settings[tournament.id].countdown_aktiv ? "Ja" : "Nein"}
                          </div>
                        </div>
                        {settings[tournament.id].countdown_aktiv && settings[tournament.id].countdown_datum && (
                          <div className="flex items-center p-2 rounded-md bg-secondary/20 text-sm">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            Frist: {formatDate(settings[tournament.id].countdown_datum)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">Keine Einstellungen vorhanden</p>
                      </div>
                    )}
                  </CardContent>
                  <div className="px-4 pb-4">
                    <Button asChild className="w-full">
                      <Link href={`/admin/blanketts/settings/${tournament.id}`}>
                        <Settings className="mr-2 h-4 w-4" />
                        {settings[tournament.id] ? "Einstellungen bearbeiten" : "Einstellungen erstellen"}
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </RequireAuth>
  )
}
