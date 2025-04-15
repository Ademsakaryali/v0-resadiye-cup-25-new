"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Tournament } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Calendar, MapPin, Trophy } from "lucide-react"

export default function HomePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const { data, error } = await supabase
          .from("tournaments")
          .select("*")
          .eq("ist_aktiv", true)
          .order("start_datum", { ascending: true })

        if (error) {
          throw error
        }

        setTournaments(data as Tournament[])
      } catch (error) {
        console.error("Fehler beim Laden der Turniere:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Aktive Turniere</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Hinweis zur vereinfachten Authentifizierung</h2>
          <p className="text-yellow-700">
            Diese Anwendung verwendet eine vereinfachte Authentifizierung für Demozwecke. Sie können sich mit einer der
            folgenden E-Mail-Adressen anmelden:
          </p>
          <ul className="list-disc pl-5 mt-2 text-yellow-700">
            <li>admin@example.com (Admin)</li>
            <li>trainer1@example.com (Trainer)</li>
            <li>spieler1@example.com (Spieler)</li>
          </ul>
          <p className="mt-2 text-yellow-700">
            Das Passwort wird nicht überprüft. Besuchen Sie die{" "}
            <a href="/setup" className="underline font-medium">
              Setup-Seite
            </a>
            , um Testdaten zu erstellen.
          </p>
        </div>
        {user?.rolle === "Admin" && (
          <Button asChild>
            <Link href="/tournaments/new">Neues Turnier erstellen</Link>
          </Button>
        )}
      </div>

      {tournaments.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Keine aktiven Turniere</h3>
          <p className="mt-1 text-sm text-gray-500">Derzeit sind keine aktiven Turniere vorhanden.</p>
          {user?.rolle === "Admin" && (
            <div className="mt-6">
              <Button asChild>
                <Link href="/tournaments/new">Neues Turnier erstellen</Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <Link href={`/tournaments/${tournament.id}`} key={tournament.id}>
              <Card className="h-full hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{tournament.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {tournament.beschreibung || "Keine Beschreibung verfügbar"}
                      </CardDescription>
                    </div>
                    {tournament.logo_url && (
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={tournament.logo_url || "/placeholder.svg"}
                          alt={`${tournament.name} Logo`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>
                        {formatDate(tournament.start_datum)} - {formatDate(tournament.end_datum)}
                      </span>
                    </div>
                    {tournament.ort && (
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="mr-2 h-4 w-4" />
                        <span>{tournament.ort}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Details anzeigen
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
