"use client"

import { Suspense, useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useGLTF, useAnimations, OrbitControls } from "@react-three/drei"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import * as THREE from "three"
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js"
import type { RhododendronSceneConfig } from "@/lib/rhododendron-scene-config"

const MODEL_PATH = "/models/rhododendron_web.glb"

interface RhododendronCanvasProps {
  config: RhododendronSceneConfig
  orbitEnabled?: boolean
  onConfigChange?: (config: RhododendronSceneConfig) => void
}

function RhododendronModel({
  modelRotationY,
  modelScale,
}: {
  modelRotationY: number
  modelScale: number
}) {
  const modelRef = useRef<THREE.Object3D>(null)
  const { scene, animations } = useGLTF(MODEL_PATH, true)
  const { actions, names } = useAnimations(animations, modelRef)

  const clonedScene = useMemo(() => {
    const clone = cloneSkinned(scene)
    const box = new THREE.Box3().setFromObject(clone)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = modelScale / maxDim

    clone.position.sub(center)
    clone.scale.setScalar(scale)
    clone.rotation.y = modelRotationY

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]
        materials.forEach((material) => {
          if (!material) return
          material.side = THREE.FrontSide
          if (material instanceof THREE.MeshStandardMaterial) {
            material.metalness = 0
            material.roughness = Math.max(material.roughness, 0.45)
            material.envMapIntensity = 0.6
          }
        })
      }
    })

    return clone
  }, [scene, modelRotationY, modelScale])

  useEffect(() => {
    names.forEach((name) => {
      const action = actions[name]
      if (!action) return
      action.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.3).play()
    })
  }, [actions, names])

  return <primitive ref={modelRef} object={clonedScene} />
}

function CameraRig({
  lookAt,
  orbitEnabled,
}: {
  lookAt: [number, number, number]
  orbitEnabled: boolean
}) {
  const target = useMemo(() => new THREE.Vector3(...lookAt), [lookAt])

  useFrame(({ camera }) => {
    if (orbitEnabled) return
    camera.lookAt(target)
  })

  return null
}

function CameraSync({ config }: { config: RhododendronSceneConfig }) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(...config.camera.position)
    if ("fov" in camera) {
      ;(camera as THREE.PerspectiveCamera).fov = config.camera.fov
      camera.updateProjectionMatrix()
    }
  }, [camera, config.camera.fov, config.camera.position])

  return null
}

function OrbitController({
  config,
  orbitEnabled,
  onConfigChange,
}: {
  config: RhododendronSceneConfig
  orbitEnabled: boolean
  onConfigChange?: (config: RhododendronSceneConfig) => void
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    controls.target.set(...config.lookAt)
    controls.update()
  }, [config.lookAt])

  if (!orbitEnabled) return null

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      onEnd={() => {
        const controls = controlsRef.current
        if (!controls || !onConfigChange) return
        const { x, y, z } = controls.object.position
        const t = controls.target
        onConfigChange({
          ...config,
          camera: {
            ...config.camera,
            position: [x, y, z],
          },
          lookAt: [t.x, t.y, t.z],
        })
      }}
    />
  )
}

function SceneLights({
  lookAt,
  lighting,
}: {
  lookAt: [number, number, number]
  lighting: RhododendronSceneConfig["lighting"]
}) {
  const target = useMemo(() => new THREE.Vector3(...lookAt), [lookAt])

  return (
    <>
      <ambientLight intensity={lighting.ambient} color="#fff9f6" />
      <hemisphereLight
        args={["#fff8f4", "#e8cfc4", lighting.hemisphere]}
        position={[0, 4, 0]}
      />
      <directionalLight
        position={[target.x + 2.5, target.y + 4, target.z + 3]}
        intensity={lighting.key}
        color="#fff5ef"
      />
      <directionalLight
        position={[target.x - 2, target.y + 1.5, target.z + 2]}
        intensity={lighting.fill}
        color="#f5e8e2"
      />
      <directionalLight
        position={[target.x + 0.5, target.y + 2, target.z - 3]}
        intensity={lighting.rim}
        color="#f8ddd4"
      />
      <pointLight
        position={[target.x - 1.2, target.y + 1.8, target.z + 2]}
        intensity={lighting.key * 0.35}
        color="#ffece4"
        distance={10}
        decay={2}
      />
    </>
  )
}

function ToneMappingSync({ exposure }: { exposure: number }) {
  const { gl } = useThree()

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = exposure
  }, [gl, exposure])

  return null
}

function Scene({
  config,
  orbitEnabled,
  onConfigChange,
}: RhododendronCanvasProps) {
  return (
    <>
      <CameraSync config={config} />
      <ToneMappingSync exposure={config.lighting.exposure} />
      <CameraRig lookAt={config.lookAt} orbitEnabled={!!orbitEnabled} />
      <SceneLights lookAt={config.lookAt} lighting={config.lighting} />
      <group
        position={config.group.position}
        rotation={config.group.rotation}
      >
        <RhododendronModel
          modelRotationY={config.modelRotationY}
          modelScale={config.modelScale}
        />
      </group>
      <OrbitController
        config={config}
        orbitEnabled={!!orbitEnabled}
        onConfigChange={onConfigChange}
      />
    </>
  )
}

export function RhododendronCanvas({
  config,
  orbitEnabled = false,
  onConfigChange,
}: RhododendronCanvasProps) {
  return (
    <Canvas
      className="h-full w-full"
      gl={{
        alpha: true,
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: config.lighting.exposure,
      }}
      dpr={[1, 1.5]}
      camera={{
        position: config.camera.position,
        fov: config.camera.fov,
        near: 0.01,
        far: 200,
      }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <Scene
          config={config}
          orbitEnabled={orbitEnabled}
          onConfigChange={onConfigChange}
        />
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload(MODEL_PATH, true)
