export type RhododendronLightingConfig = {
  ambient: number
  hemisphere: number
  key: number
  fill: number
  rim: number
  exposure: number
}

export type RhododendronSceneConfig = {
  camera: {
    position: [number, number, number]
    fov: number
  }
  lookAt: [number, number, number]
  group: {
    position: [number, number, number]
    rotation: [number, number, number]
  }
  modelRotationY: number
  modelScale: number
  lighting: RhododendronLightingConfig
}

export const RHODODENDRON_SCENE_CONFIG: RhododendronSceneConfig = {
  camera: {
    position: [-1.54, 0.85, 1.7],
    fov: 42,
  },
  lookAt: [-0.49, 0.51, -1.24],
  group: {
    position: [0.6, -0.53, -0.32],
    rotation: [0, 0.1571, 0],
  },
  modelRotationY: -3.1241,
  modelScale: 1.55,
  lighting: {
    ambient: 0.5,
    hemisphere: 0.9,
    key: 1.65,
    fill: 0.7,
    rim: 0.5,
    exposure: 1.15,
  },
}

export function formatRhododendronSceneConfig(config: RhododendronSceneConfig): string {
  const r = (n: number) => Number(n.toFixed(4))
  const rad = (n: number) => {
    if (Math.abs(n - Math.PI) < 0.0001) return "Math.PI"
    if (Math.abs(n + Math.PI) < 0.0001) return "-Math.PI"
    if (Math.abs(n - Math.PI / 2) < 0.0001) return "Math.PI / 2"
    return r(n).toString()
  }

  return `export const RHODODENDRON_SCENE_CONFIG = {
  camera: {
    position: [${config.camera.position.map(r).join(", ")}],
    fov: ${r(config.camera.fov)},
  },
  lookAt: [${config.lookAt.map(r).join(", ")}],
  group: {
    position: [${config.group.position.map(r).join(", ")}],
    rotation: [${config.group.rotation.map(rad).join(", ")}],
  },
  modelRotationY: ${rad(config.modelRotationY)},
  modelScale: ${r(config.modelScale)},
  lighting: {
    ambient: ${r(config.lighting.ambient)},
    hemisphere: ${r(config.lighting.hemisphere)},
    key: ${r(config.lighting.key)},
    fill: ${r(config.lighting.fill)},
    rim: ${r(config.lighting.rim)},
    exposure: ${r(config.lighting.exposure)},
  },
}`
}
