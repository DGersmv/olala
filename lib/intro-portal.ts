export const PORTAL_PAGE_BG = "#eee4d6"

export const OLALA_LOGO_VIEWBOX = 220
export const OLALA_O_CX = 46.69
export const OLALA_O_CY = 188.45
export const OLALA_O_INNER_R = 18.4
export const OLALA_O_OUTER_R = 25.11

export const OLALA_O_ORIGIN_X = `${(OLALA_O_CX / OLALA_LOGO_VIEWBOX) * 100}%`
export const OLALA_O_ORIGIN_Y = `${(OLALA_O_CY / OLALA_LOGO_VIEWBOX) * 100}%`

export function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1)
}

export function easeInCubic(t: number) {
  return t * t * t
}

export function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}
