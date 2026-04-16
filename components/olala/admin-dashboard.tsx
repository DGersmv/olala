"use client"

import { useState, useEffect, useCallback } from "react"
import { OlalaLogoAnimated } from "./olala-logo-animated"
import type { AuthUser } from "./auth-screens"
import { OCCASION_OPTIONS, BUDGET_OPTIONS } from "@/lib/olala-constants"
import { daysUntil, formatDate, getDaysLabel } from "@/lib/olala-utils"
import {
  LogOut, Users, Calendar, Bell, MapPin, Phone,
  Mail, Flower2, RefreshCw, ChevronRight, Clock,
} from "lucide-react"

// ─── Типы ────────────────────────────────────────────────────────────────────

interface AdminDateRow {
  id: string
  occasion: string
  custom_name: string
  date: string
  recipient_name: string
  recipient_phone: string
  recipient_socials: string
  address: string
  budget: string
  budget_mode: string
  selected_photo_url: string
  note: string
  created_at: string
  users: {
    id: string
    name: string
    email: string
    phone: string
  }
}

interface AdminUser {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
  last_login_at: string | null
}

type Tab = "upcoming" | "all" | "clients"

// ─── Хелперы ─────────────────────────────────────────────────────────────────

function occasionLabel(row: AdminDateRow): string {
  if (row.custom_name) return row.custom_name
  return OCCASION_OPTIONS.find((o) => o.id === row.occasion)?.label ?? row.occasion
}

function budgetLabel(id: string): string {
  return BUDGET_OPTIONS.find((b) => b.id === id)?.label ?? id
}

function budgetColor(id: string): string {
  return BUDGET_OPTIONS.find((b) => b.id === id)?.color ?? "#d4836b"
}

function urgencyStyle(days: number): { bg: string; text: string; label: string } {
  if (days === 0) return { bg: "bg-red-100",    text: "text-red-700",    label: "Сегодня!" }
  if (days <= 2)  return { bg: "bg-red-50",     text: "text-red-600",    label: `${days} ${getDaysLabel(days)}` }
  if (days <= 7)  return { bg: "bg-amber-50",   text: "text-amber-700",  label: `${days} ${getDaysLabel(days)}` }
  if (days <= 30) return { bg: "bg-emerald-50", text: "text-emerald-700",label: `${days} ${getDaysLabel(days)}` }
  return             { bg: "bg-secondary",      text: "text-muted-foreground", label: `${days} ${getDaysLabel(days)}` }
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })
}

// ─── Карточка даты ────────────────────────────────────────────────────────────

