import { format, isToday, isTomorrow, isYesterday } from "date-fns"
import { de } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import type { Match } from "@/lib/types"

/**
 * Formatiert ein Datum in ein lesbares Format
 */
export function formatDate(dateString: string | Date | null | undefined, formatStr = "dd.MM.yyyy") {
  if (!dateString) return "Unbekannt"
  const date = typeof dateString === "string" ? new Date(dateString) : dateString
  return format(date, formatStr, { locale: de })
}

/**
 * Formatiert ein Datum mit Uhrzeit in ein lesbares Format
 */
export function formatDateTime(dateString: string | Date | null | undefined, formatStr = "dd.MM.yyyy HH:mm") {
  if (!dateString) return "Unbekannt"
  const date = typeof dateString === "string" ? new Date(dateString) : dateString
  return format(date, formatStr, { locale: de })
}

/**
 * Formatiert ein Datum relativ zum aktuellen Tag (Heute, Morgen, Gestern, etc.)
 */
export function formatRelativeDate(dateString: string | Date | null | undefined) {
  if (!dateString) return "Unbekannt"
  const date = typeof dateString === "string" ? new Date(dateString) : dateString

  if (isToday(date)) return "Heute"
  if (isTomorrow(date)) return "Morgen"
  if (isYesterday(date)) return "Gestern"

  return format(date, "dd.MM.yyyy", { locale: de })
}

/**
 * Berechnet das Alter basierend auf dem Geburtsdatum
 */
export function calculateAge(geburtsdatum: string | Date | null | undefined) {
  if (!geburtsdatum) return null
  const heute = new Date()
  const geburtstag = typeof geburtsdatum === "string" ? new Date(geburtsdatum) : geburtsdatum
  let alter = heute.getFullYear() - geburtstag.getFullYear()
  const m = heute.getMonth() - geburtstag.getMonth()
  if (m < 0 || (m === 0 && heute.getDate() < geburtstag.getDate())) {
    alter--
  }
  return alter
}

/**
 * Formatiert einen Zeitraum zwischen zwei Daten
 */
export function formatTimeRange(startDate: string | Date, endDate: string | Date) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

/**
 * Generiert Initialen aus Vor- und Nachname
 */
export function getInitials(firstName?: string, lastName?: string) {
  if (!firstName && !lastName) return ""
  return firstName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

/**
 * Generiert ein Badge für eine Spielerposition
 */
export function getPositionBadge(position?: string) {
  if (!position) return <Badge className="border border-gray-700 bg-background text-gray-300">Keine Position</Badge>

  switch (position) {
    case "Torwart":
      return <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">{position}</Badge>
    case "Abwehr":
      return <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">{position}</Badge>
    case "Mittelfeld":
      return <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">{position}</Badge>
    case "Sturm":
      return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30">{position}</Badge>
    default:
      return <Badge className="border border-gray-700 bg-background text-gray-300">{position}</Badge>
  }
}

/**
 * Generiert ein Badge für den Status eines Spiels
 */
export function getMatchStatusBadge(status: string) {
  switch (status) {
    case "geplant":
      return <Badge className="border border-gray-600 bg-background text-gray-300">Geplant</Badge>
    case "live":
      return <Badge className="bg-red-600 text-white">Live</Badge>
    case "beendet":
      return <Badge className="bg-gray-700 text-gray-300">Beendet</Badge>
    case "abgesagt":
      return <Badge className="bg-destructive text-destructive-foreground">Abgesagt</Badge>
    default:
      return <Badge className="border border-gray-600 bg-background text-gray-300">Unbekannt</Badge>
  }
}

/**
 * Generiert ein Badge für den Status eines Turniers
 */
export function getTournamentStatusBadge(startDate: string, endDate: string, isActive: boolean) {
  if (!isActive) return <Badge className="bg-gray-700 text-gray-300">Inaktiv</Badge>

  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (now < start) return <Badge className="bg-blue-600 text-white">Bevorstehend</Badge>
  if (now > end) return <Badge className="border border-gray-600 bg-background text-gray-300">Abgeschlossen</Badge>
  return <Badge className="bg-green-600 text-white">Aktiv</Badge>
}

/**
 * Formatiert ein Spielergebnis
 */
export function formatMatchResult(match: Match) {
  if (match.status === "geplant" || match.status === "abgesagt") {
    return "vs"
  }
  return `${match.tore_heim} : ${match.tore_gast}`
}

/**
 * Kürzt einen Text auf eine bestimmte Länge
 */
export function truncateText(text: string | null | undefined, maxLength = 100) {
  if (!text || text.length <= maxLength) return text || ""
  return `${text.substring(0, maxLength)}...`
}
