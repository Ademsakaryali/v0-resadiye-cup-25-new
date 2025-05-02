"use client"

import type React from "react"
import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { effects } from "@/lib/design-tokens"

// Definiere die Props für die DataCard-Komponente
export interface DataCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: ReactNode
  icon?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  neonBorder?: boolean
  neonTitle?: boolean
  onClick?: () => void
}

/**
 * Wiederverwendbare Karten-Komponente für Datenansichten mit Accessibility und Performance-Optimierungen
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
  ...rest
}: DataCardProps) {
  // Erstelle die Klassen für die Card
  const cardClasses = cn(
    "border border-gray-800 bg-gray-900/60",
    neonBorder && effects.neon.primary,
    onClick && "cursor-pointer transition-all duration-200 hover:shadow-md",
    className,
  )

  // Erstelle die Klassen für den Titel
  const titleClasses = cn("text-white", neonTitle && effects.neon.text)

  // Tastatur-Handling für Accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!onClick) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <Card
      className={cardClasses}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <CardTitle className={titleClasses}>{title}</CardTitle>
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
