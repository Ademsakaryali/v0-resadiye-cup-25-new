"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { User } from "@/lib/types"
import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import {
  MoreHorizontal,
  UserPlus,
  Pencil,
  Trash2,
  AlertCircle,
  Search,
  Filter,
  X,
  UserCog,
  Mail,
  Phone,
  Calendar,
} from "lucide-react"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userDetailsOpen, setUserDetailsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [filtersVisible, setFiltersVisible] = useState(false)
  const [supabase, setSupabase] = useState(() => getSupabaseClient())

  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [errorDetails, setErrorDetails] = useState<string[]>([])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase.from("users").select("*").order("nachname", { ascending: true })

        if (error) {
          throw error
        }

        setUsers(data as User[])
        setFilteredUsers(data as User[])
      } catch (error) {
        console.error("Fehler beim Laden der Benutzer:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [supabase])

  useEffect(() => {
    // Filter und Suche anwenden
    let result = users

    // Suche
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (user) =>
          user.vorname.toLowerCase().includes(term) ||
          user.nachname.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          (user.telefonnummer && user.telefonnummer.includes(term)),
      )
    }

    // Rollenfilter
    if (roleFilter !== "all") {
      result = result.filter((user) => user.rolle === roleFilter)
    }

    // Statusfilter
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active"
      result = result.filter((user) => user.ist_aktiv === isActive)
    }

    setFilteredUsers(result)
  }, [users, searchTerm, roleFilter, statusFilter])

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      const dependencies = []
      let hasBlockingDependencies = false

      // 1. Prüfen, ob der Benutzer als Trainer für ein Team eingetragen ist
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("id, name")
        .eq("trainer_id", userToDelete.id)

      if (teamError) {
        throw teamError
      }

      if (teamData && teamData.length > 0) {
        const teamNames = teamData.map((team) => team.name).join(", ")
        dependencies.push(`Trainer für Teams: ${teamNames}`)
        hasBlockingDependencies = true
      }

      // 2. Prüfen, ob der Benutzer in team_change_requests referenziert wird
      const { data: requestData, error: requestError } = await supabase
        .from("team_change_requests")
        .select("id")
        .eq("trainer_id", userToDelete.id)

      if (requestError) {
        throw requestError
      }

      if (requestData && requestData.length > 0) {
        dependencies.push(`${requestData.length} offene Teamänderungsanfragen`)
        hasBlockingDependencies = true
      }

      // 3. Hier können weitere Abhängigkeitsprüfungen hinzugefügt werden
      // z.B. für Spieler in Teams, Turniere, etc.

      // Wenn Abhängigkeiten bestehen, zeigen wir eine Fehlermeldung an
      if (hasBlockingDependencies) {
        setErrorMessage(
          `Der Benutzer "${userToDelete.vorname} ${userToDelete.nachname}" kann nicht gelöscht werden, da noch Abhängigkeiten bestehen.`,
        )
        setErrorDetails(dependencies)
        setErrorDialogOpen(true)
        return
      }

      // Wenn keine Abhängigkeiten bestehen, löschen wir den Benutzer
      const { error } = await supabase.from("users").delete().eq("id", userToDelete.id)

      if (error) {
        // Wenn trotzdem ein Fehler auftritt, könnte es eine nicht geprüfte Abhängigkeit sein
        throw error
      }

      setUsers(users.filter((user) => user.id !== userToDelete.id))
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (error: any) {
      console.error("Fehler beim Löschen des Benutzers:", error)

      // Versuchen, den Constraint-Namen aus der Fehlermeldung zu extrahieren
      let constraintMessage = "Möglicherweise bestehen noch Abhängigkeiten zu anderen Daten."

      if (error.message && error.message.includes("foreign key constraint")) {
        const constraintMatch = error.message.match(/"([^"]+)"/)
        if (constraintMatch && constraintMatch[1]) {
          const constraintName = constraintMatch[1]

          // Benutzerfreundlichere Meldung basierend auf dem Constraint-Namen
          if (constraintName.includes("teams_")) {
            constraintMessage = "Der Benutzer ist als Trainer für ein Team eingetragen."
          } else if (constraintName.includes("team_change_requests_")) {
            constraintMessage = "Der Benutzer ist mit Teamänderungsanfragen verknüpft."
          } else if (constraintName.includes("spieler_")) {
            constraintMessage = "Der Benutzer ist als Spieler registriert."
          } else if (constraintName.includes("tournament_")) {
            constraintMessage = "Der Benutzer ist mit Turnieren verknüpft."
          }
        }
      }

      setErrorMessage(`Beim Löschen des Benutzers ist ein Fehler aufgetreten: ${constraintMessage}`)
      setErrorDetails([])
      setErrorDialogOpen(true)
    }
  }

  const handleUserDetailsClick = (user: User) => {
    setSelectedUser(user)
    setUserDetailsOpen(true)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setRoleFilter("all")
    setStatusFilter("all")
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "Admin":
        return "destructive"
      case "Trainer":
        return "default"
      case "Spieler":
        return "secondary"
      default:
        return "outline"
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Nicht angegeben"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("de-DE").format(date)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <RequireAuth allowedRoles={["Admin"]}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Benutzerverwaltung</h1>
          <Button asChild>
            <Link href="/users/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Neuen Benutzer anlegen
            </Link>
          </Button>
        </div>

        <div className="bg-card rounded-lg shadow-sm border mb-6">
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suche nach Name, E-Mail oder Telefonnummer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setFiltersVisible(!filtersVisible)}
                className={filtersVisible ? "bg-accent" : ""}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {filtersVisible && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role-filter">Rolle</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger id="role-filter">
                      <SelectValue placeholder="Alle Rollen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Rollen</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Trainer">Trainer</SelectItem>
                      <SelectItem value="Spieler">Spieler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder="Alle Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Status</SelectItem>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="inactive">Inaktiv</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                    <X className="mr-2 h-4 w-4" />
                    Filter zurücksetzen
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <UserCog className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Keine Benutzer gefunden</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mt-1">
                {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                  ? "Es wurden keine Benutzer gefunden, die den Filterkriterien entsprechen. Versuchen Sie, die Filter anzupassen."
                  : "Es wurden noch keine Benutzer angelegt. Klicken Sie auf 'Neuen Benutzer anlegen', um zu beginnen."}
              </p>
              {(searchTerm || roleFilter !== "all" || statusFilter !== "all") && (
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Filter zurücksetzen
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="bg-card shadow-sm rounded-lg overflow-hidden border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Benutzer</TableHead>
                    <TableHead className="hidden md:table-cell">E-Mail</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleUserDetailsClick(user)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage src={user.profilbild_url || ""} alt={user.vorname} />
                            <AvatarFallback>{`${user.vorname.charAt(0)}${user.nachname.charAt(0)}`}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{`${user.vorname} ${user.nachname}`}</div>
                            <div className="text-sm text-muted-foreground md:hidden truncate max-w-[150px]">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center">
                          <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[250px]">{user.email}</span>
                        </div>
                        {user.telefonnummer && (
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Phone className="mr-2 h-3 w-3" />
                            <span>{user.telefonnummer}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.rolle) as any}>{user.rolle}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center">
                          <div
                            className={`h-2.5 w-2.5 rounded-full mr-2 ${
                              user.ist_aktiv ? "bg-green-500" : "bg-gray-400"
                            }`}
                          ></div>
                          <span>{user.ist_aktiv ? "Aktiv" : "Inaktiv"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Menü öffnen</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/users/${user.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Bearbeiten
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(user)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Benutzer löschen
              </DialogTitle>
              <DialogDescription>
                Sind Sie sicher, dass Sie den Benutzer "{userToDelete?.vorname} {userToDelete?.nachname}" löschen
                möchten? Diese Aktion kann nicht rückgängig gemacht werden.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Löschen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Benutzerdetails</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-2">
                    <AvatarImage src={selectedUser.profilbild_url || ""} alt={selectedUser.vorname} />
                    <AvatarFallback className="text-lg">{`${selectedUser.vorname.charAt(0)}${selectedUser.nachname.charAt(0)}`}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-medium">{`${selectedUser.vorname} ${selectedUser.nachname}`}</h3>
                  <Badge variant={getRoleBadgeVariant(selectedUser.rolle) as any} className="mt-1">
                    {selectedUser.rolle}
                  </Badge>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">E-Mail</p>
                      <p className="text-sm">{selectedUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Telefonnummer</p>
                      <p className="text-sm">{selectedUser.telefonnummer || "Nicht angegeben"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Geburtsdatum</p>
                      <p className="text-sm">{formatDate(selectedUser.geburtsdatum)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div
                      className={`h-3 w-3 rounded-full mt-1 ${selectedUser.ist_aktiv ? "bg-green-500" : "bg-gray-400"}`}
                    />
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm">{selectedUser.ist_aktiv ? "Aktiv" : "Inaktiv"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setUserDetailsOpen(false)}>
                    Schließen
                  </Button>
                  <Button asChild>
                    <Link href={`/users/${selectedUser.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Bearbeiten
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Fehler beim Löschen
              </DialogTitle>
              <DialogDescription>{errorMessage}</DialogDescription>
            </DialogHeader>

            {errorDetails.length > 0 && (
              <div className="mt-2 space-y-2">
                <h4 className="text-sm font-medium">Abhängigkeiten:</h4>
                <ul className="text-sm space-y-1 list-disc pl-5">
                  {errorDetails.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  Bitte lösen Sie diese Abhängigkeiten, bevor Sie den Benutzer löschen.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button variant="primary" onClick={() => setErrorDialogOpen(false)}>
                Verstanden
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RequireAuth>
  )
}
