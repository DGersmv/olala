"use client"

import { useState } from "react"
import { Copy, Check, RotateCcw, MousePointer2 } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import {
  formatRhododendronSceneConfig,
  RHODODENDRON_SCENE_CONFIG,
  type RhododendronSceneConfig,
} from "@/lib/rhododendron-scene-config"

interface RhododendronTuningPanelProps {
  config: RhododendronSceneConfig
  orbitEnabled: boolean
  onConfigChange: (config: RhododendronSceneConfig) => void
  onOrbitEnabledChange: (enabled: boolean) => void
}

type SliderSpec = {
  key: string
  label: string
  min: number
  max: number
  step: number
  get: (config: RhododendronSceneConfig) => number
  set: (config: RhododendronSceneConfig, value: number) => RhododendronSceneConfig
  format?: (value: number) => string
}

const SLIDERS: SliderSpec[] = [
  {
    key: "camX",
    label: "Камера X",
    min: -3,
    max: 3,
    step: 0.01,
    get: (c) => c.camera.position[0],
    set: (c, v) => ({
      ...c,
      camera: { ...c.camera, position: [v, c.camera.position[1], c.camera.position[2]] },
    }),
  },
  {
    key: "camY",
    label: "Камера Y",
    min: -1,
    max: 3,
    step: 0.01,
    get: (c) => c.camera.position[1],
    set: (c, v) => ({
      ...c,
      camera: { ...c.camera, position: [c.camera.position[0], v, c.camera.position[2]] },
    }),
  },
  {
    key: "camZ",
    label: "Камера Z",
    min: 0.5,
    max: 8,
    step: 0.01,
    get: (c) => c.camera.position[2],
    set: (c, v) => ({
      ...c,
      camera: { ...c.camera, position: [c.camera.position[0], c.camera.position[1], v] },
    }),
  },
  {
    key: "fov",
    label: "FOV",
    min: 15,
    max: 70,
    step: 1,
    get: (c) => c.camera.fov,
    set: (c, v) => ({ ...c, camera: { ...c.camera, fov: v } }),
  },
  {
    key: "lookX",
    label: "Цель X",
    min: -2,
    max: 2,
    step: 0.01,
    get: (c) => c.lookAt[0],
    set: (c, v) => ({ ...c, lookAt: [v, c.lookAt[1], c.lookAt[2]] }),
  },
  {
    key: "lookY",
    label: "Цель Y",
    min: -2,
    max: 2,
    step: 0.01,
    get: (c) => c.lookAt[1],
    set: (c, v) => ({ ...c, lookAt: [c.lookAt[0], v, c.lookAt[2]] }),
  },
  {
    key: "lookZ",
    label: "Цель Z",
    min: -2,
    max: 2,
    step: 0.01,
    get: (c) => c.lookAt[2],
    set: (c, v) => ({ ...c, lookAt: [c.lookAt[0], c.lookAt[1], v] }),
  },
  {
    key: "grpX",
    label: "Модель X",
    min: -2,
    max: 2,
    step: 0.01,
    get: (c) => c.group.position[0],
    set: (c, v) => ({
      ...c,
      group: { ...c.group, position: [v, c.group.position[1], c.group.position[2]] },
    }),
  },
  {
    key: "grpY",
    label: "Модель Y",
    min: -3,
    max: 2,
    step: 0.01,
    get: (c) => c.group.position[1],
    set: (c, v) => ({
      ...c,
      group: { ...c.group, position: [c.group.position[0], v, c.group.position[2]] },
    }),
  },
  {
    key: "grpZ",
    label: "Модель Z",
    min: -2,
    max: 2,
    step: 0.01,
    get: (c) => c.group.position[2],
    set: (c, v) => ({
      ...c,
      group: { ...c.group, position: [c.group.position[0], c.group.position[1], v] },
    }),
  },
  {
    key: "grpRotY",
    label: "Поворот Y (°)",
    min: -180,
    max: 180,
    step: 1,
    get: (c) => (c.group.rotation[1] * 180) / Math.PI,
    set: (c, v) => ({
      ...c,
      group: { ...c.group, rotation: [c.group.rotation[0], (v * Math.PI) / 180, c.group.rotation[2]] },
    }),
    format: (v) => `${Math.round(v)}°`,
  },
  {
    key: "modelRotY",
    label: "Модель rot Y (°)",
    min: -180,
    max: 180,
    step: 1,
    get: (c) => (c.modelRotationY * 180) / Math.PI,
    set: (c, v) => ({ ...c, modelRotationY: (v * Math.PI) / 180 }),
    format: (v) => `${Math.round(v)}°`,
  },
  {
    key: "scale",
    label: "Масштаб",
    min: 0.5,
    max: 4,
    step: 0.05,
    get: (c) => c.modelScale,
    set: (c, v) => ({ ...c, modelScale: v }),
  },
]

