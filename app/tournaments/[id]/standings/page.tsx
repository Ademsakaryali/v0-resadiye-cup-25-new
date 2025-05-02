"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Team = {
  id: string
  name: string
  logo: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

export default function TournamentStandingsPage({ params }: { params: { id: string } }) {
  // Beispieldaten für die Tabelle
  const teams: Team[] = [
    {
      id: "1",
      name: "FC Bayern München",
      logo: "/abstract-fcb.png",
      played: 10,
      won: 8,
      drawn: 1,
      lost: 1,
      goalsFor: 30,
      goalsAgainst: 10,
      points: 25,
    },
    {
      id: "2",
      name: "Borussia Dortmund",
      logo: "/abstract-geometric-bvb.png",
      played: 10,
      won: 7,
      drawn: 2,
      lost: 1,
      goalsFor: 25,
      goalsAgainst: 12,
      points: 23,
    },
    {
      id: "3",
      name: "RB Leipzig",
      logo: "/rbl-graffiti.png",
      played: 10,
      won: 6,
      drawn: 2,
      lost: 2,
      goalsFor: 22,
      goalsAgainst: 15,
      points: 20,
    },
    {
      id: "4",
      name: "Bayer Leverkusen",
      logo: "/abstract-geometric-shapes.png",
      played: 10,
      won: 5,
      drawn: 3,
      lost: 2,
      goalsFor: 20,
      goalsAgainst: 15,
      points: 18,
    },
    {
      id: "5",
      name: "Eintracht Frankfurt",
      logo: "/placeholder.svg?height=40&width=40&query=SGE",
      played: 10,
      won: 5,
      drawn: 2,
      lost: 3,
      goalsFor: 18,
      goalsAgainst: 16,
      points: 17,
    },
    {
      id: "6",
      name: "VfL Wolfsburg",
      logo: "/placeholder.svg?height=40&width=40&query=WOB",
      played: 10,
      won: 4,
      drawn: 3,
      lost: 3,
      goalsFor: 15,
      goalsAgainst: 14,
      points: 15,
    },
    {
      id: "7",
      name: "Borussia Mönchengladbach",
      logo: "/placeholder.svg?height=40&width=40&query=BMG",
      played: 10,
      won: 3,
      drawn: 4,
      lost: 3,
      goalsFor: 14,
      goalsAgainst: 15,
      points: 13,
    },
    {
      id: "8",
      name: "FC Augsburg",
      logo: "/placeholder.svg?height=40&width=40&query=FCA",
      played: 10,
      won: 2,
      drawn: 3,
      lost: 5,
      goalsFor: 10,
      goalsAgainst: 18,
      points: 9,
    },
  ]

  // Sortiere Teams nach Punkten, Tordifferenz und geschossenen Toren
  const sortedTeams = [...teams].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points
    const aDiff = a.goalsFor - a.goalsAgainst
    const bDiff = b.goalsFor - b.goalsAgainst
    if (aDiff !== bDiff) return bDiff - aDiff
    return b.goalsFor - a.goalsFor
  })

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Turniertabelle</h1>

      <Card>
        <CardHeader>
          <CardTitle>Tabelle</CardTitle>
          <CardDescription>Aktuelle Tabelle des Turniers Resadiye Cup 2023</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Platz</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">Sp</TableHead>
                <TableHead className="text-center">S</TableHead>
                <TableHead className="text-center">U</TableHead>
                <TableHead className="text-center">N</TableHead>
                <TableHead className="text-center">Tore</TableHead>
                <TableHead className="text-center">Diff</TableHead>
                <TableHead className="text-center">Pkt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTeams.map((team, index) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={team.logo || "/placeholder.svg"} alt={team.name} />
                        <AvatarFallback>{team.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span>{team.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{team.played}</TableCell>
                  <TableCell className="text-center">{team.won}</TableCell>
                  <TableCell className="text-center">{team.drawn}</TableCell>
                  <TableCell className="text-center">{team.lost}</TableCell>
                  <TableCell className="text-center">
                    {team.goalsFor}:{team.goalsAgainst}
                  </TableCell>
                  <TableCell className="text-center">
                    {team.goalsFor - team.goalsAgainst > 0 ? "+" : ""}
                    {team.goalsFor - team.goalsAgainst}
                  </TableCell>
                  <TableCell className="text-center font-bold">{team.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Aufstiegsplätze</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedTeams.slice(0, 3).map((team, index) => (
                <div key={team.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge className="h-6 w-6 rounded-full flex items-center justify-center p-0 bg-primary text-primary-foreground hover:bg-primary/80">
                      {index + 1}
                    </Badge>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={team.logo || "/placeholder.svg"} alt={team.name} />
                      <AvatarFallback>{team.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{team.name}</span>
                  </div>
                  <span className="font-bold">{team.points} Pkt</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Beste Offensive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...teams]
                .sort((a, b) => b.goalsFor - a.goalsFor)
                .slice(0, 3)
                .map((team, index) => (
                  <div key={team.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge className="h-6 w-6 rounded-full flex items-center justify-center p-0 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        {index + 1}
                      </Badge>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={team.logo || "/placeholder.svg"} alt={team.name} />
                        <AvatarFallback>{team.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{team.name}</span>
                    </div>
                    <span className="font-bold">{team.goalsFor} Tore</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Beste Defensive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...teams]
                .sort((a, b) => a.goalsAgainst - b.goalsAgainst)
                .slice(0, 3)
                .map((team, index) => (
                  <div key={team.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge className="h-6 w-6 rounded-full flex items-center justify-center p-0 border bg-transparent">
                        {index + 1}
                      </Badge>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={team.logo || "/placeholder.svg"} alt={team.name} />
                        <AvatarFallback>{team.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{team.name}</span>
                    </div>
                    <span className="font-bold">{team.goalsAgainst} Gegentore</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
