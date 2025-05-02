import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/context/auth-context"
import { LayoutProvider } from "@/context/layout-context"
import { AppStateProvider } from "@/context/app-state-context"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { fontSans } from "@/lib/fonts"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Resadiye Cup 25",
  description: "Fußballturnier-Verwaltungsanwendung",
  generator: "v0.dev",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-gray-950 text-white antialiased", fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <AppStateProvider>
              <LayoutProvider>
                <div className="flex min-h-screen flex-col">
                  <div className="flex flex-1">
                    <Sidebar />
                    <div className="flex-1 flex flex-col">
                      <Header />
                      <main className="flex-1 overflow-y-auto">{children}</main>
                    </div>
                  </div>
                </div>
              </LayoutProvider>
            </AppStateProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
