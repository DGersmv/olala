"use client"

import { useState } from "react"
import { X } from "lucide-react"
import {
  OCCASION_OPTIONS,
  OCCASION_SECTIONS,
  BUDGET_OPTIONS,
  type DateEntry,
  type OccasionId,
  type BudgetId,
} from "@/lib/olala-constants"

interface AddDateModalProps {
  onClose: () => void
  onAdd: (date: Omit<DateEntry, "id">) => void
}

type NewDateForm = Omit<DateEntry, "id">

export function AddDateModal({ onClose, onAdd }: AddDateModalProps) {
  const [newDate, setNewDate] = useState<NewDateForm>({
    occasion: "",
    customName: "",
    date: "",
    recipientName: "",
    recipientPhone: "",
    address: "",
    budget: "medium",
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

  return (
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
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          <label className="mb-2 block text-[11px] uppercase tracking-widest opacity-50">
            Повод — выберите или добавьте свой
          </label>

          {OCCASION_SECTIONS.map((section) => (
            <div key={section.cat}>
              <p className="mb-0.5 mt-3.5 font-sans text-[11px] uppercase tracking-widest opacity-35">
                {section.title}
              </p>
              <div className="mt-1.5 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-1.5">
                {OCCASION_OPTIONS.filter((o) => o.cat === section.cat).map(
                  (o) => (
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
                  )
                )}
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

          {(newDate.occasion === "custom" ||
            newDate.occasion === "custom_prof") && (
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

          {/* Recipient */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1.5 block text-[11px] uppercase tracking-widest opacity-50">
                Кому
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
              <label className="mb-1.5 block text-[11px] uppercase tracking-widest opacity-50">
                Телефон получателя
              </label>
              <input
                type="tel"
                placeholder="+371..."
                value={newDate.recipientPhone}
                onChange={(e) => set("recipientPhone", e.target.value)}
                className="w-full border border-input bg-muted p-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div className="mt-4">
            <label className="mb-1.5 block text-[11px] uppercase tracking-widest opacity-50">
              Адрес доставки
            </label>
            <input
              type="text"
              placeholder="ул. Бривибас 100, Рига"
              value={newDate.address}
              onChange={(e) => set("address", e.target.value)}
              className="w-full border border-input bg-muted p-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>

          {/* Budget */}
          <div className="mt-4">
            <label className="mb-2 block text-[11px] uppercase tracking-widest opacity-50">
              Бюджет
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {BUDGET_OPTIONS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => set("budget", b.id as BudgetId)}
                  className={`cursor-pointer border bg-secondary/50 p-4 text-center font-sans transition-all ${
                    newDate.budget === b.id
                      ? "border-primary bg-accent"
                      : "border-border hover:border-primary/50"
                  }`}
                  style={
                    newDate.budget === b.id
                      ? {
                          borderColor: b.color,
                          boxShadow: `0 0 20px ${b.color}33`,
                        }
                      : {}
                  }
                >
                  <span
                    className="block text-base font-normal"
                    style={{ color: b.color }}
                  >
                    {b.price}
                  </span>
                  <span className="block text-[13px] font-normal">
                    {b.label}
                  </span>
                  <span className="block text-[11px] opacity-40">{b.desc}</span>
                </button>
              ))}
            </div>
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
  )
}
