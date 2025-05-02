"use client"

import type React from "react"
import { createContext, useContext, useReducer, type ReactNode } from "react"

// Definiere den Zustandstyp
interface AppState {
  activeTournamentId: string | null
  activeTeamId: string | null
  filters: {
    [key: string]: any
  }
}

// Definiere die Aktionstypen
type AppAction =
  | { type: "SET_ACTIVE_TOURNAMENT"; payload: string | null }
  | { type: "SET_ACTIVE_TEAM"; payload: string | null }
  | { type: "SET_FILTER"; payload: { key: string; value: any } }
  | { type: "RESET_FILTERS"; payload?: { except?: string[] } }

// Initialer Zustand
const initialState: AppState = {
  activeTournamentId: null,
  activeTeamId: null,
  filters: {},
}

// Reducer-Funktion
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_ACTIVE_TOURNAMENT":
      return { ...state, activeTournamentId: action.payload }
    case "SET_ACTIVE_TEAM":
      return { ...state, activeTeamId: action.payload }
    case "SET_FILTER":
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.key]: action.payload.value,
        },
      }
    case "RESET_FILTERS":
      if (action.payload?.except?.length) {
        const newFilters: { [key: string]: any } = {}
        action.payload.except.forEach((key) => {
          if (state.filters[key] !== undefined) {
            newFilters[key] = state.filters[key]
          }
        })
        return { ...state, filters: newFilters }
      }
      return { ...state, filters: {} }
    default:
      return state
  }
}

// Kontext erstellen
const AppStateContext = createContext<
  | {
      state: AppState
      dispatch: React.Dispatch<AppAction>
    }
  | undefined
>(undefined)

/**
 * Provider-Komponente für den App-Zustand
 * Stellt den Zustand und Dispatch-Funktionen für die gesamte Anwendung bereit
 */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return <AppStateContext.Provider value={{ state, dispatch }}>{children}</AppStateContext.Provider>
}

/**
 * Hook für den Zugriff auf den App-Zustand
 */
export function useAppState() {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error("useAppState muss innerhalb eines AppStateProviders verwendet werden")
  }
  return context
}
