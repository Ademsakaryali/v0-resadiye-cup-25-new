"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
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

export default function NewTournamentPage() {
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
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const supabase = getSupabaseClient()

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

    setIsLoading(true)

    try {
      const { error } = await supabase.from("tournaments").insert([
        {
          name: formData.name,
          beschreibung: formData.beschreibung || null,
          start_datum: formData.start_datum,
          end_datum: formData.end_datum,
          ort: formData.ort || null,
          logo_url: formData.logo_url || null,
          ist_aktiv: formData.ist_aktiv,
        },
      ])

      if (error) {
        throw error
      }

      router.push("/tournaments")
    } catch (err: any) {
      console.error("Fehler beim Erstellen des Turniers:", err)
      setError(err.message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: string) => {
    if (!date) return ""
    return format(new Date(date), "dd.MM.yyyy", { locale: de })
  }

  return (
    <RequireAuth allowedRoles={["Admin"]}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button asChild className="mb-4">
            <Link href="/tournaments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Turnierübersicht
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Neues Turnier erstellen</h1>
        </div>

        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Turnier-Informationen</CardTitle>
            <CardDescription>Geben Sie die Informationen für das neue Turnier ein.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4">
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
                  disabled={isLoading}
                  className="ml-auto bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Wird erstellt...
                    </>
                  ) : (
                    "Turnier erstellen"
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
