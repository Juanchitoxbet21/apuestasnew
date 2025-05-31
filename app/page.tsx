"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Clock, Send, RefreshCw, Bot, BarChart3, Target, Zap, Users, Trash2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  odds: {
    homeWin: number
    draw: number
    awayWin: number
    over25: number
    under25: number
  }
  stake: {
    recommended: number
    confidence: "low" | "medium" | "high"
    units: number
  }
  value: number
}

interface ChatConfig {
  id: string
  name: string
  enabled: boolean
}

export default function FootballPredictionsBot() {
  const [predictions, setPredictions] = useState<MatchPrediction[]>([])
  const [isBackup, setIsBackup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [currentTime, setCurrentTime] = useState("")
  const [apiMessage, setApiMessage] = useState<string>("")
  const [chatConfigs, setChatConfigs] = useState<ChatConfig[]>([
    { id: "6097718185", name: "Chat Principal", enabled: true },
    { id: "", name: "Chat VIP", enabled: false },
  ])
  const { toast } = useToast()

  // Actualizar hora colombiana
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const colombianTime = now.toLocaleString("es-CO", {
        timeZone: "America/Bogota",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      setCurrentTime(colombianTime)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchPredictions = async () => {
    setLoading(true)
    setApiMessage("")
    try {
      const response = await fetch("/api/predictions")
      const data = await response.json()

      if (data.success) {
        setPredictions(data.predictions)
        setIsBackup(data.isBackup)
        setApiMessage(data.message)
        toast({
          title: "✅ Predicciones actualizadas",
          description: data.message,
        })
      } else {
        toast({
          title: "❌ Error",
          description: "No se pudieron obtener las predicciones",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const sendPredictions = async () => {
    const enabledChats = chatConfigs.filter((chat) => chat.enabled && chat.id.trim())

    if (enabledChats.length === 0) {
      toast({
        title: "❌ Error",
        description: "Configura al menos un Chat ID habilitado",
        variant: "destructive",
      })
      return
    }

    if (predictions.length === 0) {
      toast({
        title: "❌ Error",
        description: "No hay predicciones para enviar",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      const response = await fetch("/api/send-predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatIds: enabledChats.map((chat) => chat.id),
          predictions: predictions,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "🚀 ¡Enviado exitosamente!",
          description: `${predictions.length} pronósticos enviados a ${enabledChats.length} chat(s)`,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudieron enviar las predicciones",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleChatConfigChange = (index: number, field: keyof ChatConfig, value: string | boolean) => {
    setChatConfigs((prev) => prev.map((chat, i) => (i === index ? { ...chat, [field]: value } : chat)))
  }

  const addChatConfig = () => {
    setChatConfigs((prev) => [
      ...prev,
      {
        id: "",
        name: `Chat ${prev.length + 1}`,
        enabled: false,
      },
    ])
  }

  const removeChatConfig = (index: number) => {
    if (chatConfigs.length > 1) {
      setChatConfigs((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const recommended = predictions.filter((p) => p.isLikelyOver25 || p.confidence >= 40)
  const highConfidence = predictions.filter((p) => p.confidence >= 60)

  useEffect(() => {
    fetchPredictions()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <Target className="h-10 w-10 text-blue-400" />
            PRONÓSTICO REAL
          </h1>
          <p className="text-blue-200">Bot con API real - Máximo 5 pronósticos</p>
          <div className="flex items-center justify-center gap-2 text-sm text-blue-300">
            <Clock className="h-4 w-4" />
            <span>Hora Colombia: {currentTime}</span>
          </div>
        </div>

        {/* Mensaje de estado de API */}
        {apiMessage && (
          <Card className={`${isBackup ? "bg-yellow-900/30 border-yellow-700" : "bg-green-900/30 border-green-700"}`}>
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className={`h-5 w-5 ${isBackup ? "text-yellow-400" : "text-green-400"}`} />
              <div>
                <p className={`${isBackup ? "text-yellow-200" : "text-green-200"} font-semibold`}>
                  {isBackup ? "Datos de Respaldo" : "API Funcionando"}
                </p>
                <p className={`${isBackup ? "text-yellow-300" : "text-green-300"} text-sm`}>{apiMessage}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Pronósticos</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{predictions.length}</div>
              <p className="text-xs text-blue-300 mt-1">Máximo 5 por día</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Recomendados</CardTitle>
              <Bot className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{recommended.length}</div>
              <p className="text-xs text-green-300 mt-1">Confianza +40%</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Alta Confianza</CardTitle>
              <Zap className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{highConfidence.length}</div>
              <p className="text-xs text-yellow-300 mt-1">+60% confianza</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Estado</CardTitle>
              <div className={`h-2 w-2 rounded-full ${isBackup ? "bg-yellow-500" : "bg-green-500"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-white">{isBackup ? "Respaldo" : "API Real"}</div>
              <p className="text-xs text-blue-300 mt-1">{isBackup ? "Datos seguros" : "Datos en vivo"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Configuración de Chats */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Configuración de Chats de Telegram
            </CardTitle>
            <CardDescription className="text-blue-300">Configura múltiples chats para envío automático</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {chatConfigs.map((chat, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-slate-700 rounded-lg">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`chat-name-${index}`} className="text-white">
                    Nombre del Chat
                  </Label>
                  <Input
                    id={`chat-name-${index}`}
                    value={chat.name}
                    onChange={(e) => handleChatConfigChange(index, "name", e.target.value)}
                    placeholder="Nombre descriptivo"
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`chat-id-${index}`} className="text-white">
                    Chat ID
                  </Label>
                  <Input
                    id={`chat-id-${index}`}
                    value={chat.id}
                    onChange={(e) => handleChatConfigChange(index, "id", e.target.value)}
                    placeholder="-1001234567890"
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Label className="text-white">Habilitado</Label>
                  <Switch
                    checked={chat.enabled}
                    onCheckedChange={(checked) => handleChatConfigChange(index, "enabled", checked)}
                  />
                </div>
                {chatConfigs.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeChatConfig(index)}
                    className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button onClick={addChatConfig} variant="outline" className="w-full text-blue-400 border-blue-400">
              + Agregar Chat
            </Button>
          </CardContent>
        </Card>

        {/* Controles */}
        <div className="flex gap-4 justify-center">
          <Button onClick={fetchPredictions} disabled={loading} className="bg-blue-600 hover:bg-blue-700" size="lg">
            <RefreshCw className={`h-5 w-5 mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Obteniendo pronósticos..." : "Actualizar Predicciones"}
          </Button>

          <Button
            onClick={sendPredictions}
            disabled={sending || predictions.length === 0}
            className="bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <Send className="h-5 w-5 mr-2" />
            {sending ? "Enviando..." : `Enviar ${predictions.length} Pronósticos`}
          </Button>
        </div>

        {/* Información del sistema */}
        <div className="text-center">
          <Badge className="bg-blue-600 text-white px-4 py-2 text-sm">
            🎯 API real con respaldo • Máximo 5 pronósticos • Rate limiting controlado
          </Badge>
        </div>

        {/* Predicciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {predictions.length > 0 ? (
            predictions.map((prediction, index) => (
              <Card key={index} className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-blue-600 text-white">{prediction.league}</Badge>
                    <Badge
                      className={`${
                        prediction.confidence >= 75
                          ? "bg-green-700 text-green-100"
                          : prediction.confidence >= 65
                            ? "bg-yellow-700 text-yellow-100"
                            : "bg-gray-700 text-gray-100"
                      }`}
                    >
                      {prediction.confidence}% confianza
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-lg">
                    {prediction.homeTeam} vs {prediction.awayTeam}
                  </CardTitle>
                  <CardDescription className="text-blue-300">
                    {prediction.matchDate} - {prediction.matchTime}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Ganador probable */}
                  <div className="text-center p-3 bg-slate-700 rounded-lg">
                    <p className="text-sm text-blue-300 mb-1">Ganador probable:</p>
                    <p className="text-xl font-bold text-yellow-400">
                      {prediction.predictedWinner === "home"
                        ? prediction.homeTeam
                        : prediction.predictedWinner === "away"
                          ? prediction.awayTeam
                          : "EMPATE"}
                    </p>
                  </div>

                  {/* Probabilidades */}
                  <div className="space-y-3">
                    <h4 className="text-white font-semibold">📊 Probabilidades:</h4>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-300">Victoria local:</span>
                        <span className="text-white font-bold">{prediction.homeWinProb}%</span>
                      </div>
                      <Progress value={prediction.homeWinProb} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-300">Empate:</span>
                        <span className="text-white font-bold">{prediction.drawProb}%</span>
                      </div>
                      <Progress value={prediction.drawProb} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-300">Victoria visitante:</span>
                        <span className="text-white font-bold">{prediction.awayWinProb}%</span>
                      </div>
                      <Progress value={prediction.awayWinProb} className="h-2" />
                    </div>
                  </div>

                  {/* Análisis de goles */}
                  <div
                    className={`p-3 border rounded-lg ${
                      prediction.isLikelyOver25 ? "bg-green-900/30 border-green-700" : "bg-blue-900/30 border-blue-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {prediction.isLikelyOver25 ? (
                        <Zap className="h-4 w-4 text-green-400" />
                      ) : (
                        <BarChart3 className="h-4 w-4 text-blue-400" />
                      )}
                      <span
                        className={`font-semibold ${prediction.isLikelyOver25 ? "text-green-400" : "text-blue-400"}`}
                      >
                        Análisis de Goles
                      </span>
                    </div>
                    <p className="text-white font-bold">
                      {prediction.isLikelyOver25 ? "OVER 2.5 GOLES" : "PARTIDO CERRADO"}
                    </p>
                    <p className={`text-sm ${prediction.isLikelyOver25 ? "text-green-300" : "text-blue-300"}`}>
                      Promedio esperado: {prediction.avgGoals} goles
                    </p>
                    <p className={`text-sm ${prediction.isLikelyOver25 ? "text-green-300" : "text-blue-300"}`}>
                      Probabilidad Over 2.5: {prediction.over25Pct}%
                    </p>
                  </div>
                  {/* Cuotas y Stake */}
                  <div className="space-y-3">
                    <h4 className="text-white font-semibold">💰 Cuotas y Apuesta:</h4>

                    {/* Cuotas principales */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="bg-slate-600 p-2 rounded text-center">
                        <p className="text-blue-300">Local</p>
                        <p className="text-white font-bold">{prediction.odds.homeWin}</p>
                      </div>
                      <div className="bg-slate-600 p-2 rounded text-center">
                        <p className="text-blue-300">Empate</p>
                        <p className="text-white font-bold">{prediction.odds.draw}</p>
                      </div>
                      <div className="bg-slate-600 p-2 rounded text-center">
                        <p className="text-blue-300">Visitante</p>
                        <p className="text-white font-bold">{prediction.odds.awayWin}</p>
                      </div>
                    </div>

                    {/* Cuotas de goles */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-green-900/30 border border-green-700 p-2 rounded text-center">
                        <p className="text-green-300">Over 2.5</p>
                        <p className="text-green-400 font-bold">{prediction.odds.over25}</p>
                      </div>
                      <div className="bg-red-900/30 border border-red-700 p-2 rounded text-center">
                        <p className="text-red-300">Under 2.5</p>
                        <p className="text-red-400 font-bold">{prediction.odds.under25}</p>
                      </div>
                    </div>

                    {/* Stake recomendado */}
                    <div
                      className={`p-3 border rounded-lg ${
                        prediction.stake.confidence === "high"
                          ? "bg-green-900/30 border-green-700"
                          : prediction.stake.confidence === "medium"
                            ? "bg-yellow-900/30 border-yellow-700"
                            : "bg-blue-900/30 border-blue-700"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className={`font-semibold ${
                            prediction.stake.confidence === "high"
                              ? "text-green-400"
                              : prediction.stake.confidence === "medium"
                                ? "text-yellow-400"
                                : "text-blue-400"
                          }`}
                        >
                          Stake Recomendado
                        </span>
                        <Badge
                          className={`${
                            prediction.stake.confidence === "high"
                              ? "bg-green-700"
                              : prediction.stake.confidence === "medium"
                                ? "bg-yellow-700"
                                : "bg-blue-700"
                          }`}
                        >
                          {prediction.stake.confidence.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-300">Nivel</p>
                          <p className="text-white font-bold">{prediction.stake.recommended}/10</p>
                        </div>
                        <div>
                          <p className="text-gray-300">Unidades</p>
                          <p className="text-white font-bold">{prediction.stake.units}u</p>
                        </div>
                        <div>
                          <p className="text-gray-300">Valor</p>
                          <p className={`font-bold ${prediction.value > 0 ? "text-green-400" : "text-red-400"}`}>
                            {prediction.value > 0 ? "+" : ""}
                            {prediction.value}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Target className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <p className="text-blue-200 text-lg">
                {loading ? "Obteniendo pronósticos..." : "Haz clic en 'Actualizar Predicciones' para comenzar"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
