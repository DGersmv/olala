"use client"

import { useEffect, useRef, useState } from "react"

const LERP = 0.1

export function TulipCursor() {
  const [mounted, setMounted] = useState(false)
  const [isTouch, setIsTouch] = useState(true)
  const [visible, setVisible] = useState(false)
  const [isHover, setIsHover] = useState(false)
  const dotRef = useRef<HTMLDivElement>(null)
  const tulipRef = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: 0, y: 0 })
  const trail = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number>(0)

  useEffect(() => {
    setMounted(true)
    setIsTouch(window.navigator.maxTouchPoints > 0)
  }, [])

  useEffect(() => {
    if (!mounted || isTouch) return
    document.body.classList.add("has-custom-cursor")
    return () => document.body.classList.remove("has-custom-cursor")
  }, [mounted, isTouch])

  useEffect(() => {
    if (!mounted || isTouch) return

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (!visible) setVisible(true)
    }

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (t?.closest?.("a,button,[role='button'],label,summary")) setIsHover(true)
    }

    const onOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      const r = e.relatedTarget as HTMLElement
      if (t?.closest?.("a,button,[role='button'],label,summary")) {
        if (!r?.closest?.("a,button,[role='button'],label,summary")) setIsHover(false)
      }
    }

    const animate = () => {
      trail.current.x += (pos.current.x - trail.current.x) * LERP
      trail.current.y += (pos.current.y - trail.current.y) * LERP
      dotRef.current?.style.setProperty("transform", `translate(${pos.current.x}px,${pos.current.y}px) translate(-50%,-50%)`)
      tulipRef.current?.style.setProperty("transform", `translate(${trail.current.x}px,${trail.current.y}px) translate(-50%,-50%)`)
      rafRef.current = requestAnimationFrame(animate)
    }

    trail.current = { ...pos.current }
    rafRef.current = requestAnimationFrame(animate)
    window.addEventListener("mousemove", onMove)
    document.addEventListener("mouseover", onOver)
    document.addEventListener("mouseout", onOut)
    return () => {
      window.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseover", onOver)
      document.removeEventListener("mouseout", onOut)
      cancelAnimationFrame(rafRef.current)
    }
  }, [mounted, isTouch, visible])

  if (!mounted || isTouch) return null

  const dotSize = isHover ? 10 : 5
  const tulipSize = isHover ? 52 : 34
  const strokeColor = isHover ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.4)"

  return (
    <div
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, visibility: visible ? "visible" : "hidden" }}
      aria-hidden
    >
      {/* Точка — мгновенно за мышью */}
      <div
        ref={dotRef}
        style={{
          position: "fixed", left: 0, top: 0,
          width: dotSize, height: dotSize,
          borderRadius: "50%",
          background: "#D11D36",
          transform: "translate(-50%,-50%)",
          transition: "width 0.18s, height 0.18s",
          zIndex: 2,
        }}
      />
      {/* Контур тюльпана — тянется с задержкой */}
      <div
        ref={tulipRef}
        style={{
          position: "fixed", left: 0, top: 0,
          width: tulipSize, height: tulipSize,
          transform: "translate(-50%,-50%)",
          transition: "width 0.18s, height 0.18s",
          zIndex: 1,
        }}
      >
        <svg
          viewBox="60 1 40 46"
          width={tulipSize}
          height={tulipSize}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path d="m93.96 10.47c-1.25-1.31-5.07 2.06-7.08 4.01l-0.44 0.43c-1.42-3.63-4.04-7.91-5.72-8.21-2.03-0.37-5.29 5.23-6.21 7.93-2.18-2.39-6.21-5.43-7.79-4.95-1.59 0.51-1.93 12.08-0.14 18.94 2.16 8.52 8.13 11.76 14.23 11.76 7.5 0 12.9-6.43 13.85-18.62 0.54-6.89 0.14-10.27-0.7-11.29z" />
        </svg>
      </div>
    </div>
  )
}
