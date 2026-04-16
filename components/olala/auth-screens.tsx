"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { OlalaLogo } from "./olala-logo"
import { OlalaLogoAnimated } from "./olala-logo-animated"
import type { UserData } from "@/lib/olala-constants"
import { ArrowLeft, Loader2, MailCheck } from "lucide-react"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"

// ─── Типы ────────────────────────────────────────────────────────────────────

export type AuthMode = "register" | "login" | "admin"

export interface AuthScreenProps {
  mode: AuthMode
  onSuccess: (user: AuthUser) => void
  onBack: () => void
  /** только для login: переключиться на admin */
  onSwitchToAdmin?: () => void
}

// ─── Yandex SmartCaptcha ─────────────────────────────────────────────────────

// Ключ клиента из Яндекс Облако → SmartCaptcha → "Ключ клиента"
const CAPTCHA_SITE_KEY = "ysc1_IeP5HbjpcjdaAHjOXYsmwE4itaxmQ1XIP85v7o2n3088fba7"

declare global {
  interface Window {
    smartCaptcha?: {
      render: (el: HTMLElement, params: object) => number
      destroy: (id: number) => void
      reset: (id: number) => void
    }
  }
}

function loadCaptchaScript(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined") return resolve()
    if (window.smartCaptcha) return resolve()

    const SCRIPT_ID = "ysc-captcha-script"
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null

    if (!script) {
      script = document.createElement("script")
      script.id = SCRIPT_ID
      script.src = "https://captcha-api.yandex.ru/captcha.js"
      document.head.appendChild(script)
    }

    // Скрипт уже загружен но window.smartCaptcha ещё не готов — ждём
    script.addEventListener("load", () => resolve(), { once: true })
    script.addEventListener("error", () => resolve(), { once: true })

    // Если скрипт уже загружен (событие load уже стрельнуло)
    if ((script as HTMLScriptElement & { readyState?: string }).readyState === "complete") {
      resolve()
    }
  })
}

function CaptchaWidget({ onToken }: { onToken: (t: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<number | null>(null)
  const [status, setStatus] = useState<"loading" | "ok" | "failed">("loading")

  useEffect(() => {
    let cancelled = false

    loadCaptchaScript().then(() => {
      if (cancelled) return

      if (!containerRef.current || !window.smartCaptcha) {
        setStatus("failed")
        onToken("__captcha_unavailable__")
        return
      }

      // Уничтожаем предыдущий виджет если был (React StrictMode)
      if (widgetId.current !== null) {
        try { window.smartCaptcha!.destroy(widgetId.current) } catch { /* ignore */ }
        widgetId.current = null
      }

      try {
        widgetId.current = window.smartCaptcha.render(containerRef.current, {
          sitekey: CAPTCHA_SITE_KEY,
          callback: (t: string) => { onToken(t) },
        })
        setStatus("ok")
      } catch (e) {
        console.warn("[SmartCaptcha] render failed:", e)
        setStatus("failed")
        onToken("__captcha_unavailable__")
      }
    })

    return () => {
      cancelled = true
      if (window.smartCaptcha && widgetId.current !== null) {
        try { window.smartCaptcha.destroy(widgetId.current) } catch { /* ignore */ }
        widgetId.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === "failed") {
    return (
      <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
        Капча недоступна — проверьте ключ в Яндекс Облаке
      </div>
    )
  }

  return <div ref={containerRef} className="mt-1" />
}

// ─── Общие стили ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full border border-input bg-muted p-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"

const labelCls = "mb-1.5 block text-[11px] uppercase tracking-widest opacity-50"

// ─── Шаг 1: форма ────────────────────────────────────────────────────────────

interface FormStepProps {
  mode: AuthMode
  onCodeSent: (email: string, name?: string, phone?: string) => void
}

function FormStep({ mode, onCodeSent }: FormStepProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ADMIN_EMAIL = "admin@olala-flowers.ru"

  const validate = (): string | null => {
    if (mode === "register") {
      if (!name.trim()) return "Введите имя"
      if (!phone.trim()) return "Введите телефон"
    }
    if (!email.trim()) return "Введите email"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Некорректный email"
    if (mode === "admin" && email.toLowerCase() !== ADMIN_EMAIL) {
      return `Доступ только для ${ADMIN_EMAIL}`
    }
    if (!captchaToken) return "Подтвердите, что вы не робот"
    return null
  }

  const handleSend = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), captchaToken }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Ошибка"); return }
      onCodeSent(email.toLowerCase(), name.trim() || undefined, phone.trim() || undefined)
    } catch {
      setError("Нет соединения с сервером")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {mode === "register" && (
        <>
          <div>
            <label className={labelCls}>Ваше имя</label>
            <input
              type="text"
              placeholder="Александр"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Телефон</label>
            <input
              type="tel"
              placeholder="+7 900 000 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputCls}
            />
          </div>
        </>
      )}

      <div>
        <label className={labelCls}>Email</label>
        <input
          type="email"
          placeholder={mode === "admin" ? ADMIN_EMAIL : "email@example.com"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className={inputCls}
        />
      </div>

      {/* Yandex SmartCaptcha */}
      <CaptchaWidget onToken={setCaptchaToken} />

      {error && (
        <p className="text-[13px] text-red-500">{error}</p>
      )}

      <button
        onClick={handleSend}
        disabled={loading}
        className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 bg-primary px-10 py-3.5 text-sm font-normal uppercase tracking-widest text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          "Получить код"
        )}
      </button>
    </div>
  )
}

// ─── Шаг 2: ввод кода ────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  name: string
  phone: string
  isAdmin: boolean
}

interface CodeStepProps {
  email: string
  mode: AuthMode
  name?: string
  phone?: string
  onSuccess: (user: AuthUser) => void
  onBack: () => void
}

