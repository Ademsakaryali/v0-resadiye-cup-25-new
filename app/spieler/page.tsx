"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Search, Filter, SortAsc, SortDesc, Grid, List, Calendar } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function SpielerPage() {
  const [loading, setLoading] = useState(true)
  const [spieler, setSpieler] = useState<any[]>([])
  const [filteredSpieler, setFilteredSpieler] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"name_asc" | "name_desc" | "newest" | "oldest">("name_asc")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const supabase = getSupabaseClient()
  const { user } = useAuth()

  useEffect(() => {
    const fetchSpieler = async () => {
      try {
        // Spieler mit Teamzugehörigkeit abrufen
        const { data, error } = await supabase
          .from("users")
          .select(`
            *,
            team_spieler:team_spieler(
              team:team_id(
                id,
                name,
                logo_url
              )
            )
          `)
          .eq("rolle", "Spieler")
          .order("nachname", { ascending: true })

        if (error) {
          throw error
        }

        // Daten verarbeiten, um das aktuelle Team zu extrahieren
        const processedData =
          data?.map((player) => {
            const currentTeam =
              player.team_spieler && player.team_spieler.length > 0 ? player.team_spieler[0].team : null

            return {
              ...player,
              currentTeam,
            }
          }) || []

        setSpieler(processedData)
        setFilteredSpieler(processedData)
      } catch (error) {
        console.error("Fehler beim Laden der Spieler:", error)
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
      result = result.filter(
        (player) =>
          player.vorname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          player.nachname?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Sortierung anwenden
    switch (sortOrder) {
      case "name_asc":
        result.sort((a, b) => `${a.nachname} ${a.vorname}`.localeCompare(`${b.nachname} ${b.vorname}`))
        break
      case "name_desc":
        result.sort((a, b) => `${b.nachname} ${b.vorname}`.localeCompare(`${a.nachname} ${a.vorname}`))
        break
      case "newest":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "oldest":
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
    }

    setFilteredSpieler(result)
  }, [spieler, searchQuery, sortOrder])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nicht angegeben"
    return new Date(dateString).toLocaleDateString("de-DE")
  }

  const calculateAge = (dateString: string | null) => {
    if (!dateString) return "Unbekannt"
    const birthDate = new Date(dateString)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
        {user && user.rolle === "Admin" && (
          <Button asChild className="bg-primary-600 hover:bg-primary-700">
            <Link href="/spieler/new">
              <User className="mr-2 h-4 w-4" />
              Neuer Spieler
            </Link>
          </Button>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-4">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Spieler durchsuchen..."
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
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="rounded-none border-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
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

      {filteredSpieler.length === 0 ? (
        <Card className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">Keine Spieler gefunden</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {searchQuery
                ? "Es wurden keine Spieler gefunden, die Ihren Suchkriterien entsprechen."
                : "Es wurden noch keine Spieler angelegt."}
            </p>
            {user && user.rolle === "Admin" && (
              <Button className="mt-4" asChild>
                <Link href="/spieler/new">Ersten Spieler erstellen</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={viewMode} value={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "list")}>
          <TabsContent value="grid" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredSpieler.map((player) => (
                <Link href={`/spieler/${player.id}`} key={player.id}>
                  <Card className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all duration-200 h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-3">
                        <Avatar className="h-16 w-16 mr-3">
                          <AvatarImage src={player.profilbild_url || ""} alt={player.vorname} />
                          <AvatarFallback>
                            {player.vorname?.charAt(0)}
                            {player.nachname?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-lg">{`${player.vorname} ${player.nachname}`}</h3>
                          <div className="flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                            <span className="text-xs text-gray-500">{formatDate(player.geburtsdatum)}</span>
                            {player.geburtsdatum && (
                              <span className="text-xs ml-2 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                {calculateAge(player.geburtsdatum)} Jahre
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {player.currentTeam ? (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                          <p className="text-xs text-gray-500 mb-2">Aktuelles Team:</p>
                          <div className="flex items-center">
                            <div className="h-8 w-8 mr-2 flex-shrink-0">
                              <img
                                src={
                                  player.currentTeam.logo_url || "/placeholder.svg?height=50&width=50&query=soccer team"
                                }
                                alt={player.currentTeam.name}
                                className="h-full w-full object-contain"
                              />
                            </div>
                            <span className="font-medium text-sm">{player.currentTeam.name}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                          <p className="text-xs text-gray-500">Kein Team zugewiesen</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <div className="bg-white dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Geburtsdatum</TableHead>
                    <TableHead>Alter</TableHead>
                    <TableHead>Team</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSpieler.map((player) => (
                    <TableRow key={player.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell>
                        <Link href={`/spieler/${player.id}`} className="flex items-center">
                          <Avatar className="h-10 w-10 mr-2">
                            <AvatarImage src={player.profilbild_url || ""} alt={player.vorname} />
                            <AvatarFallback className="text-xs">{`${player.vorname?.charAt(0)}${player.nachname?.charAt(0)}`}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{`${player.vorname} ${player.nachname}`}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDate(player.geburtsdatum)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {player.geburtsdatum ? `${calculateAge(player.geburtsdatum)} Jahre` : "Unbekannt"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {player.currentTeam ? (
                          <div className="flex items-center">
                            <div className="h-6 w-6 mr-2 flex-shrink-0">
                              <img
                                src={
                                  player.currentTeam.logo_url || "/placeholder.svg?height=50&width=50&query=soccer team"
                                }
                                alt={player.currentTeam.name}
                                className="h-full w-full object-contain"
                              />
                            </div>
                            <span className="text-sm">{player.currentTeam.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Kein Team</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
