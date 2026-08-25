"use client"

import { useEffect, useRef } from "react"
import {
  OLALA_LOGO_VIEWBOX,
  OLALA_O_CX,
  OLALA_O_CY,
  OLALA_O_INNER_R,
  PORTAL_PAGE_BG,
  clamp01,
  easeInOutCubic,
} from "@/lib/intro-portal"

const FOV = 42
const CAM_Z = 7
const EXTRUDE_DEPTH = 14

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220">
  <path fill="#1a1a1a" fill-rule="evenodd" d="m46.69 163.4c-13.98 0-25.28 11.47-25.28 25.11 0 12.83 10.5 24.78 25.28 24.78 13.87 0 24.96-11.66 24.96-24.92 0-12.91-10.57-24.97-24.96-24.97zm0 43.56c-10.78 0-18.58-8.76-18.58-18.69 0-10.25 8.65-18.24 18.64-18.24 10.47 0 18.07 8.65 18.07 18.41 0 10.15-8.1 18.52-18.13 18.52z"/>
  <path fill="#1a1a1a" d="m91.83 207.5c-6.92 0-8.45-5.54-8.45-9.87v-148c0-1.92-1.12-2.81-3.21-2.81s-2.49 1.33-2.49 2.81v148.2c0 9.63 5.57 15.43 13.81 15.43h0.27c1.95 0 2.9-1.12 2.9-3.27 0-1.95-0.85-2.42-2.83-2.42z"/>
  <path fill="#1a1a1a" d="m156.2 207.5c-6.92 0-8.44-5.54-8.44-9.87v-53.94c0-1.92-1.12-2.8-3.21-2.8s-3.51 0.61-3.51 2.8v54.07c0 9.63 5.57 15.43 13.81 15.43h0.94c1.96 0 2.9-1.12 2.9-3.27 0-1.95-0.84-2.42-2.49-2.42z"/>
  <path fill="#1a1a1a" fill-rule="evenodd" d="m115.5 162.8h-0.27c-7.22 0-11.45 3.14-13.67 5.19-1.01 0.88-1.24 1.32-0.7 2.8 0.74 2.12 3.46 3.27 4.95 1.79 2.84-2.84 6.04-3.61 9.39-3.61 7.8 0 12.09 5.12 12.29 12.72v0.68c-3.21-2.7-7.34-4.45-11.99-4.45-10.27 0-17.67 8.75-17.67 18.37 0 9.16 7.26 16.88 16.56 16.88h0.87c5.13 0 9.29-1.85 12.23-4.88v1.68c0 2.22 1.14 3.2 3.16 3.2 2.16 0 3.2-1.02 3.2-3.27v-28.27c-0.1-11.08-7.16-18.83-18.35-18.83zm-0.4 44.48c-7.29 0-10.62-6.16-10.62-10.85 0-6.99 5.74-12.6 11.67-12.6 7.02 0 11.07 5.27 11.07 11.86 0 6.92-5.1 11.59-12.12 11.59z"/>
  <path fill="#1a1a1a" fill-rule="evenodd" d="m179.3 162.8h-0.26c-6.56 0-10.95 3.38-13.4 5.8-1.15 1.11-1.12 2.33 0.13 3.95 1.18 1.61 2.77 1.65 3.95 0.47 3.2-3.21 6.03-4.05 9.27-4.05 7.8 0 12.66 4.75 12.86 12.79v0.61c-3.2-2.7-7.33-4.45-11.98-4.45-10.27 0-17.67 8.75-17.67 18.37 0 9.16 7.26 16.88 16.56 16.88h0.88c5.13 0 9.28-1.85 12.21-4.88v1.68c0 2.22 1.15 3.2 3.17 3.2 2.15 0 3.2-1.02 3.2-3.27v-28.27c-0.1-10.36-7.43-18.83-18.92-18.83zm-0.13 44.48c-7.29 0-10.85-5.95-10.85-10.85 0-6.99 6.1-12.6 12.03-12.6 7.42 0 10.93 5.44 10.93 11.86 0 6.92-5.1 11.59-12.11 11.59z"/>
  <path fill="#D11D36" d="m93.96 10.47c-1.25-1.31-5.07 2.06-7.08 4.01l-0.44 0.43c-1.42-3.63-4.04-7.91-5.72-8.21-2.03-0.37-5.29 5.23-6.21 7.93-2.18-2.39-6.21-5.43-7.79-4.95-1.59 0.51-1.93 12.08-0.14 18.94 2.16 8.52 8.13 11.76 14.23 11.76 7.5 0 12.9-6.43 13.85-18.62 0.54-6.89 0.14-10.27-0.7-11.29z"/>
  <path fill="#FEFFFE" d="m68.77 20.51c1.49 4.67 4.04 11.47 9.81 15.23-0.61 0.27-3.54 0.44-6.11-2.8-3.37-4.22-3.7-10.78-3.7-12.43z"/>
