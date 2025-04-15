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
