import { Suspense } from "react"
import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trophy } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default async function TournamentScorersPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  // Turnierdaten abrufen
  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", params.id)
    .single()

  if (tournamentError || !tournament) {
    notFound()
  }

  // Spieler mit Toren abrufen
  const { data: scorers, error: scorersError } = await supabase
    .from("tournament_players")
    .select(`
      id,
      goals,
      players (
        id,
        first_name,
        last_name,
        jersey_number,
        position
      ),
      teams (
        id,
        name,
        logo_url
      )
    `)
    .eq("tournament_id", params.id)
    .order("goals", { ascending: false })
    .gt("goals", 0)

  if (scorersError) {
    console.error("Fehler beim Abrufen der Torschützen:", scorersError)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Link
          href={`/tournaments/${params.id}`}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Turnier
        </Link>
        <h1 className="text-3xl font-bold flex items-center">
          <Trophy className="mr-3 h-8 w-8 text-yellow-500" />
          Torschützenliste: {tournament.name}
        </h1>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Rang
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Spieler
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Mannschaft
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Position
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tore
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scorers && scorers.length > 0 ? (
                scorers.map((scorer, index) => (
                  <tr key={scorer.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{index + 1}.</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            <Link href={`/spieler/${scorer.players.id}`} className="hover:underline">
                              {scorer.players.first_name} {scorer.players.last_name}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-500">#{scorer.players.jersey_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {scorer.teams.logo_url && (
                          <img
                            src={scorer.teams.logo_url || "/placeholder.svg"}
                            alt={`${scorer.teams.name} Logo`}
                            className="h-8 w-8 mr-2 object-contain"
                          />
                        )}
                        <Link href={`/teams/${scorer.teams.id}`} className="text-sm text-gray-900 hover:underline">
                          {scorer.teams.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scorer.players.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {scorer.goals}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Keine Torschützen gefunden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Suspense>
    </div>
  )
}
