type ParticleBurst = {
  points: import("three").Points
  progress: { value: number }
  geometry: import("three").BufferGeometry
  material: import("three").ShaderMaterial
}

type CreateBurstOptions = {
  pixelRatio: number
  grid?: number
  mode: "assemble" | "dissolve"
  viewportWidth: number
  viewportHeight: number
}

const ASSEMBLE_VERTEX = `
  attribute vec3 aStart;
  attribute vec3 aScatter;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uProgress;
  uniform float uPixelRatio;
  uniform vec2 uResolution;
  uniform float uPointScale;
  void main() {
    float t = uProgress;
    vec3 p = mix(aStart, position, t);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float pointWorld = uPointScale * mix(0.85, 1.35, t);
    float pixelsPerWorld = uResolution.y / max(-mv.z, 0.05);
    gl_PointSize = clamp(pointWorld * pixelsPerWorld * uPixelRatio, 2.0, 72.0);
    vColor = color;
    vAlpha = mix(0.55, 0.95, t);
  }
`

const DISSOLVE_VERTEX = `
  attribute vec3 aStart;
  attribute vec3 aScatter;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uProgress;
  uniform float uPixelRatio;
  uniform vec2 uResolution;
  uniform float uPointScale;
  void main() {
    float t = uProgress;
    vec3 p = mix(position, aScatter, t);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float pointWorld = uPointScale * mix(1.35, 0.85, t);
    float pixelsPerWorld = uResolution.y / max(-mv.z, 0.05);
    gl_PointSize = clamp(pointWorld * pixelsPerWorld * uPixelRatio, 2.0, 72.0);
    vColor = color;
    vAlpha = mix(0.95, 0.0, t);
  }
`

const PARTICLE_FRAGMENT = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.14, d) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`

export function createImageParticleBurst(
  THREE: typeof import("three"),
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  options: CreateBurstOptions,
): ParticleBurst {
  const grid = options.grid ?? 80
  const canvas = document.createElement("canvas")
  canvas.width = grid
  canvas.height = Math.max(Math.round(grid * (sourceHeight / sourceWidth)), 1)
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) throw new Error("2d context unavailable")
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data

  const aspect = sourceWidth / Math.max(sourceHeight, 1)
  const worldHeight = 2
  const worldWidth = worldHeight * aspect

  const positions: number[] = []
  const starts: number[] = []
  const scatters: number[] = []
  const colors: number[] = []

  for (let row = 0; row < canvas.height; row++) {
    for (let col = 0; col < canvas.width; col++) {
      const i = (row * canvas.width + col) * 4
      const alpha = pixels[i + 3] / 255
      if (alpha < 0.1) continue

      const x = (col / (canvas.width - 1) - 0.5) * worldWidth
      const y = (0.5 - row / (canvas.height - 1)) * worldHeight

      positions.push(x, y, 0)
      starts.push(
        x + (Math.random() - 0.5) * 1.2,
        y + (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 0.8,
      )
      scatters.push(
        x + (Math.random() - 0.5) * 2.4,
        y + (Math.random() - 0.5) * 2.4,
        (Math.random() - 0.5) * 1.6,
      )
      colors.push(
        (pixels[i] / 255) * alpha,
        (pixels[i + 1] / 255) * alpha,
        (pixels[i + 2] / 255) * alpha,
      )
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute("aStart", new THREE.Float32BufferAttribute(starts, 3))
  geometry.setAttribute("aScatter", new THREE.Float32BufferAttribute(scatters, 3))
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))

  const progress = { value: options.mode === "assemble" ? 0 : 0 }

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uProgress: progress,
      uPixelRatio: { value: options.pixelRatio },
      uResolution: {
        value: new THREE.Vector2(options.viewportWidth, options.viewportHeight),
      },
      uPointScale: { value: worldHeight / canvas.height },
    },
    vertexShader: options.mode === "assemble" ? ASSEMBLE_VERTEX : DISSOLVE_VERTEX,
    fragmentShader: PARTICLE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  })

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  return { points, progress, geometry, material }
}

export function disposeParticleBurst(burst: ParticleBurst) {
  burst.geometry.dispose()
  burst.material.dispose()
}

export function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

export function easeInCubic(t: number) {
  return t * t * t
}

export type { ParticleBurst }
