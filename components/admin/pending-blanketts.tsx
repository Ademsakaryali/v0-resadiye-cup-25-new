import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

export function PendingBlanketts() {
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder.svg" alt="Avatar" />
          <AvatarFallback>FC</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">FC Bayern München</p>
          <p className="text-sm text-muted-foreground">Blankett für Turnier: Resadiye Cup 2023</p>
        </div>
        <div className="ml-auto flex space-x-2">
          <Button
            size="sm"
            className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder.svg" alt="Avatar" />
          <AvatarFallback>BV</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Borussia Dortmund</p>
          <p className="text-sm text-muted-foreground">Blankett für Turnier: Resadiye Cup 2023</p>
        </div>
        <div className="ml-auto flex space-x-2">
          <Button
            size="sm"
            className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder.svg" alt="Avatar" />
          <AvatarFallback>RB</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">RB Leipzig</p>
          <p className="text-sm text-muted-foreground">Blankett für Turnier: Resadiye Cup 2023</p>
        </div>
        <div className="ml-auto flex space-x-2">
          <Button
            size="sm"
            className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
