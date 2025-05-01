/**
 * Design-Tokens für die gesamte Anwendung
 * Diese Datei dient als zentrale Quelle für alle Design-Werte
 */

export const colors = {
  // Primärfarben
  primary: {
    light: "text-primary-400 bg-primary-50 border-primary-200",
    default: "text-white bg-primary-600 hover:bg-primary-700",
    dark: "text-white bg-primary-800 hover:bg-primary-900",
    outline: "text-primary-600 bg-transparent border border-primary-600 hover:bg-primary-50",
  },

  // Hintergrundfarben
  background: {
    light: "bg-gray-50 dark:bg-gray-900/20",
    default: "bg-white dark:bg-gray-900/60",
    dark: "bg-gray-100 dark:bg-gray-800/50",
    card: "bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800",
  },

  // Textfarben
  text: {
    primary: "text-gray-900 dark:text-white",
    secondary: "text-gray-700 dark:text-gray-300",
    muted: "text-gray-500 dark:text-gray-400",
    accent: "text-primary-600 dark:text-primary-400",
  },

  // Status-Farben
  status: {
    success:
      "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800/50",
    warning:
      "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800/50",
    error: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800/50",
    info: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800/50",
  },
}

export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
  "3xl": "4rem", // 64px
}

export const typography = {
  fontSizes: {
    xs: "text-xs", // 0.75rem
    sm: "text-sm", // 0.875rem
    base: "text-base", // 1rem
    lg: "text-lg", // 1.125rem
    xl: "text-xl", // 1.25rem
    "2xl": "text-2xl", // 1.5rem
    "3xl": "text-3xl", // 1.875rem
    "4xl": "text-4xl", // 2.25rem
  },
  fontWeights: {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  },
  lineHeights: {
    none: "leading-none",
    tight: "leading-tight",
    normal: "leading-normal",
    relaxed: "leading-relaxed",
  },
}

export const effects = {
  shadows: {
    sm: "shadow-sm",
    md: "shadow",
    lg: "shadow-lg",
    xl: "shadow-xl",
  },
  transitions: {
    fast: "transition-all duration-150",
    default: "transition-all duration-200",
    slow: "transition-all duration-300",
  },
  neon: {
    primary: "shadow-[0_0_5px_rgba(12,135,232,0.5),0_0_20px_rgba(12,135,232,0.3)]",
    text: "text-primary-500 drop-shadow-[0_0_2px_rgba(12,135,232,0.7)]",
  },
}

export const layout = {
  container: {
    default: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    sm: "max-w-3xl mx-auto px-4 sm:px-6",
    lg: "max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8",
  },
  card: {
    default: "rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm",
    interactive:
      "rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm hover:shadow-md transition-all duration-200",
    neon: "rounded-lg border border-primary-500/30 bg-white dark:bg-gray-900/60 shadow-[0_0_5px_rgba(12,135,232,0.15)] hover:shadow-[0_0_15px_rgba(12,135,232,0.25)] transition-all duration-200",
  },
}

export const components = {
  button: {
    base: "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
    primary: "bg-primary-600 text-white hover:bg-primary-700",
    secondary: "bg-gray-800 text-white hover:bg-gray-700",
    outline: "border border-gray-700 bg-transparent text-gray-200 hover:bg-gray-800 hover:text-white",
    ghost: "hover:bg-gray-800 text-gray-300 hover:text-white",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  },
  badge: {
    base: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
    primary: "bg-primary-500/20 text-primary-400 hover:bg-primary-500/30",
    secondary: "bg-gray-700 text-gray-300",
    outline: "border border-gray-700 text-gray-300",
    success: "bg-green-500/20 text-green-400 hover:bg-green-500/30",
    warning: "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30",
    error: "bg-red-500/20 text-red-400 hover:bg-red-500/30",
  },
}

/**
 * Hilfsfunktion zum Kombinieren von Tailwind-Klassen
 * @param baseClasses - Basis-Klassen
 * @param conditionalClasses - Bedingte Klassen als Objekt mit Bedingung als Schlüssel
 * @returns Kombinierte Klassen-String
 */
export function classNames(baseClasses: string, conditionalClasses: Record<string, boolean> = {}): string {
  const classes = [baseClasses]

  Object.entries(conditionalClasses).forEach(([className, condition]) => {
    if (condition) {
      classes.push(className)
    }
  })

  return classes.filter(Boolean).join(" ")
}
