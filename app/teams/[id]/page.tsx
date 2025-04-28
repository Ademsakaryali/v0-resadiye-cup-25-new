"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Users,
  Edit,
  AlertCircle,
  MoreVertical,
  UserPlus,
  Trash2,
  UserMinus,
  Calendar,
  Trophy,
  Mail,
  Phone,
} from "lucide-react"
import { AddPlayerToTeamForm } from "@/components/teams/add-player-form"

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
  const [trainerTeams, setTrainerTeams] = useState<any[]>([])
  const [showSpielerDialog, setShowSpielerDialog] = useState(false)
  const [editingSpieler, setEditingSpieler] = useState<any>(null)
  const [vorname, setVorname] = useState("")
  const [nachname, setNachname] = useState("")
  const [geburtsdatum, setGeburtsdatum] = useState("")
  const [trikotNummer, setTrikotNummer] = useState("")
  const [position, setPosition] = useState("")
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [tournaments, setTournaments] = useState<any[]>([])
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("spieler")

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

      // Spieler abrufen mit Trikotnummern und Positionen
      const { data: spielerData, error: spielerError } = await supabase
        .from("team_spieler")
        .select(`
          team_id,
          spieler_id,
          trikot_nummer,
          position,
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
        .order("trikot_nummer", { ascending: true })

      if (spielerError) throw spielerError

      setSpieler(spielerData)

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

      // Turniere abrufen, an denen das Team teilnimmt
      const { data: tournamentData, error: tournamentError } = await supabase
        .from("tournament_teams")
        .select(`
          tournament:tournament_id (
            id,
            name,
            start_datum,
            end_datum,
            ist_aktiv
          )
        `)
        .eq("team_id", params.id)

      if (tournamentError) throw tournamentError

      const activeTeamTournaments = tournamentData
        .map((item: any) => item.tournament)
        .filter((tournament: any) => tournament.ist_aktiv)

      setTournaments(activeTeamTournaments)

      // Wenn der Benutzer ein Trainer ist, alle seine Teams abrufen
      if (user?.rolle === "Trainer") {
        const { data: trainerTeamsData, error: trainerTeamsError } = await supabase
          .from("teams")
          .select("id, name, logo_url")
          .eq("trainer_id", user.id)
          .eq("ist_aktiv", true)
          .order("name", { ascending: true })

        if (!trainerTeamsError && trainerTeamsData) {
          setTrainerTeams(trainerTeamsData)
        }
      }
    } catch (error: any) {
      console.error("Fehler beim Laden der Team-Daten:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Prüfen, ob die ID "new" ist, und in diesem Fall zur Erstellungsseite weiterleiten
    if (params.id === "new") {
      router.push("/teams/new")
      return
    }

    fetchTeamData()
  }, [supabase, params.id, router, user])

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

  const calculateAge = (geburtsdatum: string) => {
    if (!geburtsdatum) return ""
    const heute = new Date()
    const geburtstag = new Date(geburtsdatum)
    let alter = heute.getFullYear() - geburtstag.getFullYear()
    const m = heute.getMonth() - geburtstag.getMonth()
    if (m < 0 || (m === 0 && heute.getDate() < geburtstag.getDate())) {
      alter--
    }
    return alter
  }

  const getPositionBadge = (position: string) => {
    switch (position) {
      case "Torwart":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">{position}</Badge>
      case "Abwehr":
        return <Badge className="bg-blue-500 hover:bg-blue-600">{position}</Badge>
      case "Mittelfeld":
        return <Badge className="bg-green-500 hover:bg-green-600">{position}</Badge>
      case "Sturm":
        return <Badge className="bg-red-500 hover:bg-red-600">{position}</Badge>
      default:
        return <Badge variant="outline">{position}</Badge>
    }
  }

  const getInitials = (name: string) => {
    if (!name) return ""
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Funktion zum Weiterleiten zum Blankett
  const handleBlankettClick = () => {
    // Wenn das Team nur an einem aktiven Turnier teilnimmt und ein Blankett dafür existiert,
    // direkt zum Blankett weiterleiten
    if (tournaments.length === 1) {
      const tournamentId = tournaments[0].id
      const blankett = blanketts.find((b) => b.tournament_id === tournamentId)

      if (blankett) {
        router.push(`/teams/${team.id}/blankett/${blankett.id}`)
        return
      }
    }

    // Ansonsten zur Blankett-Übersicht
    router.push(`/teams/${team.id}/blankett`)
  }

  const handleTeamChange = (teamId: string) => {
    router.push(`/teams/${teamId}`)
  }

  const handleEditSpieler = (spieler: any) => {
    // Nur Admins dürfen Spieler bearbeiten
    if (!isAdmin()) return

    setEditingSpieler(spieler)
    setVorname(spieler.spieler.vorname || "")
    setNachname(spieler.spieler.nachname || "")
    setGeburtsdatum(spieler.spieler.geburtsdatum || "")
    setTrikotNummer(spieler.trikot_nummer?.toString() || "")
    setPosition(spieler.position || "")
    setShowSpielerDialog(true)
  }

  const handleUpdateSpieler = async () => {
    // Nur Admins dürfen Spieler aktualisieren
    if (!isAdmin()) return

    if (!editingSpieler || !vorname || !nachname || !geburtsdatum || !trikotNummer || !position) {
      setError("Bitte füllen Sie alle Felder aus.")
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Prüfen, ob die Trikotnummer bereits vergeben ist (außer für den aktuellen Spieler)
      const trikotExists = spieler.some(
        (s) => s.trikot_nummer?.toString() === trikotNummer && s.spieler_id !== editingSpieler.spieler_id,
      )

      if (trikotExists) {
        setError("Diese Trikotnummer ist bereits vergeben.")
        return
      }

      // Spielerdaten aktualisieren
      const { error: spielerError } = await supabase
        .from("users")
        .update({
          vorname,
          nachname,
          geburtsdatum,
        })
        .eq("id", editingSpieler.spieler_id)

      if (spielerError) throw spielerError

      // Team-Spieler-Verknüpfung aktualisieren
      const { error: teamSpielerError } = await supabase
        .from("team_spieler")
        .update({
          trikot_nummer: Number.parseInt(trikotNummer),
          position,
        })
        .eq("team_id", team.id)
        .eq("spieler_id", editingSpieler.spieler_id)

      if (teamSpielerError) throw teamSpielerError

      // Spielerliste aktualisieren
      setSpieler(
        spieler.map((s) => {
          if (s.spieler_id === editingSpieler.spieler_id) {
            return {
              ...s,
              trikot_nummer: Number.parseInt(trikotNummer),
              position,
              spieler: {
                ...s.spieler,
                vorname,
                nachname,
                geburtsdatum,
              },
            }
          }
          return s
        }),
      )

      // Dialog schließen und Formular zurücksetzen
      setShowSpielerDialog(false)
      setEditingSpieler(null)
      setVorname("")
      setNachname("")
      setGeburtsdatum("")
      setTrikotNummer("")
      setPosition("")

      setSuccess("Spieler erfolgreich aktualisiert.")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Fehler beim Aktualisieren des Spielers:", error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveSpieler = async (spielerId: string) => {
    // Nur Admins dürfen Spieler komplett entfernen
    if (!isAdmin()) return

    try {
      setSaving(true)
      setError(null)

      // Spieler aus dem Team entfernen
      const { error } = await supabase.from("team_spieler").delete().eq("team_id", team.id).eq("spieler_id", spielerId)

      if (error) throw error

      // Spielerliste aktualisieren
      setSpieler(spieler.filter((s) => s.spieler_id !== spielerId))

      setSuccess("Spieler erfolgreich aus dem Team entfernt.")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Fehler beim Entfernen des Spielers:", error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSetVereinlos = async (spielerId: string) => {
    // Sowohl Trainer als auch Admins dürfen Spieler als vereinslos setzen
    try {
      setSaving(true)
      setError(null)

      // Spieler aus dem Team entfernen
      const { error: removeError } = await supabase
        .from("team_spieler")
        .delete()
        .eq("team_id", team.id)
        .eq("spieler_id", spielerId)

      if (removeError) throw removeError

      // Spielerliste aktualisieren
      setSpieler(spieler.filter((s) => s.spieler_id !== spielerId))

      setSuccess("Spieler erfolgreich als vereinslos gesetzt.")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Fehler beim Setzen des Spielers als vereinslos:", error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePlayerAdded = () => {
    setSuccess("Spieler erfolgreich zum Team hinzugefügt.")
    setShowAddPlayerDialog(false)

    // Daten neu laden
    setTimeout(() => {
      setSuccess(null)
      fetchTeamData() // Hier rufen wir die Funktion auf, um die Daten neu zu laden
    }, 1000)
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-600 text-green-600">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erfolg</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Header-Bereich mit Team-Informationen */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative w-32 h-32 flex-shrink-0">
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
              <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                <Users className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold">{team.name}</h1>
            {team.beschreibung && <p className="text-gray-600 dark:text-gray-400 mt-1">{team.beschreibung}</p>}

            <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
              {tournaments.map((tournament) => (
                <Badge key={tournament.id} variant="secondary" className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {tournament.name}
                </Badge>
              ))}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              {canEdit() && (
                <Button asChild variant="outline" size="sm">
                  <Link href={isAdmin() ? `/teams/${team.id}/edit` : `/teams/${team.id}/trainer-edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Team bearbeiten
                  </Link>
                </Button>
              )}
              {(isTrainer() || isAdmin()) && (
                <Button variant="default" size="sm" onClick={handleBlankettClick}>
                  <FileText className="mr-2 h-4 w-4" />
                  Mannschaftsblankett
                </Button>
              )}
              {isAdmin() && (
                <Dialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Spieler hinzufügen
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Spieler zum Team hinzufügen</DialogTitle>
                      <DialogDescription>
                        Fügen Sie einen existierenden Spieler zum Team hinzu oder erstellen Sie einen neuen Spieler.
                      </DialogDescription>
                    </DialogHeader>
                    <AddPlayerToTeamForm
                      teamId={team.id}
                      existingPlayerIds={spieler.map((s) => s.spieler_id)}
                      onSuccess={handlePlayerAdded}
                      onError={(errorMsg) => setError(errorMsg)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Trainer</h3>
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarFallback>
                  {team.trainer?.vorname?.charAt(0)}
                  {team.trainer?.nachname?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {team.trainer?.vorname} {team.trainer?.nachname}
                </div>
                {team.trainer?.email && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    {team.trainer?.email}
                  </div>
                )}
                {team.trainer?.telefonnummer && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {team.trainer?.telefonnummer}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team-Auswahl für Trainer mit mehreren Teams */}
      {user?.rolle === "Trainer" && trainerTeams.length > 1 && (
        <div className="mb-6">
          <Card>
            <CardContent className="pt-6">
              <Label htmlFor="team-select" className="text-sm">
                Meine Teams
              </Label>
              <Select value={params.id as string} onValueChange={handleTeamChange}>
                <SelectTrigger id="team-select" className="mt-1">
                  <SelectValue placeholder="Team auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {trainerTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs für verschiedene Bereiche */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="spieler">Spieler</TabsTrigger>
          <TabsTrigger value="info">Team-Info</TabsTrigger>
        </TabsList>

        <TabsContent value="spieler" className="mt-6">
          <Card className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Mannschaftskader
                </CardTitle>
                <CardDescription>{spieler.length} Spieler im Team</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {spieler.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" />
                  <h3 className="mt-4 text-lg font-medium">Keine Spieler</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Diesem Team sind noch keine Spieler zugeordnet.
                  </p>
                  {isAdmin() && (
                    <Button variant="outline" className="mt-4" onClick={() => setShowAddPlayerDialog(true)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Spieler hinzufügen
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {spieler.map((s) => (
                    <Link key={s.spieler_id} href={`/spieler/${s.spieler_id}`} className="block">
                      <div className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:shadow-md hover:border-primary/30 transition-all duration-200">
                        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-full mr-3 font-bold text-primary">
                          {s.trikot_nummer || "-"}
                        </div>
                        <div className="flex items-center min-w-0 flex-1">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarFallback>
                              {getInitials(`${s.spieler?.vorname} ${s.spieler?.nachname}`)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              {s.spieler?.vorname} {s.spieler?.nachname}
                            </div>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-2">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(s.spieler?.geburtsdatum || "")}
                              </span>
                              {s.spieler?.geburtsdatum && (
                                <span className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                                  {calculateAge(s.spieler.geburtsdatum)} J.
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          {s.position && getPositionBadge(s.position)}
                          {canEdit() && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {isAdmin() && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.preventDefault()
                                        handleEditSpieler(s)
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Bearbeiten
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.preventDefault()
                                        handleRemoveSpieler(s.spieler_id)
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Löschen
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.preventDefault()
                                    handleSetVereinlos(s.spieler_id)
                                  }}
                                >
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Aus dem Mannschaft enfernen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="mt-6">
          <Card className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Team-Informationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gründungsdatum</h3>
                    <p className="mt-1 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(team.created_at)}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Anzahl Spieler</h3>
                    <p className="mt-1 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      {spieler.length} Spieler
                    </p>
                  </div>

                  {team.heimatort && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Heimatort</h3>
                      <p className="mt-1">{team.heimatort}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Aktive Turniere</h3>
                    {tournaments.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {tournaments.map((tournament) => (
                          <div
                            key={tournament.id}
                            className="flex items-center p-2 rounded-md bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                          >
                            <Trophy className="h-4 w-4 mr-2 text-amber-500" />
                            <div>
                              <div className="font-medium">{tournament.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(tournament.start_datum)} - {formatDate(tournament.end_datum)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-gray-500 dark:text-gray-400">Keine aktiven Turniere</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Mannschaftsblanketts</h3>
                    {blanketts.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {blanketts.slice(0, 3).map((blankett) => (
                          <div
                            key={blankett.id}
                            className="flex items-center p-2 rounded-md bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                          >
                            <FileText className="h-4 w-4 mr-2 text-blue-500" />
                            <div>
                              <div className="font-medium">{blankett.tournament?.name || "Turnier"}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Erstellt am {formatDate(blankett.created_at)}
                              </div>
                            </div>
                          </div>
                        ))}
                        {blanketts.length > 3 && (
                          <Button variant="link" size="sm" className="mt-1" onClick={handleBlankettClick}>
                            Alle Blanketts anzeigen
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="mt-1 text-gray-500 dark:text-gray-400">Keine Blanketts vorhanden</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog zum Bearbeiten eines Spielers (nur für Admins) */}
      {isAdmin() && (
        <Dialog open={showSpielerDialog} onOpenChange={setShowSpielerDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Spieler bearbeiten</DialogTitle>
              <DialogDescription>Ändern Sie die Spielerdaten und Position.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {editingSpieler && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/20">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(`${editingSpieler.spieler?.vorname} ${editingSpieler.spieler?.nachname}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {editingSpieler.spieler?.vorname} {editingSpieler.spieler?.nachname}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {editingSpieler.spieler?.geburtsdatum && formatDate(editingSpieler.spieler.geburtsdatum)}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vorname-edit">Vorname</Label>
                  <Input id="vorname-edit" value={vorname} onChange={(e) => setVorname(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nachname-edit">Nachname</Label>
                  <Input id="nachname-edit" value={nachname} onChange={(e) => setNachname(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="geburtsdatum-edit">Geburtsdatum</Label>
                <Input
                  id="geburtsdatum-edit"
                  type="date"
                  value={geburtsdatum}
                  onChange={(e) => setGeburtsdatum(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trikot-edit">Trikotnummer</Label>
                  <Input
                    id="trikot-edit"
                    type="number"
                    min="1"
                    max="99"
                    value={trikotNummer}
                    onChange={(e) => setTrikotNummer(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position-edit">Position</Label>
                  <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger id="position-edit">
                      <SelectValue placeholder="Position auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Torwart">Torwart</SelectItem>
                      <SelectItem value="Abwehr">Abwehr</SelectItem>
                      <SelectItem value="Mittelfeld">Mittelfeld</SelectItem>
                      <SelectItem value="Sturm">Sturm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSpielerDialog(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleUpdateSpieler}
                disabled={!vorname || !nachname || !geburtsdatum || !trikotNummer || !position || saving}
              >
                {saving ? "Wird aktualisiert..." : "Speichern"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
