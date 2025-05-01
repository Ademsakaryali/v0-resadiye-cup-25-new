import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function RecentActivity() {
  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder.svg" alt="Avatar" />
          <AvatarFallback>OM</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Oliver Müller</p>
          <p className="text-sm text-muted-foreground">Hat ein neues Team registriert: FC Bayern München</p>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">Vor 5m</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder.svg" alt="Avatar" />
          <AvatarFallback>JK</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Julia Krause</p>
          <p className="text-sm text-muted-foreground">Hat ein Blankett eingereicht für: Borussia Dortmund</p>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">Vor 10m</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder.svg" alt="Avatar" />
          <AvatarFallback>MS</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Max Schmidt</p>
          <p className="text-sm text-muted-foreground">Hat einen neuen Spieler hinzugefügt: Thomas Müller</p>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">Vor 15m</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder.svg" alt="Avatar" />
          <AvatarFallback>LW</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Lisa Wagner</p>
          <p className="text-sm text-muted-foreground">Hat ein Turnier erstellt: Resadiye Cup 2023</p>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">Vor 30m</div>
      </div>
    </div>
  )
}
