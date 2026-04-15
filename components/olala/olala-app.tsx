"use client"

import { useState, useEffect, useCallback } from "react"
import { LandingScreen } from "./landing-screen"
import { RegisterScreen, LoginScreen } from "./auth-screens"
import { DashboardScreen } from "./dashboard-screen"
import type { DateEntry, UserData } from "@/lib/olala-constants"
import type { CatalogPhotos } from "@/lib/catalog-photos"

type Screen = "landing" | "register" | "login" | "dashboard"

export function OlalaApp({ catalogPhotos }: { catalogPhotos: CatalogPhotos }) {
  const [screen, setScreen] = useState<Screen>("landing")
  const [user, setUser] = useState<UserData | null>(null)
  const [dates, setDates] = useState<DateEntry[]>([])
  const [fadeIn, setFadeIn] = useState(true)
  const [heroIdx, setHeroIdx] = useState(0)

  // Hero image rotation
  useEffect(() => {
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % 5), 5000)
    return () => clearInterval(t)
  }, [])

  const navigate = useCallback((s: Screen) => {
    setFadeIn(false)
    setTimeout(() => {
      setScreen(s)
      setFadeIn(true)
    }, 400)
  }, [])

  const handleRegister = useCallback(
    (data: UserData) => {
      setUser(data)
      navigate("dashboard")
    },
    [navigate]
  )

  const handleLogin = useCallback(
    (data: UserData) => {
      setUser(data)
      navigate("dashboard")
    },
    [navigate]
  )

  const addDate = useCallback((d: Omit<DateEntry, "id">) => {
    setDates((prev) => [...prev, { ...d, id: Date.now() }])
  }, [])

  const removeDate = useCallback((id: number) => {
    setDates((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const handleLogout = useCallback(() => {
    setUser(null)
    setDates([])
    navigate("landing")
  }, [navigate])

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="min-h-screen transition-opacity duration-400"
        style={{ opacity: fadeIn ? 1 : 0 }}
      >
        {screen === "landing" && (
          <LandingScreen
            onRegister={() => navigate("register")}
            onLogin={() => navigate("login")}
            heroIdx={heroIdx}
          />
        )}
        {screen === "register" && (
          <RegisterScreen
            onSubmit={handleRegister}
            onBack={() => navigate("landing")}
          />
        )}
        {screen === "login" && (
          <LoginScreen
            onSubmit={handleLogin}
            onBack={() => navigate("landing")}
          />
        )}
        {screen === "dashboard" && (
          <DashboardScreen
            user={user}
            dates={dates}
            onAdd={addDate}
            onRemove={removeDate}
            onLogout={handleLogout}
            catalogPhotos={catalogPhotos}
          />
        )}
      </div>
    </div>
  )
}
