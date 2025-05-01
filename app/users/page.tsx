"use client"

import { useState } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { FilterBar } from "@/components/ui/filter-bar"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { ErrorHandler } from "@/components/ui/error-handler"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { useRequireAdmin } from "@/hooks/use-auth-guards"
import { routes } from "@/lib/routes"
import { formatDate } from "@/lib/date-utils"
import type { User } from "@/lib/types"
import { PageLoading } from "@/components/ui/page-loading"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getInitials } from "@/lib/format-utils"
import { Plus, UserCog } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function UsersPage() {
  // Verwende den Admin-Guard, um sicherzustellen, dass nur Admins Zugriff haben
  const { isAdmin, loading: authLoading } = useRequireAdmin()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("active")

  // Lade Benutzerdaten
  const {
    data: users,
    loading,
    error,
  } = useSupabaseQuery<User[]>("users", (supabase) => supabase.from("users").select("*").order("nachname"), [])

  // Wende Filter an
  const filteredUsers =
    users?.filter((user) => {
      const nameMatch = `${user.vorname} ${user.nachname} ${user.email}`.toLowerCase().includes(search.toLowerCase())
      const roleMatch = !roleFilter || user.rolle === roleFilter
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "active" && user.ist_aktiv) ||
        (statusFilter === "inactive" && !user.ist_aktiv)
      return nameMatch && roleMatch && statusMatch
    }) || []

  if (authLoading || loading) return <PageLoading />

  return (
    <PageLayout
      title="Benutzerverwaltung"
      description="Verwalten Sie alle Benutzer der Anwendung"
      actions={
        <Button asChild>
          <Link href={routes.users.new}>
            <Plus className="mr-2 h-4 w-4" />
            Neuer Benutzer
          </Link>
        </Button>
      }
    >
      <ErrorHandler error={error} />

      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Benutzer suchen..."
        onReset={() => {
          setSearch("")
          setRoleFilter("")
          setStatusFilter("active")
        }}
      >
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700 text-white">
            <SelectValue placeholder="Rolle" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700 text-white">
            <SelectItem value="all">Alle Rollen</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Trainer">Trainer</SelectItem>
            <SelectItem value="Spieler">Spieler</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700 text-white">
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="inactive">Inaktiv</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable
        data={filteredUsers}
        keyExtractor={(user) => user.id}
        columns={[
          {
            key: "user",
            header: "Benutzer",
            cell: (user) => (
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={user.profilbild_url || undefined} alt={`${user.vorname} ${user.nachname}`} />
                  <AvatarFallback className="bg-gray-800 text-blue-400">
                    {getInitials(user.vorname, user.nachname)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Link href={routes.users.detail(user.id)} className="font-medium text-white hover:text-blue-400">
                    {user.vorname} {user.nachname}
                  </Link>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: "role",
            header: "Rolle",
            cell: (user) => {
              switch (user.rolle) {
                case "Admin":
                  return <Badge className="bg-red-500/20 text-red-400">Admin</Badge>
                case "Trainer":
                  return <Badge className="bg-blue-500/20 text-blue-400">Trainer</Badge>
                case "Spieler":
                  return <Badge className="bg-green-500/20 text-green-400">Spieler</Badge>
                default:
                  return <Badge variant="outline">Unbekannt</Badge>
              }
            },
          },
          {
            key: "status",
            header: "Status",
            cell: (user) =>
              user.ist_aktiv ? (
                <Badge className="bg-green-600 text-white">Aktiv</Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                  Inaktiv
                </Badge>
              ),
          },
          {
            key: "created",
            header: "Erstellt am",
            cell: (user) => formatDate(user.created_at),
          },
          {
            key: "actions",
            header: "",
            cell: (user) => (
              <Button variant="ghost" size="sm" asChild className="text-gray-300 hover:text-blue-400">
                <Link href={routes.users.detail(user.id)}>
                  <UserCog className="h-4 w-4 mr-1" />
                  Details
                </Link>
              </Button>
            ),
          },
        ]}
        emptyState={
          <div className="text-center py-8">
            <p className="text-gray-400">Keine Benutzer gefunden.</p>
          </div>
        }
      />
    </PageLayout>
  )
}
