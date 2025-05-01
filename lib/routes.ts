/**
 * Zentrale Routendefinitionen für die Anwendung
 * Verhindert hart codierte URLs und erleichtert Änderungen
 */
export const routes = {
  home: "/",
  login: "/login",
  profile: "/profile",

  // Teams
  teams: {
    index: "/teams",
    new: "/teams/new",
    detail: (id: string) => `/teams/${id}`,
    edit: (id: string) => `/teams/${id}/edit`,
    trainerEdit: (id: string) => `/teams/${id}/trainer-edit`,
    blankett: {
      index: (id: string) => `/teams/${id}/blankett`,
      detail: (teamId: string, blankettId: string) => `/teams/${teamId}/blankett/${blankettId}`,
    },
  },

  // Tournaments
  tournaments: {
    index: "/tournaments",
    new: "/tournaments/new",
    detail: (id: string) => `/tournaments/${id}`,
    edit: (id: string) => `/tournaments/${id}/edit`,
    teams: {
      manage: (id: string) => `/tournaments/${id}/teams/manage`,
    },
    players: (id: string) => `/tournaments/${id}/players`,
    scorers: (id: string) => `/tournaments/${id}/scorers`,
    schedule: (id: string) => `/tournaments/${id}/schedule`,
    standings: (id: string) => `/tournaments/${id}/standings`,
  },

  // Players
  players: {
    index: "/spieler",
    detail: (id: string) => `/spieler/${id}`,
    // Statistik-Route entfernt
  },

  // Users
  users: {
    index: "/users",
    new: "/users/new",
    detail: (id: string) => `/users/${id}`,
  },

  // Admin
  admin: {
    dashboard: "/admin/dashboard",
    blanketts: {
      index: "/blanketts",
      detail: (id: string) => `/blanketts/${id}`,
      settings: (id: string) => `/blanketts/settings/${id}`,
      admin: (id: string) => `/admin/blanketts/${id}`,
    },
  },

  // Spiele
  matches: {
    index: "/spiele",
  },
}
