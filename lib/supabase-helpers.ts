import { getSupabaseClient } from "@/lib/supabase/client"
import type { User, Team, Tournament, Match } from "@/lib/types"

/**
 * Hilfsfunktionen für Supabase-Abfragen
 * Diese Funktionen kapseln häufig verwendete Datenbankabfragen
 */

/**
 * Ruft ein Team anhand seiner ID ab
 */
export async function getTeamById(teamId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("teams").select("*, trainer:trainer_id(*)").eq("id", teamId).single()

  if (error) throw error
  return data as Team
}

/**
 * Ruft alle Teams ab
 */
export async function getAllTeams(options?: { activeOnly?: boolean }) {
  const supabase = getSupabaseClient()
  let query = supabase.from("teams").select("*, trainer:trainer_id(*)")

  if (options?.activeOnly) {
    query = query.eq("ist_aktiv", true)
  }

  const { data, error } = await query.order("name")

  if (error) throw error
  return data as Team[]
}

/**
 * Ruft ein Turnier anhand seiner ID ab
 */
export async function getTournamentById(tournamentId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("tournaments").select("*").eq("id", tournamentId).single()

  if (error) throw error
  return data as Tournament
}

/**
 * Ruft alle Turniere ab
 */
export async function getAllTournaments(options?: { activeOnly?: boolean }) {
  const supabase = getSupabaseClient()
  let query = supabase.from("tournaments").select("*")

  if (options?.activeOnly) {
    query = query.eq("ist_aktiv", true)
  }

  const { data, error } = await query.order("start_datum", { ascending: false })

  if (error) throw error
  return data as Tournament[]
}

/**
 * Ruft einen Benutzer anhand seiner ID ab
 */
export async function getUserById(userId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

  if (error) throw error
  return data as User
}

/**
 * Ruft alle Spieler eines Teams ab
 */
export async function getTeamPlayers(teamId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("team_spieler")
    .select(`
      team_id,
      spieler_id,
      trikot_nummer,
      position,
      spieler:spieler_id (
        id,
        vorname,
        nachname,
        email,
        geburtsdatum,
        telefonnummer,
        profilbild_url
      )
    `)
    .eq("team_id", teamId)
    .order("trikot_nummer", { ascending: true })

  if (error) throw error
  return data
}

/**
 * Ruft alle Spiele eines Turniers ab
 */
export async function getTournamentMatches(tournamentId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("matches")
    .select("*, team_heim:team_heim_id(*), team_gast:team_gast_id(*)")
    .eq("tournament_id", tournamentId)
    .order("datum", { ascending: true })

  if (error) throw error
  return data as Match[]
}

/**
 * Ruft alle Teams eines Turniers ab
 */
export async function getTournamentTeams(tournamentId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("tournament_teams")
    .select(`
      team_id,
      team:team_id (
        id,
        name,
        logo_url,
        trainer:trainer_id(*)
      )
    `)
    .eq("tournament_id", tournamentId)

  if (error) throw error
  return data.map((item) => item.team) as Team[]
}

/**
 * Ruft die Kadergröße eines Teams ab
 */
export async function getTeamSize(teamId: string) {
  const supabase = getSupabaseClient()
  const { count, error } = await supabase
    .from("team_spieler")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId)

  if (error) throw error
  return count || 0
}