function DateCard({ row }: { row: AdminDateRow }) {
  const days = daysUntil(row.date)
  const { bg, text, label } = urgencyStyle(days)
  const budget = BUDGET_OPTIONS.find((b) => b.id === row.budget)

  return (
    <div className="border border-border bg-card p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start gap-4">
        {/* Срочность */}
        <div className={`flex min-w-[72px] flex-col items-center rounded px-2 py-2 ${bg}`}>
          <span className={`text-xl font-light leading-none ${text}`}>{days}</span>
          <span className={`mt-0.5 text-[10px] uppercase tracking-wide ${text}`}>{getDaysLabel(days)}</span>
          <span className={`mt-1 text-[9px] opacity-60 ${text}`}>{label === `${days} ${getDaysLabel(days)}` ? "" : label}</span>
        </div>

        {/* Основное */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-serif text-base">{occasionLabel(row)}</span>
            <span className="text-[11px] opacity-40">·</span>
            <span className="text-[12px] opacity-50">{formatDate(row.date)}</span>
            {/* Бюджет */}
            <span
              className="rounded px-2 py-0.5 text-[10px] uppercase tracking-widest text-white"
              style={{ background: budgetColor(row.budget) }}
            >
              {budgetLabel(row.budget)}
            </span>
            {row.budget_mode === "catalog" && row.selected_photo_url && (
              <span className="text-[10px] opacity-40">из каталога</span>
            )}
          </div>

          {/* Получатель */}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
            <span className="font-medium">{row.recipient_name}</span>
            {row.recipient_phone && (
              <span className="flex items-center gap-1 opacity-50">
                <Phone className="size-3" />{row.recipient_phone}
              </span>
            )}
            {row.address && (
              <span className="flex items-center gap-1 opacity-50">
                <MapPin className="size-3" />{row.address}
              </span>
            )}
          </div>

          {/* Социалки и заметка */}
          {row.recipient_socials && (
            <p className="mt-1 text-[11px] opacity-40">Соцсети: {row.recipient_socials}</p>
          )}
          {row.note && (
            <p className="mt-1 text-[11px] italic opacity-50">"{row.note}"</p>
          )}

          {/* Заказчик */}
          <div className="mt-2 flex items-center gap-3 border-t border-border pt-2">
            <span className="text-[11px] uppercase tracking-widest opacity-30">Заказчик</span>
            <span className="text-[12px]">{row.users.name}</span>
            <span className="flex items-center gap-1 text-[11px] opacity-40">
              <Mail className="size-3" />{row.users.email}
            </span>
            {row.users.phone && (
              <span className="flex items-center gap-1 text-[11px] opacity-40">
                <Phone className="size-3" />{row.users.phone}
              </span>
            )}
          </div>
        </div>

        {/* Фото букета если выбрано */}
        {row.selected_photo_url && (
          <div className="hidden size-16 shrink-0 overflow-hidden border border-border sm:block">
            <img src={row.selected_photo_url} alt="" className="h-full w-full object-cover" />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Основной компонент ───────────────────────────────────────────────────────

interface AdminDashboardProps {
  user: AuthUser | null
  onLogout: () => void
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>("upcoming")
  const [dates, setDates] = useState<AdminDateRow[]>([])
  const [clients, setClients] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [dRes, uRes] = await Promise.all([
        fetch("/api/admin/dates").then((r) => r.json()),
        fetch("/api/admin/users").then((r) => r.json()),
      ])
      setDates(dRes.dates ?? [])
      setClients(uRes.users ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Ближайшие 30 дней + сортировка по дням
  const upcoming = dates
    .map((d) => ({ ...d, days: daysUntil(d.date) }))
    .filter((d) => d.days <= 30)
    .sort((a, b) => a.days - b.days)

  const thisWeek = dates.filter((d) => daysUntil(d.date) <= 7).length

  // Сгруппировать даты по клиентам для вкладки клиентов
  const clientDateCount: Record<string, number> = {}
  dates.forEach((d) => {
    clientDateCount[d.users.id] = (clientDateCount[d.users.id] ?? 0) + 1
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-end gap-3">
            <OlalaLogoAnimated size={48} />
            <span className="hidden pb-0.5 text-[10px] uppercase tracking-[5px] opacity-30 sm:block">
              admin
            </span>
          </div>

          {/* Статистика */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-[12px]">
              <Users className="size-3.5 opacity-40" />
              <span className="font-medium">{clients.length}</span>
              <span className="hidden opacity-40 sm:inline">клиентов</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px]">
              <Calendar className="size-3.5 opacity-40" />
              <span className="font-medium">{dates.length}</span>
              <span className="hidden opacity-40 sm:inline">дат</span>
            </div>
            {thisWeek > 0 && (
              <div className="flex items-center gap-1.5 rounded bg-amber-50 px-2 py-1 text-[12px] text-amber-700">
                <Bell className="size-3.5" />
                <span className="font-medium">{thisWeek}</span>
                <span className="hidden sm:inline">на этой неделе</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              title="Обновить"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onLogout}
              className="flex cursor-pointer items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Приветствие */}
        <div className="mb-8">
          <h1 className="font-serif text-[28px] font-light">Панель управления</h1>
          <p className="mt-1 text-[13px] opacity-40">{user?.email}</p>
        </div>

        {/* Табы */}
        <div className="mb-6 flex gap-1 border-b border-border">
          {(
            [
              { id: "upcoming", label: "Ближайшие", icon: Bell, count: upcoming.length },
              { id: "all",      label: "Все заказы", icon: Calendar, count: dates.length },
              { id: "clients",  label: "Клиенты",    icon: Users,    count: clients.length },
            ] as const
          ).map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 pb-3 pt-1 text-[13px] transition-all ${
                tab === id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                tab === id ? "bg-primary/10 text-primary" : "bg-secondary"
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Ближайшие 30 дней */}
            {tab === "upcoming" && (
              <div>
                {upcoming.length === 0 ? (
                  <div className="flex flex-col items-center py-20 text-center">
                    <Flower2 className="mb-4 size-10 opacity-20" />
                    <p className="text-[13px] opacity-40">Нет дат в ближайшие 30 дней</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {upcoming.map((row) => <DateCard key={row.id} row={row} />)}
                  </div>
                )}
              </div>
            )}

            {/* Все заказы */}
            {tab === "all" && (
              <div>
                {dates.length === 0 ? (
                  <div className="flex flex-col items-center py-20 text-center">
                    <Calendar className="mb-4 size-10 opacity-20" />
                    <p className="text-[13px] opacity-40">Пока нет заказов</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {[...dates]
                      .sort((a, b) => daysUntil(a.date) - daysUntil(b.date))
                      .map((row) => <DateCard key={row.id} row={row} />)
                    }
                  </div>
                )}
              </div>
            )}

            {/* Клиенты */}
            {tab === "clients" && (
              <div>
                {clients.length === 0 ? (
                  <div className="flex flex-col items-center py-20 text-center">
                    <Users className="mb-4 size-10 opacity-20" />
                    <p className="text-[13px] opacity-40">Пока нет клиентов</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {clients.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between border border-border bg-card px-5 py-4 transition-shadow hover:shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          {/* Аватар-заглушка */}
                          <div className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-medium text-primary">
                            {c.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{c.name || "—"}</p>
                            <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] opacity-40">
                              <span className="flex items-center gap-1">
                                <Mail className="size-3" />{c.email}
                              </span>
                              {c.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="size-3" />{c.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <p className="text-[13px] font-medium">{clientDateCount[c.id] ?? 0}</p>
                            <p className="text-[10px] opacity-40">
                              {clientDateCount[c.id] === 1 ? "дата" : "дат"}
                            </p>
                          </div>
                          <div className="hidden sm:block">
                            <p className="text-[11px] opacity-40">
                              <Clock className="mr-1 inline size-3" />
                              {c.last_login_at ? shortDate(c.last_login_at) : "не входил"}
                            </p>
                            <p className="text-[10px] opacity-30">
                              с {shortDate(c.created_at)}
                            </p>
                          </div>
                          <ChevronRight className="size-4 opacity-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
