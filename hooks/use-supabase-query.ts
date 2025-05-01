"use client"

import { useState, useEffect, useCallback } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"

/**
 * Hook für generische Supabase-Abfragen
 * Vereinfacht die Datenabfrage und Fehlerbehandlung
 */
export function useSupabaseQuery<T = any>(
  tableName: string,
  queryFn: (supabase: ReturnType<typeof getSupabaseClient>) => Promise<{ data: T | null; error: any }>,
  dependencies: any[] = [],
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await queryFn(supabase)

      if (error) throw error
      setData(data)
      setError(null)
    } catch (err: any) {
      console.error(`Fehler beim Laden von ${tableName}:`, err)
      setError(err.message || `Ein Fehler ist aufgetreten beim Laden von ${tableName}.`)
    } finally {
      setLoading(false)
    }
  }, [supabase, tableName, queryFn])

  useEffect(() => {
    fetchData()
  }, [...dependencies, fetchData])

  return { data, error, loading, refetch: fetchData }
}

/**
 * Hook zum Laden eines Teams anhand seiner ID
 */
export function useTeam(teamId: string) {
  return useSupabaseQuery(
    "teams",
    (supabase) => supabase.from("teams").select("*, trainer:trainer_id(*)").eq("id", teamId).single(),
    [teamId],
  )
}

/**
 * Hook zum Laden eines Turniers anhand seiner ID
 */
export function useTournament(tournamentId: string) {
  return useSupabaseQuery(
    "tournaments",
    (supabase) => supabase.from("tournaments").select("*").eq("id", tournamentId).single(),
    [tournamentId],
  )
}

/**
 * Hook zum Laden eines Spielers anhand seiner ID
 */
export function usePlayer(playerId: string) {
  return useSupabaseQuery(
    "users",
    (supabase) => supabase.from("users").select("*").eq("id", playerId).eq("rolle", "Spieler").single(),
    [playerId],
  )
}

/**
 * Hook zum Laden aller Teams
 */
export function useTeams(options: { activeOnly?: boolean } = {}) {
  const { activeOnly = true } = options

  return useSupabaseQuery(
    "teams",
    (supabase) => {
      let query = supabase.from("teams").select("*, trainer:trainer_id(*)").order("name")

      if (activeOnly) {
        query = query.eq("ist_aktiv", true)
      }

      return query
    },
    [activeOnly],
  )
}

/**
 * Hook zum Laden aller Turniere
 */
export function useTournaments(options: { activeOnly?: boolean } = {}) {
  const { activeOnly = true } = options

  return useSupabaseQuery(
    "tournaments",
    (supabase) => {
      let query = supabase.from("tournaments").select("*").order("start_datum", { ascending: false })

      if (activeOnly) {
        query = query.eq("ist_aktiv", true)
      }

      return query
    },
    [activeOnly],
  )
}

/**
 * Hook zum Laden der Spiele eines Turniers
 */
export function useTournamentMatches(tournamentId: string) {
  return useSupabaseQuery(
    "matches",
    (supabase) =>
      supabase
        .from("matches")
        .select("*, team_heim:team_heim_id(*), team_gast:team_gast_id(*)")
        .eq("tournament_id", tournamentId)
        .order("datum"),
    [tournamentId],
  )
}
