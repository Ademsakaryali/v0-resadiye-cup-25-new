/**
 * Zentrale Farbdefinitionen für die Anwendung
 */
export const themeColors = {
  primary: {
    DEFAULT: "hsl(221, 83%, 53%)", // blue-600
    light: "hsl(221, 83%, 65%)", // blue-500
    dark: "hsl(221, 83%, 45%)", // blue-700
    hover: "hsl(221, 83%, 45%)", // blue-700
  },
  background: {
    DEFAULT: "hsl(222, 47%, 11%)", // gray-900
    light: "hsl(215, 25%, 27%)", // gray-800
    dark: "hsl(222, 47%, 8%)", // gray-950
    card: "hsla(222, 47%, 11%, 0.8)", // gray-900 mit Transparenz
  },
  border: {
    DEFAULT: "hsl(215, 19%, 35%)", // gray-700
    light: "hsl(215, 14%, 45%)", // gray-600
    dark: "hsl(215, 28%, 17%)", // gray-800
  },
  text: {
    DEFAULT: "hsl(0, 0%, 100%)", // white
    muted: "hsl(215, 16%, 70%)", // gray-400
    subtle: "hsl(215, 16%, 55%)", // gray-500
  },
  neon: {
    blue: "0 0 5px hsl(221, 83%, 53%), 0 0 20px hsl(221, 83%, 53%)",
    red: "0 0 5px hsl(0, 84%, 60%), 0 0 20px hsl(0, 84%, 60%)",
    green: "0 0 5px hsl(142, 71%, 45%), 0 0 20px hsl(142, 71%, 45%)",
    yellow: "0 0 5px hsl(48, 96%, 53%), 0 0 20px hsl(48, 96%, 53%)",
  },
}

/**
 * Einheitliche Abstandsdefinitionen
 */
export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
  "3xl": "4rem", // 64px
}

/**
 * Einheitliche Definitionen für Eckenradien
 */
export const borderRadius = {
  sm: "0.125rem", // 2px
  DEFAULT: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  full: "9999px", // Vollständig abgerundet
}

/**
 * Einheitliche Schattendefinitionen
 */
export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  neon: {
    blue: "0 0 5px hsl(221, 83%, 53%), 0 0 20px hsl(221, 83%, 53%)",
    primary: "0 0 5px hsl(221, 83%, 53%), 0 0 20px hsl(221, 83%, 53%)",
  },
}

/**
 * CSS-Klassen für Neon-Effekte
 */
export const neonClasses = {
  text: "text-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.7)]",
  border: "border border-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.7)]",
  glow: "shadow-[0_0_15px_rgba(59,130,246,0.5)]",
}

/**
 * Animationsdefinitionen
 */
export const animations = {
  fadeIn: "animate-fadeIn",
  slideIn: "animate-slideIn",
  pulse: "animate-pulse",
  bounce: "animate-bounce",
}
