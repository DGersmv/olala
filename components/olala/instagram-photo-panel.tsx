"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  loadDecodedImage,
  runCanvasParticleAnimation,
  sampleCanvasParticles,
} from "@/lib/canvas-particle-assemble"
import { useSiteLoad } from "./site-load-context"

const PHOTO_START_DELAY_MS = 7_000
const PHOTO_ASSEMBLE_MS = 4_200
const PHOTO_FADE_MS = 900
const PHOTO_HOLD_MS = 4_800
const PHOTO_DISSOLVE_MS = 4_200
const PHOTO_MAX = 8
const PANEL_VERTICAL_INSET = 0.3
const MOBILE_BATCH = 4
const MOBILE_FADE_MS = 1_600
const MOBILE_STAGGER_MS = 320
const MOBILE_HOLD_MS = 4_200
const MOBILE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)"
const DESKTOP_MQ = "(min-width: 1024px)"

type FeedPost = {
  id: string
  imageUrl: string
  caption?: string
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

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(DESKTOP_MQ).matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MQ)
    const update = () => setIsDesktop(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return isDesktop
}

function wrapBatch(posts: FeedPost[], start: number, count: number) {
  if (posts.length === 0) return []
  const size = Math.min(count, posts.length)
  return Array.from({ length: size }, (_, i) => posts[(start + i) % posts.length])
}

function MobilePhotoThumb({
  photo,
  index,
  visible,
  shift,
  width,
  height,
}: {
  photo: FeedPost
  index: number
  visible: boolean
  shift: string
  width?: number
  height?: number
}) {
  return (
    <div
      className={width ? "shrink-0" : "min-w-0 flex-1"}
      style={{
        width: width ?? undefined,
        height: height ?? undefined,
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0, 0)" : shift,
        boxShadow: visible
          ? "0 16px 28px rgba(28, 20, 16, 0.32), 0 6px 12px rgba(28, 20, 16, 0.14)"
          : "0 0 20px rgba(28, 20, 16, 0)",
        transition: `opacity ${MOBILE_FADE_MS}ms ${MOBILE_EASE}, transform ${MOBILE_FADE_MS}ms ${MOBILE_EASE}, box-shadow ${MOBILE_FADE_MS}ms ${MOBILE_EASE}`,
        transitionDelay: `${index * MOBILE_STAGGER_MS}ms`,
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          width: width ? "100%" : undefined,
          height: height ? "100%" : undefined,
          aspectRatio: width ? undefined : "4 / 5",
        }}
      >
        <img
          src={photo.imageUrl}
          alt=""
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  )
}

