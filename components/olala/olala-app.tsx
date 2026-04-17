"use client"

import { useState, useEffect, useCallback } from "react"
import { LandingScreen } from "./landing-screen"
import { RegisterScreen, LoginScreen } from "./auth-screens"
import type { AuthUser } from "./auth-screens"
import { DashboardScreen } from "./dashboard-screen"
import { AdminDashboard } from "./admin-dashboard"
import type { DateEntry } from "@/lib/olala-constants"
import type { CatalogPhotos } from "@/lib/catalog-photos"

type Screen = "loading" | "landing" | "register" | "login" | "dashboard" | "admin_dashboard"

export function OlalaApp({ catalogPhotos }: { catalogPhotos: CatalogPhotos }) {
  const [screen, setScreen] = useState<Screen>("loading")
  const [user, setUser] = useState<AuthUser | null>(null)
  const [dates, setDates] = useState<DateEntry[]>([])
  const [fadeIn, setFadeIn] = useState(true)
  const [heroIdx, setHeroIdx] = useState(0)

  // Hero image rotation
  useEffect(() => {
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % 5), 5000)
    return () => clearInterval(t)
  }, [])

  // Восстановление сессии при загрузке
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(({ user: u }) => {
        if (u) {
          setUser(u)
          setScreen(u.isAdmin ? "admin_dashboard" : "dashboard")
          // Загружаем даты
          loadDates()
        } else {
          setScreen("landing")
        }
      })
      .catch(() => setScreen("landing"))
  }, [])

  const loadDates = useCallback(async () => {
    try {
      const res = await fetch("/api/dates")
      if (!res.ok) return
      const { dates: d } = await res.json()
      setDates(d ?? [])
    } catch { /* ignore */ }
  }, [])

  const navigate = useCallback((s: Screen) => {
    setFadeIn(false)
    setTimeout(() => { setScreen(s); setFadeIn(true) }, 400)
  }, [])

  const handleAuth = useCallback(async (u: AuthUser) => {
    setUser(u)
    if (u.isAdmin) {
      navigate("admin_dashboard")
    } else {
      await loadDates()
      navigate("dashboard")
    }
  }, [navigate, loadDates])

  const addDate = useCallback(async (d: Omit<DateEntry, "id">) => {
    try {
      const res = await fetch("/api/dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      })
      if (!res.ok) return
      const { date } = await res.json()
      setDates((prev) => [...prev, date])
    } catch { /* ignore */ }
  }, [])

  const removeDate = useCallback(async (id: number) => {
    setDates((prev) => prev.filter((d) => d.id !== id))
    try {
      await fetch(`/api/dates/${id}`, { method: "DELETE" })
    } catch { /* ignore */ }
  }, [])

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    setDates([])
    navigate("landing")
  }, [navigate])

  if (screen === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="min-h-screen transition-opacity duration-400" style={{ opacity: fadeIn ? 1 : 0 }}>
        {screen === "landing" && (
          <LandingScreen onAuth={handleAuth} heroIdx={heroIdx} />
        )}
        {screen === "register" && (
          <RegisterScreen onSuccess={handleAuth} onBack={() => navigate("landing")} />
        )}
        {screen === "login" && (
          <LoginScreen onSuccess={handleAuth} onBack={() => navigate("landing")} />
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
        {screen === "admin_dashboard" && (
          <AdminDashboard user={user} onLogout={handleLogout} />
        )}
      </div>
    </div>
  )
}
