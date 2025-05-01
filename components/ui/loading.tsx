import { cn } from "@/lib/utils"

type LoadingProps = {
  /** Größe des Spinners: klein, mittel oder groß */
  size?: "sm" | "md" | "lg"
  /** Farbe des Spinners */
  color?: "primary" | "white" | "gray"
  /** Zusätzliche CSS-Klassen */
  className?: string
  /** Text, der neben dem Spinner angezeigt wird */
  text?: string
  /** Position des Textes: links oder rechts vom Spinner */
  textPosition?: "left" | "right"
  /** Vollständige Seite füllen */
  fullPage?: boolean
}

/**
 * Wiederverwendbare Ladekomponente mit verschiedenen Größen und Stilen
 */
export function Loading({
  size = "md",
  color = "primary",
  className,
  text,
  textPosition = "right",
  fullPage = false,
}: LoadingProps) {
  // Größen-Mapping
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  }

  // Farben-Mapping
  const colorClasses = {
    primary: "border-b-primary-600",
    white: "border-b-white",
    gray: "border-b-gray-400",
  }

  // Container-Klassen
  const containerClasses = fullPage
    ? "flex justify-center items-center min-h-[calc(100vh-4rem)]"
    : "flex items-center justify-center"

  return (
    <div className={cn(containerClasses, className)}>
      <div className="flex items-center gap-3">
        {text && textPosition === "left" && <span className="text-gray-500 dark:text-gray-400">{text}</span>}
        <div className={cn("animate-spin rounded-full border-transparent", sizeClasses[size], colorClasses[color])} />
        {text && textPosition === "right" && <span className="text-gray-500 dark:text-gray-400">{text}</span>}
      </div>
    </div>
  )
}

/**
 * Ladekomponente speziell für Seitenladezustände
 */
export function PageLoading({ text = "Wird geladen..." }: { text?: string }) {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col items-center gap-3">
        <Loading size="lg" color="primary" />
        <p className="text-gray-500 dark:text-gray-400 animate-pulse">{text}</p>
      </div>
    </div>
  )
}

/**
 * Einfacher Spinner für Buttons und kleine UI-Elemente
 */
export function LoadingSpinner({ className = "", size = "sm" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div className={cn("flex justify-center items-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-b-2 border-transparent border-b-primary-600",
          sizeClasses[size],
        )}
      ></div>
    </div>
  )
}

/**
 * Ladekomponente für Inline-Verwendung in Textelementen
 */
export function InlineLoading({ className = "" }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center", className)}>
      <div className="animate-spin rounded-full h-3 w-3 border-2 border-transparent border-b-current"></div>
    </div>
  )
}
