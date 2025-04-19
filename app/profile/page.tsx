"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { UserCircle, Mail, Phone } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (!loading) {
      setIsLoading(false)
    }
  }, [user, loading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const getInitials = () => {
    return `${user?.vorname.charAt(0)}${user?.nachname.charAt(0)}`
  }

  const getRoleBadgeColor = (rolle: string) => {
    switch (rolle) {
      case "Admin":
        return "bg-red-500 hover:bg-red-600"
      case "Trainer":
        return "bg-blue-500 hover:bg-blue-600"
      case "Spieler":
        return "bg-green-500 hover:bg-green-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  return (
    <div className="container max-w-3xl py-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">Mein Profil</CardTitle>
          <CardDescription>Ihre persönlichen Informationen und Einstellungen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.profilbild_url || ""} alt={user?.vorname} />
                <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
              </Avatar>
              <Badge className={getRoleBadgeColor(user?.rolle || "")}>{user?.rolle}</Badge>
              <Button variant="outline" size="sm" className="mt-2">
                Profilbild ändern
              </Button>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-medium">
                  {user?.vorname} {user?.nachname}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Mitglied seit {new Date(user?.created_at || "").toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user?.email}</span>
                </div>
                {user?.telefon && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user?.telefon}</span>
                  </div>
                )}
                {user?.team_id && (
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                    <span>Team ID: {user?.team_id}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 flex flex-wrap gap-2">
                <Button variant="outline">Passwort ändern</Button>
                <Button variant="outline">Profil bearbeiten</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
