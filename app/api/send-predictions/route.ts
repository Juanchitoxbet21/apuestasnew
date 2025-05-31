import { NextResponse } from "next/server"

interface MatchPrediction {
  homeTeam: string
  awayTeam: string
  league: string
  matchDate: string
  matchTime: string
  avgGoals: number
  over25Pct: number
  isLikelyOver25: boolean
  homeWinProb: number
  drawProb: number
  awayWinProb: number
  predictedWinner: "home" | "away" | "draw"
  confidence: number
}

export async function POST(request: Request) {
  try {
    const { chatIds, predictions }: { chatIds: string[]; predictions: MatchPrediction[] } = await request.json()

    if (!chatIds || chatIds.length === 0) {
      return NextResponse.json({ success: false, error: "Chat IDs requeridos" }, { status: 400 })
    }

    if (!predictions || predictions.length === 0) {
      return NextResponse.json({ success: false, error: "No hay predicciones para enviar" }, { status: 400 })
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      return NextResponse.json({ success: false, error: "Token de bot no configurado" }, { status: 500 })
    }

    // Formato optimizado para máximo 5 pronósticos TOP
    const formatTopPredictions = () => {
      const currentTime = new Date().toLocaleString("es-CO", {
        timeZone: "America/Bogota",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })

      let message = `🎯 **TOP 5 PRONÓSTICOS DEL DÍA** 🔥
📅 ${new Date().toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}
⚡ Solo los mejores ${predictions.length} partidos

`

      predictions.forEach((prediction, index) => {
        const winnerText =
          prediction.predictedWinner === "home"
            ? prediction.homeTeam
            : prediction.predictedWinner === "away"
              ? prediction.awayTeam
              : "EMPATE"

        const confidenceEmoji = prediction.confidence >= 75 ? "🔥" : prediction.confidence >= 65 ? "⚡" : "✅"
        const goalsEmoji = prediction.isLikelyOver25 ? "⚽🔥" : "🛡️"

        message += `**${index + 1}.** ${confidenceEmoji} **${prediction.homeTeam} vs ${prediction.awayTeam}**
🏆 ${prediction.league}
⏰ ${prediction.matchTime}
🏅 **${winnerText}** (${prediction.confidence}% confianza)
📊 ${prediction.homeWinProb}% | ${prediction.drawProb}% | ${prediction.awayWinProb}%
${
  prediction.isLikelyOver25
    ? `${goalsEmoji} **OVER 2.5** (${prediction.over25Pct}% - ${prediction.avgGoals} goles)`
    : `🛡️ **Partido cerrado** (${prediction.avgGoals} goles)`
}

`
      })

      message += `⚠️ *Solo estadísticas puras - API real*
🔔 *Apuesta responsablemente*
🎯 *Máximo 5 pronósticos de alta calidad*

---
⏰ **Enviado:** ${currentTime}`

      return message
    }

    const message = formatTopPredictions()

    // Enviar a cada chat
    let successCount = 0
    let failCount = 0

    for (const chatId of chatIds) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "Markdown",
          }),
        })

        if (response.ok) {
          successCount++
        } else {
          failCount++
          console.error(`Error enviando a chat ${chatId}:`, await response.text())
        }

        // Delay entre envíos para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        failCount++
        console.error(`Error enviando a chat ${chatId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failCount,
      recommended: predictions.filter((p) => p.isLikelyOver25 || p.confidence >= 40).length,
    })
  } catch (error) {
    console.error("Error in send-predictions API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error enviando predicciones",
      },
      { status: 500 },
    )
  }
}
