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
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  FileText,
  Users,
  Edit,
  AlertCircle,
  MoreVertical,
  UserPlus,
  Trash2,
  UserMinus,
  MessageSquare,
  ExternalLink,
} from "lucide-react"

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
          updated_at: new Date().toISOString(),
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
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={team.trainer?.profilbild_url || ""} alt={team.trainer?.vorname} />
                    <AvatarFallback>
                      {team.trainer?.vorname?.charAt(0)}
                      {team.trainer?.nachname?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {team.trainer?.vorname} {team.trainer?.nachname}
                    </span>
                    {team.trainer?.geburtsdatum && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {calculateAge(team.trainer.geburtsdatum)} Jahre
                      </span>
                    )}
                    {isAdmin() && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{team.trainer?.email}</span>
                    )}
                  </div>
                </div>
                {isAdmin() && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Erstellt am {formatDate(team.created_at)}
                  </p>
                )}
              </div>

              {/* Team-Auswahl für Trainer mit mehreren Teams */}
              {user?.rolle === "Trainer" && trainerTeams.length > 1 && (
                <div className="mb-4">
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
                </div>
              )}

              {/* Hinweis für Trainer zur Logo-Änderung */}
              {isTrainer() && (
                <Alert className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertTitle className="text-blue-800 dark:text-blue-300 text-sm">Logo ändern?</AlertTitle>
                  <AlertDescription className="text-blue-700 dark:text-blue-400 text-xs">
                    Melden Sie sich bei einem unserer Administratoren, um Ihr Logo zu ändern.
                    <a
                      href="https://wa.me/436605795264"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 dark:text-blue-300 mt-1 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      WhatsApp Kontakt
                    </a>
                  </AlertDescription>
                </Alert>
              )}

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

        {/* Spielerliste */}
        <div className="w-full md:w-2/3">
          <Card className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Spielerliste</CardTitle>
                <CardDescription>{spieler.length} Spieler im Team</CardDescription>
              </div>

              {isAdmin() && (
                <Button variant="outline" size="sm" className="bg-background/50">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Spieler hinzufügen
                </Button>
              )}
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
                <div className="space-y-2">
                  {spieler.map((s) => (
                    <div
                      key={s.spieler_id}
                      className="flex items-center justify-between p-3 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:shadow-sm transition-all duration-200"
                    >
                      <Link
                        href={`/spieler/${s.spieler_id}`}
                        className="flex items-center flex-1 min-w-0 overflow-hidden"
                      >
                        <div className="w-7 text-center font-bold mr-2 flex-shrink-0">{s.trikot_nummer || "-"}</div>
                        <div className="flex items-center min-w-0">
                          <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full mr-2 text-xs font-bold">
                            {getInitials(`${s.spieler?.vorname} ${s.spieler?.nachname}`)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              {s.spieler?.vorname} {s.spieler?.nachname}
                            </div>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-1">
                              <span className="truncate">{formatDate(s.spieler?.geburtsdatum || "")}</span>
                              {s.spieler?.geburtsdatum && (
                                <span className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                  {calculateAge(s.spieler.geburtsdatum)} J.
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {s.position && <div className="hidden sm:block">{getPositionBadge(s.position)}</div>}
                        {canEdit() && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {isAdmin() && (
                                <>
                                  <DropdownMenuItem onClick={() => handleEditSpieler(s)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Bearbeiten
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRemoveSpieler(s.spieler_id)}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Löschen
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem onClick={() => handleSetVereinlos(s.spieler_id)}>
                                <UserMinus className="h-4 w-4 mr-2" />
                                Als vereinslos setzen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
                    <AvatarImage
                      src={editingSpieler.spieler?.profilbild_url || ""}
                      alt={editingSpieler.spieler?.vorname}
                    />
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
