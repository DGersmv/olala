"use client"

import { Suspense, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { RHODODENDRON_SCENE_CONFIG, type RhododendronSceneConfig } from "@/lib/rhododendron-scene-config"
import { RhododendronTuningPanel } from "./rhododendron-tuning-panel"

const RhododendronCanvas = dynamic(
  () =>
    import("./rhododendron-canvas").then((mod) => mod.RhododendronCanvas),
  { ssr: false }
)

interface RhododendronWidgetProps {
  visible: boolean
}

const UNMOUNT_DELAY_MS = 700
const TUNING_ENABLED = process.env.NODE_ENV === "development"

export function RhododendronWidget({ visible }: RhododendronWidgetProps) {
  const [mounted, setMounted] = useState(visible)
  const [config, setConfig] = useState<RhododendronSceneConfig>(RHODODENDRON_SCENE_CONFIG)
  const [orbitEnabled, setOrbitEnabled] = useState(false)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      return
    }
    const timer = setTimeout(() => setMounted(false), UNMOUNT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [visible])

  const interactive = TUNING_ENABLED && orbitEnabled

  return (
    <>
      <div
        aria-hidden={!interactive}
        className={`group fixed bottom-0 right-0 z-20 h-[50vh] w-[50vw] origin-bottom-right overflow-visible transition-all duration-700 ease-out ${
          visible
            ? `${interactive ? "pointer-events-auto" : "pointer-events-none"} scale-100 opacity-100`
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <div className={`h-full w-full ${interactive ? "pointer-events-auto" : "pointer-events-none"}`}>
          {mounted && (
            <Suspense fallback={null}>
              <RhododendronCanvas
                config={config}
                orbitEnabled={TUNING_ENABLED && orbitEnabled}
                onConfigChange={TUNING_ENABLED ? setConfig : undefined}
              />
            </Suspense>
          )}
        </div>
      </div>

      {TUNING_ENABLED && visible && (
        <RhododendronTuningPanel
          config={config}
          orbitEnabled={orbitEnabled}
          onConfigChange={setConfig}
          onOrbitEnabledChange={setOrbitEnabled}
        />
      )}
    </>
  )
}
