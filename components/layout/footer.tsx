export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-gray-500">&copy; {currentYear} Resadiye Cup. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
