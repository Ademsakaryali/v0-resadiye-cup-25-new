"use client"

import { AvatarFallback } from "@/components/ui/avatar"

import { AvatarImage } from "@/components/ui/avatar"

import { Avatar } from "@/components/ui/avatar"

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
import { AlertCircle, ArrowLeft, Search, Plus, LinkIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
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

export default function NewTeamPage() {
  const [formData, setFormData] = useState({
    name: "",
    beschreibung: "",
    trainer_id: "",
    ist_aktiv: true,
    logo_url: "", // Geändert von logoFile zu logo_url
  })
  const [trainers, setTrainers] = useState<
    Array<{ id: string; vorname: string; nachname: string; rolle: string; team?: string; profile_image_url?: string }>
  >([])
  const [filteredTrainers, setFilteredTrainers] = useState<
    Array<{ id: string; vorname: string; nachname: string; rolle: string; team?: string; profile_image_url?: string }>
  >([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showAllUsers, setShowAllUsers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
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
  const router = useRouter()
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        // Trainer mit Team-Informationen abrufen
        const query = supabase
          .from("users")
          .select("id, vorname, nachname, rolle, profile_image_url")
          .eq("ist_aktiv", true)

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
      }
    }

    fetchTrainers()
  }, [supabase, showAllUsers])

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
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleNewTrainerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewTrainerData((prev) => ({ ...prev, [name]: value }))
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

      const { error } = await supabase.from("teams").insert([
        {
          name: formData.name,
          beschreibung: formData.beschreibung || null,
          trainer_id: formData.trainer_id || null,
          logo_url: formData.logo_url || null,
          ist_aktiv: formData.ist_aktiv,
        },
      ])

      if (error) {
        throw error
      }

      router.push("/teams")
    } catch (err: any) {
      console.error("Fehler beim Erstellen des Teams:", err)
      setError(err.message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.")
    } finally {
      setIsLoading(false)
    }
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

  return (
    <RequireAuth allowedRoles={["Admin"]}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/teams">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Teamübersicht
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Neues Team erstellen</h1>
        </div>

        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Team-Informationen</CardTitle>
            <CardDescription>Geben Sie die Informationen für das neue Team ein.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
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
                        <Button variant="outline" className="shrink-0">
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
                          <Alert variant="destructive" className="mt-4">
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
                          <Button type="button" variant="outline" onClick={() => setShowNewTrainerDialog(false)}>
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
                    className="mt-2 border rounded-md divide-y trainer-scrollbar"
                    style={{ maxHeight: "300px", overflowY: "auto" }}
                  >
                    {filteredTrainers.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">Keine Trainer gefunden</div>
                    ) : (
                      filteredTrainers.slice(0, 5).map((trainer) => (
                        <div
                          key={trainer.id}
                          className={`flex items-center p-3 cursor-pointer hover:bg-muted/30 ${
                            formData.trainer_id === trainer.id ? "bg-primary/10" : ""
                          }`}
                          onClick={() => handleSelectChange("trainer_id", trainer.id)}
                        >
                          <div className="flex items-center flex-1">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarImage
                                src={trainer.profile_image_url || undefined}
                                alt={`${trainer.vorname} ${trainer.nachname}`}
                              />
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
                            {formData.trainer_id === trainer.id && <div className="w-3 h-3 rounded-full bg-primary" />}
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
                  type="submit"
                  disabled={isLoading}
                  className="ml-auto bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Wird erstellt...
                    </>
                  ) : (
                    "Team erstellen"
                  )}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  )
}
