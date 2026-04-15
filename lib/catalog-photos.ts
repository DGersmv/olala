import fs from "fs"
import path from "path"
import { BUDGET_OPTIONS, type BudgetId } from "./olala-constants"

export type CatalogPhotos = Record<BudgetId, string[]>

const FOLDER: Record<BudgetId, string> = {
  small:  "mini",
  medium: "classic",
  large:  "premium",
  vip:    "vip",
}

export function getCatalogPhotos(): CatalogPhotos {
  const result = {} as CatalogPhotos
  for (const b of BUDGET_OPTIONS) {
    const folder = FOLDER[b.id]
    const dir = path.join(process.cwd(), "public", "catalog", folder)
    try {
      const files = fs
        .readdirSync(dir)
        .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
        .sort()
        .map((f) => `/catalog/${folder}/${f}`)
      result[b.id] = files
    } catch {
      result[b.id] = []
    }
  }
  return result
}
