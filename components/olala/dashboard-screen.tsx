"use client"

import { useState } from "react"
import { OlalaLogo } from "./olala-logo"
import { AddDateModal } from "./add-date-modal"
import {
  OCCASION_OPTIONS,
  BUDGET_OPTIONS,
  type DateEntry,
  type UserData,
} from "@/lib/olala-constants"
import {
  formatDate,
  daysUntil,
  getDaysLabel,
  getDatesLabel,
} from "@/lib/olala-utils"
import { Plus, X, Calendar, MapPin, Flower2, MessageCircle, LogOut } from "lucide-react"
import type { CatalogPhotos } from "@/lib/catalog-photos"

interface DashboardScreenProps {
  user: UserData | null
  dates: DateEntry[]
  onAdd: (date: Omit<DateEntry, "id">) => void
  onRemove: (id: number) => void
  onLogout: () => void
  catalogPhotos: CatalogPhotos
}

export function DashboardScreen({
  user,
  dates,
  onAdd,
  onRemove,
  onLogout,
  catalogPhotos,
}: DashboardScreenProps) {
  const [showModal, setShowModal] = useState(false)

  const sortedDates = [...dates].sort(
    (a, b) => daysUntil(a.date) - daysUntil(b.date)
  )

  const occasionLabel = (d: DateEntry) => {
    if (d.customName) return d.customName
    return (
      OCCASION_OPTIONS.find((o) => o.id === d.occasion)?.label || d.occasion
    )
  }

  const budgetInfo = (id: string) => BUDGET_OPTIONS.find((b) => b.id === id)

  const firstName = user?.name?.split(" ")[0] || "Гость"

  return (
    <div className="animate-fade-up mx-auto min-h-screen max-w-[720px] px-6 pb-32">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border py-5">
        <OlalaLogo width={100} />
        <div className="flex items-center gap-4">
          <span className="text-[13px] opacity-50">{user?.name}</span>
          <button
            onClick={onLogout}
            className="flex cursor-pointer items-center gap-1.5 border border-border bg-transparent px-4 py-1.5 font-sans text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <LogOut className="size-3.5" />
            Выйти
          </button>
        </div>
      </header>

      {/* Greeting */}
      <div className="mb-8 mt-8">
        <h2 className="font-serif text-[28px] font-light">
          Привет, {firstName}
        </h2>
        <p className="mt-1.5 text-sm opacity-40">
          {dates.length === 0
            ? "Добавьте первую важную дату — мы позаботимся об остальном"
            : `У вас ${dates.length} ${getDatesLabel(dates.length)} на контроле`}
        </p>
      </div>

      {/* Next upcoming date */}
      {sortedDates.length > 0 && (
        <div className="mb-8 border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
          <div className="mb-3 text-[10px] uppercase tracking-[3px] text-primary">
            Ближайшая дата
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-[22px] font-normal">
                {occasionLabel(sortedDates[0])} — {sortedDates[0].recipientName}
              </h3>
              <p className="mt-1 text-[13px] opacity-50">
                {formatDate(sortedDates[0].date)}
              </p>
            </div>
            <div className="text-center">
              <span className="block font-serif text-5xl font-light leading-none text-primary">
                {daysUntil(sortedDates[0].date)}
              </span>
              <span className="text-[11px] uppercase tracking-widest opacity-40">
                дн.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dates list */}
      <div className="flex flex-col gap-3">
        {sortedDates.map((d) => {
          const days = daysUntil(d.date)
          const bi = budgetInfo(d.budget)
          const isUrgent = days <= 7
          return (
            <div
              key={d.id}
              className="relative border border-border bg-secondary/50 p-5"
              style={{
                borderLeftWidth: 3,
                borderLeftColor: isUrgent ? "#d4836b" : bi?.color || "#d4c4bc",
              }}
            >
              <div className="mb-2.5 flex items-center justify-between">
                <div>
                  <span className="font-serif text-[17px] font-medium">
                    {occasionLabel(d)}
                  </span>
                  <span className="ml-2 text-[13px] opacity-50">
                    → {d.recipientName}
                  </span>
                </div>
                <button
                  onClick={() => onRemove(d.id)}
                  className="cursor-pointer border-none bg-transparent p-1 text-foreground/20 transition-colors hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-4 text-xs opacity-45">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {formatDate(d.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Flower2 className="size-3.5" />
                  {bi?.label} ({bi?.price})
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {d.address}
                </span>
                {d.note && (
                  <span className="flex items-center gap-1.5 italic opacity-75">
                    <MessageCircle className="size-3.5" />
                    {d.note}
                  </span>
                )}
              </div>
              <div
                className="absolute bottom-4.5 right-5 text-xs font-normal"
                style={{ color: isUrgent ? "#d4836b" : "#a09490" }}
              >
                через {days} {getDaysLabel(days)}
              </div>
            </div>
          )
        })}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 cursor-pointer items-center gap-2.5 bg-primary px-8 py-3.5 font-sans text-[13px] font-normal tracking-wide text-primary-foreground shadow-[0_8px_32px_rgba(212,131,107,0.4)] transition-all hover:opacity-90"
      >
        <Plus className="size-5" strokeWidth={1.5} />
        Добавить дату
      </button>

      {/* Modal */}
      {showModal && (
        <AddDateModal
          onClose={() => setShowModal(false)}
          onAdd={onAdd}
          catalogPhotos={catalogPhotos}
        />
      )}

      {/* Empty state */}
      {dates.length === 0 && (
        <div className="py-20 text-center opacity-50">
          <p className="font-serif text-[22px] font-normal">
            Здесь появятся ваши важные даты
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[13px] opacity-60">
            Нажмите «Добавить дату», чтобы мы никогда не забыли поздравить ваших
            близких
          </p>
        </div>
      )}
    </div>
  )
}
