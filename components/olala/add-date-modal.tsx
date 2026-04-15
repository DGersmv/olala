"use client"

import { useState } from "react"
import {
  X, BookOpen, Sparkles,
  Heart, User, Users, Star, Briefcase, Home,
  Gem, Wine, Scroll, GraduationCap,
  Flower2, HeartPulse, BarChart2, Scale, ChefHat,
  Newspaper, Compass, Code2, Handshake, Pill,
  Palette, ClipboardList, Building2, Award,
  Sun, Flame, Bell, Pencil,
  type LucideIcon,
} from "lucide-react"

const ICON_MAP: Record<string, LucideIcon> = {
  Heart, User, Users, Star, Briefcase, Home,
  Gem, Wine, Scroll, GraduationCap, BookOpen,
  Flower2, HeartPulse, BarChart2, Scale, ChefHat,
  Newspaper, Compass, Code2, Handshake, Pill,
  Palette, ClipboardList, Building2, Award, Sparkles,
  Sun, Flame, Bell, Pencil,
}
import {
  OCCASION_OPTIONS,
  OCCASION_SECTIONS,
  BUDGET_OPTIONS,
  type DateEntry,
  type OccasionId,
  type BudgetId,
  type BudgetMode,
} from "@/lib/olala-constants"
import { CatalogModal } from "./catalog-modal"
import type { CatalogPhotos } from "@/lib/catalog-photos"

interface AddDateModalProps {
  onClose: () => void
  onAdd: (date: Omit<DateEntry, "id">) => void
  catalogPhotos: CatalogPhotos
}

type NewDateForm = Omit<DateEntry, "id">