function MobilePhotoStrip({
  posts,
  landscape,
  viewportWidth,
  viewportHeight,
  frozen,
}: {
  posts: FeedPost[]
  landscape: boolean
  viewportWidth: number
  viewportHeight: number
  frozen: boolean
}) {
  const [startIndex, setStartIndex] = useState(0)
  const [visible, setVisible] = useState(false)

  const batchSize = Math.min(MOBILE_BATCH, posts.length)
  const batch = wrapBatch(posts, startIndex, batchSize)

  useEffect(() => {
    if (batch.length === 0) return

    if (frozen) {
      setVisible(true)
      return
    }

    setVisible(false)
    let cancelled = false
    const staggerSpan = Math.max(0, batchSize - 1) * MOBILE_STAGGER_MS
    const fadeIn = window.setTimeout(() => {
      if (!cancelled) setVisible(true)
    }, 80)
    const fadeOut = window.setTimeout(() => {
      if (!cancelled) setVisible(false)
    }, MOBILE_FADE_MS + staggerSpan + MOBILE_HOLD_MS)
    const next = window.setTimeout(() => {
      if (cancelled) return
      setStartIndex((prev) => (prev + batchSize) % posts.length)
    }, MOBILE_FADE_MS + staggerSpan + MOBILE_HOLD_MS + MOBILE_FADE_MS + staggerSpan)

    return () => {
      cancelled = true
      window.clearTimeout(fadeIn)
      window.clearTimeout(fadeOut)
      window.clearTimeout(next)
    }
  }, [frozen, startIndex, batch.length, batchSize, posts.length])

  if (batch.length === 0) return null

  if (landscape) {
    const leftPhotos = batch.slice(0, 2)
    const rightPhotos = batch.slice(2, 4)
    const gap = 8
    const vPad = Math.max(16, Math.round(viewportHeight * 0.08))
    const maxHeight = (viewportHeight - vPad * 2 - gap) / 2
    const maxWidth = viewportWidth * 0.15
    const photoHeight = Math.max(56, Math.min(maxHeight, maxWidth / 0.8))
    const photoWidth = Math.round(photoHeight * 0.8)
    const roundedHeight = Math.round(photoHeight)

    return (
      <>
        <div
          className="absolute top-1/2 flex -translate-y-1/2 flex-col justify-center gap-2"
          style={{ left: "max(12px, calc(2vw + env(safe-area-inset-left, 0px)))" }}
        >
          {leftPhotos.map((photo, index) => (
            <MobilePhotoThumb
              key={`${photo.id}-${startIndex}-l-${index}`}
              photo={photo}
              index={index}
              visible={visible}
              shift="translateX(-18px)"
              width={photoWidth}
              height={roundedHeight}
            />
          ))}
        </div>
        <div
          className="absolute top-1/2 flex -translate-y-1/2 flex-col justify-center gap-2"
          style={{ right: "max(12px, calc(2vw + env(safe-area-inset-right, 0px)))" }}
        >
          {rightPhotos.map((photo, index) => (
            <MobilePhotoThumb
              key={`${photo.id}-${startIndex}-r-${index}`}
              photo={photo}
              index={index + 2}
              visible={visible}
              shift="translateX(18px)"
              width={photoWidth}
              height={roundedHeight}
            />
          ))}
        </div>
      </>
    )
  }

  return (
    <div
      className="absolute inset-x-0 flex items-end justify-center gap-2 px-3"
      style={{
        bottom: "max(52px, calc(8vh + env(safe-area-inset-bottom, 0px)))",
      }}
    >
      {batch.map((photo, index) => (
        <MobilePhotoThumb
          key={`${photo.id}-${startIndex}-${index}`}
          photo={photo}
          index={index}
          visible={visible}
          shift="translateY(18px)"
        />
      ))}
    </div>
  )
}

