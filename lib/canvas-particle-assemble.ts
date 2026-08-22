import { easeInCubic, easeOutCubic } from "@/lib/particle-display"

export type CanvasParticle = {
  sx: number
  sy: number
  tx: number
  ty: number
  dx: number
  dy: number
  delay: number
  r: number
  g: number
  b: number
  a: number
  startSize: number
  endSize: number
  rotation: number
}

/** Unit petal: notched top, rounded tip at the bottom. Local space ≈ -0.5..0.5. */
function createPetalPath() {
  const path = new Path2D()
  path.moveTo(0, 0.52)
  path.bezierCurveTo(-0.38, 0.28, -0.5, -0.02, -0.46, -0.28)
  path.bezierCurveTo(-0.4, -0.48, -0.16, -0.5, 0, -0.34)
  path.bezierCurveTo(0.16, -0.5, 0.4, -0.48, 0.46, -0.28)
  path.bezierCurveTo(0.5, -0.02, 0.38, 0.28, 0, 0.52)
  path.closePath()
  return path
}

export async function loadDecodedImage(url: string) {
  const res = await fetch(url, { cache: "force-cache" })
  if (!res.ok) throw new Error(`Failed to fetch ${url}`)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const image = new Image()
  image.decoding = "async"
  image.src = objectUrl
  try {
    await image.decode()
    return { image, objectUrl }
  } catch (error) {
    URL.revokeObjectURL(objectUrl)
    throw error
  }
}

function gaussianOffset(sigmaX: number, sigmaY: number) {
  const u = Math.max(Math.random(), 1e-6)
  const angle = Math.random() * Math.PI * 2
  const mag = Math.sqrt(-2 * Math.log(u))
  return {
    x: Math.cos(angle) * mag * sigmaX,
    y: Math.sin(angle) * mag * sigmaY,
  }
}

export function sampleCanvasParticles(
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  photoWidth: number,
  photoHeight: number,
  photoLeft: number,
  photoTop: number,
  canvasWidth: number,
  canvasHeight: number,
  grid = 56,
): CanvasParticle[] {
  const sampleCanvas = document.createElement("canvas")
  sampleCanvas.width = grid
  sampleCanvas.height = Math.max(Math.round(grid * (sourceHeight / Math.max(sourceWidth, 1))), 1)

  const ctx = sampleCanvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) throw new Error("2d context unavailable")

  ctx.drawImage(image, 0, 0, sampleCanvas.width, sampleCanvas.height)
  const pixels = ctx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data

  const cell = Math.max(photoWidth / sampleCanvas.width, photoHeight / sampleCanvas.height)
  const sigmaX = canvasWidth * 0.22
  const sigmaY = canvasHeight * 0.32
  const particles: CanvasParticle[] = []

  for (let row = 0; row < sampleCanvas.height; row += 1) {
    for (let col = 0; col < sampleCanvas.width; col += 1) {
      const i = (row * sampleCanvas.width + col) * 4
      const alpha = pixels[i + 3] / 255
      if (alpha < 0.08) continue

      const tx =
        photoLeft + (col / Math.max(sampleCanvas.width - 1, 1)) * photoWidth
      const ty =
        photoTop + (row / Math.max(sampleCanvas.height - 1, 1)) * photoHeight

      const assemble = gaussianOffset(sigmaX, sigmaY)
      const dissolve = gaussianOffset(sigmaX, sigmaY)

      particles.push({
        tx,
        ty,
        sx: tx + assemble.x,
        sy: ty + assemble.y,
        dx: tx + dissolve.x,
        dy: ty + dissolve.y,
        delay: Math.random() * 0.28,
        r: pixels[i],
        g: pixels[i + 1],
        b: pixels[i + 2],
        a: alpha,
        startSize: cell * (1.6 + Math.random() * 2.2),
        endSize: Math.max(2.4, cell * 0.9),
        rotation: Math.random() * Math.PI * 2,
      })
    }
  }

  return particles
}

export function runCanvasParticleAnimation(
  canvas: HTMLCanvasElement,
  particles: CanvasParticle[],
  cssWidth: number,
  cssHeight: number,
  durationMs: number,
  mode: "assemble" | "dissolve",
  onComplete: () => void,
) {
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("2d context unavailable")
  const petalPath = createPetalPath()

  let raf = 0
  const startedAt = performance.now()

  const draw = () => {
    const rawT = Math.min((performance.now() - startedAt) / durationMs, 1)
    const scaleX = canvas.width / Math.max(cssWidth, 1)
    const scaleY = canvas.height / Math.max(cssHeight, 1)

    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0)
    ctx.clearRect(0, 0, cssWidth, cssHeight)

    for (const p of particles) {
      const localRaw = Math.min(Math.max((rawT - p.delay) / (1 - p.delay), 0), 1)
      const t = mode === "assemble" ? easeOutCubic(localRaw) : easeInCubic(localRaw)
      const fromX = mode === "assemble" ? p.sx : p.tx
      const fromY = mode === "assemble" ? p.sy : p.ty
      const toX = mode === "assemble" ? p.tx : p.dx
      const toY = mode === "assemble" ? p.ty : p.dy
      const x = fromX + (toX - fromX) * t
      const y = fromY + (toY - fromY) * t
      const size =
        mode === "assemble"
          ? p.startSize + (p.endSize - p.startSize) * t
          : p.endSize + (p.startSize - p.endSize) * t
      const fade =
        mode === "assemble"
          ? Math.min(t / 0.42, 1)
          : Math.max(1 - t / 0.85, 0)
      const alpha = p.a * fade

      if (alpha <= 0.02) continue

      const cos = Math.cos(p.rotation)
      const sin = Math.sin(p.rotation)
      ctx.setTransform(
        scaleX * cos * size,
        scaleY * sin * size,
        -scaleX * sin * size,
        scaleY * cos * size,
        scaleX * x,
        scaleY * y,
      )
      ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`
      ctx.fill(petalPath)
    }

    if (rawT >= 1) {
      onComplete()
      return
    }

    raf = requestAnimationFrame(draw)
  }

  raf = requestAnimationFrame(draw)
  return () => cancelAnimationFrame(raf)
}
