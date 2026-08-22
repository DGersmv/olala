"use client"

import { useEffect, useState } from "react"
import { InstagramPhotoPanel } from "./instagram-photo-panel"
import { OlalaLogoAnimated, OLALA_LOGO_HERO_SIZE } from "./olala-logo-animated"
import { LumaSceneViewer } from "./luma-scene-viewer"
import { SiteLoadProvider, useSiteLoad } from "./site-load-context"
import { SiteLoadingOverlay } from "./site-loading-overlay"

const heroGradient =
  "radial-gradient(ellipse at center, rgba(250, 246, 242, 0.82) 0%, rgba(250, 246, 242, 0.38) 48%, rgba(250, 246, 242, 0.1) 100%)"

const LOGO_FADE_MS = 1200
const COMPACT_MQ =
  "(orientation: landscape) and (max-height: 560px) and (max-width: 1023px)"

function useCompactLandscape() {
  const [compact, setCompact] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(COMPACT_MQ).matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia(COMPACT_MQ)
    const update = () => setCompact(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return compact
}

export function UnderConstructionScreen() {
  return (
    <SiteLoadProvider>
      <SiteLoadingOverlay>
        <UnderConstructionContent />
      </SiteLoadingOverlay>
    </SiteLoadProvider>
  )
}

function UnderConstructionContent() {
  const compact = useCompactLandscape()
  const { phase } = useSiteLoad()
  const heroSize = compact ? 88 : OLALA_LOGO_HERO_SIZE
  const [logoVisible, setLogoVisible] = useState(false)
  const [logoAnimate, setLogoAnimate] = useState(false)

  useEffect(() => {
    if (phase !== "done") {
      setLogoVisible(false)
      setLogoAnimate(false)
      return
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reducedMotion) {
      setLogoVisible(true)
      setLogoAnimate(true)
      return
    }

    const fadeFrame = window.requestAnimationFrame(() => setLogoVisible(true))
    const playTimer = window.setTimeout(() => setLogoAnimate(true), 280)
    return () => {
      window.cancelAnimationFrame(fadeFrame)
      window.clearTimeout(playTimer)
    }
  }, [phase])

  return (
    <div className="relative h-screen overflow-hidden">
      <LumaSceneViewer className="absolute inset-0 z-0" />

      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ background: heroGradient }}
      />

      <div className="pointer-events-none relative z-10 flex h-full w-full flex-col items-center justify-center px-5 text-center">
        <div
          className={`mx-auto flex w-full flex-col items-center ${
            compact ? "max-w-[280px]" : "max-w-[600px]"
          }`}
        >
          <div
            style={{
              opacity: logoVisible ? 1 : 0,
              transition: `opacity ${LOGO_FADE_MS}ms ease-out`,
            }}
          >
            <OlalaLogoAnimated
              size={heroSize}
              animate={logoAnimate}
              loop={logoAnimate}
              className={`flex flex-col items-center ${compact ? "mb-0.5" : "mb-4"}`}
            />
          </div>

          <div
            className="flex flex-col items-center"
            style={{
              color: "#2c221f",
              textShadow:
                "0 1px 0 rgba(250, 246, 242, 0.95), 0 0 14px rgba(250, 246, 242, 0.9), 0 0 28px rgba(250, 246, 242, 0.7)",
            }}
          >
          <span
            className={`font-sans uppercase ${
              compact
                ? "mb-1.5 text-[9px] tracking-[4px] opacity-80"
                : "mb-8 text-[11px] tracking-[6px] opacity-80"
            }`}
          >
            flower shop
          </span>

          <p
            className={`animate-fade-up font-serif font-normal leading-snug ${
              compact ? "mb-1 text-[16px]" : "mb-3 text-[22px] sm:text-[24px]"
            }`}
            style={{ animationDelay: "0.15s" }}
          >
            Сайт в разработке
          </p>

          <p
            className={`animate-fade-up font-serif font-normal leading-snug opacity-90 ${
              compact ? "text-[13px]" : "text-[18px] sm:text-[20px]"
            }`}
            style={{ animationDelay: "0.25s" }}
          >
            Скоро здесь будет что-то{" "}
            <span className="italic text-primary">прекрасное.</span>
          </p>

          <p
            className={`animate-fade-up opacity-80 ${
              compact ? "mt-2 text-xs" : "mt-8 text-sm"
            }`}
            style={{ animationDelay: "0.35s" }}
          >
            Позвоните нам{" "}
            <a
              href="tel:+79211880590"
              className="pointer-events-auto font-medium text-foreground opacity-100 transition-opacity hover:text-primary"
            >
              +7 (921) 188-05-90
            </a>
          </p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-30 overflow-visible">
        <InstagramPhotoPanel />
      </div>
    </div>
  )
}