function useImageAspect(imageUrl: string) {
  const [aspect, setAspect] = useState(4 / 5)

  useEffect(() => {
    let cancelled = false
    loadImage(imageUrl)
      .then((image) => {
        if (cancelled || image.naturalHeight <= 0) return
        setAspect(image.naturalWidth / image.naturalHeight)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [imageUrl])

  return aspect
}

function ParticlePhotoCard({
  imageUrl,
  caption,
  cardWidth,
  cardHeight,
  viewportWidth,
  viewportHeight,
  frozen,
  onCycleComplete,
}: {
  imageUrl: string
  caption?: string
  cardWidth: number
  cardHeight: number
  viewportWidth: number
  viewportHeight: number
  frozen: boolean
  onCycleComplete: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showPhoto, setShowPhoto] = useState(false)
  const onCycleCompleteRef = useRef(onCycleComplete)
  const frozenRef = useRef(frozen)
  const stopAnimationRef = useRef<(() => void) | undefined>(undefined)
  const holdTimerRef = useRef<number | undefined>(undefined)
  const fadeTimerRef = useRef<number | undefined>(undefined)
  onCycleCompleteRef.current = onCycleComplete
  frozenRef.current = frozen

  useEffect(() => {
    const canvas = canvasRef.current
    const card = cardRef.current
    if (!canvas || !card || cardWidth < 8 || cardHeight < 8) return

    let cancelled = false
    let objectUrl: string | undefined

    setShowPhoto(false)

    async function setup() {
      const loaded = await loadDecodedImage(imageUrl)
      objectUrl = loaded.objectUrl
      if (cancelled || !canvasRef.current || !cardRef.current) return

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      if (cancelled || !canvasRef.current || !cardRef.current) return

      if (frozenRef.current) {
        setShowPhoto(true)
        return
      }

      const rect = cardRef.current.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(viewportWidth * dpr)
      canvas.height = Math.round(viewportHeight * dpr)
      canvas.style.width = `${viewportWidth}px`
      canvas.style.height = `${viewportHeight}px`

      const particles = sampleCanvasParticles(
        loaded.image,
        loaded.image.naturalWidth,
        loaded.image.naturalHeight,
        cardWidth,
        cardHeight,
        rect.left,
        rect.top,
        viewportWidth,
        viewportHeight,
        52,
      )
      if (particles.length === 0) {
        throw new Error("No particles sampled")
      }

      const runDissolve = () => {
        if (cancelled || frozenRef.current || !canvasRef.current) return
        stopAnimationRef.current = runCanvasParticleAnimation(
          canvasRef.current,
          particles,
          viewportWidth,
          viewportHeight,
          PHOTO_DISSOLVE_MS,
          "dissolve",
          () => {
            if (!cancelled && !frozenRef.current) onCycleCompleteRef.current()
          },
        )
      }

      stopAnimationRef.current = runCanvasParticleAnimation(
        canvas,
        particles,
        viewportWidth,
        viewportHeight,
        PHOTO_ASSEMBLE_MS,
        "assemble",
        () => {
          if (cancelled) return
          setShowPhoto(true)
          if (frozenRef.current) return
          holdTimerRef.current = window.setTimeout(() => {
            if (cancelled || frozenRef.current) return
            setShowPhoto(false)
            fadeTimerRef.current = window.setTimeout(runDissolve, PHOTO_FADE_MS)
          }, PHOTO_FADE_MS + PHOTO_HOLD_MS)
        },
      )
    }

    setup().catch((error) => {
      console.error("[instagram particles]", error)
      if (!cancelled) {
        setShowPhoto(true)
        if (!frozenRef.current) {
          holdTimerRef.current = window.setTimeout(
            () => onCycleCompleteRef.current(),
            PHOTO_HOLD_MS,
          )
        }
      }
    })

    return () => {
      cancelled = true
      stopAnimationRef.current?.()
      if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current)
      if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [imageUrl, cardWidth, cardHeight, viewportWidth, viewportHeight])

  useEffect(() => {
    if (!frozen) return
    setShowPhoto(true)
    if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current)
    if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current)
    stopAnimationRef.current?.()
  }, [frozen])

  return (
    <div className="relative shrink-0 overflow-visible" style={{ width: cardWidth }}>
      <div
        ref={cardRef}
        className="relative overflow-visible"
        style={{ width: cardWidth, height: cardHeight }}
      >
        <img
          src={imageUrl}
          alt={caption ?? ""}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: showPhoto ? 1 : 0,
            boxShadow: showPhoto
              ? "0 28px 60px rgba(28, 20, 16, 0.38), 0 10px 22px rgba(28, 20, 16, 0.18)"
              : "0 0 40px rgba(28, 20, 16, 0)",
            transition: frozen
              ? "none"
              : `opacity ${PHOTO_FADE_MS}ms ease-in-out, box-shadow ${PHOTO_FADE_MS}ms ease-in-out`,
          }}
        />
      </div>
      {caption ? (
        <p
          className="pointer-events-none mt-3 line-clamp-2 px-1 text-center font-serif font-normal leading-snug"
          style={{
            color: "#2c221f",
            fontSize: 18,
            textShadow:
              "0 1px 0 rgba(250, 246, 242, 0.95), 0 0 14px rgba(250, 246, 242, 0.9), 0 0 28px rgba(250, 246, 242, 0.7)",
            opacity: showPhoto ? 1 : 0,
            transition: `opacity ${PHOTO_FADE_MS}ms ease-in-out`,
          }}
        >
          {caption}
        </p>
      ) : null}
      {createPortal(
        <canvas
          ref={canvasRef}
          className="pointer-events-none fixed inset-0 z-40"
          style={{
            opacity: frozen || showPhoto ? 0 : 1,
            transition: frozen
              ? "none"
              : `opacity ${PHOTO_FADE_MS}ms ease-in-out`,
          }}
          aria-hidden
        />,
        document.body,
      )}
    </div>
  )
}

