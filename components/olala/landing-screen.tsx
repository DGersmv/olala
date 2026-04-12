"use client"

import { OlalaLogo } from "./olala-logo"
import { Calendar, Flower2, Truck } from "lucide-react"

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

const features = [
  {
    icon: Calendar,
    title: "Добавьте даты",
    desc: "Дни рождения, годовщины, праздники",
  },
  {
    icon: Flower2,
    title: "Выберите бюджет",
    desc: "Флорист подберёт идеальный букет",
  },
  {
    icon: Truck,
    title: "Доставка в срок",
    desc: "Букет приедет точно в нужный день",
  },
]

export function LandingScreen({ onRegister, onLogin, heroIdx }: LandingScreenProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-10">
      {/* Animated background */}
      <div
        className="absolute inset-0 transition-all duration-2000"
        style={{ background: heroGradients[heroIdx] }}
      />

      {/* Floating petals */}
      <div className="pointer-events-none absolute inset-0">
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

      <div className="relative z-10 max-w-[680px] text-center">
        {/* Logo */}
        <div className="animate-fade-up mb-10">
          <OlalaLogo width={240} />
          <p className="mt-1 font-sans text-[11px] uppercase tracking-[6px] opacity-40">
            flower shop
          </p>
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

        {/* Features */}
        <div className="mt-16 flex flex-wrap justify-center gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="animate-fade-up w-[180px] border border-border bg-secondary p-7 text-center"
              style={{ animationDelay: `${0.3 + i * 0.15}s` }}
            >
              <f.icon className="mx-auto mb-3 size-7 text-primary" strokeWidth={1.5} />
              <h3 className="mb-1.5 font-serif text-base font-medium">
                {f.title}
              </h3>
              <p className="text-xs leading-relaxed opacity-40">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
