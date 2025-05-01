"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

interface ErrorHandlerProps {
  error: string | null
  resetError?: () => void
  backLink?: string
  backLabel?: string
}

/**
 * Einheitliche Fehlerbehandlungskomponente
 * Stellt Fehler konsistent dar und bietet Optionen zum Zurücksetzen oder Navigieren
 */
export function ErrorHandler({
  error,
  resetError,
  backLink = "/",
  backLabel = "Zurück zur Startseite",
}: ErrorHandlerProps) {
  if (!error) return null

  return (
    <div className="space-y-4">
      <Alert className="bg-red-900/20 border-red-800 text-red-300">
        <AlertCircle className="h-4 w-4 text-red-400" />
        <AlertTitle className="text-red-300">Fehler</AlertTitle>
        <AlertDescription className="text-red-200">{error}</AlertDescription>
      </Alert>
      <div className="flex gap-4">
        {resetError && (
          <Button
            onClick={resetError}
            className="border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
          >
            Erneut versuchen
          </Button>
        )}
        <Button asChild className="border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white">
          <Link href={backLink}>{backLabel}</Link>
        </Button>
      </div>
    </div>
  )
}
