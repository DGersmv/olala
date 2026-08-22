"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { SiteLoadTracker, type SiteLoadSnapshot } from "@/lib/site-load-tracker"

export type SiteLoadPhase = "loading" | "dissolving" | "done"

export type InstagramFeedPost = {
  id: string
  imageUrl: string
}

type SiteLoadContextValue = {
  phase: SiteLoadPhase
  snapshot: SiteLoadSnapshot
  instagramPosts: InstagramFeedPost[]
  sceneRotationStartAt: number | null
  setProgress: (id: string, progress: number) => void
  complete: (id: string) => void
  beginDissolve: () => void
  finishDissolve: () => void
  markSceneRotationStart: () => void
}

const SiteLoadContext = createContext<SiteLoadContextValue | null>(null)

const PHOTO_PREFETCH = 20
const LOAD_TIMEOUT_MS = 45000

function loadImage(src: string) {
  return new Promise<void>((resolve, reject) => {
    const image = new Image()
    image.decoding = "async"
    image.onload = () => resolve()
    image.onerror = () => reject(new Error(`Failed to load ${src}`))
    image.src = src
  })
}

export function SiteLoadProvider({ children }: { children: ReactNode }) {
  const trackerRef = useRef<SiteLoadTracker | null>(null)
  if (!trackerRef.current) trackerRef.current = new SiteLoadTracker()

  const [snapshot, setSnapshot] = useState<SiteLoadSnapshot>(() =>
    trackerRef.current!.getSnapshot(),
  )
  const [phase, setPhase] = useState<SiteLoadPhase>("loading")
  const [instagramPosts, setInstagramPosts] = useState<InstagramFeedPost[]>([])
  const [sceneRotationStartAt, setSceneRotationStartAt] = useState<number | null>(
    null,
  )
  const dissolveStartedRef = useRef(false)
  const rotationStartedRef = useRef(false)

  const setProgress = useCallback((id: string, progress: number) => {
    trackerRef.current?.setProgress(id, progress)
  }, [])

  const complete = useCallback((id: string) => {
    trackerRef.current?.complete(id)
  }, [])

  const beginDissolve = useCallback(() => {
    if (dissolveStartedRef.current) return
    dissolveStartedRef.current = true
    setPhase("dissolving")
  }, [])

  const finishDissolve = useCallback(() => {
    setPhase("done")
    if (!rotationStartedRef.current) {
      rotationStartedRef.current = true
      setSceneRotationStartAt(performance.now())
    }
  }, [])

  const markSceneRotationStart = useCallback(() => {
    if (rotationStartedRef.current) return
    rotationStartedRef.current = true
    setSceneRotationStartAt(performance.now())
  }, [])

  useEffect(() => {
    const tracker = trackerRef.current!
    tracker.register("fonts", "Шрифты", 0.08)
    tracker.register("runtime", "3D-движок", 0.1)
    tracker.register("luma", "Сцена Olala", 0.42)
    tracker.register("instagram", "Instagram", 0.25)
    tracker.register("assets", "Ресурсы сайта", 0.15)

    return tracker.subscribe(setSnapshot)
  }, [])

  useEffect(() => {
    const tracker = trackerRef.current!
    let cancelled = false

    document.fonts.ready
      .then(() => {
        if (!cancelled) tracker.complete("fonts")
      })
      .catch(() => {
        if (!cancelled) tracker.complete("fonts")
      })

    const icon = new Image()
    icon.onload = () => {
      if (!cancelled) tracker.complete("assets")
    }
    icon.onerror = () => {
      if (!cancelled) tracker.complete("assets")
    }
    icon.src = "/icon.svg"

    async function prefetchInstagram() {
      tracker.setProgress("instagram", 0.05)
      try {
        const res = await fetch("/api/instagram/feed")
        const data = (await res.json()) as { posts?: InstagramFeedPost[] }
        const posts = Array.isArray(data.posts) ? data.posts.slice(0, PHOTO_PREFETCH) : []
        if (!cancelled) setInstagramPosts(posts)
        tracker.setProgress("instagram", 0.2)
        if (posts.length === 0) {
          tracker.complete("instagram")
          return
        }
        let loaded = 0
        const concurrency = 2
        for (let i = 0; i < posts.length; i += concurrency) {
          const batch = posts.slice(i, i + concurrency)
          await Promise.all(
            batch.map(async (post) => {
              try {
                await loadImage(post.imageUrl)
              } catch {
                /* skip broken image */
              } finally {
                loaded += 1
                tracker.setProgress(
                  "instagram",
                  0.2 + (loaded / posts.length) * 0.8,
                )
              }
            }),
          )
        }
        tracker.complete("instagram")
      } catch {
        tracker.complete("instagram")
      }
    }

    void prefetchInstagram()

    const timeout = window.setTimeout(() => {
      for (const task of tracker.getSnapshot().tasks) {
        if (task.progress < 1) tracker.complete(task.id)
      }
    }, LOAD_TIMEOUT_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [])

  const value = useMemo(
    () => ({
      phase,
      snapshot,
      instagramPosts,
      sceneRotationStartAt,
      setProgress,
      complete,
      beginDissolve,
      finishDissolve,
      markSceneRotationStart,
    }),
    [
      phase,
      snapshot,
      instagramPosts,
      sceneRotationStartAt,
      setProgress,
      complete,
      beginDissolve,
      finishDissolve,
      markSceneRotationStart,
    ],
  )

  return (
    <SiteLoadContext.Provider value={value}>{children}</SiteLoadContext.Provider>
  )
}

export function useSiteLoad() {
  const ctx = useContext(SiteLoadContext)
  if (!ctx) throw new Error("useSiteLoad must be used within SiteLoadProvider")
  return ctx
}

export function useSiteLoadTask(id: string) {
  const { setProgress, complete } = useSiteLoad()
  return useMemo(
    () => ({
      setProgress: (progress: number) => setProgress(id, progress),
      complete: () => complete(id),
    }),
    [id, setProgress, complete],
  )
}