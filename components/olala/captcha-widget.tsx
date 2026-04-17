"use client"

import { useEffect, useRef, useState } from "react"

const CAPTCHA_SITE_KEY = "ysc1_IeP5HbjpcjdaAHjOXYsmwE4itaxmQ1XIP85v7o2n3088fba7"

declare global {
  interface Window {
    smartCaptcha?: {
      render: (el: HTMLElement, params: object) => number
      destroy: (id: number) => void
      reset: (id: number) => void
    }
  }
}

function loadCaptchaScript(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined") return resolve()
    if (window.smartCaptcha) return resolve()
    const SCRIPT_ID = "ysc-captcha-script"
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement("script")
      script.id = SCRIPT_ID
      script.src = "https://captcha-api.yandex.ru/captcha.js"
      document.head.appendChild(script)
    }
    script.addEventListener("load", () => resolve(), { once: true })
    script.addEventListener("error", () => resolve(), { once: true })
    if ((script as HTMLScriptElement & { readyState?: string }).readyState === "complete") resolve()
  })
}

export function CaptchaWidget({ onToken }: { onToken: (t: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<number | null>(null)
  const [status, setStatus] = useState<"loading" | "ok" | "failed">("loading")

  useEffect(() => {
    let cancelled = false
    loadCaptchaScript().then(() => {
      if (cancelled) return
      if (!containerRef.current || !window.smartCaptcha) {
        setStatus("failed"); onToken("__captcha_unavailable__"); return
      }
      if (widgetId.current !== null) {
        try { window.smartCaptcha!.destroy(widgetId.current) } catch { /* ignore */ }
        widgetId.current = null
      }
      try {
        widgetId.current = window.smartCaptcha.render(containerRef.current, {
          sitekey: CAPTCHA_SITE_KEY,
          callback: (t: string) => { onToken(t) },
        })
        setStatus("ok")
      } catch (e) {
        console.warn("[SmartCaptcha] render failed:", e)
        setStatus("failed"); onToken("__captcha_unavailable__")
      }
    })
    return () => {
      cancelled = true
      if (window.smartCaptcha && widgetId.current !== null) {
        try { window.smartCaptcha.destroy(widgetId.current) } catch { /* ignore */ }
        widgetId.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === "failed") {
    return (
      <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
        Капча недоступна — проверьте ключ в Яндекс Облаке
      </div>
    )
  }
  return <div ref={containerRef} className="mt-1" />
}
