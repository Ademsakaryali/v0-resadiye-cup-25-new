import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Bell } from "lucide-react"

export function Notifications() {
  return (
    <div className="space-y-4">
      <Alert>
        <Bell className="h-4 w-4" />
        <AlertTitle>Neues Team registriert</AlertTitle>
        <AlertDescription>FC Bayern München hat sich für das Turnier angemeldet.</AlertDescription>
      </Alert>
      <Alert className="bg-destructive/15 text-destructive border-destructive/20">
        <Bell className="h-4 w-4" />
        <AlertTitle>Blankett abgelehnt</AlertTitle>
        <AlertDescription>Ein Blankett wurde von einem Administrator abgelehnt.</AlertDescription>
      </Alert>
      <Alert>
        <Bell className="h-4 w-4" />
        <AlertTitle>Neuer Spieler hinzugefügt</AlertTitle>
        <AlertDescription>Thomas Müller wurde zum Team FC Bayern München hinzugefügt.</AlertDescription>
      </Alert>
    </div>
  )
}
