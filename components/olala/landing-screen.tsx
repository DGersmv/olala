"use client"

import { useState, useEffect, useRef, type CSSProperties } from "react"
import { OlalaLogoAnimated } from "./olala-logo-animated"
import { ShopSvg } from "./shop-svg"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { Loader2 } from "lucide-react"
import type { AuthUser } from "./auth-screens"
import { CaptchaWidget } from "./captcha-widget"

interface LandingScreenProps {
  onAuth: (user: AuthUser) => void
  heroIdx: number
}

type FormStep = "email" | "register" | "otp"

const heroGradients = [
  "linear-gradient(135deg, #faf6f2 0%, #f5e6e0 50%, #faf6f2 100%)",
  "linear-gradient(135deg, #faf6f2 0%, #f0ddd6 50%, #f5efe9 100%)",
  "linear-gradient(135deg, #f5e6e0 0%, #faf6f2 50%, #f0e0d8 100%)",
  "linear-gradient(135deg, #faf6f2 0%, #f5e0d5 50%, #faf6f2 100%)",
  "linear-gradient(135deg, #f0ddd6 0%, #faf6f2 50%, #f5e6e0 100%)",
]

const flowerImages = Array.from({ length: 10 }, (_, i) => `/landing/${String(i + 1).padStart(2, "0")}.jpg`)

const inputCls = "w-full border border-input bg-muted px-4 py-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"

export function LandingScreen({ onAuth, heroIdx }: LandingScreenProps) {
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
    setOtp(""); setError(null); setLoading(false)
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
    <div className="relative min-h-screen overflow-hidden">
      {/* Gradient background */}
      <div
        className="absolute inset-0 -z-20 transition-all duration-2000"
        style={{ background: heroGradients[heroIdx] }}
      />

      {/* Background flower cards — плавно исчезают при expanded */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] hidden lg:block transition-opacity duration-700"
        style={{ opacity: expanded ? 0 : 1 }}
        aria-hidden
      >
        {flowerImages.map((src, i) => {
          const step = 360 / flowerImages.length
          const angleDeg = -90 + i * step
          return (
            <div
              key={src}
              className="animate-flower-bloom absolute left-1/2 top-1/2 h-32 w-32 overflow-hidden rounded shadow-sm"
              style={{
                "--petal-angle": `${angleDeg}deg`,
                "--petal-radius": "min(42vw, 46vh)",
                animationDelay: `${300 + i * 90}ms`,
                zIndex: i,
              } as CSSProperties}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </div>
          )
        })}
      </div>

      {/* Floating petals — тоже исчезают */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-700"
        style={{ opacity: expanded ? 0 : 1 }}
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="animate-petal absolute size-2 rounded-[50%_50%_50%_0] bg-[rgba(196,50,74,0.2)]"
            style={{
              left: `${10 + i * 15}%`,
              animationDelay: `${i * 1.2}s`,
              animationDuration: `${8 + i * 2}s`,
            }}
          />
        ))}
      </div>

      {/* ── Логотип — сжимается и уходит в верхний левый угол ── */}
      <div
        onClick={expanded ? () => { setExpanded(false); setShopPhase(0); setEmail("") } : undefined}
        className={`fixed z-20 flex flex-col items-center gap-2${expanded ? " cursor-pointer" : ""}`}
        style={{
          top: 0,
          left: 0,
          transform: expanded && logoTarget
            ? `translate(${logoTarget.x}px, ${logoTarget.y}px) scale(0.4)`
            : "translate(calc(50vw - 140px), calc(50vh - 300px)) scale(1)",
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
        className="relative z-10 grid min-h-screen w-full grid-rows-[1fr_auto_1fr] px-5 transition-opacity duration-500"
        style={{ opacity: expanded ? 0 : 1, pointerEvents: expanded ? "none" : "auto" }}
      >
        <div aria-hidden className="min-h-0" />
        <div className="mx-auto flex w-full max-w-[680px] min-h-0 flex-col items-center justify-center py-6 text-center">
          {/* Placeholder высоты логотипа */}
          <div className="mb-8" style={{ height: 360 }} />

          <p className="animate-fade-up mb-4 font-serif text-[26px] font-light leading-relaxed" style={{ animationDelay: "0.15s" }}>
            Забудьте о забытых датах.
            <br />
            <span className="italic text-primary">Мы помним за Вас.</span>
          </p>

          <p className="animate-fade-up mx-auto mb-2 max-w-[480px] text-sm leading-relaxed opacity-50" style={{ animationDelay: "0.25s" }}>
            Зарегистрируйтесь, добавьте важные даты — и в нужный день ваши близкие
            получат авторский букет от нашего флориста.
          </p>
          <p className="animate-fade-up mx-auto mb-10 max-w-[480px] text-sm leading-relaxed opacity-50" style={{ animationDelay: "0.28s" }}>
            Без напоминаний, без забот.
          </p>

          {/* Кнопка-ссылка */}
          <button
            onClick={() => setExpanded(true)}
            className="animate-fade-up group relative font-serif text-[22px] font-light italic text-foreground transition-all hover:text-primary"
            style={{ animationDelay: "0.35s" }}
          >
            Расскажите нам
            <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-100 bg-current transition-transform duration-300 group-hover:scale-x-110" />
          </button>

          <p className="animate-fade-up mt-8 text-sm opacity-40" style={{ animationDelay: "0.42s" }}>
            Или просто позвоните
          </p>
          <p className="animate-fade-up text-sm font-medium opacity-60" style={{ animationDelay: "0.46s" }}>
            +7 (921) 188-05-90
          </p>
        </div>
        <div aria-hidden className="min-h-0" />
      </div>

      {/* ── Expanded: витрина + поле email ── */}
      <div
        className="absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-700"
        style={{ opacity: expanded ? 1 : 0, pointerEvents: expanded ? "auto" : "none" }}
      >
        <div className="flex w-full max-w-[900px] flex-col items-center gap-8 px-6 pt-24 lg:flex-row lg:items-end lg:gap-16">

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
