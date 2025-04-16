"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/context/auth-context"
import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Info,
  MessageSquare,
  RefreshCcw,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  Users,
} from "lucide-react"

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    teams: 0,
    tournaments: 0,
    players: 0,
    matches: 0,
    blanketts: 0,
  })
  const [pendingBlanketts, setPendingBlanketts] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [upcomingTournaments, setUpcomingTournaments] = useState<any[]>([])
  const [notificationEnabled, setNotificationEnabled] = useState(false)
  const [notificationMethod, setNotificationMethod] = useState<"whatsapp" | "telegram" | null>(null)
  const [notificationNumber, setNotificationNumber] = useState("")
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Statistiken abrufen
        const [teamsResult, tournamentsResult, playersResult, matchesResult, blankettsResult] = await Promise.all([
          supabase.from("teams").select("*", { count: "exact", head: true }),
          supabase.from("tournaments").select("*", { count: "exact", head: true }),
          supabase.from("users").select("*", { count: "exact", head: true }).eq("rolle", "Spieler"),
          supabase.from("matches").select("*", { count: "exact", head: true }),
          supabase.from("blankett_entries").select("*", { count: "exact", head: true }),
        ])

        setStats({
          teams: teamsResult.count || 0,
          tournaments: tournamentsResult.count || 0,
          players: playersResult.count || 0,
          matches: matchesResult.count || 0,
          blanketts: blankettsResult.count || 0,
        })

        // Ausstehende Blanketts abrufen
        const { data: pendingBlankettsData } = await supabase
          .from("blankett_entries")
          .select(`
            id,
            team_id,
            tournament_id,
            status,
            eingereicht_am,
            team:team_id (
              id,
              name,
              trainer:trainer_id (
                id,
                vorname,
                nachname,
                email
              )
            ),
            tournament:tournament_id (
              id,
              name
            )
          `)
          .eq("status", "eingereicht")
          .order("eingereicht_am", { ascending: false })

        setPendingBlanketts(pendingBlankettsData || [])

        // Neueste Aktivitäten abrufen (hier simuliert)
        const now = new Date()
        const recentActivitiesData = [
          {
            id: 1,
            type: "blankett_submitted",
            team: "FC Adler",
            tournament: "Resadiye Cup 2024",
            timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 2,
            type: "team_created",
            team: "SV Löwen",
            user: "Thomas Müller",
            timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 3,
            type: "match_updated",
            match: "FC Adler vs SV Löwen",
            tournament: "Sommerturnier 2024",
            timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 4,
            type: "player_added",
            player: "Max Mustermann",
            team: "FC Adler",
            timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          },
        ]
        setRecentActivities(recentActivitiesData)

        // Kommende Turniere abrufen
        const { data: upcomingTournamentsData } = await supabase
          .from("tournaments")
          .select("*")
          .eq("ist_aktiv", true)
          .gte("start_datum", new Date().toISOString())
          .order("start_datum", { ascending: true })
          .limit(3)

        setUpcomingTournaments(upcomingTournamentsData || [])

        // Benachrichtigungseinstellungen abrufen (hier simuliert)
        // In einer echten Anwendung würden diese aus der Datenbank geladen werden
        setNotificationEnabled(localStorage.getItem("notificationEnabled") === "true")
        setNotificationMethod((localStorage.getItem("notificationMethod") as "whatsapp" | "telegram") || null)
        setNotificationNumber(localStorage.getItem("notificationNumber") || "")
      } catch (error) {
        console.error("Fehler beim Laden der Dashboard-Daten:", error)
        setError("Fehler beim Laden der Dashboard-Daten. Bitte versuchen Sie es später erneut.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const handleApproveBlankett = async (blankettId: string) => {
    try {
      // Blankett genehmigen
      const { error } = await supabase
        .from("blankett_entries")
        .update({
          status: "genehmigt",
          genehmigt_am: new Date().toISOString(),
        })
        .eq("id", blankettId)

      if (error) throw error

      // Aktualisiere die Liste der ausstehenden Blanketts
      setPendingBlanketts(pendingBlanketts.filter((blankett) => blankett.id !== blankettId))
      setSuccess("Blankett erfolgreich genehmigt.")

      // Erfolgsbenachrichtigung nach 3 Sekunden ausblenden
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Fehler beim Genehmigen des Blanketts:", error)
      setError(error.message || "Fehler beim Genehmigen des Blanketts.")
    }
  }

  const handleRejectBlankett = async (blankettId: string) => {
    try {
      // Blankett ablehnen
      const { error } = await supabase
        .from("blankett_entries")
        .update({
          status: "abgelehnt",
          genehmigt_am: null,
        })
        .eq("id", blankettId)

      if (error) throw error

      // Aktualisiere die Liste der ausstehenden Blanketts
      setPendingBlanketts(pendingBlanketts.filter((blankett) => blankett.id !== blankettId))
      setSuccess("Blankett erfolgreich abgelehnt.")

      // Erfolgsbenachrichtigung nach 3 Sekunden ausblenden
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Fehler beim Ablehnen des Blanketts:", error)
      setError(error.message || "Fehler beim Ablehnen des Blanketts.")
    }
  }

  const handleSaveNotificationSettings = () => {
    // Benachrichtigungseinstellungen speichern (hier simuliert)
    // In einer echten Anwendung würden diese in der Datenbank gespeichert werden
    localStorage.setItem("notificationEnabled", notificationEnabled.toString())
    localStorage.setItem("notificationMethod", notificationMethod || "")
    localStorage.setItem("notificationNumber", notificationNumber)

    setSuccess("Benachrichtigungseinstellungen erfolgreich gespeichert.")
    setTimeout(() => setSuccess(null), 3000)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) {
      return `vor ${diffMins} Minuten`
    } else if (diffHours < 24) {
      return `vor ${diffHours} Stunden`
    } else {
      return `vor ${diffDays} Tagen`
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <RequireAuth allowedRoles={["Admin"]}>
      <div className="container mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Willkommen im Admin-Bereich. Hier finden Sie eine Übersicht über alle wichtigen Informationen und Aktionen.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-900/20 border-green-600/30 text-green-500">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Erfolg</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-6 mb-6">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="p-3 md:p-6 flex items-center">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-primary mr-2" />
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Teams</p>
                <p className="text-lg md:text-2xl font-bold">{stats.teams}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="p-3 md:p-6 flex items-center">
              <Trophy className="h-4 w-4 md:h-5 md:w-5 text-primary mr-2" />
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Turniere</p>
                <p className="text-lg md:text-2xl font-bold">{stats.tournaments}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="p-3 md:p-6 flex items-center">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-primary mr-2" />
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Spieler</p>
                <p className="text-lg md:text-2xl font-bold">{stats.players}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="p-3 md:p-6 flex items-center">
              <Trophy className="h-4 w-4 md:h-5 md:w-5 text-primary mr-2" />
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Spiele</p>
                <p className="text-lg md:text-2xl font-bold">{stats.matches}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="p-3 md:p-6 flex items-center">
              <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary mr-2" />
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Blanketts</p>
                <p className="text-lg md:text-2xl font-bold">{stats.blanketts}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6 bg-secondary/30">
            <TabsTrigger value="pending" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Ausstehende Blanketts
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Neueste Aktivitäten
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              Benachrichtigungen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Ausstehende Blanketts</CardTitle>
                <CardDescription>
                  Hier können Sie Blanketts genehmigen oder ablehnen, die von Trainern eingereicht wurden.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingBlanketts.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Keine ausstehenden Blanketts</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Derzeit gibt es keine Blanketts, die auf Genehmigung warten.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingBlanketts.map((blankett) => (
                      <div
                        key={blankett.id}
                        className="p-4 rounded-lg border border-border/50 bg-card/80 hover:bg-card/90 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="font-medium">{blankett.team?.name}</h3>
                            <p className="text-sm text-muted-foreground">Turnier: {blankett.tournament?.name}</p>
                            <div className="flex items-center mt-1">
                              <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Eingereicht am: {formatDateTime(blankett.eingereicht_am)}
                              </span>
                            </div>
                            {blankett.team?.trainer && (
                              <div className="flex items-center mt-2">
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarFallback>
                                    {blankett.team.trainer.vorname.charAt(0)}
                                    {blankett.team.trainer.nachname.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">
                                  Trainer: {blankett.team.trainer.vorname} {blankett.team.trainer.nachname}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="bg-background/50 hover:bg-background/80"
                            >
                              <Link href={`/blanketts/${blankett.id}`}>Details</Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                              onClick={() => handleRejectBlankett(blankett.id)}
                            >
                              <ThumbsDown className="mr-2 h-4 w-4" />
                              Ablehnen
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveBlankett(blankett.id)}
                            >
                              <ThumbsUp className="mr-2 h-4 w-4" />
                              Genehmigen
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/blanketts">
                    <FileText className="mr-2 h-4 w-4" />
                    Alle Blanketts anzeigen
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="activities">
            <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Neueste Aktivitäten</CardTitle>
                <CardDescription>Eine Übersicht über die letzten Aktivitäten in der Anwendung.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-4 rounded-lg border border-border/50 bg-card/80 hover:bg-card/90 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-2">
                          {activity.type === "blankett_submitted" && <FileText className="h-5 w-5 text-primary" />}
                          {activity.type === "team_created" && <Users className="h-5 w-5 text-primary" />}
                          {activity.type === "match_updated" && <Trophy className="h-5 w-5 text-primary" />}
                          {activity.type === "player_added" && <Users className="h-5 w-5 text-primary" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-medium">
                              {activity.type === "blankett_submitted" &&
                                `${activity.team} hat ein Blankett für ${activity.tournament} eingereicht`}
                              {activity.type === "team_created" &&
                                `${activity.user} hat das Team ${activity.team} erstellt`}
                              {activity.type === "match_updated" &&
                                `Spiel ${activity.match} im Turnier ${activity.tournament} wurde aktualisiert`}
                              {activity.type === "player_added" &&
                                `Spieler ${activity.player} wurde zum Team ${activity.team} hinzugefügt`}
                            </h3>
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{formatDateTime(activity.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Aktivitäten aktualisieren
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Benachrichtigungseinstellungen</CardTitle>
                <CardDescription>
                  Konfigurieren Sie, wie Sie über neue Blankett-Einreichungen benachrichtigt werden möchten.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enable-notifications"
                      checked={notificationEnabled}
                      onChange={(e) => setNotificationEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="enable-notifications" className="text-sm font-medium">
                      Benachrichtigungen aktivieren
                    </label>
                  </div>

                  {notificationEnabled && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Benachrichtigungsmethode</label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="whatsapp"
                              name="notification-method"
                              value="whatsapp"
                              checked={notificationMethod === "whatsapp"}
                              onChange={() => setNotificationMethod("whatsapp")}
                              className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="whatsapp" className="text-sm">
                              WhatsApp
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="telegram"
                              name="notification-method"
                              value="telegram"
                              checked={notificationMethod === "telegram"}
                              onChange={() => setNotificationMethod("telegram")}
                              className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="telegram" className="text-sm">
                              Telegram
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="notification-number" className="text-sm font-medium">
                          {notificationMethod === "whatsapp" ? "WhatsApp Nummer" : "Telegram Nummer"}
                        </label>
                        <input
                          type="text"
                          id="notification-number"
                          value={notificationNumber}
                          onChange={(e) => setNotificationNumber(e.target.value)}
                          placeholder="+49123456789"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <p className="text-xs text-muted-foreground">
                          Geben Sie Ihre Telefonnummer im internationalen Format ein (z.B. +49123456789).
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Benachrichtigungen für</h3>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="notify-blankett-submitted"
                              checked={true}
                              disabled
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="notify-blankett-submitted" className="text-sm">
                              Neue Blankett-Einreichungen
                            </label>
                          </div>
                        </div>
                      </div>

                      <Alert className="bg-blue-900/20 border-blue-600/30 text-blue-500">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Hinweis: Um Benachrichtigungen über WhatsApp oder Telegram zu erhalten, müssen Sie den
                          Resadiye Cup Bot zu Ihren Kontakten hinzufügen. Weitere Informationen finden Sie in der
                          Dokumentation.
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSaveNotificationSettings}
                  disabled={notificationEnabled && (!notificationMethod || !notificationNumber)}
                  className="ml-auto"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Einstellungen speichern
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">Kommende Turniere</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingTournaments.length === 0 ? (
              <Card className="col-span-full border border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Keine kommenden Turniere</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Derzeit sind keine aktiven Turniere für die Zukunft geplant.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/tournaments/new">Neues Turnier erstellen</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              upcomingTournaments.map((tournament) => (
                <Link href={`/tournaments/${tournament.id}`} key={tournament.id}>
                  <Card className="h-full hover:shadow-md transition-shadow duration-200 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>{tournament.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>
                            {formatDate(tournament.start_datum)} - {formatDate(tournament.end_datum)}
                          </span>
                        </div>
                        {tournament.ort && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Info className="mr-2 h-4 w-4" />
                            <span>{tournament.ort}</span>
                          </div>
                        )}
                        <Badge className="mt-2 bg-primary/10 text-primary-foreground border-primary/20">Aktiv</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
