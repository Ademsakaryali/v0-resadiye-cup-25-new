import { Badge } from "@/components/ui/badge"
import type { Match } from "@/lib/types"

/**
 * Generiert Initialen aus Vor- und Nachname
 * @param firstName - Vorname
 * @param lastName - Nachname (optional)
 * @returns Initialen als String
 */
export function getInitials(firstName: string, lastName?: string) {
  if (!firstName) return ""
  if (!lastName) {
    return firstName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

/**
 * Generiert einen vollständigen Namen aus Vor- und Nachname
 * @param firstName - Vorname
 * @param lastName - Nachname
 * @returns Vollständiger Name
 */
export function getFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`
}

/**
 * Generiert ein Badge für eine Spielerposition
 * @param position - Die Position des Spielers
 * @returns Ein Badge-Element mit entsprechender Formatierung
 */
export function getPositionBadge(position?: string) {
  if (!position)
    return (
      <Badge variant="outline" className="border-gray-700 text-gray-300">
        Keine Position
      </Badge>
    )

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
      return (
        <Badge variant="outline" className="border-gray-700 text-gray-300">
          {position}
        </Badge>
      )
  }
}

/**
 * Generiert ein Badge für den Status eines Spiels
 * @param status - Der Status des Spiels
 * @returns Ein Badge-Element mit entsprechender Formatierung
 */
export function getMatchStatusBadge(status: string) {
  switch (status) {
    case "geplant":
      return (
        <Badge variant="outline" className="border-gray-600 text-gray-300">
          Geplant
        </Badge>
      )
    case "live":
      return <Badge className="bg-red-600 text-white">Live</Badge>
    case "beendet":
      return (
        <Badge variant="secondary" className="bg-gray-700 text-gray-300">
          Beendet
        </Badge>
      )
    case "abgesagt":
      return <Badge variant="destructive">Abgesagt</Badge>
    default:
      return (
        <Badge variant="outline" className="border-gray-600 text-gray-300">
          Unbekannt
        </Badge>
      )
  }
}

/**
 * Generiert ein Badge für den Status eines Turniers
 * @param startDate - Das Startdatum des Turniers
 * @param endDate - Das Enddatum des Turniers
 * @param isActive - Gibt an, ob das Turnier aktiv ist
 * @returns Ein Badge-Element mit entsprechender Formatierung
 */
export function getTournamentStatusBadge(startDate: string, endDate: string, isActive: boolean) {
  if (!isActive)
    return (
      <Badge variant="secondary" className="bg-gray-700 text-gray-300">
        Inaktiv
      </Badge>
    )

  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (now < start) return <Badge className="bg-blue-600 text-white">Bevorstehend</Badge>
  if (now > end)
    return (
      <Badge variant="outline" className="border-gray-600 text-gray-300">
        Abgeschlossen
      </Badge>
    )
  return <Badge className="bg-green-600 text-white">Aktiv</Badge>
}

/**
 * Generiert ein Badge für den Status eines Blanketts
 * @param status - Der Status des Blanketts
 * @returns Ein Badge-Element mit entsprechender Formatierung
 */
export function getBlankettStatusBadge(status: string) {
  switch (status) {
    case "entwurf":
      return (
        <Badge variant="outline" className="border-gray-600 text-gray-300">
          Entwurf
        </Badge>
      )
    case "eingereicht":
      return <Badge className="bg-yellow-600 text-white">Eingereicht</Badge>
    case "genehmigt":
      return <Badge className="bg-green-600 text-white">Genehmigt</Badge>
    case "abgelehnt":
      return <Badge variant="destructive">Abgelehnt</Badge>
    default:
      return (
        <Badge variant="outline" className="border-gray-600 text-gray-300">
          Unbekannt
        </Badge>
      )
  }
}

/**
 * Formatiert ein Spielergebnis
 * @param match - Das Spiel mit den Ergebnissen
 * @returns Formatiertes Spielergebnis als String
 */
export function formatMatchResult(match: Match) {
  if (match.status === "geplant" || match.status === "abgesagt") {
    return "vs"
  }
  return `${match.tore_heim} : ${match.tore_gast}`
}

/**
 * Formatiert eine Telefonnummer für die Anzeige
 * @param phoneNumber - Die zu formatierende Telefonnummer
 * @returns Formatierte Telefonnummer
 */
export function formatPhoneNumber(phoneNumber?: string) {
  if (!phoneNumber) return "Keine Telefonnummer"

  // Einfache Formatierung für deutsche Telefonnummern
  // Kann je nach Anforderung angepasst werden
  return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")
}

/**
 * Kürzt einen Text auf eine bestimmte Länge
 * @param text - Der zu kürzende Text
 * @param maxLength - Die maximale Länge
 * @returns Gekürzter Text mit Ellipsis
 */
export function truncateText(text: string, maxLength = 100) {
  if (!text || text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}
