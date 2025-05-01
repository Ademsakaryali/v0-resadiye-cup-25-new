"use client"

import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { effects } from "@/lib/design-tokens"

interface DataCardProps {
  /** Titel der Karte */
  title: string
  /** Optionale Beschreibung */
  description?: ReactNode
  /** Optionales Icon links vom Titel */
  icon?: ReactNode
  /** Optionale Aktionen rechts vom Titel */
  actions?: ReactNode
  /** Hauptinhalt der Karte */
  children?: ReactNode
  /** Optionaler Footer-Inhalt */
  footer?: ReactNode
  /** Zusätzliche CSS-Klassen */
  className?: string
  /** Klick-Handler für die gesamte Karte */
  onClick?: () => void
  /** Neon-Effekt für den Rand */
  neonBorder?: boolean
  /** Neon-Effekt für den Titel */
  neonTitle?: boolean
}

/**
 * Wiederverwendbare Karten-Komponente für Datenansichten
 * Bietet konsistente Struktur für Titel, Beschreibung, Inhalt und Aktionen
 */
export function DataCard({
  title,
  description,
  icon,
  actions,
  children,
  footer,
  className,
  onClick,
  neonBorder = false,
  neonTitle = false,
}: DataCardProps) {
  return (
    <Card
      className={cn(
        "border border-gray-800 bg-gray-900/60",
        neonBorder && effects.neon.primary,
        onClick && "cursor-pointer transition-all duration-200 hover:shadow-md",
        className,
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <CardTitle className={cn("text-white", neonTitle && effects.neon.text)}>{title}</CardTitle>
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
        {description && <CardDescription className="text-gray-400 mt-1">{description}</CardDescription>}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  )
}
