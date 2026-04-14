"use client"

import type { CSSProperties } from "react"
import { OlalaLogoAnimated } from "./olala-logo-animated"

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

/** Фоновые карточки — статика из `public/landing/` */
const flowerImages = Array.from({ length: 10 }, (_, i) => `/landing/${String(i + 1).padStart(2, "0")}.jpg`)

export function LandingScreen({ onRegister, onLogin, heroIdx }: LandingScreenProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background */}
      <div
        className="absolute inset-0 -z-20 transition-all duration-2000"
        style={{ background: heroGradients[heroIdx] }}
      />

      {/* Background flower cards — все из центра экрана, лучами как распускающийся цветок */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] hidden lg:block"
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

      {/* Floating petals */}
      <div className="pointer-events-none absolute inset-0 -z-10">
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

      <div className="relative z-10 grid min-h-screen w-full grid-rows-[1fr_auto_1fr] px-5">
        <div aria-hidden className="min-h-0" />
        <div className="mx-auto flex w-full max-w-[680px] min-h-0 flex-col items-center justify-center py-6 text-center">
          <div className="animate-fade-up mb-8 flex flex-col items-center gap-2">
            <OlalaLogoAnimated size={280} className="flex flex-col items-center" />
            <span className="font-sans text-[11px] uppercase tracking-[6px] opacity-40">
              flower shop
            </span>
          </div>

          <p
            className="animate-fade-up mb-4 font-serif text-[26px] font-light leading-relaxed"
            style={{ animationDelay: "0.15s" }}
          >
            Забудьте о забытых датах.
            <br />
            <span className="italic text-primary">Мы помним за вас.</span>
          </p>

          <p
            className="animate-fade-up mx-auto mb-10 max-w-[480px] text-sm leading-relaxed opacity-50"
            style={{ animationDelay: "0.25s" }}
          >
            Зарегистрируйтесь, добавьте важные даты — и в нужный день ваши близкие
            получат авторский букет от нашего флориста. Без напоминаний, без
            забот.
          </p>

          <div
            className="animate-fade-up flex flex-wrap justify-center gap-4"
            style={{ animationDelay: "0.35s" }}
          >
            <button
              onClick={onRegister}
              className="cursor-pointer bg-primary px-10 py-3.5 text-sm font-normal uppercase tracking-widest text-primary-foreground transition-all hover:opacity-90"
            >
              Начать
            </button>
            <button
              onClick={onLogin}
              className="cursor-pointer border border-border bg-transparent px-10 py-3.5 text-sm font-light uppercase tracking-widest text-foreground transition-all hover:bg-accent"
            >
              Уже есть аккаунт
            </button>
          </div>
        </div>
        <div aria-hidden className="min-h-0" />
      </div>
    </div>
  )
}