</svg>`

export type LogoRect = {
  left: number
  top: number
  width: number
  height: number
}

type OPortal3DProps = {
  progress: number
  logoRect: LogoRect
  className?: string
}

function worldAtZ(z: number, vw: number, vh: number) {
  const height = 2 * Math.tan((FOV * Math.PI) / 180 / 2) * z
  return { width: height * (vw / Math.max(vh, 1)), height }
}

function screenToWorld(
  x: number,
  y: number,
  vw: number,
  vh: number,
  viewW: number,
  viewH: number,
) {
  return {
    x: (x / vw - 0.5) * viewW,
    y: -(y / vh - 0.5) * viewH,
  }
}

export function OPortal3D({ progress, logoRect, className }: OPortal3DProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(progress)
  const rectRef = useRef(logoRect)
  progressRef.current = progress
  rectRef.current = logoRect

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    let disposed = false
    let renderer: import("three").WebGLRenderer | undefined
    let resizeObserver: ResizeObserver | undefined

    async function setup() {
      const THREE = await import("three")
      const { SVGLoader } = await import(
        "three/examples/jsm/loaders/SVGLoader.js"
      )
      if (disposed || !wrap) return

      const webgl = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      })
      webgl.setClearColor(0x000000, 0)
      webgl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      webgl.setSize(wrap.clientWidth, wrap.clientHeight, false)
      webgl.domElement.style.width = "100%"
      webgl.domElement.style.height = "100%"
      webgl.domElement.style.display = "block"
      wrap.appendChild(webgl.domElement)
      renderer = webgl

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(
        FOV,
        wrap.clientWidth / Math.max(wrap.clientHeight, 1),
        0.015,
        80,
      )
      camera.position.set(0, 0, CAM_Z)

      scene.add(new THREE.HemisphereLight(0xf7efe6, 0x2a221e, 1))
      const key = new THREE.DirectionalLight(0xfff6ee, 0.95)
      key.position.set(2.4, 3.2, 6)
      scene.add(key)
      const rim = new THREE.DirectionalLight(0xd4c4b8, 0.55)
      rim.position.set(-3.2, -1.4, 4)
      scene.add(rim)

      const letterMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.34,
        metalness: 0.1,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      })
      const tulipMat = new THREE.MeshStandardMaterial({
        color: 0xd11d36,
        roughness: 0.42,
        metalness: 0.04,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      })
      const highlightMat = new THREE.MeshStandardMaterial({
        color: 0xfefffe,
        roughness: 0.5,
        metalness: 0,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      })

      const extrude = {
        depth: EXTRUDE_DEPTH,
        bevelEnabled: false,
        curveSegments: 48,
      }

      const logoGroup = new THREE.Group()
      const parsed = new SVGLoader().parse(LOGO_SVG)
      for (const path of parsed.paths) {
        const fill = String(path.userData?.style?.fill ?? "").toLowerCase()
        if (fill === "none") continue
        const hex = path.color?.getHex?.() ?? 0x1a1a1a
        const material =
          hex === 0xd11d36 || fill.includes("d11d36")
            ? tulipMat
            : hex === 0xfefffe || fill.includes("fefffe")
              ? highlightMat
              : letterMat
        const shapes = SVGLoader.createShapes(path)
        for (const shape of shapes) {
          const geometry = new THREE.ExtrudeGeometry(shape, extrude)
          geometry.translate(0, 0, -EXTRUDE_DEPTH)
          logoGroup.add(new THREE.Mesh(geometry, material))
        }
      }
      scene.add(logoGroup)

      const planeMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(PORTAL_PAGE_BG),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
      const plane = new THREE.Mesh(new THREE.CircleGeometry(1, 80), planeMat)
      scene.add(plane)

      const onResize = () => {
        const width = wrap.clientWidth
        const height = Math.max(wrap.clientHeight, 1)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        webgl.setSize(width, height, false)
      }
      resizeObserver = new ResizeObserver(onResize)
      resizeObserver.observe(wrap)

      webgl.setAnimationLoop(() => {
        const p = progressRef.current
        const rect = rectRef.current
        const vw = wrap.clientWidth
        const vh = Math.max(wrap.clientHeight, 1)
        if (vw < 8 || vh < 8 || rect.width < 8) {
          webgl.render(scene, camera)
          return
        }

        const morph = clamp01((p - 0.02) / 0.16)
        const focus = easeInOutCubic(clamp01((p - 0.12) / 0.28))
        const dolly = easeInOutCubic(clamp01((p - 0.24) / 0.54))
        const fill = clamp01((p - 0.16) / 0.3)

        const view = worldAtZ(CAM_Z, vw, vh)
        const topLeft = screenToWorld(rect.left, rect.top, vw, vh, view.width, view.height)
        const scale = (rect.width / vw) * view.width / OLALA_LOGO_VIEWBOX
        const depthScale = 0.07 + morph * 0.93

        logoGroup.position.set(topLeft.x, topLeft.y, 0)
        logoGroup.scale.set(scale, -scale, scale * depthScale)

        const oScreenX =
          rect.left + (OLALA_O_CX / OLALA_LOGO_VIEWBOX) * rect.width
        const oScreenY =
          rect.top + (OLALA_O_CY / OLALA_LOGO_VIEWBOX) * rect.height
        const oWorld = screenToWorld(oScreenX, oScreenY, vw, vh, view.width, view.height)
        const hole =
          (OLALA_O_INNER_R / OLALA_LOGO_VIEWBOX) * rect.width * (view.width / vw)

        letterMat.opacity = morph
        tulipMat.opacity = morph
        highlightMat.opacity = morph * 0.9
        letterMat.depthWrite = morph > 0.55
        tulipMat.depthWrite = morph > 0.55

        plane.position.set(oWorld.x, oWorld.y, -0.03)
        plane.scale.setScalar(Math.max(hole, 0.002) * (1 + fill * 1.2 + dolly * 20))
        planeMat.opacity = fill * (0.2 + dolly * 0.8)

        const endZ = Math.max(
          (hole * 0.5) / Math.tan((FOV * Math.PI) / 360),
          0.09,
        )
        camera.position.set(
          THREE.MathUtils.lerp(0, oWorld.x, focus),
          THREE.MathUtils.lerp(0, oWorld.y, focus),
          THREE.MathUtils.lerp(CAM_Z, endZ, dolly),
        )
        camera.lookAt(
          oWorld.x * focus,
          oWorld.y * focus,
          THREE.MathUtils.lerp(0, -1.2, dolly),
        )

        webgl.render(scene, camera)
      })
    }

    setup().catch((error) => {
      console.error("O portal failed to start", error)
    })

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      renderer?.setAnimationLoop(null)
      renderer?.dispose()
      renderer?.domElement.remove()
    }
  }, [])

  return <div ref={wrapRef} className={className} aria-hidden />
}
