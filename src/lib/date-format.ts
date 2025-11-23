const MESES_CURTOS = [
  "jan.",
  "fev.",
  "mar.",
  "abr.",
  "mai.",
  "jun.",
  "jul.",
  "ago.",
  "set.",
  "out.",
  "nov.",
  "dez.",
] as const

function normalizeIsoDate(value: string) {
  const datePart = value.split("T")[0]
  const bits = datePart.split("-")
  if (bits.length !== 3) return null
  const [yyyy, mm, dd] = bits
  const year = Number(yyyy)
  const monthIndex = Number(mm) - 1
  const day = Number(dd)

  if (!Number.isFinite(year) || !Number.isFinite(day) || monthIndex < 0 || monthIndex > 11) {
    return null
  }

  return { year, monthIndex, day }
}

export function formatDateBrMedium(isoDate: string | null | undefined): string {
  if (!isoDate) return "—"
  const normalized = normalizeIsoDate(isoDate)
  if (!normalized) {
    return isoDate
  }

  const { day, monthIndex, year } = normalized
  return `${day} de ${MESES_CURTOS[monthIndex]} de ${year}`
}
