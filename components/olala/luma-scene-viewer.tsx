"use client"

import { useEffect, useRef, useState } from "react"

export const OLALA_INBOX_CAPTURE =
  "https://lumalabs.ai/capture/918250fc-a1ea-4d1a-979b-b241517d4bd2"

const REVEAL_AMOUNT = 0.8
const REVEAL_SPEED = 0.18
const AUTO_ROTATE_SPEED = 0.22
const PHOTO_SPAWN_GAP_MS = 2600
const PHOTO_ASSEMBLE_MS = 4800
const PHOTO_MAX = 8
const PHOTO_GRID = 80
/** Share of viewport height a photo should occupy. */
const PHOTO_SCREEN_HEIGHT = 0.42

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

type FeedPost = {
  id: string
  imageUrl: string
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

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = "async"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load ${src}`))
    image.src = src
  })
}

function createPhotoBurst(
  THREE: typeof import("three"),
  image: HTMLImageElement,
  pixelRatio: number,
) {
  const cols = PHOTO_GRID
  const rows = PHOTO_GRID
  const canvas = document.createElement("canvas")
  canvas.width = cols
  canvas.height = rows
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) throw new Error("2d context unavailable")
  ctx.drawImage(image, 0, 0, cols, rows)
  const pixels = ctx.getImageData(0, 0, cols, rows).data

  const aspect = Math.min(
    Math.max(image.naturalWidth / Math.max(image.naturalHeight, 1), 0.7),
    1.35,
  )
  const height = 1
  const width = height * aspect

  const targets: number[] = []
  const starts: number[] = []
  const colors: number[] = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = (row * cols + col) * 4
      const alpha = pixels[i + 3] / 255
      if (alpha < 0.12) continue
      const x = (col / (cols - 1) - 0.5) * width
      const y = (0.5 - row / (rows - 1)) * height
      targets.push(x, y, 0)
      starts.push(
        x + (Math.random() - 0.5) * 1.1,
        y + (Math.random() - 0.5) * 1.1,
        (Math.random() - 0.5) * 0.9,
      )
      colors.push(
        (pixels[i] / 255) * alpha,
        (pixels[i + 1] / 255) * alpha,
        (pixels[i + 2] / 255) * alpha,
      )
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(targets, 3))
  geometry.setAttribute("aStart", new THREE.Float32BufferAttribute(starts, 3))
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))

  const progress = { value: 0 }
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uProgress: progress,
      uPixelRatio: { value: pixelRatio },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uFov: { value: 55 * (Math.PI / 180) },
      uPhotoHeight: { value: 1 },
    },
    vertexShader: `
      attribute vec3 aStart;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vProgress;
      uniform float uProgress;
      uniform float uPixelRatio;
      uniform vec2 uResolution;
      uniform float uFov;
      uniform float uPhotoHeight;
      void main() {
        float t = uProgress;
        vec3 p = mix(aStart, position, t);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float worldPoint = (uPhotoHeight / 80.0) * mix(0.9, 1.55, t);
        float pixelsPerWorld = uResolution.y / (2.0 * tan(uFov * 0.5) * max(-mv.z, 0.05));
        gl_PointSize = clamp(worldPoint * pixelsPerWorld * uPixelRatio, 3.0, 64.0);
        vColor = color;
        vProgress = t;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vProgress;
      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.16, d) * mix(0.55, 0.95, vProgress);
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  })

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  return { points, progress, geometry, material, startedAt: 0 }
}

type LumaSceneViewerProps = {
  className?: string
}

