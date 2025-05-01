"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

type Match = {
  id: string
  date: string
  time: string
  homeTeam: {
    id: string
    name: string
    logo: string
  }
  awayTeam: {
    id: string
    name: string
    logo: string
  }
  homeGoals: number | null
  awayGoals: number | null
  status: "scheduled" | "live" | "completed"
  group: string
}

export default function TournamentSchedulePage({ params }: { params: { id: string } }) {
  const [groupFilter, setGroupFilter] = useState("all")

  // Beispieldaten für Spiele
  const matches: Match[] = [
    {
      id: "1",
      date: "2023-06-10",
      time: "14:00",
      homeTeam: {
        id: "1",
        name: "FC Bayern München",
        logo: "/abstract-fcb.png",
      },
      awayTeam: {
        id: "2",
        name: "Borussia Dortmund",
        logo: "/abstract-geometric-bvb.png",
      },
      homeGoals: 3,
      awayGoals: 2,
      status: "completed",
      group: "A",
    },
    {
      id: "2",
      date: "2023-06-10",
      time: "16:30",
      homeTeam: {
        id: "3",
        name: "RB Leipzig",
        logo: "/rbl-graffiti.png",
      },
      awayTeam: {
        id: "4",
        name: "Bayer Leverkusen",
        logo: "/abstract-geometric-shapes.png",
      },
      homeGoals: 1,
      awayGoals: 1,
      status: "completed",
      group: "A",
    },
    {
      id: "3",
      date: "2023-06-11",
      time: "14:00",
      homeTeam: {
        id: "5",
        name: "Eintracht Frankfurt",
        logo: "/placeholder.svg?height=40&width=40&query=SGE",
      },
      awayTeam: {
        id: "6",
        name: "VfL Wolfsburg",
        logo: "/placeholder.svg?height=40&width=40&query=WOB",
      },
      homeGoals: 2,
      awayGoals: 0,
      status: "completed",
      group: "B",
    },
    {
      id: "4",
      date: "2023-06-11",
      time: "16:30",
      homeTeam: {
        id: "7",
        name: "Borussia Mönchengladbach",
        logo: "/placeholder.svg?height=40&width=40&query=BMG",
      },
      awayTeam: {
        id: "8",
        name: "FC Augsburg",
        logo: "/placeholder.svg?height=40&width=40&query=FCA",
      },
      homeGoals: 1,
      awayGoals: 2,
      status: "completed",
      group: "B",
    },
    {
      id: "5",
      date: "2023-06-17",
      time: "14:00",
      homeTeam: {
        id: "1",
        name: "FC Bayern München",
        logo: "/abstract-fcb.png",
      },
      awayTeam: {
        id: "3",
        name: "RB Leipzig",
        logo: "/rbl-graffiti.png",
      },
      homeGoals: 2,
      awayGoals: 1,
      status: "completed",
      group: "A",
    },
    {
      id: "6",
      date: "2023-06-17",
      time: "16:30",
      homeTeam: {
        id: "2",
        name: "Borussia Dortmund",
        logo: "/abstract-geometric-bvb.png",
      },
      awayTeam: {
        id: "4",
        name: "Bayer Leverkusen",
        logo: "/abstract-geometric-shapes.png",
      },
      homeGoals: 3,
      awayGoals: 1,
      status: "completed",
      group: "A",
    },
    {
      id: "7",
      date: "2023-06-18",
      time: "14:00",
      homeTeam: {
        id: "5",
        name: "Eintracht Frankfurt",
        logo: "/placeholder.svg?height=40&width=40&query=SGE",
      },
      awayTeam: {
        id: "7",
        name: "Borussia Mönchengladbach",
        logo: "/placeholder.svg?height=40&width=40&query=BMG",
      },
      homeGoals: 2,
      awayGoals: 2,
      status: "completed",
      group: "B",
    },
    {
      id: "8",
      date: "2023-06-18",
      time: "16:30",
      homeTeam: {
        id: "6",
        name: "VfL Wolfsburg",
        logo: "/placeholder.svg?height=40&width=40&query=WOB",
      },
      awayTeam: {
        id: "8",
        name: "FC Augsburg",
        logo: "/placeholder.svg?height=40&width=40&query=FCA",
      },
      homeGoals: 0,
      awayGoals: 1,
      status: "completed",
      group: "B",
    },
    {
      id: "9",
      date: "2023-06-24",
      time: "14:00",
      homeTeam: {
        id: "1",
        name: "FC Bayern München",
        logo: "/abstract-fcb.png",
      },
      awayTeam: {
        id: "4",
        name: "Bayer Leverkusen",
        logo: "/abstract-geometric-shapes.png",
      },
      homeGoals: null,
      awayGoals: null,
      status: "scheduled",
      group: "A",
    },
    {
      id: "10",
      date: "2023-06-24",
      time: "16:30",
      homeTeam: {
        id: "2",
        name: "Borussia Dortmund",
        logo: "/abstract-geometric-bvb.png",
      },
      awayTeam: {
        id: "3",
        name: "RB Leipzig",
        logo: "/rbl-graffiti.png",
      },
      homeGoals: null,
      awayGoals: null,
      status: "scheduled",
      group: "A",
    },
    {
      id: "11",
      date: "2023-06-25",
      time: "14:00",
      homeTeam: {
        id: "5",
        name: "Eintracht Frankfurt",
        logo: "/placeholder.svg?height=40&width=40&query=SGE",
      },
      awayTeam: {
        id: "8",
        name: "FC Augsburg",
        logo: "/placeholder.svg?height=40&width=40&query=FCA",
      },
      homeGoals: null,
      awayGoals: null,
      status: "scheduled",
      group: "B",
    },
    {
      id: "12",
      date: "2023-06-25",
      time: "16:30",
      homeTeam: {
        id: "6",
        name: "VfL Wolfsburg",
        logo: "/placeholder.svg?height=40&width=40&query=WOB",
      },
      awayTeam: {
        id: "7",
        name: "Borussia Mönchengladbach",
        logo: "/placeholder.svg?height=40&width=40&query=BMG",
      },
      homeGoals: null,
      awayGoals: null,
      status: "scheduled",
      group: "B",
    },
  ]

  // Gruppiere Spiele nach Datum
  const matchesByDate = matches.reduce(
    (acc, match) => {
      if (!acc[match.date]) {
        acc[match.date] = []
      }
      acc[match.date].push(match)
      return acc
    },
    {} as Record<string, Match[]>,
  )

  // Filtere Spiele nach Gruppe
  const filteredMatches = groupFilter === "all" ? matches : matches.filter((match) => match.group === groupFilter)

  // Gruppiere gefilterte Spiele nach Datum
  const filteredMatchesByDate = filteredMatches.reduce(
    (acc, match) => {
      if (!acc[match.date]) {
        acc[match.date] = []
      }
      acc[match.date].push(match)
      return acc
    },
    {} as Record<string, Match[]>,
  )

  // Formatiere Datum
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  }

  // Extrahiere einzigartige Gruppen
  const groups = Array.from(new Set(matches.map((match) => match.group)))

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Spielplan</h1>

      <div className="mb-6">
        <Tabs defaultValue="all">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">Alle Spiele</TabsTrigger>
              <TabsTrigger value="upcoming">Kommende Spiele</TabsTrigger>
              <TabsTrigger value="completed">Gespielte Spiele</TabsTrigger>
            </TabsList>

            <div className="w-48">
              <Label htmlFor="groupFilter">Gruppe</Label>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Gruppen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Gruppen</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group} value={group}>
                      Gruppe {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="all" className="space-y-6">
            {Object.keys(filteredMatchesByDate)
              .sort()
              .map((date) => (
                <Card key={date}>
                  <CardHeader>
                    <CardTitle>{formatDate(date)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filteredMatchesByDate[date].map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{match.time}</Badge>
                          <Badge variant="secondary">Gruppe {match.group}</Badge>
                        </div>

                        <div className="flex items-center justify-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-right w-32 truncate">{match.homeTeam.name}</span>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={match.homeTeam.logo || "/placeholder.svg"} alt={match.homeTeam.name} />
                              <AvatarFallback>{match.homeTeam.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                          </div>

                          <div className="flex items-center justify-center w-20">
                            {match.status === "completed" ? (
                              <span className="font-bold text-lg">
                                {match.homeGoals} : {match.awayGoals}
                              </span>
                            ) : match.status === "live" ? (
                              <Badge variant="destructive" className="animate-pulse">
                                LIVE
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">vs</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={match.awayTeam.logo || "/placeholder.svg"} alt={match.awayTeam.name} />
                              <AvatarFallback>{match.awayTeam.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium w-32 truncate">{match.awayTeam.name}</span>
                          </div>
                        </div>

                        <div className="w-24 text-right">
                          {match.status === "completed" ? (
                            <Badge variant="outline">Beendet</Badge>
                          ) : match.status === "live" ? (
                            <Badge variant="destructive">Live</Badge>
                          ) : (
                            <Badge variant="secondary">Geplant</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            {Object.keys(filteredMatchesByDate)
              .filter((date) => filteredMatchesByDate[date].some((match) => match.status === "scheduled"))
              .sort()
              .map((date) => (
                <Card key={date}>
                  <CardHeader>
                    <CardTitle>{formatDate(date)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filteredMatchesByDate[date]
                      .filter((match) => match.status === "scheduled")
                      .map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{match.time}</Badge>
                            <Badge variant="secondary">Gruppe {match.group}</Badge>
                          </div>

                          <div className="flex items-center justify-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-right w-32 truncate">{match.homeTeam.name}</span>
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={match.homeTeam.logo || "/placeholder.svg"}
                                  alt={match.homeTeam.name}
                                />
                                <AvatarFallback>{match.homeTeam.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                            </div>

                            <div className="flex items-center justify-center w-20">
                              <span className="text-muted-foreground">vs</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={match.awayTeam.logo || "/placeholder.svg"}
                                  alt={match.awayTeam.name}
                                />
                                <AvatarFallback>{match.awayTeam.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium w-32 truncate">{match.awayTeam.name}</span>
                            </div>
                          </div>

                          <div className="w-24 text-right">
                            <Badge variant="secondary">Geplant</Badge>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            {Object.keys(filteredMatchesByDate)
              .filter((date) => filteredMatchesByDate[date].some((match) => match.status === "completed"))
              .sort()
              .map((date) => (
                <Card key={date}>
                  <CardHeader>
                    <CardTitle>{formatDate(date)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filteredMatchesByDate[date]
                      .filter((match) => match.status === "completed")
                      .map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{match.time}</Badge>
                            <Badge variant="secondary">Gruppe {match.group}</Badge>
                          </div>

                          <div className="flex items-center justify-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-right w-32 truncate">{match.homeTeam.name}</span>
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={match.homeTeam.logo || "/placeholder.svg"}
                                  alt={match.homeTeam.name}
                                />
                                <AvatarFallback>{match.homeTeam.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                            </div>

                            <div className="flex items-center justify-center w-20">
                              <span className="font-bold text-lg">
                                {match.homeGoals} : {match.awayGoals}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={match.awayTeam.logo || "/placeholder.svg"}
                                  alt={match.awayTeam.name}
                                />
                                <AvatarFallback>{match.awayTeam.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium w-32 truncate">{match.awayTeam.name}</span>
                            </div>
                          </div>

                          <div className="w-24 text-right">
                            <Badge variant="outline">Beendet</Badge>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
