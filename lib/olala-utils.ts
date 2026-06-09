const MONTHS_RU = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]

/** YYYY-MM-DD из строки или Date (pg / JSON иногда отдаёт ISO с временем) */
export function parseDateOnly(value: string | Date): { y: number; m: number; d: number } | null {
  if (!value) return null
  const raw = value instanceof Date ? value.toISOString() : String(value)
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) }
}

export function formatDate(dateStr: string): string {
  const parts = parseDateOnly(dateStr)
  if (!parts) return ""
  return `${parts.d} ${MONTHS_RU[parts.m - 1]}`
}

export function daysUntil(dateStr: string): number {
  const parts = parseDateOnly(dateStr)
  if (!parts) return 0
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  let target = new Date(now.getFullYear(), parts.m - 1, parts.d)
  if (target < now) target.setFullYear(target.getFullYear() + 1)
  return Math.ceil((target.getTime() - now.getTime()) / 86400000)
}

export function getDaysLabel(days: number): string {
  if (days === 1) return "день"
  if (days >= 2 && days <= 4) return "дня"
  return "дней"
}

export function getDatesLabel(count: number): string {
  if (count === 1) return "дата"
  if (count >= 2 && count <= 4) return "даты"
  return "дат"
}
