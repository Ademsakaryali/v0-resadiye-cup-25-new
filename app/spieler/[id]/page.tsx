"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoadingSpinner } from "@/components/ui/loading"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, AlertCircle, Calendar, User, Users } from "lucide-react"

export default function SpielerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = getSupabaseClient()
  const [spieler, setSpieler] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSpielerData = async () => {
      try {
        // Spieler abrufen
        const { data: spielerData, error: spielerError } = await supabase
          .from("users")
          .select("*")
          .eq("id", params.id)
          .single()

        if (spielerError) throw spielerError

        setSpieler(spielerData)

        // Teams des Spielers abrufen
        const { data: teamData, error: teamError } = await supabase
          .from("team_spieler")
          .select(`
            team:team_id (
              id,
              name,
              logo_url,
              trainer:trainer_id (
                id,
                vorname,
                nachname
              )
            )
          `)
          .eq("spieler_id", params.id)

        if (teamError) throw teamError

        const teamList = teamData.map((item) => item.team)
        setTeams(teamList)
      } catch (error: any) {
        console.error("Fehler beim Laden der Spieler-Daten:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSpielerData()
  }, [supabase, params.id])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nicht angegeben"
    return new Date(dateString).toLocaleDateString("de-DE")
  }

  const calculateAge = (dateString: string | null) => {
    if (!dateString) return "Unbekannt"
    const birthDate = new Date(dateString)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const getInitials = (vorname: string, nachname: string) => {
    return `${vorname?.charAt(0) || ""}${nachname?.charAt(0) || ""}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!spieler) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert className="bg-red-900/20 border-red-800 text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>Der angeforderte Spieler konnte nicht gefunden werden.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild>
            <Link href="/spieler">Zurück zur Spielerübersicht</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="mb-4">
        <Button asChild className="mb-2">
          <Link href="/spieler">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Spielerübersicht
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Spieler-Informationen */}
        <div className="w-full md:w-1/2">
          <Card className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2">
              <div className="flex justify-center mb-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={spieler.profilbild_url || ""} alt={spieler.vorname} />
                  <AvatarFallback className="text-3xl">{getInitials(spieler.vorname, spieler.nachname)}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-center text-2xl">
                {spieler.vorname} {spieler.nachname}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Geburtsdatum</p>
                    <p className="font-medium">{formatDate(spieler.geburtsdatum)}</p>
                  </div>
                </div>
                {spieler.geburtsdatum && (
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Alter</p>
                      <p className="font-medium">{calculateAge(spieler.geburtsdatum)} Jahre</p>
                    </div>
                  </div>
                )}
              </div>

              {user && user.rolle === "Admin" && (
                <div className="mt-6">
                  <Button asChild className="border border-gray-200 dark:border-gray-800 w-full">
                    <Link href={`/users/${spieler.id}`}>Spieler bearbeiten</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Teams des Spielers */}
        <div className="w-full md:w-1/2">
          <Card className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle>Teams</CardTitle>
              <CardDescription>Teams, in denen dieser Spieler Mitglied ist</CardDescription>
            </CardHeader>
            <CardContent>
              {teams.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">Keine Teams</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Dieser Spieler ist noch keinem Team zugeordnet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {teams.map((team) => (
                    <Link href={`/teams/${team.id}`} key={team.id}>
                      <Card className="bg-gray-50 dark:bg-gray-800/50 hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-16 w-16 mr-4">
                              <img
                                src={team.logo_url || "/placeholder.svg?height=100&width=100&query=soccer team"}
                                alt={team.name}
                                className="h-full w-full object-contain"
                              />
                            </div>
                            <div>
                              <h3 className="font-medium text-lg">{team.name}</h3>
                              {team.trainer && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Trainer: {team.trainer.vorname} {team.trainer.nachname}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
