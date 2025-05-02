"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/context/auth-context"
import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, ArrowLeft, Search, Plus, LinkIcon, Info } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function EditTeamPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    beschreibung: "",
    trainer_id: "",
    ist_aktiv: true,
    logo_url: "", // Geändert zu logo_url
  })
  const [trainers, setTrainers] = useState<
    Array<{ id: string; vorname: string; nachname: string; rolle: string; team?: string }>
  >([])
  const [filteredTrainers, setFilteredTrainers] = useState<
    Array<{ id: string; vorname: string; nachname: string; rolle: string; team?: string }>
  >([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showAllUsers, setShowAllUsers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showNewTrainerDialog, setShowNewTrainerDialog] = useState(false)
  const [newTrainerData, setNewTrainerData] = useState({
    email: "",
    vorname: "",
    nachname: "",
    telefonnummer: "",
    password: "",
  })
  const [newTrainerError, setNewTrainerError] = useState<string | null>(null)
  const [isCreatingTrainer, setIsCreatingTrainer] = useState(false)
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data, error } = await supabase.from("teams").select("*").eq("id", params.id).single()

        if (error) {
          throw error
        }

        setFormData({
          name: data.name || "",
          beschreibung: data.beschreibung || "",
          trainer_id: data.trainer_id || "",
          ist_aktiv: data.ist_aktiv,
          logo_url: data.logo_url || "",
        })
      } catch (error) {
        console.error("Fehler beim Laden des Teams:", error)
        router.push("/teams")
      }
    }

    const fetchTrainers = async () => {
      try {
        // Trainer mit Team-Informationen abrufen
        const query = supabase.from("users").select("id, vorname, nachname, rolle").eq("ist_aktiv", true)

        if (!showAllUsers) {
          query.eq("rolle", "Trainer")
        }

        const { data: usersData, error: usersError } = await query.order("nachname", { ascending: true })

        if (usersError) {
          throw usersError
        }

        // Teams für die Trainer abrufen
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("id, name, trainer_id")
          .not("trainer_id", "is", null)

        if (teamsError) {
          throw teamsError
        }

        // Trainer mit Team-Informationen anreichern
        const trainersWithTeams = usersData.map((trainer) => {
          const team = teamsData.find((team) => team.trainer_id === trainer.id)
          return {
            ...trainer,
            team: team ? team.name : undefined,
          }
        })

        setTrainers(trainersWithTeams || [])
        setFilteredTrainers(trainersWithTeams || [])
      } catch (error) {
        console.error("Fehler beim Laden der Trainer:", error)
      } finally {
        setInitialLoading(false)
      }
    }

    fetchTeam()
    fetchTrainers()
  }, [supabase, params.id, router, showAllUsers])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTrainers(trainers)
    } else {
      const filtered = trainers.filter(
        (trainer) =>
          trainer.vorname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trainer.nachname.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredTrainers(filtered)
    }
  }, [searchQuery, trainers])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value === "none" ? "" : value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleNewTrainerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewTrainerData((prev) => ({ ...prev, [name]: value }))
  }

  // Hilfsfunktion zur Validierung von URLs
  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  const handleCreateTrainer = async () => {
    setNewTrainerError(null)
    setIsCreatingTrainer(true)

    try {
      // Validierung
      if (!newTrainerData.email || !newTrainerData.vorname || !newTrainerData.nachname || !newTrainerData.password) {
        throw new Error("Bitte füllen Sie alle Pflichtfelder aus.")
      }

      // Prüfen, ob die E-Mail bereits existiert
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("email", newTrainerData.email)
        .maybeSingle()

      if (checkError) throw checkError
      if (existingUser) throw new Error("Diese E-Mail-Adresse wird bereits verwendet.")

      // Benutzer erstellen
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newTrainerData.email,
        password: newTrainerData.password,
      })

      if (authError) throw authError

      // Benutzerdaten in der users-Tabelle speichern
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert([
          {
            id: authData.user?.id,
            email: newTrainerData.email,
            vorname: newTrainerData.vorname,
            nachname: newTrainerData.nachname,
            telefonnummer: newTrainerData.telefonnummer || null,
            rolle: "Trainer",
            ist_aktiv: true,
          },
        ])
        .select()

      if (userError) throw userError

      // Trainer zur Liste hinzufügen und auswählen
      const newTrainer = {
        id: authData.user?.id || "",
        vorname: newTrainerData.vorname,
        nachname: newTrainerData.nachname,
        rolle: "Trainer",
      }

      setTrainers([...trainers, newTrainer])
      setFilteredTrainers([...filteredTrainers, newTrainer])
      setFormData((prev) => ({ ...prev, trainer_id: newTrainer.id }))

      // Dialog schließen und Formular zurücksetzen
      setShowNewTrainerDialog(false)
      setNewTrainerData({
        email: "",
        vorname: "",
        nachname: "",
        telefonnummer: "",
        password: "",
      })
    } catch (err: any) {
      console.error("Fehler beim Erstellen des Trainers:", err)
      setNewTrainerError(err.message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.")
    } finally {
      setIsCreatingTrainer(false)
    }
  }

  const [teamName, setTeamName] = useState("FC Bayern München")
  const [trainer, setTrainer] = useState("1")
  const [description, setDescription] = useState("Deutscher Rekordmeister")
  const [logoUrl, setLogoUrl] = useState("/fc-bayern-munchen-stadium.png")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Validierung
      if (!formData.name.trim()) {
        throw new Error("Bitte geben Sie einen Teamnamen ein.")
      }

      // Logo-URL validieren, falls vorhanden
      if (formData.logo_url && !isValidUrl(formData.logo_url)) {
        throw new Error("Bitte geben Sie eine gültige URL für das Logo ein.")
      }

      const { error } = await supabase
        .from("teams")
        .update({
          name: formData.name,
          beschreibung: formData.beschreibung || null,
          trainer_id: formData.trainer_id || null,
          logo_url: formData.logo_url || null,
          ist_aktiv: formData.ist_aktiv,
        })
        .eq("id", params.id)

      if (error) {
        throw error
      }

      router.push(`/teams/${params.id}`)
    } catch (err: any) {
      console.error("Fehler beim Aktualisieren des Teams:", err)
      setError(err.message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.")
    } finally {
      setIsLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <RequireAuth allowedRoles={["Admin"]}>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 mb-4" asChild>
            <Link href={`/teams/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Team
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mb-6">Team bearbeiten</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit}>
              <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Team-Informationen</CardTitle>
                  <CardDescription>Bearbeiten Sie die Informationen des Teams.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert className="mb-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Teamname *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="bg-background/50"
                          placeholder="Teamname eingeben"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="beschreibung">Beschreibung</Label>
                        <Textarea
                          id="beschreibung"
                          name="beschreibung"
                          value={formData.beschreibung}
                          onChange={handleChange}
                          rows={4}
                          className="bg-background/50"
                          placeholder="Beschreibung eingeben"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="logo_url">Team-Logo URL</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <LinkIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="logo_url"
                              name="logo_url"
                              value={formData.logo_url}
                              onChange={handleChange}
                              placeholder="https://example.com/logo.png"
                              className="pl-8 bg-background/50"
                            />
                          </div>
                        </div>
                        {formData.logo_url && isValidUrl(formData.logo_url) && (
                          <div className="mt-2 flex justify-center">
                            <div className="relative w-40 h-40 border rounded-md overflow-hidden">
                              <Image
                                src={formData.logo_url || "/placeholder.svg"}
                                alt="Team-Logo Vorschau"
                                fill
                                className="object-contain"
                                onError={() => {
                                  setError("Das Bild konnte nicht geladen werden. Bitte überprüfen Sie die URL.")
                                }}
                              />
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Geben Sie die URL eines Bildes ein (z.B. https://example.com/logo.png)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="trainer_id">Trainer</Label>
                          <div className="flex items-center space-x-2">
                            <Switch id="show-all-users" checked={showAllUsers} onCheckedChange={setShowAllUsers} />
                            <Label htmlFor="show-all-users" className="text-xs">
                              Alle Benutzer anzeigen
                            </Label>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Trainer suchen..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-8 bg-background/50"
                            />
                          </div>
                          <Dialog open={showNewTrainerDialog} onOpenChange={setShowNewTrainerDialog}>
                            <DialogTrigger asChild>
                              <Button className="border bg-background hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0">
                                <Plus className="h-4 w-4 mr-2" />
                                Neu
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Neuen Trainer erstellen</DialogTitle>
                                <DialogDescription>
                                  Füllen Sie das Formular aus, um einen neuen Trainer zu erstellen.
                                </DialogDescription>
                              </DialogHeader>
                              {newTrainerError && (
                                <Alert className="mt-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertDescription>{newTrainerError}</AlertDescription>
                                </Alert>
                              )}
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="vorname">Vorname *</Label>
                                    <Input
                                      id="vorname"
                                      name="vorname"
                                      value={newTrainerData.vorname}
                                      onChange={handleNewTrainerChange}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="nachname">Nachname *</Label>
                                    <Input
                                      id="nachname"
                                      name="nachname"
                                      value={newTrainerData.nachname}
                                      onChange={handleNewTrainerChange}
                                      required
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="email">E-Mail *</Label>
                                  <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={newTrainerData.email}
                                    onChange={handleNewTrainerChange}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="telefonnummer">Telefonnummer</Label>
                                  <Input
                                    id="telefonnummer"
                                    name="telefonnummer"
                                    value={newTrainerData.telefonnummer}
                                    onChange={handleNewTrainerChange}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="password">Passwort *</Label>
                                  <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={newTrainerData.password}
                                    onChange={handleNewTrainerChange}
                                    required
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  className="border bg-background hover:bg-gray-100 dark:hover:bg-gray-800"
                                  onClick={() => setShowNewTrainerDialog(false)}
                                >
                                  Abbrechen
                                </Button>
                                <Button type="button" onClick={handleCreateTrainer} disabled={isCreatingTrainer}>
                                  {isCreatingTrainer ? (
                                    <>
                                      <LoadingSpinner className="mr-2" />
                                      Wird erstellt...
                                    </>
                                  ) : (
                                    "Trainer erstellen"
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>

                        <div
                          className="mt-2 border rounded-md divide-y"
                          style={{ maxHeight: "300px", overflowY: "auto" }}
                        >
                          <div
                            className={`flex items-center p-3 cursor-pointer hover:bg-muted/30 ${
                              formData.trainer_id === "" ? "bg-primary/10" : ""
                            }`}
                            onClick={() => handleSelectChange("trainer_id", "none")}
                          >
                            <div className="flex-1">
                              <div className="font-medium">Kein Trainer</div>
                            </div>
                            <div className="flex items-center justify-center w-5 h-5 rounded-full border border-primary">
                              {formData.trainer_id === "" && <div className="w-3 h-3 rounded-full bg-primary" />}
                            </div>
                          </div>
                          {filteredTrainers.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">Keine Trainer gefunden</div>
                          ) : (
                            filteredTrainers.map((trainer) => (
                              <div
                                key={trainer.id}
                                className={`flex items-center p-3 cursor-pointer hover:bg-muted/30 ${
                                  formData.trainer_id === trainer.id ? "bg-primary/10" : ""
                                }`}
                                onClick={() => handleSelectChange("trainer_id", trainer.id)}
                              >
                                <div className="flex items-center flex-1">
                                  <Avatar className="h-8 w-8 mr-3">
                                    <AvatarFallback className="bg-primary-700 text-white">
                                      {`${trainer.vorname.charAt(0)}${trainer.nachname.charAt(0)}`}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{`${trainer.vorname} ${trainer.nachname}`}</div>
                                    <div className="text-xs text-muted-foreground flex items-center">
                                      {showAllUsers && trainer.rolle !== "Trainer" && (
                                        <span className="mr-2">Rolle: {trainer.rolle}</span>
                                      )}
                                      {trainer.team && (
                                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                          Team: {trainer.team}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-center w-5 h-5 rounded-full border border-primary">
                                  {formData.trainer_id === trainer.id && (
                                    <div className="w-3 h-3 rounded-full bg-primary" />
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="ist_aktiv"
                          checked={formData.ist_aktiv}
                          onCheckedChange={(checked) => handleCheckboxChange("ist_aktiv", checked as boolean)}
                        />
                        <Label htmlFor="ist_aktiv">Team ist aktiv</Label>
                      </div>
                    </div>
                    <CardFooter className="px-0 pt-6">
                      <Button
                        className="border bg-background hover:bg-gray-100 dark:hover:bg-gray-800"
                        type="button"
                        onClick={() => router.back()}
                      >
                        Abbrechen
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="ml-auto bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                      >
                        {isLoading ? (
                          <>
                            <LoadingSpinner className="mr-2" />
                            Wird aktualisiert...
                          </>
                        ) : (
                          "Team aktualisieren"
                        )}
                      </Button>
                    </CardFooter>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Team-Logo</CardTitle>
                <CardDescription>Aktuelles Logo des Teams</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Avatar className="h-40 w-40">
                  <AvatarImage src={formData.logo_url || "/placeholder.svg"} alt={formData.name} />
                  <AvatarFallback>{formData.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </CardContent>
            </Card>

            <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 mt-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Logo-Aktualisierung</AlertTitle>
              <AlertDescription>
                Um das Logo zu aktualisieren, geben Sie die URL zu einem neuen Bild ein. Das Bild sollte quadratisch
                sein und eine Mindestgröße von 200x200 Pixeln haben.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
