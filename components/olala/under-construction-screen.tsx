"use client"

import { OlalaLogoAnimated } from "./olala-logo-animated"
import { LumaSceneViewer } from "./luma-scene-viewer"

const heroGradient =
  "radial-gradient(ellipse at center, rgba(250, 246, 242, 0.72) 0%, rgba(250, 246, 242, 0.28) 48%, rgba(250, 246, 242, 0.08) 100%)"

export function UnderConstructionScreen() {
  return (
    <div className="relative h-screen overflow-hidden">
      <LumaSceneViewer className="absolute inset-0 z-0" />

      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ background: heroGradient }}
      />

      <div className="pointer-events-none relative z-10 flex h-full w-full flex-col items-center justify-center px-5 text-center">
        <div className="mx-auto flex w-full max-w-[600px] flex-col items-center">
          <OlalaLogoAnimated
            size={280}
            loop
            className="mb-4 flex flex-col items-center"
          />

          <span className="mb-8 font-sans text-[11px] uppercase tracking-[6px] opacity-40">
            flower shop
          </span>

          <p
            className="animate-fade-up mb-3 font-serif text-[22px] font-light leading-snug sm:text-[24px]"
            style={{ animationDelay: "0.15s" }}
          >
            Сайт в разработке
          </p>

          <p
            className="animate-fade-up font-serif text-[18px] font-light leading-snug opacity-70 sm:text-[20px]"
            style={{ animationDelay: "0.25s" }}
          >
            Скоро здесь будет что-то{" "}
            <span className="italic text-primary">прекрасное.</span>
          </p>

          <p className="animate-fade-up mt-8 text-sm opacity-50" style={{ animationDelay: "0.35s" }}>
            Позвоните нам{" "}
            <a
              href="tel:+79211880590"
              className="pointer-events-auto font-medium opacity-80 transition-opacity hover:opacity-100"
            >
              +7 (921) 188-05-90
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
