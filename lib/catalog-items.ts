import type { BudgetId } from "./olala-constants"

// TODO: заменить на запрос к базе данных (possiflora)
// Структура: ключ = путь к фото (совпадает с URL из getCatalogPhotos)

export interface CatalogItem {
  photoUrl: string
  title: string
  price: string
  description: string
}

const ITEMS: CatalogItem[] = [
  // ─── Мини (small) ───────────────────────────────────────────────
  {
    photoUrl: "/catalog/mini/01.jpg",
    title: "Тюльпаны моно",
    price: "1 200₽",
    description: "5 тюльпанов одного оттенка, крафтовая упаковка",
  },
  {
    photoUrl: "/catalog/mini/02.jpg",
    title: "Ромашки и зелень",
    price: "1 400₽",
    description: "Полевой букетик с эвкалиптом, лёгкий и свежий",
  },
  {
    photoUrl: "/catalog/mini/03.jpg",
    title: "Альстромерии",
    price: "1 500₽",
    description: "7 альстромерий, долго стоят в вазе",
  },

  // ─── Классика (medium) ──────────────────────────────────────────
  {
    photoUrl: "/catalog/classic/01.jpg",
    title: "Розы классические",
    price: "2 800₽",
    description: "9 роз сорта Эксплорер с аспидистрой",
  },
  {
    photoUrl: "/catalog/classic/02.jpg",
    title: "Сезонная композиция",
    price: "3 500₽",
    description: "Хризантемы, статица и сезонная зелень",
  },
  {
    photoUrl: "/catalog/classic/03.jpg",
    title: "Пионовидные розы",
    price: "4 200₽",
    description: "5 пионовидных роз Джульетта, нежный персик",
  },

  // ─── Премиум (large) ────────────────────────────────────────────
  {
    photoUrl: "/catalog/premium/01.jpg",
    title: "Пионы и эустома",
    price: "6 500₽",
    description: "Пионы, эустома, эвкалипт — воздушная пастельная композиция",
  },
  {
    photoUrl: "/catalog/premium/02.jpg",
    title: "Авторский микс",
    price: "8 000₽",
    description: "Ранункулюсы, анемоны, питтоспорум — флорист подбирает сезонно",
  },
  {
    photoUrl: "/catalog/premium/03.jpg",
    title: "Красные розы люкс",
    price: "9 500₽",
    description: "15 роз Ред Наоми, оформление из аспидистры и фисташки",
  },

  // ─── VIP ────────────────────────────────────────────────────────
  {
    photoUrl: "/catalog/vip/01.jpg",
    title: "Орхидеи и пионы",
    price: "12 000₽",
    description: "Ветка орхидеи, пионы, эвкалипт в дизайнерской упаковке",
  },
  {
    photoUrl: "/catalog/vip/02.jpg",
    title: "Шляпная коробка",
    price: "15 000₽",
    description: "Розы, эустома, лаванда — премиальная шляпная коробка",
  },
  {
    photoUrl: "/catalog/vip/03.jpg",
    title: "Эксклюзив флориста",
    price: "от 18 000₽",
    description: "Индивидуальная работа: редкие цветы, авторская концепция",
  },
]

// Быстрый доступ по URL фото
const BY_URL = new Map(ITEMS.map((item) => [item.photoUrl, item]))

export function getCatalogItem(photoUrl: string): CatalogItem | undefined {
  return BY_URL.get(photoUrl)
}

// Все позиции по категории (budget id → folder name)
const FOLDER: Record<BudgetId, string> = {
  small:  "mini",
  medium: "classic",
  large:  "premium",
  vip:    "vip",
}

export function getCatalogItemsByBudget(budgetId: BudgetId): CatalogItem[] {
  const folder = FOLDER[budgetId]
  return ITEMS.filter((item) => item.photoUrl.startsWith(`/catalog/${folder}/`))
}
