"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, Save, AlertCircle, MessageSquare, ExternalLink } from "lucide-react"

export default function TrainerTeamEditPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = getSupabaseClient()
  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [beschreibung, setBeschreibung] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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

        // Prüfen, ob der Benutzer der Trainer des Teams ist
        if (user?.rolle !== "Trainer" || user.id !== teamData.trainer_id) {
          router.push(`/teams/${params.id}`)
          return
        }

        setTeam(teamData)
        setName(teamData.name || "")
        setBeschreibung(teamData.beschreibung || "")
      } catch (error: any) {
        console.error("Fehler beim Laden des Teams:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTeam()
  }, [supabase, params.id, router, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("Bitte geben Sie einen Teamnamen ein.")
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Team aktualisieren
      const { error: updateError } = await supabase
        .from("teams")
        .update({
          name,
          beschreibung,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (updateError) throw updateError

      setSuccess("Team erfolgreich aktualisiert.")
      setTimeout(() => {
        router.push(`/teams/${params.id}`)
      }, 1500)
    } catch (error: any) {
      console.error("Fehler beim Aktualisieren des Teams:", error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/teams/${team.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Team
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Team bearbeiten</h1>
        <p className="text-muted-foreground mt-2">Aktualisieren Sie die Informationen Ihres Teams.</p>
      </div>

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

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Teaminformationen</CardTitle>
            <CardDescription>Grundlegende Informationen über Ihr Team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Teamname</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Teamname eingeben"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="beschreibung">Beschreibung</Label>
              <Textarea
                id="beschreibung"
                value={beschreibung}
                onChange={(e) => setBeschreibung(e.target.value)}
                placeholder="Kurze Beschreibung des Teams (optional)"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Team-Logo</Label>
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md">
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
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
                        <span className="text-gray-400">Kein Logo</span>
                      </div>
                    )}
                  </div>

                  <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
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
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Speichern
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
