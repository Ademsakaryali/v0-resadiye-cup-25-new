"use client"

import { DialogFooter } from "@/components/ui/dialog"

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
        return <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">{position}</Badge>
      case "Abwehr":
        return <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">{position}</Badge>
      case "Mittelfeld":
        return <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">{position}</Badge>
      case "Sturm":
        return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30">{position}</Badge>
      default:
        return (
          <Badge variant="outline" className="border-gray-700 text-gray-300">
            {position}
          </Badge>
        )
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

  const calculateTeamAverageAge = () => {
    if (spieler.length === 0) return 0

    let totalAge = 0
    let countWithAge = 0

    spieler.forEach((s) => {
      if (s.spieler?.geburtsdatum) {
        const age = calculateAge(s.spieler.geburtsdatum)
        if (age) {
          totalAge += age
          countWithAge++
        }
      }
    })

    return countWithAge > 0 ? Math.round(totalAge / countWithAge) : 0
  }

  // Prüfen, ob der aktuelle Benutzer der Trainer des Teams ist
  const isTeamTrainer = user?.rolle === "Trainer" && user.id === team.trainer_id

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {error && (
        <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-800 text-red-300">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-300">Fehler</AlertTitle>
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-900/20 border-green-800 text-green-300">
          <AlertCircle className="h-4 w-4 text-green-400" />
          <AlertTitle className="text-green-300">Erfolg</AlertTitle>
          <AlertDescription className="text-green-200">{success}</AlertDescription>
        </Alert>
      )}

      {/* Header-Bereich mit Team-Informationen */}
      <div className="bg-gray-900/80 dark:bg-gray-900/60 border border-gray-800 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-3 sm:gap-6">
          <div className="relative w-20 h-20 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-800/50 rounded-md border border-gray-700/50 p-2">
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
              <div className="w-full h-full flex items-center justify-center">
                <Users className="h-10 w-10 sm:h-16 sm:w-16 text-blue-400" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-white neon-text">{team.name}</h1>
            {team.beschreibung && (
              <p className="text-sm sm:text-base text-gray-300 mt-1 line-clamp-2 sm:line-clamp-none">
                {team.beschreibung}
              </p>
            )}

            <div className="flex flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-3 justify-center md:justify-start">
              {tournaments.map((tournament) => (
                <Badge
                  key={tournament.id}
                  variant="secondary"
                  className="flex items-center gap-1 text-xs sm:text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                >
                  <Trophy className="h-3 w-3" />
                  {tournament.name}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
              <Badge variant="outline" className="flex items-center gap-1 border-gray-700 text-gray-300">
                <Users className="h-3 w-3 text-blue-400" />
                {spieler.length} Spieler
              </Badge>
              {calculateTeamAverageAge() > 0 && (
                <Badge variant="outline" className="flex items-center gap-1 border-gray-700 text-gray-300">
                  <Calendar className="h-3 w-3 text-blue-400" />
                  {`Ø ${calculateTeamAverageAge()} Jahre`}
                </Badge>
              )}
            </div>

            <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
              {canEdit() && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs sm:text-sm border-gray-700 bg-gray-800/50 text-gray-200 hover:bg-gray-700/50 hover:text-blue-400"
                >
                  <Link href={isAdmin() ? `/teams/${team.id}/edit` : `/teams/${team.id}/trainer-edit`}>
                    <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Team bearbeiten
                  </Link>
                </Button>
              )}
              {(isTrainer() || isAdmin()) && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleBlankettClick}
                  className="h-8 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Mannschaftsblankett
                </Button>
              )}
              {isAdmin() && (
                <Dialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs sm:text-sm border-gray-700 bg-gray-800/50 text-gray-200 hover:bg-gray-700/50 hover:text-blue-400"
                    >
                      <UserPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Spieler hinzufügen
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800">
                    <DialogHeader>
                      <DialogTitle className="text-white">Spieler zum Team hinzufügen</DialogTitle>
                      <DialogDescription className="text-gray-400">
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

          <div className="flex-shrink-0 bg-gray-800/50 p-3 sm:p-4 rounded-lg border border-gray-700/50 mt-3 md:mt-0 w-full md:w-auto">
            <h3 className="text-xs sm:text-sm font-medium text-blue-400 mb-1 sm:mb-2">Trainer</h3>
            <div className="flex items-center">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-3 border border-gray-700">
                <AvatarFallback className="bg-blue-500/20 text-blue-400">
                  {team.trainer?.vorname?.charAt(0)}
                  {team.trainer?.nachname?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm sm:text-base text-white">
                  {team.trainer?.vorname} {team.trainer?.nachname}
                </div>
                {isAdmin() && team.trainer?.email && (
                  <div className="text-xs sm:text-sm text-gray-400 flex items-center">
                    <Mail className="h-3 w-3 mr-1 text-blue-400" />
                    {team.trainer?.email}
                  </div>
                )}
                {isAdmin() && team.trainer?.telefonnummer && (
                  <div className="text-xs sm:text-sm text-gray-400 flex items-center">
                    <Phone className="h-3 w-3 mr-1 text-blue-400" />
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
          <Card className="bg-gray-900/80 border-gray-800">
            <CardContent className="pt-6">
              <Label htmlFor="team-select" className="text-sm text-gray-300">
                Meine Teams
              </Label>
              <Select value={params.id as string} onValueChange={handleTeamChange}>
                <SelectTrigger id="team-select" className="mt-1 bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Team auswählen" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {trainerTeams.map((team) => (
                    <SelectItem
                      key={team.id}
                      value={team.id}
                      className="text-gray-200 focus:bg-gray-700 focus:text-white"
                    >
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
      <Tabs value="spieler" className="mb-6">
        <TabsList className="hidden">
          <TabsTrigger value="spieler">Spieler</TabsTrigger>
        </TabsList>

        <TabsContent value="spieler" className="mt-6">
          <Card className="bg-gray-900/80 border-gray-800 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center text-white">
                  <Users className="mr-2 h-5 w-5 text-blue-400" />
                  Mannschaftskader
                </CardTitle>
                <CardDescription className="flex items-center gap-3 text-gray-400">
                  <span>{spieler.length} Spieler im Team</span>
                  {spieler.length > 0 && (
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-blue-400" />
                      {`Ø ${calculateTeamAverageAge()} Jahre`}
                    </span>
                  )}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {spieler.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="mx-auto h-16 w-16 text-gray-700" />
                  <h3 className="mt-4 text-lg font-medium text-white">Keine Spieler</h3>
                  <p className="mt-2 text-sm text-gray-400">Diesem Team sind noch keine Spieler zugeordnet.</p>
                  {isAdmin() && (
                    <Button
                      variant="outline"
                      className="mt-4 border-gray-700 bg-gray-800/50 text-gray-200 hover:bg-gray-700/50 hover:text-blue-400"
                      onClick={() => setShowAddPlayerDialog(true)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Spieler hinzufügen
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-800">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th
                          scope="col"
                          className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-16 text-center"
                        >
                          Nr.
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                        >
                          Spieler
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden sm:table-cell"
                        >
                          Geburtsdatum
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                        >
                          Alter
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                        >
                          Position
                        </th>
                        {canEdit() && (
                          <th
                            scope="col"
                            className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider w-20"
                          >
                            Aktionen
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900/30 divide-y divide-gray-800">
                      {spieler.map((s) => (
                        <tr key={s.spieler_id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="px-3 py-4 whitespace-nowrap text-center">
                            <div className="w-8 h-8 flex items-center justify-center bg-blue-500/20 rounded-full mx-auto font-bold text-blue-400">
                              {s.trikot_nummer || "-"}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3 border border-gray-700">
                                <AvatarFallback className="bg-blue-500/20 text-blue-400">
                                  {getInitials(`${s.spieler?.vorname} ${s.spieler?.nachname}`)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-white">
                                  <Link
                                    href={`/spieler/${s.spieler_id}`}
                                    className="hover:text-blue-400 transition-colors"
                                  >
                                    {s.spieler?.vorname} {s.spieler?.nachname}
                                  </Link>
                                </div>
                                {s.spieler?.email && isAdmin() && (
                                  <div className="text-xs text-gray-400">{s.spieler?.email}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300 hidden sm:table-cell">
                            {formatDate(s.spieler?.geburtsdatum || "")}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                            {s.spieler?.geburtsdatum ? calculateAge(s.spieler.geburtsdatum) : "-"}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">{s.position && getPositionBadge(s.position)}</td>
                          {canEdit() && (
                            <td className="px-3 py-4 whitespace-nowrap text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-blue-400 hover:bg-gray-700"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                  <DropdownMenuLabel className="text-gray-300">Aktionen</DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-gray-700" />
                                  {isAdmin() && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => handleEditSpieler(s)}
                                        className="text-gray-200 focus:bg-gray-700 focus:text-blue-400"
                                      >
                                        <Edit className="h-4 w-4 mr-2 text-blue-400" />
                                        Bearbeiten
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleRemoveSpieler(s.spieler_id)}
                                        className="text-gray-200 focus:bg-gray-700 focus:text-red-400"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2 text-red-400" />
                                        Löschen
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleSetVereinlos(s.spieler_id)}
                                    className="text-gray-200 focus:bg-gray-700 focus:text-yellow-400"
                                  >
                                    <UserMinus className="h-4 w-4 mr-2 text-yellow-400" />
                                    Aus dem Mannschaft enfernen
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog zum Bearbeiten eines Spielers (nur für Admins) */}
      {isAdmin() && (
        <Dialog open={showSpielerDialog} onOpenChange={setShowSpielerDialog}>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">Spieler bearbeiten</DialogTitle>
              <DialogDescription className="text-gray-400">Ändern Sie die Spielerdaten und Position.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {editingSpieler && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-gray-800/50 border border-gray-700/50">
                  <Avatar className="h-10 w-10 border border-gray-700">
                    <AvatarFallback className="bg-blue-500/20 text-blue-400">
                      {getInitials(`${editingSpieler.spieler?.vorname} ${editingSpieler.spieler?.nachname}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-white">
                      {editingSpieler.spieler?.vorname} {editingSpieler.spieler?.nachname}
                    </div>
                    <div className="text-xs text-gray-400">
                      {editingSpieler.spieler?.geburtsdatum && formatDate(editingSpieler.spieler.geburtsdatum)}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vorname-edit" className="text-gray-300">
                    Vorname
                  </Label>
                  <Input
                    id="vorname-edit"
                    value={vorname}
                    onChange={(e) => setVorname(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nachname-edit" className="text-gray-300">
                    Nachname
                  </Label>
                  <Input
                    id="nachname-edit"
                    value={nachname}
                    onChange={(e) => setNachname(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="geburtsdatum-edit" className="text-gray-300">
                  Geburtsdatum
                </Label>
                <Input
                  id="geburtsdatum-edit"
                  type="date"
                  value={geburtsdatum}
                  onChange={(e) => setGeburtsdatum(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trikot-edit" className="text-gray-300">
                    Trikotnummer
                  </Label>
                  <Input
                    id="trikot-edit"
                    type="number"
                    min="1"
                    max="99"
                    value={trikotNummer}
                    onChange={(e) => setTrikotNummer(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position-edit" className="text-gray-300">
                    Position
                  </Label>
                  <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger id="position-edit" className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Position auswählen" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="Torwart" className="text-gray-200 focus:bg-gray-700 focus:text-white">
                        Torwart
                      </SelectItem>
                      <SelectItem value="Abwehr" className="text-gray-200 focus:bg-gray-700 focus:text-white">
                        Abwehr
                      </SelectItem>
                      <SelectItem value="Mittelfeld" className="text-gray-200 focus:bg-gray-700 focus:text-white">
                        Mittelfeld
                      </SelectItem>
                      <SelectItem value="Sturm" className="text-gray-200 focus:bg-gray-700 focus:text-white">
                        Sturm
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSpielerDialog(false)}
                className="border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleUpdateSpieler}
                disabled={!vorname || !nachname || !geburtsdatum || !trikotNummer || !position || saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
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
