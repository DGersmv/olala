"use client"

import { useState, useEffect, useRef } from "react"
import { OlalaLogoAnimated } from "./olala-logo-animated"
import { ShopSvg } from "./shop-svg"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { ArrowLeft, Loader2 } from "lucide-react"
import type { AuthUser } from "./auth-screens"
import { CaptchaWidget } from "./captcha-widget"
import { InstagramFeedWidget } from "./instagram-feed-widget"

interface LandingScreenProps {
  onAuth: (user: AuthUser) => void
}

type FormStep = "email" | "register" | "otp"

const heroGradient =
  "linear-gradient(135deg, rgba(250, 246, 242, 0.85) 0%, rgba(240, 221, 214, 0.85) 50%, rgba(245, 239, 233, 0.85) 100%)"

const inputCls = "w-full border border-input bg-muted px-4 py-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"

export function LandingScreen({ onAuth }: LandingScreenProps) {
  const [expanded, setExpanded] = useState(false)
  const [shopPhase, setShopPhase] = useState(0)

  // Форма
  const [formStep, setFormStep] = useState<FormStep>("email")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const logoTargetRef = useRef<HTMLDivElement>(null)
  const [logoTarget, setLogoTarget] = useState<{ x: number; y: number } | null>(null)
  const flowerShopRef = useRef<HTMLSpanElement>(null)
  const [flowerShopWidth, setFlowerShopWidth] = useState(0)

  useEffect(() => {
    if (!expanded) { setLogoTarget(null); return }
    requestAnimationFrame(() => {
      if (!logoTargetRef.current) return
      const rect = logoTargetRef.current.getBoundingClientRect()
      setLogoTarget({ x: rect.left, y: rect.top - 30 })
    })
  }, [expanded])

  // Measure "flower shop" text width once on mount
  useEffect(() => {
    if (flowerShopRef.current) {
      setFlowerShopWidth(flowerShopRef.current.offsetWidth)
    }
  }, [])

  useEffect(() => {
    if (!expanded) return
    setShopPhase(0)
    let t1: ReturnType<typeof setTimeout>
    let t2: ReturnType<typeof setTimeout>
    let t3: ReturnType<typeof setTimeout>
    let tf: ReturnType<typeof setTimeout>
    // Double RAF: ensure browser paints initial opacity:0 state before starting transitions
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        t1 = setTimeout(() => setShopPhase(1), 900)
        t2 = setTimeout(() => setShopPhase(2), 2400)
        t3 = setTimeout(() => setShopPhase(3), 3900)
        tf = setTimeout(() => inputRef.current?.focus(), 1200)
      })
      return () => cancelAnimationFrame(raf2)
    })
    return () => {
      cancelAnimationFrame(raf1)
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(tf)
    }
  }, [expanded])

  const resetForm = () => {
    setFormStep("email"); setEmail(""); setName(""); setPhone("")
    setOtp(""); setError(null); setLoading(false); setCaptchaToken(null)
  }

  const handleBackToHome = () => {
    setExpanded(false)
    setShopPhase(0)
    resetForm()
  }

  // Шаг 1: проверяем email → новый или существующий
  const handleEmailContinue = async () => {
    const e = email.trim().toLowerCase()
    if (!e) return
    if (!captchaToken) { setError("Подтвердите, что вы не робот"); return }
    setError(null); setLoading(true)
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      })
      const { exists } = await res.json()
      if (exists) {
        // Существующий пользователь — сразу отправляем код
        await sendCode(e)
      } else {
        // Новый — показываем поля регистрации
        setFormStep("register")
      }
    } catch {
      setError("Нет соединения с сервером")
    } finally {
      setLoading(false)
    }
  }

  // Шаг 2 (новый пользователь): заполнил имя+телефон → отправляем код
  const handleRegisterContinue = async () => {
    if (!name.trim()) { setError("Введите имя"); return }
    if (!phone.trim()) { setError("Введите телефон"); return }
    setError(null); setLoading(true)
    await sendCode(email.trim().toLowerCase())
    setLoading(false)
  }

  const sendCode = async (e: string) => {
    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: e, captchaToken }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Ошибка отправки"); return }
    setFormStep("otp")
  }

  // Шаг 3: OTP введён — верифицируем
  const handleOtpChange = async (val: string) => {
    setOtp(val); setError(null)
    if (val.length < 6) return
    setLoading(true)
    try {
      const isNew = formStep === "otp" && name.trim() !== ""
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: val,
          mode: isNew ? "register" : "login",
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Неверный код"); setOtp(""); return }
      onAuth(data.user as AuthUser)
    } catch {
      setError("Нет соединения с сервером")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Instagram background */}
      <div className="instagram-bg pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <InstagramFeedWidget visible={!expanded} />
      </div>

      {/* Semi-transparent gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-700"
        style={{ background: heroGradient, opacity: expanded ? 0 : 1 }}
      />

      {/* ── Назад на главную (expanded) ── */}
      <button
        type="button"
        onClick={handleBackToHome}
        aria-label="Вернуться"
        className={`fixed left-3 top-3 z-30 flex items-center gap-2 border border-foreground/20 bg-background/90 px-3 py-2.5 text-foreground shadow-md backdrop-blur-sm transition-all duration-500 hover:border-primary/50 hover:text-primary sm:left-5 sm:top-5 sm:gap-2.5 sm:px-4 sm:py-3${expanded ? " pointer-events-auto opacity-100" : " pointer-events-none opacity-0"}`}
      >
        <ArrowLeft className="size-5 shrink-0 sm:size-6" strokeWidth={1.75} />
        <span className="font-sans text-[11px] font-normal uppercase tracking-[0.2em] sm:text-xs">
          Вернуться
        </span>
      </button>

      {/* ── Логотип — сжимается и уходит в верхний левый угол ── */}
      <div
        onClick={expanded ? handleBackToHome : undefined}
        className={`fixed z-20 flex flex-col items-center gap-2${expanded ? " cursor-pointer" : ""}`}
        style={{
          top: 0,
          left: 0,
          transform: expanded && logoTarget
            ? `translate(${logoTarget.x}px, ${logoTarget.y}px) scale(0.4)`
            : "translate(calc(50vw - 140px), calc(50vh - 350px)) scale(1)",
          transformOrigin: "top left",
          transition: "transform 1.4s ease-in-out",
        }}
      >
        <OlalaLogoAnimated
          size={280}
          className="flex flex-col items-center"
        />
        <div className="flex w-fit flex-col items-start">
          <span ref={flowerShopRef} className="font-sans text-[11px] uppercase tracking-[6px] opacity-40">
            flower shop
          </span>
          {expanded && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={flowerShopWidth || 64}
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-1.5 opacity-40 transition-opacity duration-700 hover:opacity-70"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          )}
        </div>
      </div>

      {/* ── Центральный контент (исчезает при expanded) ── */}
      <div
        className="relative z-10 flex h-full w-full flex-col items-center justify-center px-5 text-center transition-opacity duration-500"
        style={{ opacity: expanded ? 0 : 1, pointerEvents: expanded ? "none" : "auto" }}
      >
        <div className="mx-auto flex w-full max-w-[600px] flex-col items-center">
          {/* Placeholder высоты логотипа */}
          <div className="mb-4" style={{ height: 320 }} />

          <p className="animate-fade-up mb-3 font-serif text-[22px] font-light leading-snug sm:text-[24px]" style={{ animationDelay: "0.15s" }}>
            Авторские букеты и композиции для моментов,{" "}
            <span className="italic text-primary">которые хочется запомнить.</span>
          </p>

          <p className="animate-fade-up mb-8 font-serif text-[18px] font-light leading-snug sm:text-[20px]" style={{ animationDelay: "0.25s" }}>
            Забудьте о забытых датах.{" "}
            <span className="italic text-primary">Мы помним за Вас.</span>
          </p>

          <button
            onClick={() => setExpanded(true)}
            className="animate-fade-up group relative font-serif text-[20px] font-light italic text-foreground transition-all hover:text-primary sm:text-[22px]"
            style={{ animationDelay: "0.35s" }}
          >
            Расскажите нам
            <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-100 bg-current transition-transform duration-300 group-hover:scale-x-110" />
          </button>

          <p className="animate-fade-up mt-5 text-sm opacity-50" style={{ animationDelay: "0.42s" }}>
            Или позвоните{" "}
            <a href="tel:+79211880590" className="font-medium opacity-80 transition-opacity hover:opacity-100">
              +7 (921) 188-05-90
            </a>
          </p>
        </div>
      </div>

      {/* ── Expanded: витрина + поле email ── */}
      <div
        className="absolute inset-0 z-10 overflow-y-auto transition-opacity duration-700"
        style={{ opacity: expanded ? 1 : 0, pointerEvents: expanded ? "auto" : "none" }}
      >
        <div className="mx-auto flex min-h-full w-full max-w-[900px] flex-col items-center justify-center gap-8 px-6 py-24 lg:flex-row lg:items-end lg:gap-16">

          {/* SVG витрина */}
          <div className="w-full max-w-[340px] shrink-0 text-foreground lg:max-w-[400px]">
            <ShopSvg phase={shopPhase} className="w-full h-auto opacity-30" />
          </div>

          {/* Правая часть: текст + email */}
          <div
            className="flex flex-col gap-6 pb-16 transition-opacity duration-700"
            style={{ opacity: shopPhase >= 1 ? 1 : 0, transitionDelay: "0.4s" }}
          >
            {/* Якорь — сюда прилетает логотип */}
            <div ref={logoTargetRef} className="h-20 w-16" />

            <p className="font-serif text-[32px] font-light leading-tight">
              Добро пожаловать<br />
              <span className="italic text-primary">в наш магазин.</span>
            </p>

            <div className="flex max-w-[360px] flex-col gap-2 text-sm leading-relaxed opacity-50">
              <p>
                Собираем вручную, доставляем бережно, оформляем с вниманием к каждой детали.
              </p>
              <p>
                Зарегистрируйтесь, добавьте важные даты — и в нужный день ваши близкие
                получат авторский букет от нашего флориста. Без напоминаний, без забот.
              </p>
            </div>

            {/* ── Шаг: email ── */}
            {formStep === "email" && (
              <div className="flex flex-col gap-3 w-full max-w-[320px]">
                <p className="text-sm opacity-50">Введите почту — мы всё поймём сами.</p>
                <input
                  ref={inputRef}
                  type="email"
                  placeholder="ваш@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null) }}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailContinue()}
                  className={inputCls}
                />
                <CaptchaWidget onToken={setCaptchaToken} />
                {error && <p className="text-[12px] text-red-500">{error}</p>}
                <button
                  onClick={handleEmailContinue}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-primary px-8 py-3 text-sm font-normal uppercase tracking-widest text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Продолжить"}
                </button>
              </div>
            )}

            {/* ── Шаг: регистрация (новый пользователь) ── */}
            {formStep === "register" && (
              <div className="flex flex-col gap-3 w-full max-w-[320px]">
                <p className="text-sm opacity-50">Вы у нас впервые — расскажите немного о себе.</p>
                <input type="text" placeholder="Ваше имя" value={name}
                  onChange={(e) => { setName(e.target.value); setError(null) }}
                  onKeyDown={(e) => e.key === "Enter" && handleRegisterContinue()}
                  className={inputCls} />
                <input type="tel" placeholder="+7 900 000 00 00" value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(null) }}
                  onKeyDown={(e) => e.key === "Enter" && handleRegisterContinue()}
                  className={inputCls} />
                {error && <p className="text-[12px] text-red-500">{error}</p>}
                <button onClick={handleRegisterContinue} disabled={loading}
                  className="flex items-center justify-center gap-2 bg-primary px-8 py-3 text-sm font-normal uppercase tracking-widest text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Получить код"}
                </button>
                <button onClick={() => setFormStep("email")} className="text-[11px] opacity-40 hover:opacity-70 text-left">
                  ← изменить почту
                </button>
              </div>
            )}

            {/* ── Шаг: OTP ── */}
            {formStep === "otp" && (
              <div className="flex flex-col gap-4 w-full max-w-[320px]">
                <p className="text-sm opacity-50">Код отправлен на <span className="opacity-100 font-medium">{email}</span></p>
                <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={otp} onChange={handleOtpChange} disabled={loading}>
                  <InputOTPGroup>
                    {[0,1,2,3,4,5].map(i => (
                      <InputOTPSlot key={i} index={i} className="h-12 w-12 border-input text-base font-light" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {loading && <Loader2 className="size-5 animate-spin text-primary" />}
                {error && <p className="text-[12px] text-red-500">{error}</p>}
                <button onClick={() => { setFormStep(name ? "register" : "email"); setOtp(""); setError(null) }}
                  className="text-[11px] opacity-40 hover:opacity-70 text-left">
                  ← назад
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
