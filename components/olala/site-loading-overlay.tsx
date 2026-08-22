"use client"

import { useEffect, type ReactNode } from "react"
import { OlalaLogoAnimated, OLALA_LOGO_LOADING_SIZE } from "./olala-logo-animated"
import { useSiteLoad } from "./site-load-context"

const LOGO_FADE_OUT_MS = 1400

type SiteLoadingOverlayProps = {
  children: ReactNode
}

export function SiteLoadingOverlay({ children }: SiteLoadingOverlayProps) {
  const { phase, snapshot, beginDissolve, finishDissolve } = useSiteLoad()

  useEffect(() => {
    if (phase !== "loading") return
    if (snapshot.totalProgress < 0.999) return
    beginDissolve()
  }, [phase, snapshot.totalProgress, beginDissolve])

  useEffect(() => {
    if (phase !== "dissolving") return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishDissolve()
      return
    }

    const timer = window.setTimeout(() => finishDissolve(), LOGO_FADE_OUT_MS)
    return () => window.clearTimeout(timer)
  }, [phase, finishDissolve])

  const percent = Math.round(snapshot.totalProgress * 100)
  const showContent = phase === "done"
  const showLoadingPanel = phase === "loading" || phase === "dissolving"
  const fading = phase === "dissolving"

  return (
    <>
      <div
        className={showContent ? "relative" : "invisible fixed inset-0 overflow-hidden"}
        aria-hidden={!showContent}
      >
        {children}
      </div>

      {showLoadingPanel && <LoadingPanel percent={percent} fading={fading} />}
    </>
  )
}

type LoadingPanelProps = {
  percent: number
  fading: boolean
}

function LoadingPanel({ percent, fading }: LoadingPanelProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#faf6f2] px-6 text-center"
      role="status"
      aria-live="polite"
      aria-label={`Загрузка сайта ${percent}%`}
    >
        <div
          style={{
            opacity: fading ? 0 : 1,
            transition: `opacity ${LOGO_FADE_OUT_MS}ms ease-out`,
          }}
        >
          <OlalaLogoAnimated
            size={OLALA_LOGO_LOADING_SIZE}
            animate={false}
            className="mb-6 flex flex-col items-center"
          />
        </div>

        <div
          style={{
            opacity: fading ? 0 : 1,
            transition: `opacity ${LOGO_FADE_OUT_MS}ms ease-out`,
          }}
        >
          <span className="mb-8 block font-sans text-[11px] uppercase tracking-[6px] opacity-40">
            flower shop
          </span>

          <p className="mb-8 font-serif text-[20px] font-light text-foreground/80">
            Загружаем Olala
          </p>

          <div className="mx-auto mb-3 h-[3px] w-full max-w-[280px] overflow-hidden bg-foreground/10">
            <div
              className="h-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>

          <p className="font-sans text-[12px] tracking-[3px] text-foreground/35">
            {percent}%
          </p>
        </div>
      </div>
    )
}
