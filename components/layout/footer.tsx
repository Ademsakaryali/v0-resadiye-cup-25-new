"use client"

import { useLayout } from "@/context/layout-context"
import Link from "next/link"

export function Footer() {
  const { sidebarExpanded, isMobile } = useLayout()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t border-gray-800 py-4 px-6 bg-gray-900">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-400">
            &copy; {currentYear} <span className="neon-text text-blue-400">Resadiye Cup</span>. Alle Rechte vorbehalten.
          </p>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/impressum" className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200">
            Impressum
          </Link>
          <Link
            href="/datenschutz"
            className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200"
          >
            Datenschutz
          </Link>
          <Link href="/kontakt" className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200">
            Kontakt
          </Link>
        </div>

        <div className="text-sm text-gray-500 bg-gray-800 px-3 py-1 rounded-full neon-border">Version 1.0.0</div>
      </div>
    </footer>
  )
}
