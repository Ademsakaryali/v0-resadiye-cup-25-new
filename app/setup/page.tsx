"use client"

import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseClient()

  const handleCreateTestData = async () => {
    setIsLoading(true)
    setSuccess(null)
    setError(null)

    try {
      // Admin-Benutzer erstellen
      const { error: adminError } = await supabase.from("users").insert([
        {
          email: "admin@example.com",
          password_hash: "admin123",
          vorname: "Admin",
          nachname: "Benutzer",
          rolle: "Admin",
          geburtsdatum: "1980-01-01",
          telefonnummer: "+49123456789",
          ist_aktiv: true,
        },
      ])

      if (adminError) throw adminError

      // Trainer erstellen
      const { error: trainer1Error } = await supabase.from("users").insert([
        {
          email: "trainer1@example.com",
          password_hash: "trainer123",
          vorname: "Thomas",
          nachname: "Müller",
          rolle: "Trainer",
          geburtsdatum: "1985-05-15",
          telefonnummer: "+49123456790",
          ist_aktiv: true,
        },
      ])

      if (trainer1Error) throw trainer1Error

      const { error: trainer2Error } = await supabase.from("users").insert([
        {
          email: "trainer2@example.com",
          password_hash: "trainer123",
          vorname: "Julia",
          nachname: "Schmidt",
          rolle: "Trainer",
          geburtsdatum: "1988-08-20",
          telefonnummer: "+49123456791",
          ist_aktiv: true,
        },
      ])

      if (trainer2Error) throw trainer2Error

      // Spieler erstellen
      const { error: spielerError } = await supabase.from("users").insert([
        {
          email: "spieler1@example.com",
          password_hash: "spieler123",
          vorname: "Max",
          nachname: "Mustermann",
          rolle: "Spieler",
          geburtsdatum: "1995-03-10",
          telefonnummer: "+49123456792",
          ist_aktiv: true,
        },
        {
          email: "spieler2@example.com",
          password_hash: "spieler123",
          vorname: "Lisa",
          nachname: "Weber",
          rolle: "Spieler",
          geburtsdatum: "1997-07-22",
          telefonnummer: "+49123456793",
          ist_aktiv: true,
        },
        {
          email: "spieler3@example.com",
          password_hash: "spieler123",
          vorname: "Kevin",
          nachname: "Fischer",
          rolle: "Spieler",
          geburtsdatum: "1996-11-05",
          telefonnummer: "+49123456794",
          ist_aktiv: true,
        },
        {
          email: "spieler4@example.com",
          password_hash: "spieler123",
          vorname: "Sarah",
          nachname: "Becker",
          rolle: "Spieler",
          geburtsdatum: "1998-02-15",
          telefonnummer: "+49123456795",
          ist_aktiv: true,
        },
      ])

      if (spielerError) throw spielerError

      // Trainer-IDs abrufen
      const { data: trainers, error: trainerFetchError } = await supabase
        .from("users")
        .select("id")
        .in("email", ["trainer1@example.com", "trainer2@example.com"])

      if (trainerFetchError) throw trainerFetchError

      // Teams erstellen
      const { error: teamsError } = await supabase.from("teams").insert([
        {
          name: "FC Adler",
          beschreibung: "Ein starkes Team aus der Region",
          trainer_id: trainers[0].id,
          ist_aktiv: true,
        },
        {
          name: "SV Löwen",
          beschreibung: "Traditionsreicher Verein mit vielen Erfolgen",
          trainer_id: trainers[1].id,
          ist_aktiv: true,
        },
      ])

      if (teamsError) throw teamsError

      // Team-IDs abrufen
      const { data: teams, error: teamsFetchError } = await supabase
        .from("teams")
        .select("id")
        .in("name", ["FC Adler", "SV Löwen"])

      if (teamsFetchError) throw teamsFetchError

      // Spieler-IDs abrufen
      const { data: spieler, error: spielerFetchError } = await supabase
        .from("users")
        .select("id")
        .in("email", ["spieler1@example.com", "spieler2@example.com", "spieler3@example.com", "spieler4@example.com"])

      if (spielerFetchError) throw spielerFetchError

      // Spieler zu Teams zuordnen
      const { error: teamSpielerError } = await supabase.from("team_spieler").insert([
        {
          team_id: teams[0].id,
          spieler_id: spieler[0].id,
          trikot_nummer: 10,
          position: "Stürmer",
        },
        {
          team_id: teams[0].id,
          spieler_id: spieler[1].id,
          trikot_nummer: 7,
          position: "Mittelfeld",
        },
        {
          team_id: teams[1].id,
          spieler_id: spieler[2].id,
          trikot_nummer: 5,
          position: "Verteidiger",
        },
        {
          team_id: teams[1].id,
          spieler_id: spieler[3].id,
          trikot_nummer: 9,
          position: "Stürmer",
        },
      ])

      if (teamSpielerError) throw teamSpielerError

      // Turniere erstellen
      const { error: tournamentError } = await supabase.from("tournaments").insert([
        {
          name: "Resadiye Cup 2023",
          beschreibung: "Das jährliche Fußballturnier der Region",
          start_datum: "2023-07-15",
          end_datum: "2023-07-16",
          ort: "Sportplatz Resadiye",
          ist_aktiv: false,
        },
        {
          name: "Resadiye Cup 2024",
          beschreibung: "Das jährliche Fußballturnier der Region",
          start_datum: "2024-07-20",
          end_datum: "2024-07-21",
          ort: "Sportplatz Resadiye",
          ist_aktiv: true,
        },
        {
          name: "Sommerturnier 2024",
          beschreibung: "Ein freundschaftliches Sommerturnier",
          start_datum: "2024-08-10",
          end_datum: "2024-08-11",
          ort: "Stadion am See",
          ist_aktiv: true,
        },
      ])

      if (tournamentError) throw tournamentError

      // Turnier-IDs abrufen
      const { data: tournaments, error: tournamentsFetchError } = await supabase
        .from("tournaments")
        .select("id")
        .in("name", ["Resadiye Cup 2023", "Resadiye Cup 2024", "Sommerturnier 2024"])

      if (tournamentsFetchError) throw tournamentsFetchError

      // Teams zu Turnieren zuordnen
      const { error: tournamentTeamsError } = await supabase.from("tournament_teams").insert([
        {
          tournament_id: tournaments[0].id,
          team_id: teams[0].id,
          gruppe: "A",
        },
        {
          tournament_id: tournaments[0].id,
          team_id: teams[1].id,
          gruppe: "A",
        },
        {
          tournament_id: tournaments[1].id,
          team_id: teams[0].id,
          gruppe: "A",
        },
        {
          tournament_id: tournaments[1].id,
          team_id: teams[1].id,
          gruppe: "B",
        },
        {
          tournament_id: tournaments[2].id,
          team_id: teams[0].id,
          gruppe: "A",
        },
        {
          tournament_id: tournaments[2].id,
          team_id: teams[1].id,
          gruppe: "A",
        },
      ])

      if (tournamentTeamsError) throw tournamentTeamsError

      // Spiele erstellen
      const { error: matchesError } = await supabase.from("matches").insert([
        {
          tournament_id: tournaments[0].id,
          team_heim_id: teams[0].id,
          team_gast_id: teams[1].id,
          tore_heim: 2,
          tore_gast: 1,
          datum: "2023-07-15T14:00:00",
          ort: "Sportplatz Resadiye",
          status: "beendet",
        },
        {
          tournament_id: tournaments[1].id,
          team_heim_id: teams[0].id,
          team_gast_id: teams[1].id,
          tore_heim: 0,
          tore_gast: 0,
          datum: "2024-07-20T15:00:00",
          ort: "Sportplatz Resadiye",
          status: "geplant",
        },
        {
          tournament_id: tournaments[2].id,
          team_heim_id: teams[0].id,
          team_gast_id: teams[1].id,
          tore_heim: 0,
          tore_gast: 0,
          datum: "2024-08-10T16:00:00",
          ort: "Stadion am See",
          status: "geplant",
        },
      ])

      if (matchesError) throw matchesError

      // Blankett-Einstellungen erstellen
      const { error: blankettSettingsError } = await supabase.from("blankett_settings").insert([
        {
          tournament_id: tournaments[1].id,
          min_spieler: 11,
          max_spieler: 20,
          ohne_anmeldung: false,
          countdown_aktiv: true,
          countdown_datum: "2024-07-13T23:59:59",
        },
        {
          tournament_id: tournaments[2].id,
          min_spieler: 7,
          max_spieler: 15,
          ohne_anmeldung: true,
          countdown_aktiv: true,
          countdown_datum: "2024-08-03T23:59:59",
        },
      ])

      if (blankettSettingsError) throw blankettSettingsError

      setSuccess("Testdaten wurden erfolgreich erstellt!")
    } catch (err: any) {
      console.error("Fehler beim Erstellen der Testdaten:", err)
      setError(err.message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Setup</h1>

      <Card>
        <CardHeader>
          <CardTitle>Testdaten erstellen</CardTitle>
          <CardDescription>
            Erstellen Sie Testdaten für die Anwendung. Dies umfasst Benutzer, Teams, Turniere und Spiele.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}
          <p className="mb-4">
            Durch Klicken auf die Schaltfläche unten werden Testdaten für die Anwendung erstellt. Dies umfasst:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>1 Admin-Benutzer (admin@example.com / admin123)</li>
            <li>2 Trainer-Benutzer (trainer1@example.com, trainer2@example.com / trainer123)</li>
            <li>4 Spieler-Benutzer (spieler1@example.com bis spieler4@example.com / spieler123)</li>
            <li>2 Teams (FC Adler, SV Löwen)</li>
            <li>3 Turniere (Resadiye Cup 2023, Resadiye Cup 2024, Sommerturnier 2024)</li>
            <li>3 Spiele</li>
            <li>Blankett-Einstellungen für aktive Turniere</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateTestData} disabled={isLoading} className="w-full">
            {isLoading ? "Testdaten werden erstellt..." : "Testdaten erstellen"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
