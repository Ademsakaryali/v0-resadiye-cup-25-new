"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Tournament } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { Calendar, MapPin, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

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
          .limit(6)

        if (error) throw error
        setTournaments(data as Tournament[])
      } catch (error) {
        console.error("Fehler beim Laden der Turniere:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
  }, [supabase])

  if (loading) {
    return <Loading fullPage size="lg" text="Turniere werden geladen..." />
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-400">Resadiye Cup '25</h1>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              <span className="border-b-2 border-blue-500 pb-1">Aktive Turniere</span>
            </h2>
            <Button
              asChild
              className="border border-blue-500 bg-background text-blue-400 hover:bg-gray-800 hover:text-blue-300 h-9 rounded-md px-3"
            >
              <Link href="/tournaments">Alle anzeigen</Link>
            </Button>
          </div>

          {tournaments.length === 0 ? (
            <Card className="bg-gray-900/80 border border-gray-800 text-white">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-blue-500/70 mb-4" />
                <h3 className="text-lg font-medium text-white">Keine aktiven Turniere</h3>
                <p className="text-sm text-gray-400 mt-1">Derzeit sind keine aktiven Turniere vorhanden.</p>
                {user?.rolle === "Admin" && (
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white" asChild>
                    <Link href="/tournaments/new">Neues Turnier erstellen</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {tournaments.map((tournament) => (
                <Link href={`/tournaments/${tournament.id}`} key={tournament.id} className="block h-full">
                  <Card
                    className={cn(
                      "h-full hover:shadow-[0_0_15px_rgba(12,135,232,0.15)] transition-all duration-300",
                      "bg-gray-900/80 border border-gray-800 text-white hover:border-blue-700/50",
                    )}
                  >
                    <CardHeader>
                      <CardTitle className="text-white">{tournament.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-400">
                          <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                          <span>
                            {formatDate(tournament.start_datum)} - {formatDate(tournament.end_datum)}
                          </span>
                        </div>
                        {tournament.ort && (
                          <div className="flex items-center text-sm text-gray-400">
                            <MapPin className="mr-2 h-4 w-4 text-blue-500" />
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
      </div>
    </div>
  )
}