export function AddDateModal({ onClose, onAdd, catalogPhotos }: AddDateModalProps) {
  const [showCatalog, setShowCatalog] = useState(false)

  const [newDate, setNewDate] = useState<NewDateForm>({
    occasion: "",
    customName: "",
    date: "",
    recipientName: "",
    recipientPhone: "",
    recipientSocials: "",
    address: "",
    budget: "medium",
    budgetMode: "florist_choice",
    selectedPhotoUrl: "",
    note: "",
  })

  const set = <K extends keyof NewDateForm>(k: K, v: NewDateForm[K]) =>
    setNewDate((p) => ({ ...p, [k]: v }))

  const handleAdd = () => {
    if (
      !newDate.date ||
      (!newDate.occasion && !newDate.customName) ||
      !newDate.recipientName ||
      !newDate.address
    )
      return
    onAdd(newDate)
    onClose()
  }

  const selectedBudget = BUDGET_OPTIONS.find((b) => b.id === newDate.budget)

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-5 pt-10 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="animate-fade-up w-full max-w-[560px] border border-border bg-card p-7"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-7 flex items-center justify-between">
            <h3 className="font-serif text-2xl font-normal">Новая важная дата</h3>
            <button
              onClick={onClose}
              className="cursor-pointer border-none bg-transparent p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            {/* Occasion */}
            <label className="mb-2 block text-[11px] uppercase tracking-widest opacity-50">
              Повод — выберите или добавьте свой
            </label>

            {OCCASION_SECTIONS.map((section) => (
              <div key={section.cat}>
                <p className="mb-0.5 mt-3.5 font-sans text-[11px] uppercase tracking-widest opacity-35">
                  {section.title}
                </p>
                <div className="mt-1.5 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-1.5">
                  {OCCASION_OPTIONS.filter((o) => o.cat === section.cat).map((o) => (
                    <button
                      key={o.id}
                      onClick={() => set("occasion", o.id as OccasionId)}
                      className={`flex cursor-pointer items-center gap-2 border bg-secondary px-2 py-2.5 font-sans text-xs text-foreground transition-all ${
                        newDate.occasion === o.id
                          ? "border-primary bg-accent"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {(() => { const Ic = ICON_MAP[o.icon]; return Ic ? <Ic className="size-3.5 flex-shrink-0 opacity-50" /> : null })()}
                      <span>{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Custom occasion */}
            <div className="mt-1.5 grid grid-cols-1">
              {OCCASION_OPTIONS.filter((o) => o.cat === "custom").map((o) => (
                <button
                  key={o.id}
                  onClick={() => set("occasion", o.id as OccasionId)}
                  className={`flex cursor-pointer items-center gap-2 border bg-secondary px-2 py-2.5 font-sans text-xs text-foreground transition-all ${
                    newDate.occasion === o.id
                      ? "border-primary bg-accent"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span>{o.icon}</span>
                  <span>{o.label}</span>
                </button>
              ))}
            </div>

            {(newDate.occasion === "custom" || newDate.occasion === "custom_prof") && (
              <input
                type="text"
                placeholder="Название повода"
                value={newDate.customName}
                onChange={(e) => set("customName", e.target.value)}
                className="mt-2 w-full border border-input bg-muted p-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            )}

            {/* Date */}
            <div className="mt-4">
              <label className="mb-1.5 block text-[11px] uppercase tracking-widest opacity-50">
                Дата
              </label>
              <input
                type="date"
                value={newDate.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full border border-input bg-muted p-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            {/* Budget */}
            <div className="mt-5 border-t border-border pt-5">
              <label className="mb-3 block text-[11px] uppercase tracking-widest opacity-50">
                Бюджет и выбор букета
              </label>

              {/* Budget mode switcher */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                {(
                  [
                    { mode: "catalog" as BudgetMode, label: "Из каталога", icon: BookOpen },
                    { mode: "florist_choice" as BudgetMode, label: "На выбор флориста", icon: Sparkles },
                  ] as const
                ).map(({ mode, label, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => set("budgetMode", mode)}
                    className={`flex cursor-pointer flex-col items-center gap-1 border py-3 font-sans text-[11px] uppercase tracking-widest transition-all ${
                      newDate.budgetMode === mode
                        ? "border-primary bg-accent text-foreground"
                        : "border-border bg-secondary/50 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Catalog selection */}
              {newDate.budgetMode === "catalog" && (
                <div>
                  <button
                    onClick={() => setShowCatalog(true)}
                    className="flex w-full cursor-pointer items-center justify-between border border-dashed border-primary/50 bg-accent/50 px-5 py-4 text-left font-sans transition-all hover:border-primary hover:bg-accent"
                  >
                    <div>
                      <span className="block text-sm font-normal">
                        {newDate.selectedPhotoUrl ? "Букет выбран" : "Открыть каталог"}
                      </span>
                      <span className="block text-[11px] opacity-40">
                        {newDate.selectedPhotoUrl
                          ? `Категория: ${selectedBudget?.label}`
                          : "Выберите понравившийся стиль"}
                      </span>
                    </div>
                    <BookOpen className="size-5 opacity-40" />
                  </button>

                  {newDate.selectedPhotoUrl && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="size-16 overflow-hidden border border-border">
                        <img
                          src={newDate.selectedPhotoUrl}
                          alt="Выбранный букет"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm">{selectedBudget?.label} · {selectedBudget?.price}</p>
                        <button
                          onClick={() => { set("selectedPhotoUrl", ""); setShowCatalog(true) }}
                          className="mt-1 cursor-pointer border-none bg-transparent text-[11px] uppercase tracking-widest opacity-40 transition-opacity hover:opacity-70"
                        >
                          Изменить выбор
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Florist choice */}
              {newDate.budgetMode === "florist_choice" && (
                <div className="border border-dashed border-border bg-secondary/30 px-5 py-5">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 size-4 flex-shrink-0 opacity-40" style={{ color: "#9e5a6e" }} />
                    <div>
                      <p className="text-sm font-normal">Хозяйка знает лучше</p>
                      <p className="mt-1 text-[11px] leading-relaxed opacity-50">
                        Наш флорист самостоятельно подберёт сезонный букет, учитывая повод, стиль получателя и актуальные цветы. Укажите примерный бюджет ниже.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {BUDGET_OPTIONS.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => set("budget", b.id as BudgetId)}
                        className={`cursor-pointer border py-2.5 text-center font-sans text-[11px] transition-all ${
                          newDate.budget === b.id
                            ? "border-primary bg-accent"
                            : "border-border bg-secondary/50 opacity-60 hover:opacity-100"
                        }`}
                        style={newDate.budget === b.id ? { borderColor: b.color } : {}}
                      >
                        <span className="block font-normal" style={{ color: b.color }}>{b.price}</span>
                        <span className="block text-[10px] opacity-60">{b.label}</span>
                      </button>
                    ))}
                  </div>

                  {selectedBudget && catalogPhotos[newDate.budget]?.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-[11px] uppercase tracking-widest opacity-40">
                        Примеры — {selectedBudget.label}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {catalogPhotos[newDate.budget].map((src, i) => (
                          <div
                            key={i}
                            className="aspect-square overflow-hidden"
                            style={{ borderTop: `2px solid ${selectedBudget.color}` }}
                          >
                            <img
                              src={src}
                              alt={`Пример ${selectedBudget.label}`}
                              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recipient */}
            <div className="mt-5 border-t border-border pt-5">
              <label className="mb-3 block text-[11px] uppercase tracking-widest opacity-50">
                Данные получателя
              </label>
              <div className="flex flex-wrap gap-3">
                <div className="min-w-[200px] flex-1">
                  <label className="mb-1.5 block text-[10px] uppercase tracking-widest opacity-40">
                    Имя
                  </label>
                  <input
                    type="text"
                    placeholder="Имя получателя"
                    value={newDate.recipientName}
                    onChange={(e) => set("recipientName", e.target.value)}
                    className="w-full border border-input bg-muted p-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>
                <div className="min-w-[200px] flex-1">
                  <label className="mb-1.5 block text-[10px] uppercase tracking-widest opacity-40">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    placeholder="+7..."
                    value={newDate.recipientPhone}
                    onChange={(e) => set("recipientPhone", e.target.value)}
                    className="w-full border border-input bg-muted p-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Social links */}
              <div className="mt-3">
                <label className="mb-1.5 block text-[10px] uppercase tracking-widest opacity-40">
                  Instagram / ВКонтакте получателя
                </label>
                <input
                  type="text"
                  placeholder="@username или ссылка — флорист подберёт стиль"
                  value={newDate.recipientSocials}
                  onChange={(e) => set("recipientSocials", e.target.value)}
                  className="w-full border border-input bg-muted p-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
                <p className="mt-1 text-[10px] opacity-35">
                  Необязательно. Помогает флористу понять эстетику получателя.
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="mt-4">
              <label className="mb-1.5 block text-[11px] uppercase tracking-widest opacity-50">
                Адрес доставки
              </label>
              <input
                type="text"
                placeholder="пр. Суворова 13, Выборг"
                value={newDate.address}
                onChange={(e) => set("address", e.target.value)}
                className="w-full border border-input bg-muted p-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            {/* Note */}
            <div className="mt-4">
              <label className="mb-1.5 block text-[11px] uppercase tracking-widest opacity-50">
                Пожелания флористу
              </label>
              <textarea
                placeholder="Любимые цветы, предпочтения по цвету..."
                value={newDate.note}
                onChange={(e) => set("note", e.target.value)}
                className="min-h-[60px] w-full resize-y border border-input bg-muted p-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="mt-4 w-full cursor-pointer bg-primary px-10 py-3.5 text-sm font-normal uppercase tracking-widest text-primary-foreground transition-all hover:opacity-90"
          >
            Сохранить дату
          </button>
        </div>
      </div>

      {/* Catalog modal (layered on top) */}
      {showCatalog && (
        <CatalogModal
          onClose={() => setShowCatalog(false)}
          onSelect={(budget, photoUrl) => {
            set("budget", budget)
            set("selectedPhotoUrl", photoUrl)
          }}
          currentBudget={newDate.budget}
          currentPhoto={newDate.selectedPhotoUrl}
          catalogPhotos={catalogPhotos}
        />
      )}
    </>
  )
}
