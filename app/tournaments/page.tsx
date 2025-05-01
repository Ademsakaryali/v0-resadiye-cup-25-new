"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageLayout } from "@/components/layout/page-layout"
import { DataCard } from "@/components/ui/data-card"
import { FilterBar } from "@/components/ui/filter-bar"
import { Button } from "@/components/ui/button"
import { ErrorHandler } from "@/components/ui/error-handler"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/context/auth-context"
import { formatTimeRange } from "@/lib/date-utils"
import { getTournamentStatusBadge } from "@/lib/format-utils"
import { routes } from "@/lib/routes"
import { Trophy, Plus, Calendar } from "lucide-react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function TournamentsPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [tournaments, setTournaments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verwende einen einfachen useEffect für die einmalige Datenabfrage
  useEffect(() => {
    async function fetchTournaments() {
      try {
        setLoading(true)
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from("tournaments")
          .select("*")
          .order("start_datum", { ascending: false })
          .eq("ist_aktiv", true)

        if (error) throw error
        setTournaments(data || [])
      } catch (err: any) {
        console.error("Fehler beim Laden der Turniere:", err)
        setError(err.message || "Ein Fehler ist aufgetreten beim Laden der Turniere.")
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
  }, [])

  // Filter tournaments based on search
  const filteredTournaments = tournaments.filter(
    (tournament) =>
      tournament.name.toLowerCase().includes(search.toLowerCase()) ||
      tournament.beschreibung?.toLowerCase().includes(search.toLowerCase()) ||
      tournament.ort?.toLowerCase().includes(search.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <PageLayout
      title="Turniere"
      description="Übersicht aller Turniere und Wettbewerbe"
      actions={
        isAdmin && (
          <Button asChild>
            <Link href={routes.tournaments.new}>
              <Plus className="mr-2 h-4 w-4" />
              Neues Turnier
            </Link>
          </Button>
        )
      }
    >
      <ErrorHandler error={error} />

      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Turniere durchsuchen..."
        onReset={() => setSearch("")}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTournaments.map((tournament) => (
          <DataCard
            key={tournament.id}
            title={tournament.name}
            icon={<Trophy className="h-5 w-5 text-blue-400" />}
            description={
              <div className="flex items-center mt-1">
                <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                <span>{formatTimeRange(tournament.start_datum, tournament.end_datum)}</span>
              </div>
            }
            actions={getTournamentStatusBadge(tournament.start_datum, tournament.end_datum, tournament.ist_aktiv)}
            className="hover:bg-gray-800/50 transition-colors cursor-pointer"
            neonBorder={tournament.ist_aktiv}
            onClick={() => router.push(routes.tournaments.detail(tournament.id))}
          >
            <div className="space-y-2">
              {tournament.beschreibung && <p className="text-gray-300">{tournament.beschreibung}</p>}
              {tournament.ort && <p className="text-gray-400 text-sm">Ort: {tournament.ort}</p>}
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
                >
                  <Link href={routes.tournaments.detail(tournament.id)}>Details anzeigen</Link>
                </Button>
              </div>
            </div>
          </DataCard>
        ))}

        {filteredTournaments.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-300">Keine Turniere gefunden</h3>
            <p className="text-gray-400 mt-2">
              {search ? `Keine Ergebnisse für "${search}"` : "Es wurden noch keine Turniere erstellt."}
            </p>
            {isAdmin && (
              <Button className="mt-4" asChild>
                <Link href={routes.tournaments.new}>
                  <Plus className="mr-2 h-4 w-4" />
                  Neues Turnier erstellen
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