export function LumaSceneViewer({ className }: LumaSceneViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let disposed = false
    let renderer: import("three").WebGLRenderer | undefined
    let controls: { dispose: () => void } | undefined
    let splat: LumaSplat | undefined
    let resizeObserver: ResizeObserver | undefined
    const photoBursts: Array<{
      points: import("three").Points
      progress: { value: number }
      geometry: import("three").BufferGeometry
      material: import("three").ShaderMaterial
      startedAt: number
    }> = []

    async function setup() {
      const THREE = await import("three")
      const { OrbitControls } = await import(
        "three/examples/jsm/controls/OrbitControls.js"
      )
      const { LumaSplatsThree } = await import("@lumaai/luma-web")

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
        source: OLALA_INBOX_CAPTURE,
        particleRevealEnabled: true,
        enableThreeShaderIntegration: false,
      }) as LumaSplat

      const freezeElapsedMs = elapsedMsForReveal(REVEAL_AMOUNT) / REVEAL_SPEED
      const worldCenter = new THREE.Vector3()
      const ndc = new THREE.Vector3()
      const towardCam = new THREE.Vector3()
      const right = new THREE.Vector3()
      const up = new THREE.Vector3()

      splatScene.onInitialCameraTransform = (transform) => {
        transform.decompose(camera.position, camera.quaternion, new THREE.Vector3())
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
        orbit.target.copy(camera.position).addScaledVector(forward, 1.8)
        orbit.update()
      }

      splatScene.onProgress = ({ progress }) => {
        if (!disposed && progress > 0.04) setReady(true)
      }

      splatScene.onLoad = () => {
        if (!disposed) setReady(true)
      }

      scene.add(splatScene)
      splat = splatScene

      let posts: FeedPost[] = []
      fetch("/api/instagram/feed")
        .then((res) => res.json())
        .then((data: { posts?: FeedPost[] }) => {
          if (!disposed && Array.isArray(data.posts)) posts = data.posts.slice(0, PHOTO_MAX)
        })
        .catch(() => {})

      let halfCrossed = false
      let prevScreenX: number | null = null
      let nextPhoto = 0
      let spawning = false
      let lastSpawnAt = 0

      const placePhoto = (
        burst: {
          points: import("three").Points
          material: import("three").ShaderMaterial
        },
        index: number,
      ) => {
        const dist = Math.max(camera.position.distanceTo(orbit.target), 0.6)
        const fov = (camera.fov * Math.PI) / 180
        const photoDist = dist * 0.58
        const worldHeight = 2 * Math.tan(fov / 2) * photoDist * PHOTO_SCREEN_HEIGHT

        towardCam.subVectors(camera.position, orbit.target).normalize()
        right.crossVectors(towardCam, camera.up).normalize()
        if (right.lengthSq() < 0.01) {
          right.set(1, 0, 0)
        }
        up.crossVectors(right, towardCam).normalize()

        const side = index % 2 === 0 ? 1 : -1
        const slot = Math.floor(index / 2)
        burst.points.scale.setScalar(worldHeight)
        burst.points.position.copy(orbit.target)
          .addScaledVector(towardCam, dist * 0.42)
          .addScaledVector(right, side * worldHeight * (0.72 + slot * 0.18))
          .addScaledVector(up, ((slot % 2) * 2 - 1) * worldHeight * 0.16)
        burst.points.lookAt(camera.position)

        burst.material.uniforms.uPhotoHeight.value = worldHeight
        burst.material.uniforms.uFov.value = fov
        burst.material.uniforms.uPixelRatio.value = webglRenderer.getPixelRatio()
        burst.material.uniforms.uResolution.value.set(
          container.clientWidth,
          container.clientHeight,
        )
      }

      const spawnPhoto = async () => {
        if (spawning || nextPhoto >= posts.length || disposed) return
        spawning = true
        const post = posts[nextPhoto++]
        try {
          const image = await loadImage(post.imageUrl)
          if (disposed) return
          const burst = createPhotoBurst(
            THREE,
            image,
            webglRenderer.getPixelRatio(),
          )
          burst.startedAt = performance.now()
          placePhoto(burst, photoBursts.length)
          scene.add(burst.points)
          photoBursts.push(burst)
          lastSpawnAt = performance.now()
        } catch {
          lastSpawnAt = performance.now()
        } finally {
          spawning = false
        }
      }

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
        freezeReveal(splatScene, freezeElapsedMs)
        orbit.update()

        const sphere = splatScene.boundingSphere
        if (sphere && sphere.radius > 0.15) {
          worldCenter.copy(sphere.center).applyMatrix4(splatScene.matrixWorld)
          ndc.copy(worldCenter).project(camera)
          const screenX = (ndc.x * 0.5 + 0.5) * container.clientWidth
          const mid = container.clientWidth / 2
          if (!halfCrossed && prevScreenX != null) {
            const crossed =
              (prevScreenX < mid && screenX >= mid) ||
              (prevScreenX > mid && screenX <= mid)
            if (crossed) {
              halfCrossed = true
              lastSpawnAt = 0
            }
          }
          prevScreenX = screenX
        }

        const now = performance.now()
        if (
          halfCrossed &&
          posts.length > 0 &&
          now - lastSpawnAt > PHOTO_SPAWN_GAP_MS
        ) {
          void spawnPhoto()
        }

        for (const burst of photoBursts) {
          const t = Math.min((now - burst.startedAt) / PHOTO_ASSEMBLE_MS, 1)
          burst.progress.value = easeOutCubic(t) * 0.9
          burst.points.lookAt(camera.position)
          burst.material.uniforms.uPhotoHeight.value = burst.points.scale.x
          burst.material.uniforms.uFov.value = (camera.fov * Math.PI) / 180
          burst.material.uniforms.uPixelRatio.value = webglRenderer.getPixelRatio()
          burst.material.uniforms.uResolution.value.set(
            container.clientWidth,
            container.clientHeight,
          )
        }

        webglRenderer.render(scene, camera)
      })
    }

    setup().catch((error) => {
      console.error("Luma scene failed to start", error)
    })

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      renderer?.setAnimationLoop(null)
      for (const burst of photoBursts) {
        burst.geometry.dispose()
        burst.material.dispose()
      }
      splat?.dispose()
      controls?.dispose()
      renderer?.dispose()
      renderer?.domElement.remove()
    }
  }, [])

  return (
    <div className={className}>
      <div ref={containerRef} className="absolute inset-0" />
      <div
        className="pointer-events-none absolute inset-0 bg-[#faf6f2] transition-opacity duration-700"
        style={{ opacity: ready ? 0 : 1 }}
        aria-hidden
      />
    </div>
  )
}
