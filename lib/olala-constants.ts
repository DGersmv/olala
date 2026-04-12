export const OCCASION_OPTIONS = [
  // Дни рождения
  { id: "wife_birthday", label: "День рождения жены", icon: "👰", cat: "birthdays" },
  { id: "girlfriend_birthday", label: "День рождения девушки", icon: "💕", cat: "birthdays" },
  { id: "mother_in_law", label: "День рождения тёщи", icon: "👩‍🦳", cat: "birthdays" },
  { id: "father_in_law_wife", label: "День рождения тестя", icon: "👨‍🦳", cat: "birthdays" },
  { id: "mother_birthday", label: "День рождения мамы", icon: "🤱", cat: "birthdays" },
  { id: "father_birthday", label: "День рождения отца", icon: "👨", cat: "birthdays" },
  { id: "daughter_birthday", label: "День рождения дочери", icon: "👧", cat: "birthdays" },
  { id: "son_birthday", label: "День рождения сына", icon: "👦", cat: "birthdays" },
  { id: "sister_birthday", label: "День рождения сестры", icon: "👩", cat: "birthdays" },
  { id: "brother_birthday", label: "День рождения брата", icon: "👨‍🦱", cat: "birthdays" },
  { id: "grandma_birthday", label: "День рождения бабушки", icon: "👵", cat: "birthdays" },
  { id: "grandpa_birthday", label: "День рождения дедушки", icon: "👴", cat: "birthdays" },
  { id: "baby_born", label: "День рождения малыша", icon: "👶", cat: "birthdays" },
  { id: "godmother_birthday", label: "День рождения крёстной", icon: "🧑‍🍼", cat: "birthdays" },
  { id: "aunt_birthday", label: "День рождения тёти", icon: "👩‍🦰", cat: "birthdays" },
  { id: "friend_birthday", label: "Подруга жены / мамы", icon: "👯", cat: "birthdays" },
  { id: "colleague_birthday", label: "День рождения коллеги", icon: "💼", cat: "birthdays" },
  { id: "boss_birthday", label: "ДР начальницы / партнёра", icon: "👩‍💻", cat: "birthdays" },
  { id: "neighbor", label: "День рождения соседки", icon: "🏠", cat: "birthdays" },

  // Годовщины и вехи
  { id: "wedding_anniversary", label: "Годовщина свадьбы", icon: "💍", cat: "milestones" },
  { id: "first_date", label: "Годовщина первого свидания", icon: "🥂", cat: "milestones" },
  { id: "first_kiss", label: "Годовщина первого поцелуя", icon: "💋", cat: "milestones" },
  { id: "proposal", label: "День предложения руки", icon: "💎", cat: "milestones" },
  { id: "moved_in", label: "Годовщина совместной жизни", icon: "🏡", cat: "milestones" },
  { id: "first_met", label: "День знакомства", icon: "✨", cat: "milestones" },
  { id: "engagement", label: "День помолвки", icon: "💒", cat: "milestones" },
  { id: "nameday_wife", label: "Именины жены", icon: "📜", cat: "milestones" },
  { id: "nameday_mom", label: "Именины мамы / тёщи", icon: "📜", cat: "milestones" },
  { id: "wife_graduation", label: "Годовщина выпуска жены", icon: "🎓", cat: "milestones" },
  { id: "child_first_day_school", label: "1 сентября (ребёнок в школу)", icon: "🎒", cat: "milestones" },

  // Профессиональные праздники
  { id: "florist_day", label: "День флориста", icon: "🌺", cat: "professional" },
  { id: "medic_day", label: "День медработника", icon: "⚕️", cat: "professional" },
  { id: "teacher_day", label: "День учителя / воспитателя", icon: "📚", cat: "professional" },
  { id: "accountant_day", label: "День бухгалтера", icon: "📊", cat: "professional" },
  { id: "lawyer_day", label: "День юриста", icon: "⚖️", cat: "professional" },
  { id: "cosmetologist_day", label: "День косметолога / стилиста", icon: "💅", cat: "professional" },
  { id: "cook_day", label: "День повара / кондитера", icon: "👩‍🍳", cat: "professional" },
  { id: "journalist_day", label: "День журналиста", icon: "🗞️", cat: "professional" },
  { id: "architect_day", label: "День архитектора / дизайнера", icon: "📐", cat: "professional" },
  { id: "programmer_day", label: "День программиста", icon: "💻", cat: "professional" },
  { id: "social_worker_day", label: "День соцработника", icon: "🤝", cat: "professional" },
  { id: "pharmacist_day", label: "День фармацевта", icon: "💊", cat: "professional" },
  { id: "artist_day", label: "День художника / фотографа", icon: "🎨", cat: "professional" },
  { id: "secretary_day", label: "День секретаря", icon: "📋", cat: "professional" },
  { id: "realtor_day", label: "День риэлтора", icon: "🏢", cat: "professional" },
  { id: "hr_day", label: "День HR-менеджера", icon: "🧑‍💼", cat: "professional" },
  { id: "custom_prof", label: "Другой проф. праздник", icon: "🏅", cat: "professional" },

  // Праздники
  { id: "valentines", label: "День Валентина", icon: "❤️", cat: "holidays" },
  { id: "womens_day", label: "8 Марта", icon: "🌷", cat: "holidays" },
  { id: "mothers_day", label: "День матери", icon: "🌸", cat: "holidays" },
  { id: "fathers_day", label: "День отца", icon: "👔", cat: "holidays" },
  { id: "family_day", label: "День семьи (15 мая)", icon: "👨‍👩‍👧", cat: "holidays" },
  { id: "easter", label: "Пасха", icon: "🥚", cat: "holidays" },
  { id: "christmas", label: "Рождество", icon: "🎅", cat: "holidays" },
  { id: "new_year", label: "Новый Год", icon: "🎄", cat: "holidays" },
  { id: "ligo", label: "Лиго / Янов день", icon: "🔥", cat: "holidays" },
  { id: "childrens_day", label: "День защиты детей (1 июня)", icon: "🧒", cat: "holidays" },
  { id: "knowledge_day", label: "День знаний (1 сентября)", icon: "🔔", cat: "holidays" },

  // Своя дата
  { id: "custom", label: "Своя дата — напишите повод", icon: "✏️", cat: "custom" },
] as const

