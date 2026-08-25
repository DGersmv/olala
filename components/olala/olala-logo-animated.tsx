"use client"

import { useState, useEffect, useCallback } from "react"
import {
  OLALA_O_CX,
  OLALA_O_CY,
  OLALA_O_INNER_R,
  PORTAL_PAGE_BG,
} from "@/lib/intro-portal"

interface OlalaLogoAnimatedProps {
  /** CSS width/height of the SVG (square) */
  size?: number
  className?: string
  /** Повторять сборку логотипа (вперёд → сброс → вперёд) */
  loop?: boolean
  /** Если false — статичный собранный логотип без анимации */
  animate?: boolean
  /** Остановить цикл и оставить логотип полностью собранным */
  frozen?: boolean
  /** Заполнение внутренней части буквы «о», 0–1 */
  oFillProgress?: number
  /** Прозрачность плоской буквы «о» при морфе в 3D */
  oOpacity?: number
  /** Прозрачность остальных частей логотипа */
  chromeOpacity?: number
}

const SWAY_START_MS = 4200
const SWAY_DURATION_MS = 2200
const FADE_START_MS = SWAY_START_MS + SWAY_DURATION_MS
const FADE_DURATION_MS = 1000
export const OLALA_LOGO_LOADING_SIZE = 180
export const OLALA_LOGO_HERO_SIZE = 280

