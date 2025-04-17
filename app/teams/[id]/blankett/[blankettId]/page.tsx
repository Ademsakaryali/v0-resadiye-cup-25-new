"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Team, Tournament, BlankettEntry, BlankettSettings, User, BlankettSpieler } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Info,
  Users,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Shield,
  Upload,
  X,
  UserPlus,
} from "lucide-react"

export default function BlankettDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<Team | null>(null)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [blankett, setBlankett] = useState<BlankettEntry | null>(null)
  const [settings, setSettings] = useState<BlankettSettings | null>(null)
  const [blankettSpieler, setBlankettSpieler] = useState<BlankettSpieler[]>([])
  const [teamSpieler, setTeamSpieler] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedSpielerId, setSelectedSpielerId] = useState<string>("")
  const [trikotNummer, setTrikotNummer] = useState<string>("")
  const [position, setPosition] = useState<string>("")
  const [availableSpieler, setAvailableSpieler] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<string>("existing")
  const [newSpielerData, setNewSpielerData] = useState({
    vorname: "",
    nachname: "",
    email: "",
    geburtsdatum: "",
    telefonnummer: "",
  })
  const [isCreatingSpieler, setIsCreatingSpieler] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Blankett abrufen
        const { data: blankettData, error: blankettError } = await supabase
          .from("blankett_entries")
          .select("*")
          .eq("id", params.blankettId)
          .single()

        if (blankettError) throw blankettError

        setBlankett(blankettData)

        // Team abrufen
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("*, trainer:trainer_id(*)")
          .eq("id", params.id)
          .single()

        if (teamError) throw teamError

        // Prüfen, ob der Benutzer berechtigt ist
        if (user?.rolle !== "Admin" && (user?.rolle !== "Trainer" || user.id !== teamData.trainer_id)) {
          router.push(`/teams/${params.id}`)
          return
        }

        setTeam(teamData)

        // Turnier abrufen
        const { data: tournamentData, error: tournamentError } = await supabase
          .from("tournaments")
          .select("*")
          .eq("id", blankettData.tournament_id)
          .single()

        if (tournamentError) throw tournamentError

        setTournament(tournamentData)

        // Blankett-Einstellungen abrufen
        const { data: settingsData, error: settingsError } = await supabase
          .from("blankett_settings")
          .select("*")
          .eq("tournament_id", blankettData.tournament_id)
          .maybeSingle()

        if (settingsError) throw settingsError

        // Wenn keine Einstellungen vorhanden sind, Standardeinstellungen verwenden
        if (!settingsData) {
          setSettings({
            id: "",
            tournament_id: blankettData.tournament_id,
            min_spieler: 11,
            max_spieler: 20,
            ohne_anmeldung: false,
            countdown_aktiv: false,
            countdown_datum: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        } else {
          setSettings(settingsData)
        }

        // Blankett-Spieler abrufen
        const { data: blankettSpielerData, error: blankettSpielerError } = await supabase
          .from("blankett_spieler")
          .select(`
            *,
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
          .eq("blankett_id", params.blankettId)

        if (blankettSpielerError) throw blankettSpielerError

        setBlankettSpieler(blankettSpielerData)

        // Team-Spieler abrufen
        const { data: teamSpielerData, error: teamSpielerError } = await supabase
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

        if (teamSpielerError) throw teamSpielerError

        const spielerList = teamSpielerData.map((item: any) => item.spieler)
        setTeamSpieler(spielerList)

        // Verfügbare Spieler berechnen (Spieler im Team, die noch nicht im Blankett sind)
        updateAvailableSpieler(spielerList, blankettSpielerData)
      } catch (error: any) {
        console.error("Fehler beim Laden der Daten:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, params.id, params.blankettId, router, user])

  const updateAvailableSpieler = (allSpieler: User[], blankettSpielerList: BlankettSpieler[]) => {
    const blankettSpielerIds = blankettSpielerList.map((bs) => bs.spieler_id)
    const available = allSpieler.filter((spieler) => !blankettSpielerIds.includes(spieler.id))
    setAvailableSpieler(available)
  }

  const handlePhotoUpload = async () => {
    if (!photoFile) return null

    setIsUploadingPhoto(true)
    try {
      const fileExt = photoFile.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `spieler-fotos/${fileName}`

      const { error: uploadError } = await supabase.storage.from("public").upload(filePath, photoFile)

      if (uploadError) {
        throw uploadError
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("public").getPublicUrl(filePath)

      return publicUrl
    } catch (error: any) {
      console.error("Fehler beim Hochladen des Fotos:", error)
      throw new Error(`Fehler beim Hochladen des Fotos: ${error.message}`)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Überprüfen Sie den Dateityp
    if (!file.type.startsWith("image/")) {
      setError("Bitte wählen Sie eine Bilddatei aus.")
      return
    }

    // Überprüfen Sie die Dateigröße (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Das Bild darf nicht größer als 2MB sein.")
      return
    }

    setPhotoFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPhotoUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }

  const handleRemovePhoto = () => {
    setPhotoUrl(null)
    setPhotoFile(null)
  }

  const handleNewSpielerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewSpielerData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateSpieler = async () => {
    if (!blankett) return

    setIsCreatingSpieler(true)
    setError(null)

    try {
      // Validierung
      if (!newSpielerData.vorname || !newSpielerData.nachname) {
        throw new Error("Bitte geben Sie mindestens Vor- und Nachname ein.")
      }

      if (!trikotNummer || !position) {
        throw new Error("Bitte geben Sie Trikotnummer und Position an.")
      }

      // Prüfen, ob die Trikotnummer bereits vergeben ist
      const existingWithNumber = blankettSpieler.find((bs) => bs.trikot_nummer.toString() === trikotNummer)
      if (existingWithNumber) {
        throw new Error(`Die Trikotnummer ${trikotNummer} ist bereits vergeben.`)
      }

      // Foto hochladen, falls vorhanden
      let profilbildUrl = null
      if (photoFile) {
        profilbildUrl = await handlePhotoUpload()
      }

      // Spieler erstellen
      const { data: spielerData, error: spielerError } = await supabase
        .from("users")
        .insert({
          vorname: newSpielerData.vorname,
          nachname: newSpielerData.nachname,
          email: newSpielerData.email || null,
          geburtsdatum: newSpielerData.geburtsdatum || null,
          telefonnummer: newSpielerData.telefonnummer || null,
          profilbild_url: profilbildUrl,
          rolle: "Spieler",
          ist_aktiv: true,
        })
        .select()

      if (spielerError) throw spielerError

      const newSpielerId = spielerData[0].id

      // Spieler zum Team hinzufügen
      const { error: teamSpielerError } = await supabase.from("team_spieler").insert({
        team_id: team?.id,
        spieler_id: newSpielerId,
      })

      if (teamSpielerError) throw teamSpielerError

      // Spieler zum Blankett hinzufügen
      const { data: blankettSpielerData, error: blankettSpielerError } = await supabase
        .from("blankett_spieler")
        .insert({
          blankett_id: blankett.id,
          spieler_id: newSpielerId,
          trikot_nummer: Number.parseInt(trikotNummer),
          position: position,
        })
        .select(`
          *,
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

      if (blankettSpielerError) throw blankettSpielerError

      // Blankett-Spieler und Team-Spieler aktualisieren
      const newSpieler = {
        id: newSpielerId,
        vorname: newSpielerData.vorname,
        nachname: newSpielerData.nachname,
        email: newSpielerData.email || "",
        geburtsdatum: newSpielerData.geburtsdatum || "",
        telefonnummer: newSpielerData.telefonnummer || "",
        profilbild_url: profilbildUrl,
        rolle: "Spieler",
        ist_aktiv: true,
      }

      setTeamSpieler([...teamSpieler, newSpieler])
      setBlankettSpieler([...blankettSpieler, blankettSpielerData[0]])

      // Dialog schließen und Formular zurücksetzen
      setShowAddDialog(false)
      setNewSpielerData({
        vorname: "",
        nachname: "",
        email: "",
        geburtsdatum: "",
        telefonnummer: "",
      })
      setTrikotNummer("")
      setPosition("")
      setPhotoUrl(null)
      setPhotoFile(null)
      setActiveTab("existing")

      setSuccess("Spieler erfolgreich erstellt und hinzugefügt.")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Fehler beim Erstellen des Spielers:", error)
      setError(error.message)
    } finally {
      setIsCreatingSpieler(false)
    }
  }

  const handleAddSpieler = async () => {
    if (!selectedSpielerId || !trikotNummer || !position || !blankett) {
      setError("Bitte füllen Sie alle Felder aus.")
      return
    }

    try {
      // Prüfen, ob die Trikotnummer bereits vergeben ist
      const existingWithNumber = blankettSpieler.find((bs) => bs.trikot_nummer.toString() === trikotNummer)
      if (existingWithNumber) {
        setError(`Die Trikotnummer ${trikotNummer} ist bereits vergeben.`)
        return
      }

      // Spieler zum Blankett hinzufügen
      const { data, error } = await supabase
        .from("blankett_spieler")
        .insert({
          blankett_id: blankett.id,
          spieler_id: selectedSpielerId,
          trikot_nummer: Number.parseInt(trikotNummer),
          position: position,
        })
        .select(`
          *,
          spieler:spieler_id (
            id,
            vorname,
            nachname,
            email,
            geburtsdatum,
            profilbild_url
          )
        `)

      if (error) throw error

      // Blankett-Spieler aktualisieren
      setBlankettSpieler([...blankettSpieler, data[0]])

      // Verfügbare Spieler aktualisieren
      setAvailableSpieler(availableSpieler.filter((spieler) => spieler.id !== selectedSpielerId))

      // Dialog schließen und Formular zurücksetzen
      setShowAddDialog(false)
      setSelectedSpielerId("")
      setTrikotNummer("")
      setPosition("")

      setSuccess("Spieler erfolgreich hinzugefügt.")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Fehler beim Hinzufügen des Spielers:", error)
      setError(error.message)
    }
  }

  const handleRemoveSpieler = async (spielerId: string) => {
    if (!blankett) return

    try {
      // Spieler aus dem Blankett entfernen
      const { error } = await supabase
        .from("blankett_spieler")
        .delete()
        .eq("blankett_id", blankett.id)
        .eq("spieler_id", spielerId)

      if (error) throw error

      // Blankett-Spieler aktualisieren
      const updatedBlankettSpieler = blankettSpieler.filter((bs) => bs.spieler_id !== spielerId)
      setBlankettSpieler(updatedBlankettSpieler)

      // Verfügbare Spieler aktualisieren
      const removedSpieler = teamSpieler.find((spieler) => spieler.id === spielerId)
      if (removedSpieler) {
        setAvailableSpieler([...availableSpieler, removedSpieler])
      }

      setSuccess("Spieler erfolgreich entfernt.")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Fehler beim Entfernen des Spielers:", error)
      setError(error.message)
    }
  }

  const handleSubmitBlankett = async () => {
    if (!blankett || !settings) return

    try {
      setIsSubmitting(true)

      // Prüfen, ob die Mindestanzahl an Spielern erreicht ist
      if (blankettSpieler.length < settings.min_spieler) {
        throw new Error(`Es müssen mindestens ${settings.min_spieler} Spieler im Blankett sein.`)
      }

      // Blankett einreichen
      const { error } = await supabase
        .from("blankett_entries")
        .update({
          status: "eingereicht",
          eingereicht_am: new Date().toISOString(),
        })
        .eq("id", blankett.id)

      if (error) throw error

      // Benachrichtigung senden
      try {
        await fetch("/api/notifications/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "blankett_submitted",
            blankett_id: blankett.id,
          }),
        })
      } catch (notificationError) {
        console.error("Fehler beim Senden der Benachrichtigung:", notificationError)
        // Wir werfen hier keinen Fehler, da die Benachrichtigung optional ist
      }

      // Blankett aktualisieren
      setBlankett({
        ...blankett,
        status: "eingereicht",
        eingereicht_am: new Date().toISOString(),
      })

      setSuccess("Blankett erfolgreich eingereicht.")
    } catch (error: any) {
      console.error("Fehler beim Einreichen des Blanketts:", error)
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
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

  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return "Unbekannt"
    const birthDate = new Date(birthDateString)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDifference = today.getMonth() - birthDate.getMonth()

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const getCountdownText = () => {
    if (!settings || !settings.countdown_aktiv || !settings.countdown_datum) {
      return null
    }

    const countdownDate = new Date(settings.countdown_datum)
    const now = new Date()

    if (now > countdownDate) {
      return "Die Frist für die Einreichung ist abgelaufen."
    }

    const diffTime = Math.abs(countdownDate.getTime() - now.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    return `Noch ${diffDays} Tage und ${diffHours} Stunden bis zur Frist am ${formatDate(settings.countdown_datum)}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "entwurf":
        return (
          <Badge variant="outline" className="bg-background/50">
            Entwurf
          </Badge>
        )
      case "eingereicht":
        return <Badge variant="secondary">Eingereicht</Badge>
      case "genehmigt":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" /> Genehmigt
          </Badge>
        )
      case "abgelehnt":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" /> Abgelehnt
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const canEditBlankett = () => {
    if (!blankett) return false
    return blankett.status === "entwurf" || blankett.status === "abgelehnt"
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!blankett || !team || !tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">Blankett nicht gefunden</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Das angeforderte Blankett existiert nicht oder wurde gelöscht.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href={`/teams/${params.id}`}>Zurück zum Team</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/teams/${team.id}/blankett`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Blankett-Übersicht
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Mannschaftsblankett</h1>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-muted-foreground">Status: {getStatusBadge(blankett.status)}</p>
              {blankett.eingereicht_am && (
                <p className="text-xs text-muted-foreground">Eingereicht am: {formatDate(blankett.eingereicht_am)}</p>
              )}
            </div>
          </div>
          {canEditBlankett() && (
            <Button
              onClick={handleSubmitBlankett}
              disabled={isSubmitting || (settings && blankettSpieler.length < settings.min_spieler)}
              className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
            >
              <Save className="mr-2 h-4 w-4" />
              Blankett einreichen
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl">Informationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Team</h3>
              <p className="text-base font-medium">{team.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Turnier</h3>
              <p className="text-base font-medium">{tournament.name}</p>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  {formatDate(tournament.start_datum)} - {formatDate(tournament.end_datum)}
                </span>
              </div>
            </div>
            {settings && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Blankett-Einstellungen</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded-md bg-secondary/20">
                    <span className="text-muted-foreground">Min. Spieler:</span> {settings.min_spieler}
                  </div>
                  <div className="p-2 rounded-md bg-secondary/20">
                    <span className="text-muted-foreground">Max. Spieler:</span> {settings.max_spieler}
                  </div>
                </div>
                {getCountdownText() && (
                  <div className="flex items-center p-2 rounded-md bg-secondary/20 text-sm mt-2">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    {getCountdownText()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Spielerliste</CardTitle>
              <CardDescription>
                {blankettSpieler.length} von {settings?.max_spieler || "unbegrenzt"} Spielern
                {settings && <span className="text-muted-foreground"> (min. {settings.min_spieler})</span>}
              </CardDescription>
            </div>
            {canEditBlankett() && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-secondary/30"
                    disabled={settings && blankettSpieler.length >= settings.max_spieler}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Spieler hinzufügen
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border border-border/50 backdrop-blur-sm sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Spieler zum Blankett hinzufügen</DialogTitle>
                    <DialogDescription>
                      Fügen Sie einen bestehenden Spieler hinzu oder erstellen Sie einen neuen Spieler.
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="existing">Bestehender Spieler</TabsTrigger>
                      <TabsTrigger value="new">Neuer Spieler</TabsTrigger>
                    </TabsList>

                    <TabsContent value="existing" className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Spieler</label>
                        <Select value={selectedSpielerId} onValueChange={setSelectedSpielerId}>
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Spieler auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSpieler.length === 0 ? (
                              <div className="p-2 text-center text-muted-foreground">Keine verfügbaren Spieler</div>
                            ) : (
                              availableSpieler.map((spieler) => (
                                <SelectItem key={spieler.id} value={spieler.id}>
                                  {`${spieler.vorname} ${spieler.nachname}`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Trikotnummer</label>
                        <Input
                          type="number"
                          min="1"
                          max="99"
                          value={trikotNummer}
                          onChange={(e) => setTrikotNummer(e.target.value)}
                          className="bg-background/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Position</label>
                        <Select value={position} onValueChange={setPosition}>
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Position auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Torwart">Torwart</SelectItem>
                            <SelectItem value="Verteidiger">Verteidiger</SelectItem>
                            <SelectItem value="Mittelfeld">Mittelfeld</SelectItem>
                            <SelectItem value="Stürmer">Stürmer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                          Abbrechen
                        </Button>
                        <Button onClick={handleAddSpieler} disabled={!selectedSpielerId || !trikotNummer || !position}>
                          Hinzufügen
                        </Button>
                      </DialogFooter>
                    </TabsContent>

                    <TabsContent value="new" className="space-y-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vorname">Vorname *</Label>
                          <Input
                            id="vorname"
                            name="vorname"
                            value={newSpielerData.vorname}
                            onChange={handleNewSpielerChange}
                            required
                            className="bg-background/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nachname">Nachname *</Label>
                          <Input
                            id="nachname"
                            name="nachname"
                            value={newSpielerData.nachname}
                            onChange={handleNewSpielerChange}
                            required
                            className="bg-background/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">E-Mail</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={newSpielerData.email}
                          onChange={handleNewSpielerChange}
                          className="bg-background/50"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="geburtsdatum">Geburtsdatum</Label>
                          <Input
                            id="geburtsdatum"
                            name="geburtsdatum"
                            type="date"
                            value={newSpielerData.geburtsdatum}
                            onChange={handleNewSpielerChange}
                            className="bg-background/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="telefonnummer">Telefonnummer</Label>
                          <Input
                            id="telefonnummer"
                            name="telefonnummer"
                            value={newSpielerData.telefonnummer}
                            onChange={handleNewSpielerChange}
                            className="bg-background/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Spielerfoto</Label>
                        <div className="flex flex-col items-center space-y-4 p-4 border-2 border-dashed border-border/50 rounded-lg bg-background/30">
                          {photoUrl ? (
                            <div className="relative w-32 h-32">
                              <Image
                                src={photoUrl || "/placeholder.svg"}
                                alt="Spielerfoto Vorschau"
                                fill
                                className="object-cover rounded-full"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={handleRemovePhoto}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center w-32 h-32 bg-muted/30 rounded-full">
                              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-xs text-muted-foreground text-center">Foto hochladen</p>
                            </div>
                          )}
                          <div className="flex items-center justify-center w-full">
                            <label
                              htmlFor="photo-upload"
                              className="flex items-center justify-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium bg-primary/10 hover:bg-primary/20 cursor-pointer"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {photoUrl ? "Foto ändern" : "Foto hochladen"}
                              <input
                                id="photo-upload"
                                name="photo"
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={handleFileChange}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-trikot">Trikotnummer *</Label>
                          <Input
                            id="new-trikot"
                            type="number"
                            min="1"
                            max="99"
                            value={trikotNummer}
                            onChange={(e) => setTrikotNummer(e.target.value)}
                            required
                            className="bg-background/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-position">Position *</Label>
                          <Select value={position} onValueChange={setPosition}>
                            <SelectTrigger id="new-position" className="bg-background/50">
                              <SelectValue placeholder="Position auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Torwart">Torwart</SelectItem>
                              <SelectItem value="Verteidiger">Verteidiger</SelectItem>
                              <SelectItem value="Mittelfeld">Mittelfeld</SelectItem>
                              <SelectItem value="Stürmer">Stürmer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                          Abbrechen
                        </Button>
                        <Button
                          onClick={handleCreateSpieler}
                          disabled={
                            isCreatingSpieler ||
                            !newSpielerData.vorname ||
                            !newSpielerData.nachname ||
                            !trikotNummer ||
                            !position
                          }
                        >
                          {isCreatingSpieler ? (
                            <>
                              <LoadingSpinner className="mr-2 h-4 w-4" />
                              Wird erstellt...
                            </>
                          ) : (
                            <>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Spieler erstellen
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {blankettSpieler.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium">Keine Spieler</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Diesem Blankett sind noch keine Spieler zugeordnet.
                </p>
                {canEditBlankett() && (
                  <Button variant="outline" className="mt-4" onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Spieler hinzufügen
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Spieler</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Trikotnummer</TableHead>
                      <TableHead>Alter</TableHead>
                      {canEditBlankett() && <TableHead className="w-[80px]">Aktionen</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blankettSpieler.map((bs) => (
                      <TableRow key={bs.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-primary/20">
                              <AvatarImage src={bs.spieler?.profilbild_url || ""} alt={bs.spieler?.vorname} />
                              <AvatarFallback className="bg-primary-900/50">{`${bs.spieler?.vorname.charAt(0)}${bs.spieler?.nachname.charAt(0)}`}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{`${bs.spieler?.vorname} ${bs.spieler?.nachname}`}</p>
                              <p className="text-xs text-muted-foreground">{bs.spieler?.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 mr-1 text-muted-foreground" />
                            {bs.position}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-background/50">
                            {bs.trikot_nummer}
                          </Badge>
                        </TableCell>
                        <TableCell>{bs.spieler?.geburtsdatum ? calculateAge(bs.spieler.geburtsdatum) : "-"}</TableCell>
                        {canEditBlankett() && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveSpieler(bs.spieler_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {settings && blankettSpieler.length < settings.min_spieler && canEditBlankett() && (
        <Alert className="bg-yellow-900/20 border-yellow-600/30 text-yellow-500 mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Hinweis</AlertTitle>
          <AlertDescription>
            Sie müssen mindestens {settings.min_spieler} Spieler hinzufügen, um das Blankett einreichen zu können.
            Aktuell haben Sie {blankettSpieler.length} Spieler hinzugefügt.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
