"use client"

import { useEffect, useRef, useState } from "react"
import { OLALA_LUMA_ARTIFACTS, OLALA_LUMA_SCENE_SRC } from "@/lib/luma-scene"
import { useSiteLoad, useSiteLoadTask } from "./site-load-context"

const REVEAL_AMOUNT = 0.8
const REVEAL_SPEED = 0.18
const AUTO_ROTATE_SPEED = 0.4
const AUTO_ROTATE_STOP_MS = 10_000
const SCENE_APPEAR_DELAY_MS = 3_000
const SCENE_FADE_MS = 900

type LumaLoadingAnimation = {
  enabled: boolean
  particleRevealEnabled: boolean
  particleSolidDelay_ms: number
  particleRevealSpeed: number
  particleRevealOffset_ms: number
  startTime_ms: number
}

type LumaWebGL = {
  loadingAnimation: LumaLoadingAnimation
}

type LumaSplat = import("@lumaai/luma-web").LumaSplatsThree & {
  lumaSplatsWebGL: LumaWebGL | null
}

function elapsedMsForReveal(amount: number) {
  const q = Math.min(Math.max(amount, 0.02), 1)
  return Math.pow(q, 1 / 2.5) * 5000 - 1000
}

function freezeReveal(splat: LumaSplat, freezeElapsedMs: number) {
  const anim = splat.lumaSplatsWebGL?.loadingAnimation
  if (!anim) return
  anim.enabled = true
  anim.particleRevealEnabled = true
  anim.particleRevealSpeed = REVEAL_SPEED
  anim.particleSolidDelay_ms = 1e9
  if (anim.startTime_ms >= 0) {
    const elapsed = performance.now() - anim.startTime_ms
    if (elapsed > freezeElapsedMs) {
      anim.startTime_ms = performance.now() - freezeElapsedMs
    }
  }
}

type LumaSceneViewerProps = {
  className?: string
}

export function LumaSceneViewer({ className }: LumaSceneViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { phase, markSceneRotationStart } = useSiteLoad()
  const runtimeTask = useSiteLoadTask("runtime")
  const lumaTask = useSiteLoadTask("luma")
  const [sceneVisible, setSceneVisible] = useState(false)
  const phaseRef = useRef(phase)
  const sceneVisibleRef = useRef(false)
  const markRotationRef = useRef(markSceneRotationStart)
  phaseRef.current = phase
  sceneVisibleRef.current = sceneVisible
  markRotationRef.current = markSceneRotationStart

  useEffect(() => {
    if (phase !== "done") {
      setSceneVisible(false)
      return
    }
    const timer = window.setTimeout(() => setSceneVisible(true), SCENE_APPEAR_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let disposed = false
    let renderer: import("three").WebGLRenderer | undefined
    let controls: { dispose: () => void } | undefined
    let splat: LumaSplat | undefined
    let resizeObserver: ResizeObserver | undefined

    async function setup() {
      runtimeTask.setProgress(0.05)
      const THREE = await import("three")
      runtimeTask.setProgress(0.35)
      const { OrbitControls } = await import(
        "three/examples/jsm/controls/OrbitControls.js"
      )
      const { LumaSplatsThree } = await import("@lumaai/luma-web")
      runtimeTask.complete()

      if (disposed || !container) return

      const webglRenderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
      })
      webglRenderer.setClearColor(0xfaf6f2, 1)
      webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      webglRenderer.setSize(container.clientWidth, container.clientHeight, false)
      webglRenderer.domElement.style.width = "100%"
      webglRenderer.domElement.style.height = "100%"
      webglRenderer.domElement.style.display = "block"
      webglRenderer.domElement.style.touchAction = "none"
      container.appendChild(webglRenderer.domElement)
      renderer = webglRenderer

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xfaf6f2)

      const camera = new THREE.PerspectiveCamera(
        55,
        container.clientWidth / Math.max(container.clientHeight, 1),
        0.1,
        1000,
      )
      camera.position.set(0, 0.4, 2.4)

      const orbit = new OrbitControls(camera, webglRenderer.domElement)
      orbit.enableDamping = true
      orbit.dampingFactor = 0.05
      orbit.autoRotate = true
      orbit.autoRotateSpeed = AUTO_ROTATE_SPEED
      orbit.enablePan = false
      orbit.minDistance = 0.8
      orbit.maxDistance = 8
      orbit.target.set(0, 0, 0)
      controls = orbit

      const splatScene = new LumaSplatsThree({
        source: {
          src: OLALA_LUMA_SCENE_SRC,
          artifacts: OLALA_LUMA_ARTIFACTS,
        },
        particleRevealEnabled: true,
        enableThreeShaderIntegration: false,
      }) as LumaSplat

      const freezeElapsedMs = elapsedMsForReveal(REVEAL_AMOUNT) / REVEAL_SPEED

      splatScene.onInitialCameraTransform = (transform) => {
        transform.decompose(camera.position, camera.quaternion, new THREE.Vector3())
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
        orbit.target.copy(camera.position).addScaledVector(forward, 1.8)
        orbit.update()
      }

      splatScene.onProgress = ({ progress }) => {
        if (!disposed) lumaTask.setProgress(Math.max(progress, 0.05))
      }

      splatScene.onLoad = () => {
        if (!disposed) lumaTask.complete()
      }

      scene.add(splatScene)
      splat = splatScene

      let sceneVisibleSince: number | null = null

      const onResize = () => {
        const width = container.clientWidth
        const height = Math.max(container.clientHeight, 1)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        webglRenderer.setSize(width, height, false)
      }

      resizeObserver = new ResizeObserver(onResize)
      resizeObserver.observe(container)

      webglRenderer.setAnimationLoop(() => {
        if (phaseRef.current !== "done" || !sceneVisibleRef.current) {
          return
        }

        if (sceneVisibleSince === null) {
          sceneVisibleSince = performance.now()
          markRotationRef.current()
        }

        if (
          orbit.autoRotate &&
          performance.now() - sceneVisibleSince >= AUTO_ROTATE_STOP_MS
        ) {
          orbit.autoRotate = false
        }

        freezeReveal(splatScene, freezeElapsedMs)
        orbit.update()

        webglRenderer.render(scene, camera)
      })
    }

    setup().catch((error) => {
      console.error("Luma scene failed to start", error)
      runtimeTask.complete()
      lumaTask.complete()
    })

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      renderer?.setAnimationLoop(null)
      splat?.dispose()
      controls?.dispose()
      renderer?.dispose()
      renderer?.domElement.remove()
    }
  }, [runtimeTask, lumaTask])

  return (
    <div
      className={className}
      style={{
        opacity: sceneVisible ? 1 : 0,
        transition: `opacity ${SCENE_FADE_MS}ms ease-out`,
      }}
    >
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  )
}
