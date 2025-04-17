"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Tournament } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, ArrowLeft, Calendar } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function EditTournamentPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    beschreibung: "",
    start_datum: "",
    end_datum: "",
    ort: "",
    logo_url: "",
    ist_aktiv: true,
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const { data, error } = await supabase.from("tournaments").select("*").eq("id", params.id).single()

        if (error) {
          throw error
        }

        if (!data) {
          throw new Error("Turnier nicht gefunden")
        }

        setTournament(data as Tournament)
        setFormData({
          name: data.name,
          beschreibung: data.beschreibung || "",
          start_datum: data.start_datum,
          end_datum: data.end_datum,
          ort: data.ort || "",
          logo_url: data.logo_url || "",
          ist_aktiv: data.ist_aktiv,
        })
      } catch (error: any) {
        console.error("Fehler beim Laden des Turniers:", error)
        setError(error.message || "Ein Fehler ist aufgetreten beim Laden des Turniers.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTournament()
  }, [params.id, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (name: string, date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, [name]: date.toISOString() }))
    }
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const validateDates = () => {
    if (!formData.start_datum || !formData.end_datum) {
      setError("Bitte geben Sie ein Start- und Enddatum an.")
      return false
    }

    const startDate = new Date(formData.start_datum)
    const endDate = new Date(formData.end_datum)

    if (endDate < startDate) {
      setError("Das Enddatum kann nicht vor dem Startdatum liegen.")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateDates()) {
      return
    }

    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("tournaments")
        .update({
          name: formData.name,
          beschreibung: formData.beschreibung || null,
          start_datum: formData.start_datum,
          end_datum: formData.end_datum,
          ort: formData.ort || null,
          logo_url: formData.logo_url || null,
          ist_aktiv: formData.ist_aktiv,
        })
        .eq("id", params.id)

      if (error) {
        throw error
      }

      router.push(`/tournaments/${params.id}`)
    } catch (err: any) {
      console.error("Fehler beim Aktualisieren des Turniers:", err)
      setError(err.message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.")
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (date: string) => {
    if (!date) return ""
    return format(new Date(date), "dd.MM.yyyy", { locale: de })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error && !tournament) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/tournaments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Turnierübersicht
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <RequireAuth allowedRoles={["Admin"]}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/tournaments/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Turnier
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Turnier bearbeiten</h1>
        </div>

        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Turnier-Informationen</CardTitle>
            <CardDescription>Bearbeiten Sie die Informationen für das Turnier.</CardDescription>
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
                  <Label htmlFor="name">Turniername *</Label>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_datum">Startdatum *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            !formData.start_datum && "text-muted-foreground"
                          }`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.start_datum ? formatDate(formData.start_datum) : "Datum auswählen"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData.start_datum ? new Date(formData.start_datum) : undefined}
                          onSelect={(date) => handleDateChange("start_datum", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_datum">Enddatum *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            !formData.end_datum && "text-muted-foreground"
                          }`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.end_datum ? formatDate(formData.end_datum) : "Datum auswählen"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData.end_datum ? new Date(formData.end_datum) : undefined}
                          onSelect={(date) => handleDateChange("end_datum", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ort">Ort</Label>
                  <Input
                    id="ort"
                    name="ort"
                    value={formData.ort}
                    onChange={handleChange}
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL (optional)</Label>
                  <Input
                    id="logo_url"
                    name="logo_url"
                    value={formData.logo_url}
                    onChange={handleChange}
                    placeholder="https://example.com/logo.png"
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Geben Sie die URL zu einem bereits hochgeladenen Bild ein.
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="ist_aktiv"
                    checked={formData.ist_aktiv}
                    onCheckedChange={(checked) => handleCheckboxChange("ist_aktiv", checked as boolean)}
                  />
                  <Label htmlFor="ist_aktiv">Turnier ist aktiv</Label>
                </div>
              </div>
              <CardFooter className="px-0 pt-6">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="ml-auto bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Wird gespeichert...
                    </>
                  ) : (
                    "Änderungen speichern"
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
