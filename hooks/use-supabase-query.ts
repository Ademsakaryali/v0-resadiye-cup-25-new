"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { PostgrestError } from "@supabase/supabase-js"

type QueryOptions<T> = {
  table: string
  columns?: string
  filters?: Record<string, any>
  orderBy?: { column: string; ascending?: boolean }
  limit?: number
  single?: boolean
  dependencies?: any[]
}

type QueryResult<T> = {
  data: T | null
  error: PostgrestError | null
  loading: boolean
  refetch: () => Promise<void>
}

/**
 * Hook für vereinfachte Supabase-Abfragen
 * Ermöglicht deklarative Abfragen mit automatischem Neuladen bei Änderungen der Abhängigkeiten
 */
export function useSupabaseQuery<T>({
  table,
  columns = "*",
  filters = {},
  orderBy,
  limit,
  single = false,
  dependencies = [],
}: QueryOptions<T>): QueryResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<PostgrestError | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const supabase = getSupabaseClient()

  const fetchData = async () => {
    try {
      setLoading(true)
      let query = supabase.from(table).select(columns)

      // Wende Filter an
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })

      // Wende Sortierung an
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
      }

      // Wende Limit an
      if (limit) {
        query = query.limit(limit)
      }

      // Hole einzelnen Datensatz oder Liste
      const { data: result, error: queryError } = single ? await query.single() : await query

      if (queryError) {
        setError(queryError)
        setData(null)
      } else {
        setData(result as T)
        setError(null)
      }
    } catch (err) {
      console.error("Fehler bei Supabase-Abfrage:", err)
      setError(err as PostgrestError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies])

  return { data, error, loading, refetch: fetchData }
}
