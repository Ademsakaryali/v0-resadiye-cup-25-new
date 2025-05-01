import { format, isToday, isTomorrow, isYesterday } from "date-fns"
import { de } from "date-fns/locale"

/**
 * Formatiert ein Datum in ein lesbares Format
 * @param dateString - Das zu formatierende Datum als String
 * @param formatStr - Das Format-Template (Standard: dd.MM.yyyy)
 * @returns Formatiertes Datum als String
 */
export function formatDate(dateString: string | Date, formatStr = "dd.MM.yyyy") {
  if (!dateString) return "Unbekannt"
  const date = typeof dateString === "string" ? new Date(dateString) : dateString
  return format(date, formatStr, { locale: de })
}

/**
 * Formatiert ein Datum mit Uhrzeit in ein lesbares Format
 * @param dateString - Das zu formatierende Datum als String
 * @param formatStr - Das Format-Template (Standard: dd.MM.yyyy HH:mm)
 * @returns Formatiertes Datum mit Uhrzeit als String
 */
export function formatDateTime(dateString: string | Date, formatStr = "dd.MM.yyyy HH:mm") {
  if (!dateString) return "Unbekannt"
  const date = typeof dateString === "string" ? new Date(dateString) : dateString
  return format(date, formatStr, { locale: de })
}

/**
 * Formatiert ein Datum relativ zum aktuellen Tag (Heute, Morgen, Gestern, etc.)
 * @param dateString - Das zu formatierende Datum als String
 * @returns Relativer Datumsstring
 */
export function formatRelativeDate(dateString: string | Date) {
  if (!dateString) return "Unbekannt"
  const date = typeof dateString === "string" ? new Date(dateString) : dateString

  if (isToday(date)) return "Heute"
  if (isTomorrow(date)) return "Morgen"
  if (isYesterday(date)) return "Gestern"

  return format(date, "dd.MM.yyyy", { locale: de })
}

/**
 * Berechnet das Alter basierend auf dem Geburtsdatum
 * @param geburtsdatum - Das Geburtsdatum als String
 * @returns Alter als Zahl
 */
export function calculateAge(geburtsdatum: string | Date) {
  if (!geburtsdatum) return ""
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
 * @param startDate - Das Startdatum
 * @param endDate - Das Enddatum
 * @returns Formatierter Zeitraum als String
 */
export function formatTimeRange(startDate: string | Date, endDate: string | Date) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

/**
 * Formatiert eine Zeitdauer in Minuten und Sekunden
 * @param minutes - Die Anzahl der Minuten
 * @returns Formatierte Zeitdauer als String
 */
export function formatMatchTime(minutes: number) {
  if (minutes === 0) return "00:00"
  const mins = Math.floor(minutes)
  const secs = Math.round((minutes - mins) * 60)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

/**
 * Prüft, ob ein Datum in der Vergangenheit liegt
 * @param dateString - Das zu prüfende Datum
 * @returns true, wenn das Datum in der Vergangenheit liegt
 */
export function isPastDate(dateString: string | Date) {
  if (!dateString) return false
  const date = typeof dateString === "string" ? new Date(dateString) : dateString
  return date < new Date()
}

/**
 * Prüft, ob ein Datum in der Zukunft liegt
 * @param dateString - Das zu prüfende Datum
 * @returns true, wenn das Datum in der Zukunft liegt
 */
export function isFutureDate(dateString: string | Date) {
  if (!dateString) return false
  const date = typeof dateString === "string" ? new Date(dateString) : dateString
  return date > new Date()
}