function CodeStep({ email, mode, name, phone, onSuccess, onBack }: CodeStepProps) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timer, setTimer] = useState(60)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (timer === 0) return
    const t = setTimeout(() => setTimer((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [timer])

  const handleVerify = useCallback(async (val: string) => {
    if (val.length < 6) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: val, mode, name, phone }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Ошибка"); return }
      onSuccess(data.user as AuthUser)
    } catch {
      setError("Нет соединения с сервером")
    } finally {
      setLoading(false)
    }
  }, [email, mode, name, phone, onSuccess])

  // Автоверификация когда все 6 цифр введены
  const handleChange = (val: string) => {
    setCode(val)
    setError(null)
    if (val.length === 6) handleVerify(val)
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // При повторной отправке капча не требуется (уже прошла)
        body: JSON.stringify({ email, captchaToken: "__resend__" }),
      })
      setTimer(60)
      setCode("")
      setError(null)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <MailCheck className="size-10 text-primary opacity-80" />
        <p className="text-[13px] opacity-60 leading-relaxed">
          Мы отправили код на<br />
          <span className="font-medium text-foreground opacity-100">{email}</span>
        </p>
      </div>

      <InputOTP
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS}
        value={code}
        onChange={handleChange}
        disabled={loading}
      >
        <InputOTPGroup>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <InputOTPSlot
              key={i}
              index={i}
              className="h-12 w-12 border-input text-base font-light"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>

      {loading && (
        <Loader2 className="size-5 animate-spin text-primary" />
      )}

      {error && (
        <p className="text-[13px] text-red-500">{error}</p>
      )}

      <div className="flex flex-col items-center gap-2">
        {timer > 0 ? (
          <p className="text-[12px] opacity-40">
            Повторная отправка через {timer} с
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="cursor-pointer text-[12px] text-primary underline underline-offset-4 hover:opacity-70 disabled:opacity-40"
          >
            {resending ? "Отправляем..." : "Отправить снова"}
          </button>
        )}
        <button
          onClick={onBack}
          className="cursor-pointer text-[12px] opacity-40 hover:opacity-70"
        >
          Изменить email
        </button>
      </div>
    </div>
  )
}

// ─── Главный компонент AuthScreen ─────────────────────────────────────────────

const TITLES: Record<AuthMode, { heading: string; sub: string }> = {
  register: { heading: "Регистрация",       sub: "Создайте аккаунт — и мы будем помнить за вас" },
  login:    { heading: "Вход",              sub: "С возвращением" },
  admin:    { heading: "Администратор",     sub: "Панель управления Olala" },
}

export function AuthScreen({ mode, onSuccess, onBack, onSwitchToAdmin }: AuthScreenProps) {
  const [step, setStep] = useState<"form" | "code">("form")
  const [email, setEmail] = useState("")
  const [name, setName] = useState<string | undefined>()
  const [phone, setPhone] = useState<string | undefined>()

  const { heading, sub } = TITLES[mode]

  const handleCodeSent = (e: string, n?: string, p?: string) => {
    setEmail(e)
    setName(n)
    setPhone(p)
    setStep("code")
  }

  const handleVerified = (user: AuthUser) => {
    onSuccess(user)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-card p-5">
      {/* Кнопка назад */}
      <button
        onClick={step === "code" ? () => setStep("form") : onBack}
        className="absolute left-6 top-6 flex cursor-pointer items-center gap-1.5 border-none bg-transparent font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Назад
      </button>

      <div className="animate-fade-up w-full max-w-[420px] border border-border bg-secondary px-10 py-12">
        {/* Лого */}
        <div className="mb-5 flex flex-col items-center gap-2">
          {mode === "login" ? (
            <>
              <OlalaLogoAnimated size={100} className="flex flex-col items-center" />
              <span className="font-sans text-[11px] uppercase tracking-[6px] opacity-40">
                flower shop
              </span>
            </>
          ) : (
            <OlalaLogo width={110} />
          )}
        </div>

        <h2 className="mb-1.5 font-serif text-[30px] font-light">{heading}</h2>
        <p className="mb-8 text-[13px] opacity-40">{sub}</p>

        {step === "form" ? (
          <>
            <FormStep mode={mode} onCodeSent={handleCodeSent} />

            {/* Ссылка на admin только из login */}
            {mode === "login" && onSwitchToAdmin && (
              <p className="mt-6 text-center text-[11px] opacity-30">
                <button
                  onClick={onSwitchToAdmin}
                  className="cursor-pointer underline underline-offset-4 hover:opacity-70"
                >
                  Вход для администратора
                </button>
              </p>
            )}
          </>
        ) : (
          <CodeStep
            email={email}
            mode={mode}
            name={name}
            phone={phone}
            onSuccess={handleVerified}
            onBack={() => setStep("form")}
          />
        )}
      </div>
    </div>
  )
}

// ─── Обёртки для olala-app.tsx ───────────────────────────────────────────────

export function RegisterScreen({ onSuccess, onBack }: { onSuccess: (u: AuthUser) => void; onBack: () => void }) {
  return <AuthScreen mode="register" onSuccess={onSuccess} onBack={onBack} />
}

export function LoginScreen({ onSuccess, onBack, onSwitchToAdmin }: { onSuccess: (u: AuthUser) => void; onBack: () => void; onSwitchToAdmin?: () => void }) {
  return <AuthScreen mode="login" onSuccess={onSuccess} onBack={onBack} onSwitchToAdmin={onSwitchToAdmin} />
}

export function AdminLoginScreen({ onSuccess, onBack }: { onSuccess: (u: AuthUser) => void; onBack: () => void }) {
  return <AuthScreen mode="admin" onSuccess={onSuccess} onBack={onBack} />
}
