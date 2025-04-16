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
