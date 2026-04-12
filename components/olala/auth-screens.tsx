"use client"

import { useState } from "react"
import { OlalaLogo } from "./olala-logo"
import type { UserData } from "@/lib/olala-constants"
import { ArrowLeft } from "lucide-react"

interface RegisterScreenProps {
  onSubmit: (data: UserData) => void
  onBack: () => void
}

interface LoginScreenProps {
  onSubmit: (data: UserData) => void
  onBack: () => void
}

export function RegisterScreen({ onSubmit, onBack }: RegisterScreenProps) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" })
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = () => {
    if (!form.name || !form.phone) return
    onSubmit(form)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-card p-5">
      <button
        onClick={onBack}
        className="absolute left-6 top-6 flex cursor-pointer items-center gap-1.5 border-none bg-transparent font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Назад
      </button>

      <div className="animate-fade-up w-full max-w-[420px] border border-border bg-secondary px-10 py-12">
        <div className="mb-5">
          <OlalaLogo width={120} />
        </div>
        <h2 className="mb-2 font-serif text-[32px] font-light">Регистрация</h2>
        <p className="mb-8 text-[13px] opacity-40">
          Создайте аккаунт и больше никогда не забывайте важные даты
        </p>

        <div className="mb-4">
          <label className="mb-1.5 block text-[11px] uppercase tracking-widest opacity-50">
            Ваше имя
          </label>
          <input
            type="text"
            placeholder="Александр"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full border border-input bg-muted p-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-[11px] uppercase tracking-widest opacity-50">
            Телефон
          </label>
          <input
            type="tel"
            placeholder="+371 20 000 000"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="w-full border border-input bg-muted p-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-[11px] uppercase tracking-widest opacity-50">
            Email
          </label>
          <input
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="w-full border border-input bg-muted p-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>

        <div className="mb-6">
          <label className="mb-1.5 block text-[11px] uppercase tracking-widest opacity-50">
            Пароль
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            className="w-full border border-input bg-muted p-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full cursor-pointer bg-primary px-10 py-3.5 text-sm font-normal uppercase tracking-widest text-primary-foreground transition-all hover:opacity-90"
        >
          Создать аккаунт
        </button>
      </div>
    </div>
  )
}

export function LoginScreen({ onSubmit, onBack }: LoginScreenProps) {
  const [form, setForm] = useState({ phone: "", password: "" })
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-card p-5">
      <button
        onClick={onBack}
        className="absolute left-6 top-6 flex cursor-pointer items-center gap-1.5 border-none bg-transparent font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Назад
      </button>

      <div className="animate-fade-up w-full max-w-[420px] border border-border bg-secondary px-10 py-12">
        <div className="mb-5">
          <OlalaLogo width={120} />
        </div>
        <h2 className="mb-2 font-serif text-[32px] font-light">Вход</h2>
        <p className="mb-8 text-[13px] opacity-40">С возвращением</p>

        <div className="mb-4">
          <label className="mb-1.5 block text-[11px] uppercase tracking-widest opacity-50">
            Телефон
          </label>
          <input
            type="tel"
            placeholder="+371 20 000 000"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="w-full border border-input bg-muted p-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>

        <div className="mb-6">
          <label className="mb-1.5 block text-[11px] uppercase tracking-widest opacity-50">
            Пароль
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            className="w-full border border-input bg-muted p-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>

        <button
          onClick={() => onSubmit({ name: "Пользователь", phone: form.phone })}
          className="w-full cursor-pointer bg-primary px-10 py-3.5 text-sm font-normal uppercase tracking-widest text-primary-foreground transition-all hover:opacity-90"
        >
          Войти
        </button>
      </div>
    </div>
  )
}
