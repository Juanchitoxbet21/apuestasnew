import { type NextRequest, NextResponse } from "next/server"
import { TelegramBot, isValidChatId } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chatIds, message, botToken } = body

    // Validaciones
    if (!botToken) {
      return NextResponse.json({ error: "Bot token es requerido" }, { status: 400 })
    }

    if (!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) {
      return NextResponse.json({ error: "Al menos un chat ID es requerido" }, { status: 400 })
    }

    if (!message) {
      return NextResponse.json({ error: "Mensaje es requerido" }, { status: 400 })
    }

    // Validar chat IDs
    const validChatIds = chatIds.filter((id) => isValidChatId(id))
    if (validChatIds.length === 0) {
      return NextResponse.json({ error: "No se encontraron chat IDs válidos" }, { status: 400 })
    }

    // Enviar mensajes
    const bot = new TelegramBot(botToken)
    const result = await bot.sendToMultipleChats(validChatIds, message)

    return NextResponse.json({
      success: true,
      sent: result.success,
      failed: result.failed,
      total: validChatIds.length,
    })
  } catch (error) {
    console.error("Error en API send-signal:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