export const BUDGET_OPTIONS = [
  {
    id: "small",
    label: "Мини",
    price: "25–40€",
    desc: "Элегантный моно-букет",
    color: "#d4a08b",
    photos: [
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/18-tqxNHkf128JVDcBRar6UxTkyDoBfRD.jpg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/16-JhazxoOrmc0qUgC0ad2hPhBhuMgy3V.jpg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/13-20aeo0NLrjvqzOgPplBhNEyxaBXftG.jpg",
    ],
  },
  {
    id: "medium",
    label: "Классика",
    price: "45–70€",
    desc: "Сезонная композиция",
    color: "#d4836b",
    photos: [
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/17-MLr4dwAijgUWrc0LZUPq7nDWgvWgI3.jpg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/12-dQaqxT6qyW51JnN197ET1ma8KIJMhE.jpg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/15-wojMg6Nk6desgot2vKWaTTKfjUzsOc.jpg",
    ],
  },
  {
    id: "large",
    label: "Премиум",
    price: "75–120€",
    desc: "Роскошный авторский букет",
    color: "#c26b80",
    photos: [
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/19-2kGsgi9KOHDoEDGZWyzmKgwCY34LQV.jpg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/11-rIGD5FYw40de15YICXmHIgYku7l4CP.jpg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/14-iDgeluPYW4v40aSBX6hnUyM97ZNyq1.jpg",
    ],
  },
  {
    id: "vip",
    label: "VIP",
    price: "от 120€",
    desc: "Эксклюзивная флористика",
    color: "#9e5a6e",
    photos: [
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20-gOLCNreUBxXiCf4fPkwfXiQplFQ7ld.jpg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/11-rIGD5FYw40de15YICXmHIgYku7l4CP.jpg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/19-2kGsgi9KOHDoEDGZWyzmKgwCY34LQV.jpg",
    ],
  },
] as const

export const OCCASION_SECTIONS = [
  { cat: "birthdays", title: "Дни рождения" },
  { cat: "milestones", title: "Годовщины и вехи" },
  { cat: "professional", title: "Профессиональные праздники" },
  { cat: "holidays", title: "Праздники" },
] as const

export type OccasionId = typeof OCCASION_OPTIONS[number]["id"]
export type BudgetId = typeof BUDGET_OPTIONS[number]["id"]
export type OccasionCategory = typeof OCCASION_OPTIONS[number]["cat"]

export interface DateEntry {
  id: number
  occasion: OccasionId | ""
  customName: string
  date: string
  recipientName: string
  recipientPhone: string
  address: string
  budget: BudgetId
  note: string
}

export interface UserData {
  name: string
  phone: string
  email?: string
}
