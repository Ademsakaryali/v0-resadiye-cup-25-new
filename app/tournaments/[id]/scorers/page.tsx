"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Player = {
  id: string
  name: string
  team: string
  teamLogo: string
  goals: number
}

export default function TournamentScorersPage({ params }: { params: { id: string } }) {
  const [filter, setFilter] = useState("")
  const [teamFilter, setTeamFilter] = useState("")

  // Beispieldaten für Torschützen
  const players: Player[] = [
    {
      id: "1",
      name: "Robert Lewandowski",
      team: "FC Bayern München",
      teamLogo: "/abstract-fcb.png",
      goals: 12,
    },
    { id: "2", name: "Erling Haaland", team: "Borussia Dortmund", teamLogo: "/abstract-geometric-bvb.png", goals: 10 },
    { id: "3", name: "Thomas Müller", team: "FC Bayern München", teamLogo: "/abstract-fcb.png", goals: 8 },
    { id: "4", name: "André Silva", team: "RB Leipzig", teamLogo: "/rbl-graffiti.png", goals: 7 },
    { id: "5", name: "Patrik Schick", team: "Bayer Leverkusen", teamLogo: "/abstract-geometric-shapes.png", goals: 6 },
    { id: "6", name: "Serge Gnabry", team: "FC Bayern München", teamLogo: "/abstract-fcb.png", goals: 5 },
    { id: "7", name: "Marco Reus", team: "Borussia Dortmund", teamLogo: "/abstract-geometric-bvb.png", goals: 5 },
    { id: "8", name: "Christopher Nkunku", team: "RB Leipzig", teamLogo: "/rbl-graffiti.png", goals: 4 },
  ]

  // Filter players based on search and team filter
  const filteredPlayers = players.filter((player) => {
    const nameMatch = player.name.toLowerCase().includes(filter.toLowerCase())
    const teamMatch = teamFilter === "" || player.team === teamFilter
    return nameMatch && teamMatch
  })

  // Get unique teams for filter dropdown
  const teams = Array.from(new Set(players.map((player) => player.team)))

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Torschützenliste</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Torschützen</CardTitle>
            <CardDescription>Alle Torschützen des Turniers Resadiye Cup 2023</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Label htmlFor="filter">Spieler suchen</Label>
                <Input
                  id="filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Name eingeben..."
                />
              </div>
              <div className="w-full md:w-64">
                <Label htmlFor="teamFilter">Team Filter</Label>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Teams</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredPlayers.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="font-bold text-lg w-6">{index + 1}.</div>
                    <Avatar>
                      <AvatarImage src={`/placeholder.svg?height=40&width=40&query=${player.name}`} alt={player.name} />
                      <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Avatar className="h-4 w-4 mr-1">
                          <AvatarImage src={player.teamLogo || "/placeholder.svg"} alt={player.team} />
                          <AvatarFallback>{player.team.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        {player.team}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {player.goals} {player.goals === 1 ? "Tor" : "Tore"}
                  </Badge>
                </div>
              ))}

              {filteredPlayers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Keine Spieler gefunden, die den Filterkriterien entsprechen.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiken</CardTitle>
            <CardDescription>Torschützen-Statistiken</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Gesamtzahl Tore</div>
                <div className="text-2xl font-bold">{players.reduce((sum, player) => sum + player.goals, 0)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Torschützenkönig</div>
                <div className="text-xl font-bold">{players.sort((a, b) => b.goals - a.goals)[0].name}</div>
                <div className="text-sm">{players.sort((a, b) => b.goals - a.goals)[0].goals} Tore</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Team mit meisten Toren</div>
                {(() => {
                  const teamGoals = players.reduce(
                    (acc, player) => {
                      acc[player.team] = (acc[player.team] || 0) + player.goals
                      return acc
                    },
                    {} as Record<string, number>,
                  )

                  const topTeam = Object.entries(teamGoals).sort((a, b) => b[1] - a[1])[0]

                  return (
                    <>
                      <div className="text-xl font-bold">{topTeam[0]}</div>
                      <div className="text-sm">{topTeam[1]} Tore</div>
                    </>
                  )
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
