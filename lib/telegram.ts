// Funciones para integración con Telegram Bot API

interface TelegramMessage {
  chat_id: string
  text: string
  parse_mode?: "Markdown" | "HTML"
}

export class TelegramBot {
  private botToken: string

  constructor(botToken: string) {
    this.botToken = botToken
  }

  async sendMessage(chatId: string, message: string): Promise<boolean> {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`

      const payload: TelegramMessage = {
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("Error enviando mensaje a Telegram:", result)
        return false
      }

      return result.ok
    } catch (error) {
      console.error("Error en sendMessage:", error)
      return false
    }
  }

  async sendToMultipleChats(chatIds: string[], message: string): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    for (const chatId of chatIds) {
      const sent = await this.sendMessage(chatId, message)
      if (sent) {
        success++
      } else {
        failed++
      }

      // Delay entre envíos para evitar rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    return { success, failed }
  }
}

// Función helper para validar chat ID
export function isValidChatId(chatId: string): boolean {
  // Chat IDs pueden ser números positivos (usuarios) o negativos (grupos/canales)
  const chatIdRegex = /^-?\d+$/
  return chatIdRegex.test(chatId.trim())
}

// Función para formatear mensaje con emojis y estructura
export function formatBettingSignal(data: {
  game: string
  league: string
  market: string
  prediction: string
  odds: string
  stake: string
  confidence: number
  time: string
  additionalInfo?: string
}): string {
  const confidenceEmoji =
    data.confidence >= 90 ? "🔥" : data.confidence >= 80 ? "⚡" : data.confidence >= 70 ? "✅" : "⚠️"

  const currentTime = new Date().toLocaleString("es-ES", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

  return `🎯 **SEÑAL DE APUESTA** ${confidenceEmoji}

🏆 **Partido:** ${data.game}
⚽ **Liga:** ${data.league}
📊 **Mercado:** ${data.market}
🎲 **Predicción:** ${data.prediction}
💰 **Cuota:** ${data.odds}
💵 **Stake:** ${data.stake}
📈 **Confianza:** ${data.confidence}%
⏰ **Hora:** ${data.time}
📅 **Fecha:** ${new Date().toLocaleDateString("es-ES")}

${data.additionalInfo ? `📝 **Info adicional:** ${data.additionalInfo}` : ""}

🔔 ¡Buena suerte y apuesta responsablemente!

---
⏰ Enviado: ${currentTime}`
}
