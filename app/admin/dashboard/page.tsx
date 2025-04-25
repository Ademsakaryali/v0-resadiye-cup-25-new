"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { FileText, Users, Trophy, Calendar } from "lucide-react"
import Link from "next/link"
import "./dashboard.css"

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    teams: 0,
    tournaments: 0,
    players: 0,
    matches: 0,
    blanketts: 0,
  })
  const [pendingBlanketts, setPendingBlanketts] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [notifications, setNotifications] = useState([])
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    // Prüfen, ob der Benutzer ein Administrator ist
    if (user && user.rolle !== "Admin") {
      router.push("/")
      return
    }

    const fetchData = async () => {
      try {
        // Statistiken abrufen
        const [
          { count: teamsCount },
          { count: tournamentsCount },
          { count: playersCount },
          { count: matchesCount },
          { count: blankettsCount },
        ] = await Promise.all([
          supabase.from("teams").select("*", { count: "exact", head: true }),
          supabase.from("tournaments").select("*", { count: "exact", head: true }),
          supabase.from("users").select("*", { count: "exact", head: true }).eq("rolle", "Spieler"),
          supabase.from("matches").select("*", { count: "exact", head: true }),
          supabase.from("blankett_entries").select("*", { count: "exact", head: true }),
        ])

        setStats({
          teams: teamsCount || 0,
          tournaments: tournamentsCount || 0,
          players: playersCount || 0,
          matches: matchesCount || 0,
          blanketts: blankettsCount || 0,
        })

        // Ausstehende Blanketts abrufen
        const { data: pendingData } = await supabase
          .from("blankett_entries")
          .select(
            `
            id,
            status,
            created_at,
            updated_at,
            team:team_id (
              id,
              name,
              logo_url
            ),
            tournament:tournament_id (
              id,
              name
            )
          `,
          )
          .eq("status", "eingereicht")
          .order("updated_at", { ascending: false })
          .limit(5)

        setPendingBlanketts(pendingData || [])

        // Neueste Aktivitäten abrufen
        // Hier könnten Sie eine Tabelle für Aktivitäten erstellen oder verschiedene Tabellen abfragen
        // Für dieses Beispiel verwenden wir die neuesten Blanketts als Aktivitäten
        const { data: activityData } = await supabase
          .from("blankett_entries")
          .select(
            `
            id,
            status,
            created_at,
            updated_at,
            team:team_id (
              id,
              name,
              logo_url
            ),
            tournament:tournament_id (
              id,
              name
            )
          `,
          )
          .order("updated_at", { ascending: false })
          .limit(5)

        setRecentActivity(activityData || [])

        // Benachrichtigungen abrufen
        const { data: notificationsData } = await supabase
          .from("notifications")
          .select("*")
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(5)

        setNotifications(notificationsData || [])
      } catch (error) {
        console.error("Fehler beim Laden der Daten:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [supabase, router, user])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Unbekannt"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "genehmigt":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "abgelehnt":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "eingereicht":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Übersicht und Verwaltung der Plattform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary mr-4" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teams</p>
                  <h3 className="text-3xl font-bold">{stats.teams}</h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-primary mr-4" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Turniere</p>
                  <h3 className="text-3xl font-bold">{stats.tournaments}</h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary mr-4" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Spieler</p>
                  <h3 className="text-3xl font-bold">{stats.players}</h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-primary mr-4" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Spiele</p>
                  <h3 className="text-3xl font-bold">{stats.matches}</h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-primary mr-4" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Blanketts</p>
                  <h3 className="text-3xl font-bold">{stats.blanketts}</h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile-optimierte Tabs */}
      <div className="sm:hidden mb-6">
        <div className="mobile-tabs-container flex">
          <button
            className={`mobile-tab ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Ausstehende Blanketts
          </button>
          <button
            className={`mobile-tab ${activeTab === "activity" ? "active" : ""}`}
            onClick={() => setActiveTab("activity")}
          >
            Neueste Aktivitäten
          </button>
          <button
            className={`mobile-tab ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            Benachrichtigungen
          </button>
        </div>

        <div className="mt-4">
          {activeTab === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle>Ausstehende Blanketts</CardTitle>
                <CardDescription>
                  Hier können Sie Blanketts verwalten, die von Trainern gespeichert wurden.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingBlanketts.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">Keine ausstehenden Blanketts</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Derzeit gibt es keine Blanketts, die auf Bearbeitung warten.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingBlanketts.map((blankett) => (
                      <div key={blankett.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-secondary mr-3">
                              {blankett.team?.logo_url ? (
                                <img
                                  src={blankett.team.logo_url || "/placeholder.svg"}
                                  alt={blankett.team.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                  {blankett.team?.name?.charAt(0) || "T"}
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">{blankett.team?.name}</h4>
                              <p className="text-sm text-muted-foreground">{blankett.tournament?.name}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(blankett.status)}`}>
                            {blankett.status.charAt(0).toUpperCase() + blankett.status.slice(1)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Aktualisiert: {formatDate(blankett.updated_at)}
                        </div>
                        <div className="mt-3">
                          <Link
                            href={`/admin/blanketts/${blankett.id}`}
                            className="text-sm text-primary hover:underline"
                          >
                            Blankett ansehen
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "activity" && (
            <Card>
              <CardHeader>
                <CardTitle>Neueste Aktivitäten</CardTitle>
                <CardDescription>Die letzten Aktivitäten auf der Plattform.</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">Keine Aktivitäten</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Es wurden noch keine Aktivitäten aufgezeichnet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-secondary mr-3">
                              {activity.team?.logo_url ? (
                                <img
                                  src={activity.team.logo_url || "/placeholder.svg"}
                                  alt={activity.team.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                  {activity.team?.name?.charAt(0) || "T"}
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">{activity.team?.name}</h4>
                              <p className="text-sm text-muted-foreground">{activity.tournament?.name}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(activity.status)}`}>
                            {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Aktualisiert: {formatDate(activity.updated_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Benachrichtigungen</CardTitle>
                <CardDescription>Ihre neuesten Benachrichtigungen.</CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">Keine Benachrichtigungen</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Sie haben derzeit keine ungelesenen Benachrichtigungen.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="border rounded-lg p-4">
                        <div className="mb-2">
                          <h4 className="font-medium">{notification.type}</h4>
                          <p className="text-sm">{notification.message}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Erstellt: {formatDate(notification.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden sm:block">
        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">Ausstehende Blanketts</TabsTrigger>
            <TabsTrigger value="activity">Neueste Aktivitäten</TabsTrigger>
            <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Ausstehende Blanketts</CardTitle>
                <CardDescription>
                  Hier können Sie Blanketts verwalten, die von Trainern gespeichert wurden.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingBlanketts.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">Keine ausstehenden Blanketts</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Derzeit gibt es keine Blanketts, die auf Bearbeitung warten.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingBlanketts.map((blankett) => (
                      <div key={blankett.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-secondary mr-3">
                              {blankett.team?.logo_url ? (
                                <img
                                  src={blankett.team.logo_url || "/placeholder.svg"}
                                  alt={blankett.team.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                  {blankett.team?.name?.charAt(0) || "T"}
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">{blankett.team?.name}</h4>
                              <p className="text-sm text-muted-foreground">{blankett.tournament?.name}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(blankett.status)}`}>
                            {blankett.status.charAt(0).toUpperCase() + blankett.status.slice(1)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Aktualisiert: {formatDate(blankett.updated_at)}
                        </div>
                        <div className="mt-3">
                          <Link
                            href={`/admin/blanketts/${blankett.id}`}
                            className="text-sm text-primary hover:underline"
                          >
                            Blankett ansehen
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Neueste Aktivitäten</CardTitle>
                <CardDescription>Die letzten Aktivitäten auf der Plattform.</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">Keine Aktivitäten</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Es wurden noch keine Aktivitäten aufgezeichnet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-secondary mr-3">
                              {activity.team?.logo_url ? (
                                <img
                                  src={activity.team.logo_url || "/placeholder.svg"}
                                  alt={activity.team.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                  {activity.team?.name?.charAt(0) || "T"}
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">{activity.team?.name}</h4>
                              <p className="text-sm text-muted-foreground">{activity.tournament?.name}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(activity.status)}`}>
                            {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Aktualisiert: {formatDate(activity.updated_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Benachrichtigungen</CardTitle>
                <CardDescription>Ihre neuesten Benachrichtigungen.</CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">Keine Benachrichtigungen</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Sie haben derzeit keine ungelesenen Benachrichtigungen.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="border rounded-lg p-4">
                        <div className="mb-2">
                          <h4 className="font-medium">{notification.type}</h4>
                          <p className="text-sm">{notification.message}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Erstellt: {formatDate(notification.created_at)}
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
  )
}
