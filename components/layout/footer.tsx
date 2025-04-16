export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t py-4 px-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">&copy; {currentYear} Resadiye Cup. Alle Rechte vorbehalten.</p>
        <div className="text-sm text-muted-foreground">Version 1.0.0</div>
      </div>
    </footer>
  )
}
