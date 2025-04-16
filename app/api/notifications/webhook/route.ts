import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// Diese Funktion würde in einer echten Anwendung implementiert werden
async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  // Hier würde die Integration mit der WhatsApp Business API erfolgen
  console.log(`Sending WhatsApp message to ${phoneNumber}: ${message}`)
  return true
}

// Diese Funktion würde in einer echten Anwendung implementiert werden
async function sendTelegramMessage(chatId: string, message: string) {
  // Hier würde die Integration mit der Telegram Bot API erfolgen
  console.log(`Sending Telegram message to ${chatId}: ${message}`)
  return true
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Überprüfen, ob es sich um eine Blankett-Einreichung handelt
    if (body.type === "blankett_submitted") {
      const blankettId = body.blankett_id

      // Blankett-Details abrufen
      const { data: blankett, error: blankettError } = await supabase
        .from("blankett_entries")
        .select(`
          id,
          team_id,
          tournament_id,
          status,
          eingereicht_am,
          team:team_id (
            id,
            name,
            trainer:trainer_id (
              id,
              vorname,
              nachname,
              email
            )
          ),
          tournament:tournament_id (
            id,
            name
          )
        `)
        .eq("id", blankettId)
        .single()

      if (blankettError) {
        throw blankettError
      }

      // Admin-Benutzer abrufen, die Benachrichtigungen erhalten sollen
      const { data: admins, error: adminsError } = await supabase
        .from("users")
        .select("id, vorname, nachname, notification_method, notification_number")
        .eq("rolle", "Admin")
        .eq("notification_enabled", true)

      if (adminsError) {
        throw adminsError
      }

      // Nachricht erstellen
      const message = `Neues Blankett eingereicht: Team "${blankett.team.name}" hat ein Blankett für das Turnier "${blankett.tournament.name}" eingereicht.`

      // Benachrichtigungen an alle Admins senden
      for (const admin of admins) {
        if (admin.notification_method === "whatsapp" && admin.notification_number) {
          await sendWhatsAppMessage(admin.notification_number, message)
        } else if (admin.notification_method === "telegram" && admin.notification_number) {
          await sendTelegramMessage(admin.notification_number, message)
        }
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: "Unbekannter Benachrichtigungstyp" })
  } catch (error) {
    console.error("Fehler beim Verarbeiten der Benachrichtigung:", error)
    return NextResponse.json({ success: false, error: "Interner Serverfehler" }, { status: 500 })
  }
}
