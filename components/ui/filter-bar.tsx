"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

interface FilterBarProps {
  onSearch?: (query: string) => void
  searchValue?: string
  searchPlaceholder?: string
  children?: ReactNode
  onReset?: () => void
  className?: string
}

/**
 * Wiederverwendbare Filterleiste für Datenansichten
 * Ermöglicht die einfache Implementierung von Suchfunktionen und Filtern
 */
export function FilterBar({
  onSearch,
  searchValue = "",
  searchPlaceholder = "Suchen...",
  children,
  onReset,
  className,
}: FilterBarProps) {
  return (
    <div className={`bg-gray-800/50 rounded-lg p-4 border border-gray-700 mb-6 ${className}`}>
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {onSearch && (
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-700 text-white"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          {children}

          {onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
            >
              <X className="h-4 w-4 mr-1" />
              Filter zurücksetzen
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
