"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

export default function SpielerPage() {
  const [loading, setLoading] = useState(true)
  const [spieler, setSpieler] = useState<any[]>([])
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchSpieler = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("rolle", "Spieler")
          .order("nachname", { ascending: true })

        if (error) {
          throw error
        }

        setSpieler(data || [])
      } catch (error) {
        console.error("Fehler beim Laden der Spieler:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSpieler()
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
        <h1 className="text-2xl font-bold">Spieler Übersicht</h1>
        <Button>Neuer Spieler</Button>
      </div>

      {spieler.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Spieler gefunden</h3>
            <p className="text-sm text-muted-foreground mt-1">Es wurden noch keine Spieler angelegt.</p>
            <Button className="mt-4">Ersten Spieler erstellen</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spieler.map((player) => (
            <Card key={player.id} className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>{`${player.vorname} ${player.nachname}`}</CardTitle>
                <CardDescription>{player.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Geburtsdatum:</span>{" "}
                    {player.geburtsdatum
                      ? new Date(player.geburtsdatum).toLocaleDateString("de-DE")
                      : "Nicht angegeben"}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Telefon:</span> {player.telefonnummer || "Nicht angegeben"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
