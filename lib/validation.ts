export type ValidationRule = {
  validate: (value: any) => boolean
  message: string
}

export type ValidationRules = {
  [key: string]: ValidationRule[]
}

/**
 * Validiert Formularwerte anhand definierter Regeln
 * @param values - Die zu validierenden Werte
 * @param rules - Die Validierungsregeln
 * @returns Validierungsergebnis mit Fehlermeldungen
 */
export function validateForm(values: { [key: string]: any }, rules: ValidationRules) {
  const errors: { [key: string]: string } = {}

  Object.entries(rules).forEach(([field, fieldRules]) => {
    const value = values[field]

    for (const rule of fieldRules) {
      if (!rule.validate(value)) {
        errors[field] = rule.message
        break
      }
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Vordefinierte Validierungsregeln
export const required: (message?: string) => ValidationRule = (message = "Dieses Feld ist erforderlich") => ({
  validate: (value) => value !== undefined && value !== null && value !== "",
  message,
})

export const email: (message?: string) => ValidationRule = (
  message = "Bitte geben Sie eine gültige E-Mail-Adresse ein",
) => ({
  validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  message,
})

export const minLength: (length: number, message?: string) => ValidationRule = (
  length,
  message = `Mindestens ${length} Zeichen erforderlich`,
) => ({
  validate: (value) => value.length >= length,
  message,
})

export const maxLength: (length: number, message?: string) => ValidationRule = (
  length,
  message = `Maximal ${length} Zeichen erlaubt`,
) => ({
  validate: (value) => value.length <= length,
  message,
})

export const numeric: (message?: string) => ValidationRule = (message = "Nur Zahlen sind erlaubt") => ({
  validate: (value) => /^\d+$/.test(value),
  message,
})

export const date: (message?: string) => ValidationRule = (message = "Bitte geben Sie ein gültiges Datum ein") => ({
  validate: (value) => !isNaN(Date.parse(value)),
  message,
})

export const minValue: (min: number, message?: string) => ValidationRule = (
  min,
  message = `Der Wert muss mindestens ${min} sein`,
) => ({
  validate: (value) => Number(value) >= min,
  message,
})

export const maxValue: (max: number, message?: string) => ValidationRule = (
  max,
  message = `Der Wert darf höchstens ${max} sein`,
) => ({
  validate: (value) => Number(value) <= max,
  message,
})

export const pattern: (regex: RegExp, message: string) => ValidationRule = (regex, message) => ({
  validate: (value) => regex.test(value),
  message,
})
