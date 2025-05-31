import { NextResponse } from "next/server"
import { FootballAPI } from "@/lib/football-api"

export async function GET() {
  try {
    let predictions
    let isBackup = false

    try {
      predictions = await FootballAPI.getTodayPredictions()

      // Si no hay predicciones de la API, usar datos de respaldo
      if (!predictions || predictions.length === 0) {
        predictions = FootballAPI.getFallbackPredictions()
        isBackup = true
      }
    } catch (error) {
      console.error("API failed, using backup data:", error)
      predictions = FootballAPI.getFallbackPredictions()
      isBackup = true
    }

    const recommended = predictions.filter((p) => p.isLikelyOver25 || p.confidence >= 40)

    return NextResponse.json({
      success: true,
      predictions,
      count: predictions.length,
      recommended: recommended.length,
      isBackup,
      message: isBackup
        ? "Usando datos de respaldo debido a límites de API"
        : `${predictions.length} pronósticos obtenidos de la API`,
    })
  } catch (error) {
    console.error("Error in predictions API:", error)

    // En caso de error total, usar datos de respaldo
    const fallbackPredictions = FootballAPI.getFallbackPredictions()
    const recommended = fallbackPredictions.filter((p) => p.isLikelyOver25 || p.confidence >= 40)

    return NextResponse.json({
      success: true,
      predictions: fallbackPredictions,
      count: fallbackPredictions.length,
      recommended: recommended.length,
      isBackup: true,
      message: "Usando datos de respaldo debido a error de API",
    })
  }
}
