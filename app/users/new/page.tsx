"use client"

import type React from "react"

import { useState } from "react"
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
import { ProfileImageUpload } from "@/components/users/profile-image-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function NewUserPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    vorname: "",
    nachname: "",
    rolle: "",
    geburtsdatum: "",
    telefonnummer: "",
    profilbild_url: "",
    ist_aktiv: true,
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

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
    setIsLoading(true)

    try {
      // Direkt in die users-Tabelle einfügen
      const { error: userError } = await supabase.from("users").insert([
        {
          email: formData.email,
          password_hash: formData.password, // In einer echten Anwendung würde das Passwort gehasht werden
          vorname: formData.vorname,
          nachname: formData.nachname,
          rolle: formData.rolle,
          geburtsdatum: formData.geburtsdatum || null,
          telefonnummer: formData.telefonnummer || null,
          profilbild_url: formData.profilbild_url || null,
          ist_aktiv: formData.ist_aktiv,
        },
      ])

      if (userError) {
        throw userError
      }

      router.push("/users")
    } catch (err: any) {
      console.error("Fehler beim Erstellen des Benutzers:", err)
      setError(err.message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <RequireAuth allowedRoles={["Admin"]}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button className="hover:bg-accent hover:text-accent-foreground mb-4" asChild>
            <Link href="/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Benutzerliste
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Neuen Benutzer anlegen</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Benutzerinformationen</CardTitle>
            <CardDescription>Geben Sie die Informationen für den neuen Benutzer ein.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="bg-destructive/15 text-destructive border-destructive/20 mb-4">
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
                      <Input id="vorname" name="vorname" value={formData.vorname} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nachname">Nachname *</Label>
                      <Input id="nachname" name="nachname" value={formData.nachname} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Passwort *</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rolle">Rolle *</Label>
                      <Select
                        value={formData.rolle}
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
                    <div className="flex items-center space-x-2 pt-6">
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
                        initialImageUrl={formData.profilbild_url}
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
                        value={formData.geburtsdatum}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefonnummer">Telefonnummer</Label>
                      <Input
                        id="telefonnummer"
                        name="telefonnummer"
                        value={formData.telefonnummer}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <CardFooter className="px-0 pt-6">
                <Button type="submit" disabled={isLoading} className="ml-auto">
                  {isLoading ? "Wird erstellt..." : "Benutzer erstellen"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  )
}
