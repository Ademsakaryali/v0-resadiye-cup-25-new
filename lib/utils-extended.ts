import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Kombiniert Tailwind-Klassen mit clsx und twMerge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatiert ein Datum in deutsches Format
 */
export function formatDate(dateString: string | Date, options?: Intl.DateTimeFormatOptions) {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }

  return new Intl.DateTimeFormat("de-DE", options || defaultOptions).format(date)
}

/**
 * Formatiert einen Geldbetrag in Euro
 */
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}

/**
 * Kürzt einen Text auf eine bestimmte Länge
 */
export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

/**
 * Generiert eine zufällige ID
 */
export function generateId(length = 8) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length)
}

/**
 * Verzögert die Ausführung einer Funktion
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Gruppiert ein Array nach einem Schlüssel
 */
export function groupBy<T>(array: T[], key: keyof T) {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key])
      result[groupKey] = result[groupKey] || []
      result[groupKey].push(item)
      return result
    },
    {} as Record<string, T[]>,
  )
}

/**
 * Prüft, ob ein Objekt leer ist
 */
export function isEmptyObject(obj: Record<string, any>) {
  return Object.keys(obj).length === 0
}

/**
 * Entfernt doppelte Einträge aus einem Array
 */
export function removeDuplicates<T>(array: T[], key?: keyof T) {
  if (key) {
    const seen = new Set()
    return array.filter((item) => {
      const value = item[key]
      if (seen.has(value)) return false
      seen.add(value)
      return true
    })
  }

  return [...new Set(array)]
}
