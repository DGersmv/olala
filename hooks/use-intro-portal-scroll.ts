"use client"

import { useEffect, useRef, useState } from "react"
import { clamp01 } from "@/lib/intro-portal"

const SCROLL_DISTANCE = 1800
const LERP = 0.16

function canScrollUp(target: EventTarget | null) {
  let el = target instanceof Element ? target : null
  while (el && el !== document.body && el !== document.documentElement) {
    const style = window.getComputedStyle(el)
    if (
      (style.overflowY === "auto" || style.overflowY === "scroll") &&
      el.scrollTop > 1
    ) {
      return true
    }
    el = el.parentElement
  }
  return false
}

export function useIntroPortalScroll(enabled: boolean) {
  const [progress, setProgress] = useState(0)
  const [replayKey, setReplayKey] = useState(0)

  const targetRef = useRef(0)
  const currentRef = useRef(0)
  const leftRef = useRef(false)
  const rafRef = useRef(0)
  const touchRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!enabled) return

    const stopTick = () => {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }

    const tick = () => {
      const target = targetRef.current
      const lerpK = targetRef.current >= 0.97 || currentRef.current > 0.82 ? 0.24 : LERP
      const next = currentRef.current + (target - currentRef.current) * lerpK
      const settled = Math.abs(target - next) < 0.0005
      const value = settled ? target : next
      currentRef.current = value

      setProgress((prev) => (Math.abs(prev - value) < 0.0003 ? prev : value))

      if (settled && value <= 0.003 && leftRef.current) {
        leftRef.current = false
        targetRef.current = 0
        currentRef.current = 0
        setProgress(0)
        setReplayKey((key) => key + 1)
        rafRef.current = 0
        return
      }

      if (settled) {
        rafRef.current = 0
        return
      }

      rafRef.current = window.requestAnimationFrame(tick)
    }

    const ensureTick = () => {
      if (rafRef.current) return
      rafRef.current = window.requestAnimationFrame(tick)
    }

    const addDelta = (delta: number) => {
      targetRef.current = clamp01(targetRef.current + delta / SCROLL_DISTANCE)
      if (targetRef.current > 0.03) leftRef.current = true
      ensureTick()
    }

    const atEnd = () => currentRef.current >= 0.999 && targetRef.current >= 1

    const onWheel = (event: WheelEvent) => {
      const scale =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1
      const delta = event.deltaY * scale

      if (atEnd() && delta > 0) return
      if (atEnd() && delta < 0 && canScrollUp(event.target)) return

      event.preventDefault()
      addDelta(delta)
    }

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        touchRef.current = null
        return
      }
      touchRef.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      }
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!touchRef.current || event.touches.length !== 1) return
      const x = event.touches[0].clientX
      const y = event.touches[0].clientY
      const dx = x - touchRef.current.x
      const dy = touchRef.current.y - y
      touchRef.current = { x, y }
      if (Math.abs(dy) < Math.abs(dx) * 0.7) return

      if (atEnd() && dy > 0) return
      if (atEnd() && dy < 0 && canScrollUp(event.target)) return

      event.preventDefault()
      addDelta(dy)
    }

    const onTouchEnd = () => {
      touchRef.current = null
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
        if (atEnd()) return
        event.preventDefault()
        addDelta(event.key === "PageDown" ? 420 : 140)
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        if (atEnd() && canScrollUp(event.target)) return
        event.preventDefault()
        addDelta(event.key === "PageUp" ? -420 : -140)
      }
    }

    window.addEventListener("wheel", onWheel, { passive: false, capture: true })
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true })
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true })
    window.addEventListener("touchend", onTouchEnd, { capture: true })
    window.addEventListener("keydown", onKeyDown)

    return () => {
      stopTick()
      window.removeEventListener("wheel", onWheel, true)
      window.removeEventListener("touchstart", onTouchStart, true)
      window.removeEventListener("touchmove", onTouchMove, true)
      window.removeEventListener("touchend", onTouchEnd, true)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [enabled])

  return { progress, frozen: progress > 0.02, replayKey }
}
