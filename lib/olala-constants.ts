export const OCCASION_OPTIONS = [
  // Дни рождения
  { id: "wife_birthday",        label: "День рождения жены",             icon: "Heart",         cat: "birthdays" },
  { id: "girlfriend_birthday",  label: "День рождения девушки",          icon: "Heart",         cat: "birthdays" },
  { id: "mother_in_law",        label: "День рождения тёщи",             icon: "User",          cat: "birthdays" },
  { id: "father_in_law_wife",   label: "День рождения тестя",            icon: "User",          cat: "birthdays" },
  { id: "mother_birthday",      label: "День рождения мамы",             icon: "Heart",         cat: "birthdays" },
  { id: "father_birthday",      label: "День рождения отца",             icon: "User",          cat: "birthdays" },
  { id: "daughter_birthday",    label: "День рождения дочери",           icon: "Star",          cat: "birthdays" },
  { id: "son_birthday",         label: "День рождения сына",             icon: "Star",          cat: "birthdays" },
  { id: "sister_birthday",      label: "День рождения сестры",           icon: "User",          cat: "birthdays" },
  { id: "brother_birthday",     label: "День рождения брата",            icon: "User",          cat: "birthdays" },
  { id: "grandma_birthday",     label: "День рождения бабушки",          icon: "Heart",         cat: "birthdays" },
  { id: "grandpa_birthday",     label: "День рождения дедушки",          icon: "User",          cat: "birthdays" },
  { id: "baby_born",            label: "День рождения малыша",           icon: "Star",          cat: "birthdays" },
  { id: "godmother_birthday",   label: "День рождения крёстной",         icon: "Heart",         cat: "birthdays" },
  { id: "aunt_birthday",        label: "День рождения тёти",             icon: "User",          cat: "birthdays" },
  { id: "friend_birthday",      label: "Подруга жены / мамы",            icon: "Users",         cat: "birthdays" },
  { id: "colleague_birthday",   label: "День рождения коллеги",          icon: "Briefcase",     cat: "birthdays" },
  { id: "boss_birthday",        label: "ДР начальницы / партнёра",       icon: "Briefcase",     cat: "birthdays" },
  { id: "neighbor",             label: "День рождения соседки",          icon: "Home",          cat: "birthdays" },

  // Годовщины и вехи
  { id: "wedding_anniversary",      label: "Годовщина свадьбы",               icon: "Gem",           cat: "milestones" },
  { id: "first_date",               label: "Годовщина первого свидания",       icon: "Wine",          cat: "milestones" },
  { id: "first_kiss",               label: "Годовщина первого поцелуя",        icon: "Heart",         cat: "milestones" },
  { id: "proposal",                 label: "День предложения руки",            icon: "Gem",           cat: "milestones" },
  { id: "moved_in",                 label: "Годовщина совместной жизни",       icon: "Home",          cat: "milestones" },
  { id: "first_met",                label: "День знакомства",                  icon: "Sparkles",      cat: "milestones" },
  { id: "engagement",               label: "День помолвки",                    icon: "Gem",           cat: "milestones" },
  { id: "nameday_wife",             label: "Именины жены",                     icon: "Scroll",        cat: "milestones" },
  { id: "nameday_mom",              label: "Именины мамы / тёщи",              icon: "Scroll",        cat: "milestones" },
  { id: "wife_graduation",          label: "Годовщина выпуска жены",           icon: "GraduationCap", cat: "milestones" },
  { id: "child_first_day_school",   label: "1 сентября (ребёнок в школу)",     icon: "BookOpen",      cat: "milestones" },

  // Профессиональные праздники
  { id: "florist_day",      label: "День флориста",                   icon: "Flower2",       cat: "professional" },
  { id: "medic_day",        label: "День медработника",               icon: "HeartPulse",    cat: "professional" },
  { id: "teacher_day",      label: "День учителя / воспитателя",      icon: "BookOpen",      cat: "professional" },
  { id: "accountant_day",   label: "День бухгалтера",                 icon: "BarChart2",     cat: "professional" },
  { id: "lawyer_day",       label: "День юриста",                     icon: "Scale",         cat: "professional" },
  { id: "cosmetologist_day",label: "День косметолога / стилиста",     icon: "Sparkles",      cat: "professional" },
  { id: "cook_day",         label: "День повара / кондитера",         icon: "ChefHat",       cat: "professional" },
  { id: "journalist_day",   label: "День журналиста",                 icon: "Newspaper",     cat: "professional" },
  { id: "architect_day",    label: "День архитектора / дизайнера",    icon: "Compass",       cat: "professional" },
  { id: "programmer_day",   label: "День программиста",               icon: "Code2",         cat: "professional" },
  { id: "social_worker_day",label: "День соцработника",               icon: "Handshake",     cat: "professional" },
  { id: "pharmacist_day",   label: "День фармацевта",                 icon: "Pill",          cat: "professional" },
  { id: "artist_day",       label: "День художника / фотографа",      icon: "Palette",       cat: "professional" },
  { id: "secretary_day",    label: "День секретаря",                  icon: "ClipboardList", cat: "professional" },
  { id: "realtor_day",      label: "День риэлтора",                   icon: "Building2",     cat: "professional" },
  { id: "hr_day",           label: "День HR-менеджера",               icon: "Users",         cat: "professional" },
  { id: "custom_prof",      label: "Другой проф. праздник",           icon: "Award",         cat: "professional" },

  // Праздники
  { id: "valentines",     label: "День Валентина",              icon: "Heart",    cat: "holidays" },
  { id: "womens_day",     label: "8 Марта",                     icon: "Flower2",  cat: "holidays" },
  { id: "mothers_day",    label: "День матери",                 icon: "Heart",    cat: "holidays" },
  { id: "fathers_day",    label: "День отца",                   icon: "User",     cat: "holidays" },
  { id: "family_day",     label: "День семьи (15 мая)",         icon: "Users",    cat: "holidays" },
  { id: "easter",         label: "Пасха",                       icon: "Sun",      cat: "holidays" },
  { id: "christmas",      label: "Рождество",                   icon: "Star",     cat: "holidays" },
  { id: "new_year",       label: "Новый Год",                   icon: "Star",     cat: "holidays" },
  { id: "ligo",           label: "Лиго / Янов день",            icon: "Flame",    cat: "holidays" },
  { id: "childrens_day",  label: "День защиты детей (1 июня)",  icon: "Star",     cat: "holidays" },
  { id: "knowledge_day",  label: "День знаний (1 сентября)",    icon: "Bell",     cat: "holidays" },

  // Своя дата
  { id: "custom", label: "Своя дата — напишите повод", icon: "", cat: "custom" },
] as const

