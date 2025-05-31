// Utilidades para manejo de tiempo en zona horaria colombiana

export function formatColombianTime(date?: Date): string {
  const now = date || new Date()

  return now.toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

export function formatMatchTime(date: Date): string {
  return date.toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export function getColombianDate(): Date {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const colombianTime = new Date(utc + -5 * 3600000) // UTC-5
  return colombianTime
}

export function isMatchToday(matchDate: Date): boolean {
  const today = getColombianDate()
  const match = new Date(matchDate)

  return today.toDateString() === match.toDateString()
}
