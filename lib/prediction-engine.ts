// Motor de predicciones basado en estadísticas puras

interface MatchData {
  homeTeam: string
  awayTeam: string
  league: string
  matchTime: string
}

interface TeamStats {
  form: number // 1-10
  avgGoalsScored: number
  avgGoalsConceded: number
  winPercentage: number
  drawPercentage: number
  lossPercentage: number
}

// Ligas y competiciones permitidas (hasta segunda división)
const ALLOWED_LEAGUES = [
  // Primera División
  "Liga BetPlay",
  "Liga MX",
  "Liga Profesional Argentina",
  "Brasileirão",
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "Eredivisie",
  "Primeira Liga",
  "Liga NOS",

  // Segunda División
  "Primera B Colombia",
  "Liga de Expansión MX",
  "Primera Nacional Argentina",
  "Série B",
  "Championship",
  "Segunda División",
  "Serie B",
  "2. Bundesliga",
  "Ligue 2",
  "Eerste Divisie",
  "Liga Portugal 2",

  // Competiciones reconocidas
  "Copa Libertadores",
  "Copa Sudamericana",
  "Champions League",
  "Europa League",
  "Conference League",
  "Copa del Rey",
  "FA Cup",
  "Coppa Italia",
  "DFB-Pokal",
  "MLS",
  "MLS Next Pro",
  "USL Championship",
]

// Simular obtención de estadísticas (en producción vendría de una API)
function getTeamStats(teamName: string, league: string): TeamStats {
  // Generar estadísticas realistas basadas en el equipo y liga
  const baseStats = {
    form: Math.floor(Math.random() * 4) + 6, // 6-10
    avgGoalsScored: Math.random() * 1.5 + 1, // 1-2.5
    avgGoalsConceded: Math.random() * 1.5 + 0.8, // 0.8-2.3
    winPercentage: Math.random() * 30 + 35, // 35-65%
    drawPercentage: Math.random() * 15 + 20, // 20-35%
    lossPercentage: 0, // Se calculará
  }

  baseStats.lossPercentage = 100 - baseStats.winPercentage - baseStats.drawPercentage

  return baseStats
}

function calculateProbabilities(homeStats: TeamStats, awayStats: TeamStats) {
  // Algoritmo simplificado basado en estadísticas
  const homeAdvantage = 5 // 5% ventaja por jugar en casa (mínima)

  let homeWin = homeStats.winPercentage + homeAdvantage - awayStats.winPercentage * 0.3
  let awayWin = awayStats.winPercentage - homeStats.winPercentage * 0.3
  let draw = (homeStats.drawPercentage + awayStats.drawPercentage) / 2

  // Normalizar a 100%
  const total = homeWin + awayWin + draw
  homeWin = Math.round((homeWin / total) * 100)
  awayWin = Math.round((awayWin / total) * 100)
  draw = 100 - homeWin - awayWin

  return { homeWin, awayWin, draw }
}

function analyzeGoals(homeStats: TeamStats, awayStats: TeamStats) {
  const expectedGoals = homeStats.avgGoalsScored + awayStats.avgGoalsScored
  const defensiveStrength = (homeStats.avgGoalsConceded + awayStats.avgGoalsConceded) / 2

  // Ajustar por fortaleza defensiva
  const adjustedGoals = expectedGoals - defensiveStrength * 0.3

  const over25Probability =
    adjustedGoals > 2.3
      ? Math.min(Math.round((adjustedGoals - 2.3) * 30 + 55), 85)
      : Math.max(Math.round(adjustedGoals * 20 + 15), 25)

  const under25Probability = 100 - over25Probability

  let recommendation: "OVER 2.5" | "UNDER 2.5" | "NO RECOMENDADO"

  if (over25Probability >= 70) {
    recommendation = "OVER 2.5"
  } else if (under25Probability >= 70) {
    recommendation = "UNDER 2.5"
  } else {
    recommendation = "NO RECOMENDADO"
  }

  return {
    over25: over25Probability,
    under25: under25Probability,
    recommendation,
  }
}

export async function generateAutomaticPrediction(matchData: MatchData) {
  // Verificar que la liga esté permitida
  if (!ALLOWED_LEAGUES.includes(matchData.league)) {
    throw new Error(`Liga no permitida: ${matchData.league}`)
  }

  // Obtener estadísticas de ambos equipos
  const homeStats = getTeamStats(matchData.homeTeam, matchData.league)
  const awayStats = getTeamStats(matchData.awayTeam, matchData.league)

  // Calcular probabilidades
  const probabilities = calculateProbabilities(homeStats, awayStats)

  // Determinar ganador probable
  let predictedWinner: "home" | "draw" | "away"
  if (probabilities.homeWin > probabilities.awayWin && probabilities.homeWin > probabilities.draw) {
    predictedWinner = "home"
  } else if (probabilities.awayWin > probabilities.homeWin && probabilities.awayWin > probabilities.draw) {
    predictedWinner = "away"
  } else {
    predictedWinner = "draw"
  }

  // Calcular confianza basada en la diferencia de probabilidades
  const maxProb = Math.max(probabilities.homeWin, probabilities.awayWin, probabilities.draw)
  const secondMaxProb = [probabilities.homeWin, probabilities.awayWin, probabilities.draw].sort((a, b) => b - a)[1]

  const confidence = Math.min(Math.round(maxProb + (maxProb - secondMaxProb) * 0.5), 95)

  // Análisis de goles
  const goalsAnalysis = analyzeGoals(homeStats, awayStats)

  return {
    id: `${matchData.homeTeam}-${matchData.awayTeam}-${Date.now()}`,
    homeTeam: matchData.homeTeam,
    awayTeam: matchData.awayTeam,
    league: matchData.league,
    matchTime: matchData.matchTime,
    probabilities: {
      homeWin: probabilities.homeWin,
      draw: probabilities.draw,
      awayWin: probabilities.awayWin,
    },
    predictedWinner,
    confidence,
    goalsAnalysis,
    statistics: {
      homeForm: homeStats.form,
      awayForm: awayStats.form,
      h2hRecord: "Estadísticas históricas",
      avgGoalsHome: Number(homeStats.avgGoalsScored.toFixed(1)),
      avgGoalsAway: Number(awayStats.avgGoalsScored.toFixed(1)),
    },
  }
}