export function OlalaLogoAnimated({
  size = 280,
  className,
  loop = false,
  animate = true,
  frozen = false,
  oFillProgress = 0,
  oOpacity = 1,
  chromeOpacity = 1,
}: OlalaLogoAnimatedProps) {
  const [phase, setPhase] = useState(0)
  const [cycleKey, setCycleKey] = useState(0)
  const [logoOpacity, setLogoOpacity] = useState(1)

  const runAnimation = useCallback(() => {
    setPhase(0)
    const t1 = setTimeout(() => setPhase(1), 300)
    const t2 = setTimeout(() => setPhase(2), 1300)
    const t3 = setTimeout(() => setPhase(3), 2200)
    const t4 = setTimeout(() => setPhase(4), SWAY_START_MS)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [])

  useEffect(() => {
    if (!animate) return
    return runAnimation()
  }, [runAnimation, cycleKey, animate])

  useEffect(() => {
    if (!animate || !loop || frozen) return
    const fadeTimer = setTimeout(() => setLogoOpacity(0), FADE_START_MS)
    const cycleTimer = setTimeout(() => {
      setCycleKey((k) => k + 1)
      setLogoOpacity(1)
    }, FADE_START_MS + FADE_DURATION_MS)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(cycleTimer)
    }
  }, [loop, cycleKey, animate, frozen])

  useEffect(() => {
    if (!frozen) return
    setLogoOpacity(1)
  }, [frozen])

  const assembled = !animate

  return (
    <div
      className={className}
      onClick={animate && !frozen ? runAnimation : undefined}
      role="img"
      aria-label="Olala — нажмите, чтобы повторить анимацию"
      title="Нажмите, чтобы повторить анимацию"
    >
      <style>{`
        @keyframes olalaStemGrow {
          from { clip-path: inset(100% 0 0 0); }
          to { clip-path: inset(0% 0 0 0); }
        }
        @keyframes olalaBudEmerge {
          0% { transform: scale(0) translateY(6px); opacity: 0; }
          60% { transform: scale(1.08) translateY(-1px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes olalaHighlightFade {
          0% { opacity: 0; }
          100% { opacity: 0.9; }
        }
        @keyframes olalaLetterUp {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes olalaTulipSway {
          0%   { transform: rotate(0deg); }
          28%  { transform: rotate(-8deg); }
          62%  { transform: rotate(8deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>

      <div
        style={{
          opacity: animate && loop && !frozen ? logoOpacity : 1,
          transition: animate && loop && !frozen ? `opacity ${FADE_DURATION_MS}ms ease-out` : undefined,
        }}
      >
      <svg
        key={cycleKey}
        viewBox="0 0 220 220"
        className="cursor-pointer overflow-visible"
        style={{
          width: size,
          height: size,
        }}
      >
        <g style={{ opacity: chromeOpacity }}>
        {/* First L — tall stem, grows up at phase 1 */}
        <g
          style={{
            animation:
              !assembled && phase >= 1
                ? "olalaStemGrow 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards"
                : "none",
            clipPath: assembled || phase >= 1 ? undefined : "inset(100% 0 0 0)",
          }}
        >
          <path
            d="m91.83 207.5c-6.92 0-8.45-5.54-8.45-9.87v-148c0-1.92-1.12-2.81-3.21-2.81s-2.49 1.33-2.49 2.81v148.2c0 9.63 5.57 15.43 13.81 15.43h0.27c1.95 0 2.9-1.12 2.9-3.27 0-1.95-0.85-2.42-2.83-2.42z"
            fill="#1a1a1a"
          />
        </g>

        {/* Second L — short bar, grows simultaneously with first L */}
        <g
          style={{
            animation:
              !assembled && phase >= 1
                ? "olalaStemGrow 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards"
                : "none",
            clipPath: assembled || phase >= 1 ? undefined : "inset(100% 0 0 0)",
          }}
        >
          <path
            d="m156.2 207.5c-6.92 0-8.44-5.54-8.44-9.87v-53.94c0-1.92-1.12-2.8-3.21-2.8s-3.51 0.61-3.51 2.8v54.07c0 9.63 5.57 15.43 13.81 15.43h0.94c1.96 0 2.9-1.12 2.9-3.27 0-1.95-0.84-2.42-2.49-2.42z"
            fill="#1a1a1a"
          />
        </g>

        {/* Tulip — outer wrapper handles gentle sway after logo is complete */}
        <g
          style={{
            transformOrigin: "82px 45px",
            animation:
              !assembled && phase >= 4
                ? `olalaTulipSway ${SWAY_DURATION_MS}ms ease-in-out 1 both`
                : "none",
          }}
        >
          {/* Inner wrapper handles the emerge animation */}
          <g
            style={{
              transformOrigin: "82px 22px",
              opacity: assembled ? 1 : 0,
              transform: assembled ? "none" : "scale(0) translateY(6px)",
              animation:
                !assembled && phase >= 2
                  ? "olalaBudEmerge 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
                  : "none",
            }}
          >
            <path
              d="m93.96 10.47c-1.25-1.31-5.07 2.06-7.08 4.01l-0.44 0.43c-1.42-3.63-4.04-7.91-5.72-8.21-2.03-0.37-5.29 5.23-6.21 7.93-2.18-2.39-6.21-5.43-7.79-4.95-1.59 0.51-1.93 12.08-0.14 18.94 2.16 8.52 8.13 11.76 14.23 11.76 7.5 0 12.9-6.43 13.85-18.62 0.54-6.89 0.14-10.27-0.7-11.29z"
              fill="#D11D36"
            />
            <path
              d="m68.77 20.51c1.49 4.67 4.04 11.47 9.81 15.23-0.61 0.27-3.54 0.44-6.11-2.8-3.37-4.22-3.7-10.78-3.7-12.43z"
              fill="#FEFFFE"
              style={{
                opacity: assembled ? 0.9 : 0,
                animation:
                  !assembled && phase >= 2
                    ? "olalaHighlightFade 0.4s 0.6s ease-out forwards"
                    : "none",
              }}
            />
          </g>
        </g>

        </g>

        {/* O — appears after tulip */}
        <g style={{ opacity: oOpacity }}>
        <g
          style={{
            opacity: assembled ? 1 : 0,
            animation:
              !assembled && phase >= 3
                ? "olalaLetterUp 1.7s 0s cubic-bezier(0.22, 1, 0.36, 1) forwards"
                : "none",
          }}
        >
          <circle
            cx={OLALA_O_CX}
            cy={OLALA_O_CY}
            r={OLALA_O_INNER_R}
            fill={PORTAL_PAGE_BG}
            opacity={oFillProgress}
          />
          <path
            d="m46.69 163.4c-13.98 0-25.28 11.47-25.28 25.11 0 12.83 10.5 24.78 25.28 24.78 13.87 0 24.96-11.66 24.96-24.92 0-12.91-10.57-24.97-24.96-24.97zm0 43.56c-10.78 0-18.58-8.76-18.58-18.69 0-10.25 8.65-18.24 18.64-18.24 10.47 0 18.07 8.65 18.07 18.41 0 10.15-8.1 18.52-18.13 18.52z"
            fill="#1a1a1a"
          />
        </g>
        </g>

        <g style={{ opacity: chromeOpacity }}>
        {/* First A — appears after tulip */}
        <g
          style={{
            opacity: assembled ? 1 : 0,
            animation:
              !assembled && phase >= 3
                ? "olalaLetterUp 1.7s 0.15s cubic-bezier(0.22, 1, 0.36, 1) forwards"
                : "none",
          }}
        >
          <path
            d="m115.5 162.8h-0.27c-7.22 0-11.45 3.14-13.67 5.19-1.01 0.88-1.24 1.32-0.7 2.8 0.74 2.12 3.46 3.27 4.95 1.79 2.84-2.84 6.04-3.61 9.39-3.61 7.8 0 12.09 5.12 12.29 12.72v0.68c-3.21-2.7-7.34-4.45-11.99-4.45-10.27 0-17.67 8.75-17.67 18.37 0 9.16 7.26 16.88 16.56 16.88h0.87c5.13 0 9.29-1.85 12.23-4.88v1.68c0 2.22 1.14 3.2 3.16 3.2 2.16 0 3.2-1.02 3.2-3.27v-28.27c-0.1-11.08-7.16-18.83-18.35-18.83zm-0.4 44.48c-7.29 0-10.62-6.16-10.62-10.85 0-6.99 5.74-12.6 11.67-12.6 7.02 0 11.07 5.27 11.07 11.86 0 6.92-5.1 11.59-12.12 11.59z"
            fill="#1a1a1a"
          />
        </g>

        {/* Second A — appears after tulip */}
        <g
          style={{
            opacity: assembled ? 1 : 0,
            animation:
              !assembled && phase >= 3
                ? "olalaLetterUp 1.7s 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards"
                : "none",
          }}
        >
          <path
            d="m179.3 162.8h-0.26c-6.56 0-10.95 3.38-13.4 5.8-1.15 1.11-1.12 2.33 0.13 3.95 1.18 1.61 2.77 1.65 3.95 0.47 3.2-3.21 6.03-4.05 9.27-4.05 7.8 0 12.66 4.75 12.86 12.79v0.61c-3.2-2.7-7.33-4.45-11.98-4.45-10.27 0-17.67 8.75-17.67 18.37 0 9.16 7.26 16.88 16.56 16.88h0.88c5.13 0 9.28-1.85 12.21-4.88v1.68c0 2.22 1.15 3.2 3.17 3.2 2.15 0 3.2-1.02 3.2-3.27v-28.27c-0.1-10.36-7.43-18.83-18.92-18.83zm-0.13 44.48c-7.29 0-10.85-5.95-10.85-10.85 0-6.99 6.1-12.6 12.03-12.6 7.42 0 10.93 5.44 10.93 11.86 0 6.92-5.1 11.59-12.11 11.59z"
            fill="#1a1a1a"
          />
        </g>
        </g>
      </svg>
      </div>
    </div>
  )
}
