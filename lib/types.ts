// Bestehende Typen beibehalten
export type User = {
  id: string
  email: string
  vorname: string
  nachname: string
  rolle: "Admin" | "Trainer" | "Spieler"
  geburtsdatum?: string
  telefonnummer?: string
  profilbild_url?: string
  ist_aktiv: boolean
  created_at: string
  updated_at: string
}

export type Team = {
  id: string
  name: string
  logo_url?: string
  beschreibung?: string
  trainer_id?: string
  ist_aktiv: boolean
  created_at: string
  updated_at: string
  trainer?: User
}

export type Tournament = {
  id: string
  name: string
  beschreibung?: string
  start_datum: string
  end_datum: string
  ort?: string
  logo_url?: string
  ist_aktiv: boolean
  created_at: string
  updated_at: string
}

export type Match = {
  id: string
  tournament_id: string
  team_heim_id: string
  team_gast_id: string
  tore_heim: number
  tore_gast: number
  datum: string
  ort?: string
  status: "geplant" | "live" | "beendet" | "abgesagt"
  created_at: string
  updated_at: string
  team_heim?: Team
  team_gast?: Team
}

export type BlankettSettings = {
  id: string
  tournament_id: string
  min_spieler: number
  max_spieler: number
  ohne_anmeldung: boolean
  countdown_aktiv: boolean
  countdown_datum: string
  created_at: string
  updated_at: string
}

export type BlankettEntry = {
  id: string
  team_id: string
  tournament_id: string
  status: "entwurf" | "eingereicht" | "genehmigt" | "abgelehnt"
  eingereicht_am?: string
  genehmigt_am?: string
  created_at: string
  updated_at: string
  team?: Team
}

export type BlankettSpieler = {
  id: string
  blankett_id: string
  spieler_id: string
  trikot_nummer: number
  position: string
  created_at: string
  updated_at: string
  spieler?: User
}

export type TeamChangeRequest = {
  id: string
  team_id: string
  trainer_id: string
  name?: string
  beschreibung?: string
  logo_url?: string
  status: "eingereicht" | "genehmigt" | "abgelehnt"
  eingereicht_am: string
  genehmigt_am?: string
  created_at: string
  updated_at: string
  team?: Team
  trainer?: User
}

export type PlayerGoal = {
  id: string
  tournament_id: string
  match_id: string
  player_id: string
  team_id: string
  minute?: number
  is_penalty?: boolean
  is_own_goal?: boolean
  created_at: string
  updated_at: string
  player?: User
  team?: Team
  match?: Match
}

export type TournamentPlayer = {
  id: string
  vorname: string
  nachname: string
  geburtsdatum?: string
  profilbild_url?: string
  team: Team
  trikot_nummer?: number
  position?: string
  goals_count?: number
}

// Neue erweiterte Typen für Komponenten
export interface PageProps {
  params: { [key: string]: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export interface SelectOption {
  value: string
  label: string
}

export interface FilterState {
  search?: string
  status?: string
  team?: string
  position?: string
  sortBy?: string
  sortDirection?: "asc" | "desc"
  page?: number
  pageSize?: number
}

// Erweiterte Typen für API-Antworten
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Erweiterte Typen für Statistiken
export interface PlayerStatistics extends User {
  team_name: string
  team_logo_url?: string
  team_id: string
  position?: string
  jersey_number?: number
  goals: number
  matches_played: number
  minutes_played: number
  yellow_cards: number
  red_cards: number
  assists: number
  clean_sheets?: number
  goals_per_match: number
  minutes_per_goal: number | null
}

export interface TeamStatistics extends Team {
  matches_played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  points: number
  tournament_id: string
}

// Typen für Tabellen
export interface StandingsEntry {
  team_id: string
  team_name: string
  team_logo_url?: string
  matches_played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
}

// Typen für Formulare
export interface FormField {
  name: string
  label: string
  type: "text" | "email" | "password" | "number" | "date" | "select" | "textarea" | "checkbox" | "radio" | "file"
  placeholder?: string
  required?: boolean
  options?: SelectOption[]
  defaultValue?: any
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
  validation?: ValidationRule[]
}

export interface ValidationRule {
  validate: (value: any) => boolean
  message: string
}
