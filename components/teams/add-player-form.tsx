"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, UserPlus, AlertCircle } from "lucide-react"

interface AddPlayerToTeamFormProps {
  teamId: string
  existingPlayerIds?: string[]
  onSuccess: () => void
  onError: (message: string) => void
}

export function AddPlayerToTeamForm({ teamId, existingPlayerIds = [], onSuccess, onError }: AddPlayerToTeamFormProps) {
  const supabase = getSupabaseClient()
  const [activeTab, setActiveTab] = useState("search")

  // Suche nach existierenden Spielern
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [trikotNummer, setTrikotNummer] = useState("")
  const [position, setPosition] = useState("")

  // Neuer Spieler erstellen
  const [vorname, setVorname] = useState("")
  const [nachname, setNachname] = useState("")
  const [geburtsdatum, setGeburtsdatum] = useState("")
  const [telefonnummer, setTelefonnummer] = useState("")
  const [newPlayerTrikotNummer, setNewPlayerTrikotNummer] = useState("")
  const [newPlayerPosition, setNewPlayerPosition] = useState("")

  // Allgemein
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Suche nach Spielern, wenn sich die Suchanfrage ändert
  useEffect(() => {
    const searchPlayers = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      try {
        setSearching(true)
        setError(null)

        // Suche nach Spielern, die nicht bereits im Team sind
        const { data, error } = await supabase
          .from("users")
          .select("id, vorname, nachname, email, geburtsdatum, rolle")
          .or(`vorname.ilike.%${searchQuery}%,nachname.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
          .eq("rolle", "Spieler")
          .order("nachname", { ascending: true })
          .limit(10)

        if (error) throw error

        // Filtere Spieler, die bereits im Team sind
        const filteredData = data.filter((player) => !existingPlayerIds.includes(player.id))
        setSearchResults(filteredData)
      } catch (error: any) {
        console.error("Fehler bei der Spielersuche:", error)
        setError("Fehler bei der Spielersuche: " + error.message)
      } finally {
        setSearching(false)
      }
    }

    const debounceTimeout = setTimeout(searchPlayers, 300)
    return () => clearTimeout(debounceTimeout)
  }, [searchQuery, supabase, existingPlayerIds])

  const handleSelectPlayer = (player: any) => {
    setSelectedPlayer(player)
    setTrikotNummer("")
    setPosition("")
    setError(null)
  }

  const handleAddExistingPlayer = async () => {
    if (!selectedPlayer) {
      setError("Bitte wählen Sie einen Spieler aus.")
      return
    }

    if (!trikotNummer) {
      setError("Bitte geben Sie eine Trikotnummer ein.")
      return
    }

    if (!position) {
      setError("Bitte wählen Sie eine Position aus.")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Prüfen, ob die Trikotnummer bereits vergeben ist
      const { data: existingTrikot, error: trikotError } = await supabase
        .from("team_spieler")
        .select("spieler_id")
        .eq("team_id", teamId)
        .eq("trikot_nummer", Number.parseInt(trikotNummer))
        .maybeSingle()

      if (trikotError) throw trikotError

      if (existingTrikot) {
        setError("Diese Trikotnummer ist bereits vergeben.")
        return
      }

      // Spieler zum Team hinzufügen - ohne created_at
      const { error: addError } = await supabase.from("team_spieler").insert({
        team_id: teamId,
        spieler_id: selectedPlayer.id,
        trikot_nummer: Number.parseInt(trikotNummer),
        position,
      })

      if (addError) throw addError

      setSuccess("Spieler erfolgreich zum Team hinzugefügt.")

      // Formular zurücksetzen
      setSelectedPlayer(null)
      setTrikotNummer("")
      setPosition("")
      setSearchQuery("")
      setSearchResults([])

      // Callback aufrufen
      onSuccess()
    } catch (error: any) {
      console.error("Fehler beim Hinzufügen des Spielers:", error)
      setError("Fehler beim Hinzufügen des Spielers: " + error.message)
      onError("Fehler beim Hinzufügen des Spielers: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAndAddPlayer = async () => {
    if (!vorname || !nachname || !geburtsdatum || !newPlayerTrikotNummer || !newPlayerPosition) {
      setError("Bitte füllen Sie alle Pflichtfelder aus.")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Alter berechnen
      const birthDate = new Date(geburtsdatum)
      const today = new Date()
      let alter = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        alter--
      }

      // E-Mail automatisch generieren
      const generatedEmail = `${vorname.toLowerCase()}${nachname.toLowerCase()}${alter}@resadiyecup.com`

      // Passwort automatisch generieren
      const vornamePrefix = vorname.substring(0, 2).toLowerCase()
      const nachnamePrefix = nachname.substring(0, 2).toLowerCase()
      const generatedPassword = `${vornamePrefix}${nachnamePrefix}5454`

      // Prüfen, ob die Trikotnummer bereits vergeben ist
      const { data: existingTrikot, error: trikotError } = await supabase
        .from("team_spieler")
        .select("spieler_id")
        .eq("team_id", teamId)
        .eq("trikot_nummer", Number.parseInt(newPlayerTrikotNummer))
        .maybeSingle()

      if (trikotError) throw trikotError

      if (existingTrikot) {
        setError("Diese Trikotnummer ist bereits vergeben.")
        return
      }

      // Prüfen, ob die E-Mail-Adresse bereits existiert
      const { data: existingEmail, error: emailError } = await supabase
        .from("users")
        .select("id")
        .eq("email", generatedEmail)
        .maybeSingle()

      if (emailError) throw emailError

      if (existingEmail) {
        setError("Diese E-Mail-Adresse wird bereits verwendet.")
        return
      }

      // UUID für den neuen Benutzer generieren
      const userId = crypto.randomUUID()

      // Neuen Spieler erstellen
      const { data: newPlayer, error: createError } = await supabase
        .from("users")
        .insert({
          id: userId,
          vorname,
          nachname,
          email: generatedEmail,
          password_hash: generatedPassword, // Direkt das Passwort speichern
          geburtsdatum,
          telefonnummer: telefonnummer || null,
          rolle: "Spieler",
          ist_aktiv: true,
        })
        .select("id")
        .single()

      if (createError) throw createError

      // Spieler zum Team hinzufügen - ohne created_at
      const { error: addError } = await supabase.from("team_spieler").insert({
        team_id: teamId,
        spieler_id: newPlayer.id,
        trikot_nummer: Number.parseInt(newPlayerTrikotNummer),
        position: newPlayerPosition,
      })

      if (addError) throw addError

      setSuccess(`Neuer Spieler erfolgreich erstellt und zum Team hinzugefügt. 
      E-Mail: ${generatedEmail} 
      Passwort: ${generatedPassword}`)

      // Formular zurücksetzen
      setVorname("")
      setNachname("")
      setGeburtsdatum("")
      setTelefonnummer("")
      setNewPlayerTrikotNummer("")
      setNewPlayerPosition("")

      // Callback aufrufen
      onSuccess()
    } catch (error: any) {
      console.error("Fehler beim Erstellen und Hinzufügen des Spielers:", error)
      setError("Fehler beim Erstellen und Hinzufügen des Spielers: " + error.message)
      onError("Fehler beim Erstellen und Hinzufügen des Spielers: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return ""
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="py-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Existierenden Spieler suchen</TabsTrigger>
          <TabsTrigger value="create">Neuen Spieler erstellen</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="search-player">Spieler suchen</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-player"
                placeholder="Name oder E-Mail eingeben..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {searching ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                    selectedPlayer?.id === player.id ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary"
                  }`}
                  onClick={() => handleSelectPlayer(player)}
                >
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback>{getInitials(`${player.vorname} ${player.nachname}`)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      {player.vorname} {player.nachname}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{player.email}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery.length > 1 ? (
            <div className="text-center py-4 text-muted-foreground">
              Keine Spieler gefunden. Versuchen Sie einen anderen Suchbegriff oder erstellen Sie einen neuen Spieler.
            </div>
          ) : null}

          {selectedPlayer && (
            <div className="space-y-4 border rounded-md p-4 mt-4">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback>{getInitials(`${selectedPlayer.vorname} ${selectedPlayer.nachname}`)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {selectedPlayer.vorname} {selectedPlayer.nachname}
                  </div>
                  <div className="text-sm text-muted-foreground">{selectedPlayer.email}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trikot-nummer">Trikotnummer</Label>
                  <Input
                    id="trikot-nummer"
                    type="number"
                    min="1"
                    max="99"
                    placeholder="z.B. 10"
                    value={trikotNummer}
                    onChange={(e) => setTrikotNummer(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger id="position">
                      <SelectValue placeholder="Position auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Torwart">Torwart</SelectItem>
                      <SelectItem value="Abwehr">Abwehr</SelectItem>
                      <SelectItem value="Mittelfeld">Mittelfeld</SelectItem>
                      <SelectItem value="Sturm">Sturm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleAddExistingPlayer}
                disabled={!selectedPlayer || !trikotNummer || !position || loading}
              >
                {loading ? <LoadingSpinner className="mr-2" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Spieler zum Team hinzufügen
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vorname">Vorname *</Label>
              <Input
                id="vorname"
                placeholder="Vorname"
                value={vorname}
                onChange={(e) => setVorname(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nachname">Nachname *</Label>
              <Input
                id="nachname"
                placeholder="Nachname"
                value={nachname}
                onChange={(e) => setNachname(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="geburtsdatum">Geburtsdatum *</Label>
              <Input
                id="geburtsdatum"
                type="date"
                value={geburtsdatum}
                onChange={(e) => setGeburtsdatum(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefonnummer">Telefonnummer</Label>
              <Input
                id="telefonnummer"
                placeholder="Telefonnummer"
                value={telefonnummer}
                onChange={(e) => setTelefonnummer(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-trikot-nummer">Trikotnummer *</Label>
              <Input
                id="new-trikot-nummer"
                type="number"
                min="1"
                max="99"
                placeholder="z.B. 10"
                value={newPlayerTrikotNummer}
                onChange={(e) => setNewPlayerTrikotNummer(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-position">Position *</Label>
              <Select value={newPlayerPosition} onValueChange={setNewPlayerPosition}>
                <SelectTrigger id="new-position">
                  <SelectValue placeholder="Position auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Torwart">Torwart</SelectItem>
                  <SelectItem value="Abwehr">Abwehr</SelectItem>
                  <SelectItem value="Mittelfeld">Mittelfeld</SelectItem>
                  <SelectItem value="Sturm">Sturm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleCreateAndAddPlayer}
            disabled={!vorname || !nachname || !geburtsdatum || !newPlayerTrikotNummer || !newPlayerPosition || loading}
          >
            {loading ? <LoadingSpinner className="mr-2" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Spieler erstellen und zum Team hinzufügen
          </Button>
        </TabsContent>
      </Tabs>
      {success && (
        <Alert className="mt-4 border-green-600 text-green-600">
          <AlertDescription className="whitespace-pre-line">{success}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
