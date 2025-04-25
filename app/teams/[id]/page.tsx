"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileText, Users, Trophy, Edit, AlertCircle } from "lucide-react"

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = getSupabaseClient()
  const [team, setTeam] = useState<any>(null)
  const [spieler, setSpieler] = useState<any[]>([])
  const [blanketts, setBlanketts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("spieler")

  useEffect(() => {
    // Prüfen, ob die ID "new" ist, und in diesem Fall zur Erstellungsseite weiterleiten
    if (params.id === "new") {
      router.push("/teams/new")
      return
    }

    const fetchTeamData = async () => {
      try {
        // Team abrufen
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("*, trainer:trainer_id(*)")
          .eq("id", params.id)
          .single()

        if (teamError) throw teamError

        setTeam(teamData)

        // Spieler abrufen
        const { data: spielerData, error: spielerError } = await supabase
          .from("team_spieler")
          .select(`
            spieler:spieler_id (
              id,
              vorname,
              nachname,
              email,
              geburtsdatum,
              telefonnummer,
              profilbild_url
            )
          `)
          .eq("team_id", params.id)

        if (spielerError) throw spielerError

        const spielerList = spielerData.map((item) => item.spieler)
        setSpieler(spielerList)

        // Blanketts abrufen
        const { data: blankettData, error: blankettError } = await supabase
          .from("blankett_entries")
          .select(`
            *,
            tournament:tournament_id (
              id,
              name,
              start_datum,
              end_datum
            )
          `)
          .eq("team_id", params.id)
          .order("created_at", { ascending: false })

        if (blankettError) throw blankettError

        setBlanketts(blankettData)
      } catch (error: any) {
        console.error("Fehler beim Laden der Team-Daten:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamData()
  }, [supabase, params.id, router])

  const isTrainer = () => {
    return user?.rolle === "Trainer" && team?.trainer_id === user.id
  }

  const isAdmin = () => {
    return user?.rolle === "Admin"
  }

  const canEdit = () => {
    return isTrainer() || isAdmin()
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unbekannt"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "entwurf":
        return <Badge variant="outline">Entwurf</Badge>
      case "eingereicht":
        return <Badge variant="secondary">Eingereicht</Badge>
      case "genehmigt":
        return (
          <Badge variant="default" className="bg-green-600">
            Genehmigt
          </Badge>
        )
      case "abgelehnt":
        return <Badge variant="destructive">Abgelehnt</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Funktion zum Weiterleiten zum Blankett
  const handleBlankettClick = () => {
    // Wenn nur ein Blankett vorhanden ist, direkt dorthin weiterleiten
    if (blanketts.length === 1) {
      router.push(`/teams/${team.id}/blankett/${blanketts[0].id}`)
    } else {
      // Ansonsten zur Blankett-Übersicht
      router.push(`/teams/${team.id}/blankett`)
    }
  }

  // Wenn die ID "new" ist, wird die Seite zur Erstellungsseite weitergeleitet
  // Dies ist eine zusätzliche Sicherheitsmaßnahme, falls die Weiterleitung im useEffect nicht funktioniert
  if (params.id === "new") {
    return null // Nichts rendern, während die Weiterleitung stattfindet
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>Das angeforderte Team konnte nicht gefunden werden.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild>
            <Link href="/teams">Zurück zur Teamübersicht</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Team-Informationen */}
        <div className="w-full md:w-1/3">
          <Card className="mb-4 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="relative w-24 h-24 mb-4">
                  {team.logo_url ? (
                    <Image
                      src={team.logo_url || "/placeholder.svg"}
                      alt={team.name}
                      fill
                      className="object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "/diverse-team-brainstorm.png"
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                      <Users className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-bold">{team.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Trainer</p>
                <div className="flex items-center mt-2">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={team.trainer?.profilbild_url || ""} alt={team.trainer?.vorname} />
                    <AvatarFallback>
                      {team.trainer?.vorname?.charAt(0)}
                      {team.trainer?.nachname?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {team.trainer?.vorname} {team.trainer?.nachname}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{team.trainer?.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Erstellt am {formatDate(team.created_at)}
                </p>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                {canEdit() && (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={isAdmin() ? `/teams/${team.id}/edit` : `/teams/${team.id}/trainer-edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Team bearbeiten
                    </Link>
                  </Button>
                )}
                {(isTrainer() || isAdmin()) && (
                  <Button variant="default" size="sm" className="w-full" onClick={handleBlankettClick}>
                    <FileText className="mr-2 h-4 w-4" />
                    Mannschaftsblankett
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs für Spieler und Blanketts */}
        <div className="w-full md:w-2/3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="spieler" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Spieler
              </TabsTrigger>
              <TabsTrigger value="turniere" className="flex items-center">
                <Trophy className="h-4 w-4 mr-2" />
                Turniere
              </TabsTrigger>
            </TabsList>

            <TabsContent value="spieler" className="mt-4">
              <Card className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Spielerliste</CardTitle>
                  <CardDescription>{spieler.length} Spieler im Team</CardDescription>
                </CardHeader>
                <CardContent>
                  {spieler.length === 0 ? (
                    <div className="text-center py-6">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium">Keine Spieler</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Diesem Team sind noch keine Spieler zugeordnet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {spieler.map((s) => (
                        <Link href={`/spieler/${s.id}`} key={s.id}>
                          <div className="flex items-center p-2 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:shadow-sm transition-all duration-200">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={s.profilbild_url || ""} alt={s.vorname} />
                              <AvatarFallback>
                                {s.vorname?.charAt(0)}
                                {s.nachname?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {s.vorname} {s.nachname}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{s.email}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="turniere" className="mt-4">
              <Card className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Mannschaftsblanketts</CardTitle>
                  <CardDescription>Übersicht der Mannschaftsblanketts für Turniere</CardDescription>
                </CardHeader>
                <CardContent>
                  {blanketts.length === 0 ? (
                    <div className="text-center py-6">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium">Keine Blanketts</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Für dieses Team wurden noch keine Turnierblanketts erstellt.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {blanketts.map((blankett) => (
                        <div
                          key={blankett.id}
                          className="p-3 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{blankett.tournament.name}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(blankett.tournament.start_datum)} -{" "}
                                {formatDate(blankett.tournament.end_datum)}
                              </p>
                            </div>
                            <div>{getStatusBadge(blankett.status)}</div>
                          </div>
                          <div className="flex justify-end mt-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/teams/${team.id}/blankett/${blankett.id}`}>Details</Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