export const BUDGET_OPTIONS = [
  {
    id: "small",
    label: "Мини",
    price: "1 000–2 000₽",
    desc: "Элегантный моно-букет",
    color: "#d4a08b",
  },
  {
    id: "medium",
    label: "Классика",
    price: "2 500–5 000₽",
    desc: "Сезонная композиция",
    color: "#d4836b",
  },
  {
    id: "large",
    label: "Премиум",
    price: "5 000–10 000₽",
    desc: "Роскошный авторский букет",
    color: "#c26b80",
  },
  {
    id: "vip",
    label: "VIP",
    price: "от 10 000₽",
    desc: "Эксклюзивная флористика",
    color: "#9e5a6e",
  },
] as const

export const OCCASION_SECTIONS = [
  { cat: "birthdays",    title: "Дни рождения" },
  { cat: "milestones",   title: "Годовщины и вехи" },
  { cat: "professional", title: "Профессиональные праздники" },
  { cat: "holidays",     title: "Праздники" },
] as const

export type OccasionId = typeof OCCASION_OPTIONS[number]["id"]
export type BudgetId = typeof BUDGET_OPTIONS[number]["id"]
export type OccasionCategory = typeof OCCASION_OPTIONS[number]["cat"]

export type BudgetMode = "catalog" | "florist_choice"

export interface DateEntry {
  id: number
  occasion: OccasionId | ""
  customName: string
  date: string
  recipientName: string
  recipientPhone: string
  recipientSocials: string
  address: string
  budget: BudgetId
  budgetMode: BudgetMode
  selectedPhotoUrl: string
  note: string
}

export interface UserData {
  name: string
  phone: string
  email?: string
}
