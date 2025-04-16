"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Tournament } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Calendar, MapPin, Trophy, Users, GamepadIcon } from "lucide-react"

export default function HomePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [teamCount, setTeamCount] = useState(0)
  const [spielerCount, setSpielerCount] = useState(0)
  const [spieleCount, setSpieleCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Aktive Turniere abrufen
        const { data: tournamentData, error: tournamentError } = await supabase
          .from("tournaments")
          .select("*")
          .eq("ist_aktiv", true)
          .order("start_datum", { ascending: true })
          .limit(3)

        if (tournamentError) throw tournamentError
        setTournaments(tournamentData as Tournament[])

        // Team-Anzahl abrufen
        const { count: teamCountData, error: teamError } = await supabase
          .from("teams")
          .select("*", { count: "exact", head: true })

        if (teamError) throw teamError
        setTeamCount(teamCountData || 0)

        // Spieler-Anzahl abrufen
        const { count: spielerCountData, error: spielerError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("rolle", "Spieler")

        if (spielerError) throw spielerError
        setSpielerCount(spielerCountData || 0)

        // Spiele-Anzahl abrufen
        const { count: spieleCountData, error: spieleError } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })

        if (spieleError) throw spieleError
        setSpieleCount(spieleCountData || 0)
      } catch (error) {
        console.error("Fehler beim Laden der Daten:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Willkommen beim Resadiye Cup</h1>
        <p className="text-muted-foreground">
          Die offizielle Plattform für die Verwaltung von Fußballturnieren des Resadiye Cup.
        </p>
      </div>

      {/* Info-Cards - kleiner im mobilen Modus */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 md:p-6 flex items-center">
            <Trophy className="h-4 w-4 md:h-5 md:w-5 text-primary mr-2" />
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Turniere</p>
              <p className="text-lg md:text-2xl font-bold">{tournaments.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 md:p-6 flex items-center">
            <Users className="h-4 w-4 md:h-5 md:w-5 text-primary mr-2" />
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Teams</p>
              <p className="text-lg md:text-2xl font-bold">{teamCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 md:p-6 flex items-center">
            <Users className="h-4 w-4 md:h-5 md:w-5 text-primary mr-2" />
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Spieler</p>
              <p className="text-lg md:text-2xl font-bold">{spielerCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 md:p-6 flex items-center">
            <GamepadIcon className="h-4 w-4 md:h-5 md:w-5 text-primary mr-2" />
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Spiele</p>
              <p className="text-lg md:text-2xl font-bold">{spieleCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Aktive Turniere</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/tournaments">Alle anzeigen</Link>
          </Button>
        </div>

        {tournaments.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Keine aktiven Turniere</h3>
              <p className="text-sm text-muted-foreground mt-1">Derzeit sind keine aktiven Turniere vorhanden.</p>
              {user?.rolle === "Admin" && (
                <Button className="mt-4" asChild>
                  <Link href="/tournaments/new">Neues Turnier erstellen</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <Link href={`/tournaments/${tournament.id}`} key={tournament.id}>
                <Card className="h-full hover:shadow-md transition-shadow duration-200 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>{tournament.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>
                          {formatDate(tournament.start_datum)} - {formatDate(tournament.end_datum)}
                        </span>
                      </div>
                      {tournament.ort && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="mr-2 h-4 w-4" />
                          <span>{tournament.ort}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {!user && (
        <Card className="bg-card/50 backdrop-blur-sm mt-8">
          <CardHeader>
            <CardTitle>Anmelden</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Melden Sie sich an, um auf alle Funktionen der Plattform zugreifen zu können.
            </p>
            <Button asChild>
              <Link href="/login">Zur Anmeldung</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
