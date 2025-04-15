"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/context/auth-context"
import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function EditTeamPage() {
  const params = useParams()
  const [formData, setFormData] = useState({
    name: "",
    beschreibung: "",
    trainer_id: "",
    ist_aktiv: true,
  })
  const [trainers, setTrainers] = useState<Array<{ id: string; vorname: string; nachname: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const router = useRouter()
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
        })
      } catch (error) {
        console.error("Fehler beim Laden des Teams:", error)
        router.push("/teams")
      }
    }

    const fetchTrainers = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, vorname, nachname")
          .eq("rolle", "Trainer")
          .order("nachname", { ascending: true })

        if (error) {
          throw error
        }

        setTrainers(data || [])
      } catch (error) {
        console.error("Fehler beim Laden der Trainer:", error)
      } finally {
        setInitialLoading(false)
      }
    }

    fetchTeam()
    fetchTrainers()
  }, [supabase, params.id, router])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("teams")
        .update({
          name: formData.name,
          beschreibung: formData.beschreibung || null,
          trainer_id: formData.trainer_id || null,
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <RequireAuth allowedRoles={["Admin"]}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/teams/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Team
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Team bearbeiten</h1>
        </div>

        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Team-Informationen</CardTitle>
            <CardDescription>Bearbeiten Sie die Informationen des Teams.</CardDescription>
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
                  <Label htmlFor="trainer_id">Trainer</Label>
                  <Select
                    value={formData.trainer_id}
                    onValueChange={(value) => handleSelectChange("trainer_id", value)}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Trainer auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kein Trainer</SelectItem>
                      {trainers.map((trainer) => (
                        <SelectItem key={trainer.id} value={trainer.id}>
                          {`${trainer.vorname} ${trainer.nachname}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  {isLoading ? "Wird aktualisiert..." : "Team aktualisieren"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  )
}
