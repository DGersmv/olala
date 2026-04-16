"use client"

import { useState, useEffect, useRef, type CSSProperties } from "react"
import { OlalaLogoAnimated } from "./olala-logo-animated"
import { ShopSvg } from "./shop-svg"

interface LandingScreenProps {
  onRegister: () => void
  onLogin: () => void
  heroIdx: number
}

const heroGradients = [
  "linear-gradient(135deg, #faf6f2 0%, #f5e6e0 50%, #faf6f2 100%)",
  "linear-gradient(135deg, #faf6f2 0%, #f0ddd6 50%, #f5efe9 100%)",
  "linear-gradient(135deg, #f5e6e0 0%, #faf6f2 50%, #f0e0d8 100%)",
  "linear-gradient(135deg, #faf6f2 0%, #f5e0d5 50%, #faf6f2 100%)",
  "linear-gradient(135deg, #f0ddd6 0%, #faf6f2 50%, #f5e6e0 100%)",
]

const flowerImages = Array.from({ length: 10 }, (_, i) => `/landing/${String(i + 1).padStart(2, "0")}.jpg`)

export function LandingScreen({ onRegister, onLogin, heroIdx }: LandingScreenProps) {
  // expanded = true после нажатия "Расскажите нам"
  const [expanded, setExpanded] = useState(false)
  // shopPhase: 0→3, управляет появлением слоёв SVG
  const [shopPhase, setShopPhase] = useState(0)
  const [email, setEmail] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!expanded) return
    // Запускаем слои с задержками после того как фото исчезнут (800ms)
    const t1 = setTimeout(() => setShopPhase(1), 900)   // вход/дверь
    const t2 = setTimeout(() => setShopPhase(2), 2400)  // цветы
    const t3 = setTimeout(() => setShopPhase(3), 3900)  // вывеска
    // Фокус на email после появления поля
    const tf = setTimeout(() => inputRef.current?.focus(), 1200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(tf) }
  }, [expanded])

  const handleEmailSubmit = () => {
    if (!email.trim()) return
    onRegister()
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
        className={`absolute z-20 flex flex-col items-center gap-2 transition-all duration-1200 ease-in-out${expanded ? " cursor-pointer" : ""}`}
        style={
          expanded
            ? { top: 24, left: 24, transform: "none" }
            : { top: "50%", left: "50%", transform: "translate(-50%, -50%) translateY(-160px)" }
        }
      >
        <OlalaLogoAnimated
          size={expanded ? 64 : 280}
          className="flex flex-col items-center transition-all duration-700"
        />
        <span
          className="font-sans uppercase tracking-[6px] opacity-40 transition-all duration-700"
          style={{ fontSize: expanded ? "8px" : "11px" }}
        >
          flower shop
        </span>
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
            <p className="font-serif text-[32px] font-light leading-tight">
              Добро пожаловать<br />
              <span className="italic text-primary">в наш магазин.</span>
            </p>
            <p className="text-sm leading-relaxed opacity-50 max-w-[320px]">
              Введите почту — мы пришлём код для входа или создадим аккаунт, если вы у нас впервые.
            </p>

            <div className="flex flex-col gap-3">
              <input
                ref={inputRef}
                type="email"
                placeholder="ваш@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                className="border border-input bg-muted px-4 py-3 font-sans text-sm font-light text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
              <button
                onClick={handleEmailSubmit}
                className="bg-primary px-8 py-3 text-sm font-normal uppercase tracking-widest text-primary-foreground transition-all hover:opacity-90"
              >
                Продолжить
              </button>
            </div>

            <button
              onClick={onLogin}
              className="text-[12px] opacity-40 hover:opacity-70 transition-opacity text-left"
            >
              Уже есть аккаунт — войти
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
