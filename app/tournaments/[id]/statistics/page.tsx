"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Tournament } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"
import { ArrowLeft, BarChart2 } from "lucide-react"

export default function TournamentStatisticsPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        const tournamentId = params.id as string

        // Turnier-Daten abrufen
        const { data: tournamentData, error: tournamentError } = await supabase
          .from("tournaments")
          .select("*")
          .eq("id", tournamentId)
          .single()

        if (tournamentError) {
          throw tournamentError
        }

        if (!tournamentData) {
          throw new Error("Turnier nicht gefunden")
        }

        setTournament(tournamentData as Tournament)
      } catch (error: any) {
        console.error("Fehler beim Laden der Turnierdaten:", error)
        setError(error.message || "Ein Fehler ist aufgetreten beim Laden der Turnierdaten.")
      } finally {
        setLoading(false)
      }
    }

    fetchTournamentData()
  }, [params.id, supabase])

  if (loading) {
    return <Loading fullPage text="Statistiken werden geladen..." />
  }

  if (error || !tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 mb-4 text-gray-300 hover:text-blue-400"
          asChild
        >
          <Link href={`/tournaments/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Turnier
          </Link>
        </Button>
        <div className="bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Fehler</h2>
          <p>{error || "Turnier konnte nicht geladen werden."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button
        className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 mb-4 text-gray-300 hover:text-blue-400"
        asChild
      >
        <Link href={`/tournaments/${tournament.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Turnier
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Statistiken: {tournament.name}</h1>
        <p className="text-gray-400">Detaillierte Statistiken zum Turnierverlauf</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-gray-800 bg-gray-900/80">
          <CardHeader>
            <CardTitle className="text-white">Statistik-Übersicht</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart2 className="h-16 w-16 text-blue-500/70 mb-4" />
            <h3 className="text-lg font-medium text-white">Statistiken werden entwickelt</h3>
            <p className="text-sm text-gray-400 mt-1 text-center">
              Diese Funktion wird in Kürze verfügbar sein. Hier werden detaillierte Statistiken zum Turnier angezeigt.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
