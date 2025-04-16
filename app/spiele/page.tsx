"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GamepadIcon } from "lucide-react"

export default function SpielePage() {
  const [loading, setLoading] = useState(true)
  const [spiele, setSpiele] = useState<any[]>([])
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchSpiele = async () => {
      try {
        const { data, error } = await supabase
          .from("matches")
          .select(`
            *,
            team_heim:team_heim_id (id, name),
            team_gast:team_gast_id (id, name),
            tournament:tournament_id (id, name)
          `)
          .order("datum", { ascending: true })

        if (error) {
          throw error
        }

        setSpiele(data || [])
      } catch (error) {
        console.error("Fehler beim Laden der Spiele:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSpiele()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Spiele Übersicht</h1>
        <Button>Neues Spiel</Button>
      </div>

      {spiele.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GamepadIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Spiele gefunden</h3>
            <p className="text-sm text-muted-foreground mt-1">Es wurden noch keine Spiele angelegt.</p>
            <Button className="mt-4">Erstes Spiel erstellen</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {spiele.map((spiel) => (
            <Card key={spiel.id} className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>
                  {spiel.tournament?.name} - {new Date(spiel.datum).toLocaleDateString("de-DE")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-center flex-1">
                    <p className="font-medium">{spiel.team_heim?.name}</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-xl font-bold">
                      {spiel.tore_heim} : {spiel.tore_gast}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase mt-1">{spiel.status}</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="font-medium">{spiel.team_gast?.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
