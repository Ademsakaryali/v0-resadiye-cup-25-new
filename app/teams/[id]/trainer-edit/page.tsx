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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function TrainerEditTeamPage() {
  const params = useParams()
  const [formData, setFormData] = useState({
    name: "",
    beschreibung: "",
    logo_url: "",
  })
  const [originalData, setOriginalData] = useState({
    name: "",
    beschreibung: "",
    logo_url: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [pendingRequest, setPendingRequest] = useState<any | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        // Team abrufen
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("*")
          .eq("id", params.id)
          .single()

        if (teamError) throw teamError

        // Prüfen, ob der Benutzer berechtigt ist
        if (user?.rolle !== "Trainer" || user.id !== teamData.trainer_id) {
          router.push(`/teams/${params.id}`)
          return
        }

        setFormData({
          name: teamData.name || "",
          beschreibung: teamData.beschreibung || "",
          logo_url: teamData.logo_url || "",
        })

        setOriginalData({
          name: teamData.name || "",
          beschreibung: teamData.beschreibung || "",
          logo_url: teamData.logo_url || "",
        })

        // Prüfen, ob bereits eine Änderungsanfrage existiert
        const { data: requestData, error: requestError } = await supabase
          .from("team_change_requests")
          .select("*")
          .eq("team_id", params.id)
          .eq("trainer_id", user.id)
          .eq("status", "eingereicht")
          .maybeSingle()

        if (requestError) throw requestError

        if (requestData) {
          setPendingRequest(requestData)
          // Wenn es eine Änderungsanfrage gibt, zeige die beantragten Änderungen an
          setFormData({
            name: requestData.name || teamData.name || "",
            beschreibung: requestData.beschreibung || teamData.beschreibung || "",
            logo_url: requestData.logo_url || teamData.logo_url || "",
          })
        }
      } catch (error: any) {
        console.error("Fehler beim Laden des Teams:", error)
        setError(error.message)
        router.push(`/teams/${params.id}`)
      } finally {
        setInitialLoading(false)
      }
    }

    fetchTeam()
  }, [supabase, params.id, router, user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      // Prüfen, ob sich etwas geändert hat
      const hasChanges =
        formData.name !== originalData.name ||
        formData.beschreibung !== originalData.beschreibung ||
        formData.logo_url !== originalData.logo_url

      if (!hasChanges) {
        setError("Es wurden keine Änderungen vorgenommen.")
        setIsLoading(false)
        return
      }

      // Wenn bereits eine Änderungsanfrage existiert, aktualisiere diese
      if (pendingRequest) {
        const { error } = await supabase
          .from("team_change_requests")
          .update({
            name: formData.name !== originalData.name ? formData.name : null,
            beschreibung: formData.beschreibung !== originalData.beschreibung ? formData.beschreibung : null,
            logo_url: formData.logo_url !== originalData.logo_url ? formData.logo_url : null,
            eingereicht_am: new Date().toISOString(),
          })
          .eq("id", pendingRequest.id)

        if (error) throw error
      } else {
        // Sonst erstelle eine neue Änderungsanfrage
        const { error } = await supabase.from("team_change_requests").insert({
          team_id: params.id,
          trainer_id: user?.id,
          name: formData.name !== originalData.name ? formData.name : null,
          beschreibung: formData.beschreibung !== originalData.beschreibung ? formData.beschreibung : null,
          logo_url: formData.logo_url !== originalData.logo_url ? formData.logo_url : null,
          status: "eingereicht",
          eingereicht_am: new Date().toISOString(),
        })

        if (error) throw error
      }

      // Benachrichtigung senden
      try {
        await fetch("/api/notifications/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "team_change_requested",
            team_id: params.id,
            trainer_id: user?.id,
          }),
        })
      } catch (notificationError) {
        console.error("Fehler beim Senden der Benachrichtigung:", notificationError)
        // Wir werfen hier keinen Fehler, da die Benachrichtigung optional ist
      }

      setSuccess(
        "Deine Änderungen wurden erfolgreich eingereicht und werden von einem Administrator überprüft. Du wirst benachrichtigt, sobald deine Änderungen genehmigt oder abgelehnt wurden.",
      )

      // Aktualisiere die Seite nach 3 Sekunden
      setTimeout(() => {
        router.refresh()
      }, 3000)
    } catch (err: any) {
      console.error("Fehler beim Einreichen der Änderungen:", err)
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
    <RequireAuth allowedRoles={["Trainer"]}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/teams/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Team
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Team bearbeiten</h1>
          <p className="text-muted-foreground mt-2">
            Änderungen werden zur Genehmigung an einen Administrator gesendet.
          </p>
        </div>

        {pendingRequest && (
          <Alert className="mb-6 bg-blue-900/20 border-blue-600/30 text-blue-500">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ausstehende Änderungsanfrage</AlertTitle>
            <AlertDescription>
              Du hast bereits eine Änderungsanfrage eingereicht, die noch nicht bearbeitet wurde. Wenn du das Formular
              erneut absendest, wird deine bestehende Anfrage aktualisiert.
            </AlertDescription>
          </Alert>
        )}

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

        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Team-Informationen</CardTitle>
            <CardDescription>Bearbeite die Informationen deines Teams.</CardDescription>
          </CardHeader>
          <CardContent>
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
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    name="logo_url"
                    value={formData.logo_url}
                    onChange={handleChange}
                    className="bg-background/50"
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-muted-foreground">
                    Gib die URL zu einem Bild an, das als Logo für dein Team verwendet werden soll.
                  </p>
                </div>
              </div>
              <CardFooter className="px-0 pt-6">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="ml-auto bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                >
                  {isLoading ? "Wird eingereicht..." : "Änderungen einreichen"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  )
}
