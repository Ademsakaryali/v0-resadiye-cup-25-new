"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Team } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, UserPlus } from "lucide-react"

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // Teams mit Trainer-Informationen abrufen
        const { data, error } = await supabase
          .from("teams")
          .select(`
            *,
            trainer:trainer_id (
              id,
              vorname,
              nachname,
              email,
              profilbild_url
            )
          `)
          .order("name", { ascending: true })

        if (error) {
          throw error
        }

        setTeams(data as Team[])
      } catch (error) {
        console.error("Fehler beim Laden der Teams:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [supabase])

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
        <h1 className="text-3xl font-bold">Teams</h1>
        {(user?.rolle === "Admin" || user?.rolle === "Trainer") && (
          <Button asChild>
            <Link href="/teams/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Neues Team erstellen
            </Link>
          </Button>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Keine Teams gefunden</h3>
          <p className="mt-1 text-sm text-gray-500">Es wurden noch keine Teams erstellt.</p>
          {(user?.rolle === "Admin" || user?.rolle === "Trainer") && (
            <div className="mt-6">
              <Button asChild>
                <Link href="/teams/new">Neues Team erstellen</Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Link href={`/teams/${team.id}`} key={team.id}>
              <Card className="h-full hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{team.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {team.beschreibung || "Keine Beschreibung verfügbar"}
                      </CardDescription>
                    </div>
                    {team.logo_url && (
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={team.logo_url || "/placeholder.svg"}
                          alt={`${team.name} Logo`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {team.trainer && (
                    <div className="flex items-center mt-2">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={team.trainer.profilbild_url || ""} alt={team.trainer.vorname} />
                        <AvatarFallback>{`${team.trainer.vorname.charAt(0)}${team.trainer.nachname.charAt(0)}`}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Trainer</p>
                        <p className="text-xs text-gray-500">{`${team.trainer.vorname} ${team.trainer.nachname}`}</p>
                      </div>
                    </div>
                  )}
                  <div className="mt-4">
                    <Badge variant={team.ist_aktiv ? "outline" : "secondary"}>
                      {team.ist_aktiv ? "Aktiv" : "Inaktiv"}
                    </Badge>
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