const LIGHTING_SLIDERS: SliderSpec[] = [
  {
    key: "ambient",
    label: "Ambient",
    min: 0,
    max: 2,
    step: 0.05,
    get: (c) => c.lighting.ambient,
    set: (c, v) => ({ ...c, lighting: { ...c.lighting, ambient: v } }),
  },
  {
    key: "hemisphere",
    label: "Hemisphere",
    min: 0,
    max: 2,
    step: 0.05,
    get: (c) => c.lighting.hemisphere,
    set: (c, v) => ({ ...c, lighting: { ...c.lighting, hemisphere: v } }),
  },
  {
    key: "key",
    label: "Key (основной)",
    min: 0,
    max: 3,
    step: 0.05,
    get: (c) => c.lighting.key,
    set: (c, v) => ({ ...c, lighting: { ...c.lighting, key: v } }),
  },
  {
    key: "fill",
    label: "Fill (заполняющий)",
    min: 0,
    max: 2,
    step: 0.05,
    get: (c) => c.lighting.fill,
    set: (c, v) => ({ ...c, lighting: { ...c.lighting, fill: v } }),
  },
  {
    key: "rim",
    label: "Rim (контровой)",
    min: 0,
    max: 2,
    step: 0.05,
    get: (c) => c.lighting.rim,
    set: (c, v) => ({ ...c, lighting: { ...c.lighting, rim: v } }),
  },
  {
    key: "exposure",
    label: "Exposure",
    min: 0.5,
    max: 2.5,
    step: 0.05,
    get: (c) => c.lighting.exposure,
    set: (c, v) => ({ ...c, lighting: { ...c.lighting, exposure: v } }),
  },
]

function ConfigSlider({
  spec,
  config,
  onConfigChange,
}: {
  spec: SliderSpec
  config: RhododendronSceneConfig
  onConfigChange: (config: RhododendronSceneConfig) => void
}) {
  const value = spec.get(config)

  return (
    <label className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px] text-foreground/80">
        <span>{spec.label}</span>
        <span className="tabular-nums opacity-60">
          {spec.format ? spec.format(value) : value.toFixed(2)}
        </span>
      </div>
      <Slider
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={[value]}
        onValueChange={([next]) => onConfigChange(spec.set(config, next))}
      />
    </label>
  )
}

export function RhododendronTuningPanel({
  config,
  orbitEnabled,
  onConfigChange,
  onOrbitEnabledChange,
}: RhododendronTuningPanelProps) {
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const handleCopy = async () => {
    const snippet = formatRhododendronSceneConfig(config)
    await navigator.clipboard.writeText(snippet)
    console.log("[rhododendron] scene config:\n", snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="pointer-events-auto fixed bottom-4 left-4 z-50 rounded-md border border-foreground/20 bg-background/95 px-3 py-2 text-[11px] uppercase tracking-wider text-foreground shadow-lg backdrop-blur-sm"
      >
        3D настройки
      </button>
    )
  }

  return (
    <div className="pointer-events-auto fixed bottom-4 left-4 z-50 flex max-h-[min(80vh,720px)] w-[min(92vw,320px)] flex-col overflow-hidden rounded-md border border-foreground/20 bg-background/95 text-foreground shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-foreground/10 px-3 py-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em]">3D камера</p>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="text-[11px] opacity-50 hover:opacity-100"
        >
          свернуть
        </button>
      </div>

      <div className="flex gap-2 border-b border-foreground/10 p-3">
        <button
          type="button"
          onClick={() => onOrbitEnabledChange(!orbitEnabled)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded border px-2 py-2 text-[11px] transition-colors ${
            orbitEnabled
              ? "border-primary bg-primary/10 text-primary"
              : "border-foreground/15 hover:border-foreground/30"
          }`}
        >
          <MousePointer2 className="size-3.5" />
          Orbit мышью
        </button>
        <button
          type="button"
          onClick={() => onConfigChange(RHODODENDRON_SCENE_CONFIG)}
          className="rounded border border-foreground/15 px-2 py-2 text-[11px] hover:border-foreground/30"
          title="Сбросить"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto p-3">
        {SLIDERS.map((spec) => (
          <ConfigSlider
            key={spec.key}
            spec={spec}
            config={config}
            onConfigChange={onConfigChange}
          />
        ))}

        <p className="pt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-foreground/50">
          Свет
        </p>
        {LIGHTING_SLIDERS.map((spec) => (
          <ConfigSlider
            key={spec.key}
            spec={spec}
            config={config}
            onConfigChange={onConfigChange}
          />
        ))}
      </div>

      <div className="border-t border-foreground/10 p-3">
        <button
          type="button"
          onClick={handleCopy}
          className="flex w-full items-center justify-center gap-2 rounded bg-primary px-3 py-2.5 text-[11px] font-medium uppercase tracking-wider text-primary-foreground"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Скопировано" : "Копировать настройки"}
        </button>
        <p className="mt-2 text-[10px] leading-relaxed opacity-50">
          Включи Orbit, покрути камеру мышью, подстрой слайдеры и нажми «Копировать» — вставим в код.
        </p>
      </div>
    </div>
  )
}
