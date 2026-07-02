/** Ценовые сегменты каталога магазина в Instagram (Highlights). */
export const FROM_INST_PRICE_TIERS = [
  "1000-1500",
  "1800-2000",
  "2500-2800",
  "3500-4000",
  "4000-4300",
  "6500-7500",
  "9000-10000",
  "15000-17000",
  "20000-25000",
] as const

export type FromInstPriceTier = (typeof FROM_INST_PRICE_TIERS)[number]

export const FROM_INST_ROOT = "added/from_inst"
