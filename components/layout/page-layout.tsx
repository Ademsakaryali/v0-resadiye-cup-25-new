import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { effects, layout } from "@/lib/design-tokens"

interface PageLayoutProps {
  /** Seitentitel */
  title: string
  /** Optionale Beschreibung unter dem Titel */
  description?: string
  /** Optionaler Link für den Zurück-Button */
  backLink?: string
  /** Optionaler Text für den Zurück-Button */
  backLabel?: string
  /** Optionale Aktionen in der oberen rechten Ecke */
  actions?: ReactNode
  /** Hauptinhalt der Seite */
  children: ReactNode
  /** Zusätzliche CSS-Klassen */
  className?: string
  /** Neon-Effekt für den Titel */
  neonTitle?: boolean
}

/**
 * Wiederverwendbare Komponente für Seitenlayouts
 * Bietet konsistente Struktur für Titel, Beschreibung, Zurück-Button und Aktionen
 */
export function PageLayout({
  title,
  description,
  backLink,
  backLabel = "Zurück",
  actions,
  children,
  className,
  neonTitle = true,
}: PageLayoutProps) {
  return (
    <div className={cn(layout.container.default, "py-6", className)}>
      {backLink && (
        <Button className="hover:bg-gray-800 hover:text-primary-400 mb-4 text-gray-300 transition-colors" asChild>
          <Link href={backLink}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className={cn("text-3xl font-bold text-white", neonTitle && effects.neon.text)}>{title}</h1>
          {description && <p className="text-gray-400 mt-1">{description}</p>}
        </div>
        {actions && <div className="mt-4 sm:mt-0">{actions}</div>}
      </div>

      {children}
    </div>
  )
}
