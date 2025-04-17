"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ProfileImageUpload } from "@/components/users/profile-image-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { User } from "@/lib/types"

export default function EditUserPage({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState<Partial<User>>({
    email: "",
    vorname: "",
    nachname: "",
    rolle: "",
    geburtsdatum: "",
    telefonnummer: "",
    profilbild_url: "",
    ist_aktiv: true,
  })
  const [originalData, setOriginalData] = useState<Partial<User>>({})
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [changePassword, setChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.from("users").select("*").eq("id", params.id).single()

        if (error) {
          throw error
        }

        if (!data) {
          throw new Error("Benutzer nicht gefunden")
        }

        setFormData(data)
        setOriginalData(data)
      } catch (error: any) {
        console.error("Fehler beim Laden des Benutzers:", error)
        setError(error.message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [params.id, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, profilbild_url: url }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      const updateData: any = {
        email: formData.email,
        vorname: formData.vorname,
        nachname: formData.nachname,
        rolle: formData.rolle,
        geburtsdatum: formData.geburtsdatum || null,
        telefonnummer: formData.telefonnummer || null,
        profilbild_url: formData.profilbild_url || null,
        ist_aktiv: formData.ist_aktiv,
      }

      if (changePassword && newPassword) {
        updateData.password_hash = newPassword // In einer echten Anwendung würde das Passwort gehasht werden
      }

      const { error: updateError } = await supabase.from("users").update(updateData).eq("id", params.id)

      if (updateError) {
        throw updateError
      }

      router.push("/users")
    } catch (err: any) {
      console.error("Fehler beim Aktualisieren des Benutzers:", err)
      setError(err.message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <RequireAuth allowedRoles={["Admin"]}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Benutzerliste
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Benutzer bearbeiten</h1>
          <p className="text-muted-foreground mt-1">
            {formData.vorname} {formData.nachname}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Benutzerinformationen</CardTitle>
            <CardDescription>Bearbeiten Sie die Informationen des Benutzers.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Grunddaten</TabsTrigger>
                  <TabsTrigger value="profile">Profil</TabsTrigger>
                </TabsList>
                <TabsContent value="basic" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="vorname">Vorname *</Label>
                      <Input
                        id="vorname"
                        name="vorname"
                        value={formData.vorname || ""}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nachname">Nachname *</Label>
                      <Input
                        id="nachname"
                        name="nachname"
                        value={formData.nachname || ""}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rolle">Rolle *</Label>
                      <Select
                        value={formData.rolle || ""}
                        onValueChange={(value) => handleSelectChange("rolle", value)}
                        required
                      >
                        <SelectTrigger id="rolle">
                          <SelectValue placeholder="Rolle auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Trainer">Trainer</SelectItem>
                          <SelectItem value="Spieler">Spieler</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center space-x-2 mb-4">
                        <Checkbox
                          id="change_password"
                          checked={changePassword}
                          onCheckedChange={(checked) => setChangePassword(checked as boolean)}
                        />
                        <Label htmlFor="change_password">Passwort ändern</Label>
                      </div>
                      {changePassword && (
                        <div className="space-y-2">
                          <Label htmlFor="new_password">Neues Passwort</Label>
                          <Input
                            id="new_password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required={changePassword}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="ist_aktiv"
                        checked={formData.ist_aktiv}
                        onCheckedChange={(checked) => handleCheckboxChange("ist_aktiv", checked as boolean)}
                      />
                      <Label htmlFor="ist_aktiv">Benutzer ist aktiv</Label>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="profile" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <ProfileImageUpload
                        initialImageUrl={formData.profilbild_url || ""}
                        onImageUpload={handleImageUpload}
                        className="mb-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="geburtsdatum">Geburtsdatum</Label>
                      <Input
                        id="geburtsdatum"
                        name="geburtsdatum"
                        type="date"
                        value={formData.geburtsdatum || ""}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefonnummer">Telefonnummer</Label>
                      <Input
                        id="telefonnummer"
                        name="telefonnummer"
                        value={formData.telefonnummer || ""}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <CardFooter className="px-0 pt-6">
                <Button variant="outline" asChild className="mr-auto">
                  <Link href="/users">Abbrechen</Link>
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Wird gespeichert..." : "Änderungen speichern"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  )
}
