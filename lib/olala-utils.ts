const MONTHS_RU = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]

export function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const [, m, day] = dateStr.split("-")
  return `${parseInt(day)} ${MONTHS_RU[parseInt(m) - 1]}`
}

export function daysUntil(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const [, m, d] = dateStr.split("-").map(Number)
  let target = new Date(now.getFullYear(), m - 1, d)
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
