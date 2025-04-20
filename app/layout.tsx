import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LayoutProvider } from "@/context/layout-context"
import { AuthProvider } from "@/context/auth-context"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Resadiye Cup",
  description: "Fußball-Turnier-Verwaltungsanwendung",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gray-50 dark:bg-gray-900`}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            <LayoutProvider>
              <div className="flex min-h-screen">
                <Sidebar />
                <div className="flex-1 flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-1 pb-8">{children}</main>
                  <Footer />
                </div>
              </div>
            </LayoutProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
