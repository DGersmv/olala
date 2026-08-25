"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { InstagramPhotoPanel } from "./instagram-photo-panel"
import { OlalaLogoAnimated, OLALA_LOGO_HERO_SIZE } from "./olala-logo-animated"
import { LumaSceneViewer } from "./luma-scene-viewer"
import { SiteLoadProvider, useSiteLoad } from "./site-load-context"
import { SiteLoadingOverlay } from "./site-loading-overlay"
import { OlalaApp } from "./olala-app"
import { OPortal3D } from "./o-portal-3d"
import { useIntroPortalScroll } from "@/hooks/use-intro-portal-scroll"
import type { CatalogPhotos } from "@/lib/catalog-photos"
import {
  PORTAL_PAGE_BG,
  clamp01,
  easeOutCubic,
} from "@/lib/intro-portal"

const heroGradient =
  "radial-gradient(ellipse at center, rgba(250, 246, 242, 0.82) 0%, rgba(250, 246, 242, 0.38) 48%, rgba(250, 246, 242, 0.1) 100%)"

const LOGO_FADE_MS = 1200
const COMPACT_MQ =
  "(orientation: landscape) and (max-height: 560px) and (max-width: 1023px)"

const EMPTY_CATALOG: CatalogPhotos = {
  small: [],
  medium: [],
  large: [],
  vip: [],
}

function useCompactLandscape() {
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(COMPACT_MQ)
    const update = () => setCompact(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return compact
}

export function UnderConstructionScreen({
  catalogPhotos = EMPTY_CATALOG,
}: {
  catalogPhotos?: CatalogPhotos
}) {
  return (
    <SiteLoadProvider>
      <SiteLoadingOverlay>
        <UnderConstructionContent catalogPhotos={catalogPhotos} />
      </SiteLoadingOverlay>
    </SiteLoadProvider>
  )
}

function UnderConstructionContent({
  catalogPhotos,
}: {
  catalogPhotos: CatalogPhotos
}) {
  const compact = useCompactLandscape()
  const { phase } = useSiteLoad()
  const heroSize = compact ? 88 : OLALA_LOGO_HERO_SIZE
  const [logoVisible, setLogoVisible] = useState(false)
  const [logoAnimate, setLogoAnimate] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [logoBox, setLogoBox] = useState({ left: 0, top: 0, width: 0, height: 0 })
  const logoMeasureRef = useRef<HTMLDivElement>(null)
  const [keepNextPage, setKeepNextPage] = useState(false)
  const { progress, frozen, replayKey } = useIntroPortalScroll(phase === "done")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (progress >= 0.38) setKeepNextPage(true)
  }, [progress])

  useEffect(() => {
    const html = document.documentElement
    const prevHtml = html.style.overflow
    const prevBody = document.body.style.overflow
    html.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    return () => {
      html.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [])

  useLayoutEffect(() => {
    const el = logoMeasureRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      setLogoBox({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      })
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    window.addEventListener("resize", update)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [heroSize, phase, logoVisible, compact])

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

  useEffect(() => {
    if (replayKey === 0 || phase !== "done") return
    setLogoVisible(true)
    setLogoAnimate(true)
  }, [replayKey, phase])

  const split = easeOutCubic(clamp01(progress / 0.5))
  const textOpacity = 1 - clamp01(progress / 0.16)
  const logo2dOpacity = 1 - clamp01((progress - 0.02) / 0.14)
  const overlayOpacity = clamp01((progress - 0.78) / 0.14)
  const nextPageOpacity = clamp01((progress - 0.66) / 0.3)
  const sceneX = -split * 72
  const photosX = split * 78

  return (
    <div className="relative h-screen overflow-hidden">
      <div
        className="absolute inset-0 z-0 will-change-transform"
        style={{ transform: `translate3d(${sceneX}vw, 0, 0)` }}
      >
        <LumaSceneViewer
          className="absolute inset-0"
          autoRotate={!frozen}
          replayKey={replayKey}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: heroGradient }}
        />
      </div>

      <div className="pointer-events-none relative z-10 flex h-full w-full flex-col items-center justify-center px-5 text-center">
        <div
          className={`mx-auto flex w-full flex-col items-center ${
            compact ? "max-w-[280px]" : "max-w-[600px]"
          }`}
        >
          <div
            ref={logoMeasureRef}
            className={compact ? "mb-0.5" : "mb-4"}
            style={{ width: heroSize, height: heroSize }}
            aria-hidden
          />

          <div
            className="flex flex-col items-center"
            style={{
              color: "#2c221f",
              opacity: textOpacity,
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

      <div
        className="pointer-events-none absolute inset-0 z-30 overflow-visible will-change-transform"
        style={{ transform: `translate3d(${photosX}vw, 0, 0)` }}
      >
        <InstagramPhotoPanel frozen={frozen} replayKey={replayKey} />
      </div>

      {mounted && phase === "done"
        ? createPortal(
            <>
              <div className="pointer-events-none fixed inset-0 z-[55] overflow-visible">
                <div
                  style={{
                    position: "absolute",
                    left: logoBox.left,
                    top: logoBox.top,
                    width: heroSize,
                    height: heroSize,
                    opacity: logoVisible ? 1 : 0,
                    transition: frozen
                      ? undefined
                      : `opacity ${LOGO_FADE_MS}ms ease-out`,
                  }}
                >
                  <OlalaLogoAnimated
                    key={replayKey}
                    size={heroSize}
                    animate={logoAnimate && !frozen}
                    loop={logoAnimate && !frozen}
                    frozen={frozen}
                    oFillProgress={0}
                    oOpacity={logo2dOpacity}
                    chromeOpacity={logo2dOpacity}
                    className=""
                  />
                </div>
              </div>
              <OPortal3D
                progress={progress}
                logoRect={logoBox}
                className="pointer-events-none fixed inset-0 z-[56]"
              />
              <div
                className="pointer-events-none fixed inset-0 z-[60]"
                style={{
                  background: PORTAL_PAGE_BG,
                  opacity: overlayOpacity,
                }}
                aria-hidden
              />
              {keepNextPage ? (
                <div
                  className="fixed inset-0 z-[80] overflow-hidden"
                  style={{
                    background: PORTAL_PAGE_BG,
                    opacity: nextPageOpacity,
                    transform: `translate3d(0, ${(1 - nextPageOpacity) * 18}px, 0)`,
                    pointerEvents: nextPageOpacity > 0.35 ? "auto" : "none",
                  }}
                  aria-hidden={nextPageOpacity <= 0.35}
                >
                  <OlalaApp
                    catalogPhotos={catalogPhotos}
                    background={PORTAL_PAGE_BG}
                  />
                </div>
              ) : null}
            </>,
            document.body,
          )
        : null}
    </div>
  )
}