function PhotoCard({
  photo,
  maxHeight,
  maxWidth,
  viewportWidth,
  viewportHeight,
  frozen,
  onCycleComplete,
}: {
  photo: FeedPost
  maxHeight: number
  maxWidth: number
  viewportWidth: number
  viewportHeight: number
  frozen: boolean
  onCycleComplete: () => void
}) {
  const aspect = useImageAspect(photo.imageUrl)
  const cardHeight = Math.min(maxHeight, maxWidth / aspect)
  const cardWidth = cardHeight * aspect

  if (cardWidth < 8 || cardHeight < 8) return null

  const width = Math.round(cardWidth)
  const height = Math.round(cardHeight)

  return (
    <div
      className="absolute overflow-visible"
      style={{
        left: viewportWidth * (5 / 6) - width / 2,
        top: viewportHeight / 2 - height / 2,
        width,
      }}
    >
      <ParticlePhotoCard
        imageUrl={photo.imageUrl}
        caption={photo.caption}
        cardWidth={width}
        cardHeight={height}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        frozen={frozen}
        onCycleComplete={onCycleComplete}
      />
    </div>
  )
}

export function InstagramPhotoPanel({
  frozen = false,
  replayKey = 0,
}: {
  frozen?: boolean
  replayKey?: number
}) {
  const { phase, instagramPosts, sceneRotationStartAt } = useSiteLoad()
  const [started, setStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const isDesktop = useIsDesktop()

  const posts = useMemo(() => instagramPosts.slice(0, PHOTO_MAX), [instagramPosts])

  useEffect(() => {
    const update = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  useEffect(() => {
    setStarted(false)
    setCurrentIndex(0)
  }, [replayKey])

  useEffect(() => {
    if (phase !== "done" || posts.length === 0) return
    if (replayKey === 0 && sceneRotationStartAt === null) return

    const delayMs =
      replayKey > 0
        ? PHOTO_START_DELAY_MS
        : Math.max(0, PHOTO_START_DELAY_MS - (performance.now() - (sceneRotationStartAt ?? 0)))
    const timer = window.setTimeout(() => setStarted(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [phase, posts.length, sceneRotationStartAt, replayKey])

  if (
    phase !== "done" ||
    !started ||
    posts.length === 0 ||
    viewport.height === 0
  ) {
    return null
  }

  if (!isDesktop) {
    return (
      <MobilePhotoStrip
        posts={posts}
        landscape={viewport.width > viewport.height}
        viewportWidth={viewport.width}
        viewportHeight={viewport.height}
        frozen={frozen}
      />
    )
  }

  const photo = posts[currentIndex % posts.length]
  const maxPhotoHeight = viewport.height * (1 - PANEL_VERTICAL_INSET * 2)
  const maxPhotoWidth = viewport.width / 3 - 48

  return (
    <div className="hidden lg:block">
      <PhotoCard
        key={`${photo.id}-${currentIndex}`}
        photo={photo}
        maxHeight={maxPhotoHeight}
        maxWidth={maxPhotoWidth}
        viewportWidth={viewport.width}
        viewportHeight={viewport.height}
        frozen={frozen}
        onCycleComplete={() => {
          setCurrentIndex((prev) => (prev + 1) % posts.length)
        }}
      />
    </div>
  )
}
