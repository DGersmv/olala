"use client"

import { useCallback, useEffect, useState, type CSSProperties } from "react"

interface FeedPost {
  id: string
  imageUrl: string
}

const STAGGER_MS = 120
const REVEAL_START_MS = 100
const FEED_RETRY_MS = 4000
const FEED_MAX_ATTEMPTS = 3

export function InstagramFeedWidget({ visible }: { visible: boolean }) {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [gridVisible, setGridVisible] = useState(false)
  const [loadedIds, setLoadedIds] = useState<Set<string>>(() => new Set())
  const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const loadFeed = (attempt: number) => {
      fetch("/api/instagram/feed")
        .then((res) => res.json())
        .then((data: { posts?: FeedPost[] }) => {
          if (cancelled) return
          if (Array.isArray(data.posts) && data.posts.length > 0) {
            setPosts(data.posts)
            return
          }
          if (attempt + 1 < FEED_MAX_ATTEMPTS) {
            retryTimer = setTimeout(() => loadFeed(attempt + 1), FEED_RETRY_MS)
          }
        })
        .catch(() => {
          if (cancelled || attempt + 1 >= FEED_MAX_ATTEMPTS) return
          retryTimer = setTimeout(() => loadFeed(attempt + 1), FEED_RETRY_MS)
        })
    }

    loadFeed(0)
    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [])

  useEffect(() => {
    if (!visible) {
      setGridVisible(false)
      setLoadedIds(new Set())
      return
    }
    if (posts.length === 0) return

    setLoadedIds(new Set())
    let cancelled = false
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setGridVisible(true)
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [visible, posts])

  useEffect(() => {
    if (!visible || !gridVisible || posts.length === 0) return

    const timers = posts.map((post, index) =>
      setTimeout(() => {
        setLoadedIds((prev) => {
          if (prev.has(post.id)) return prev
          const next = new Set(prev)
          next.add(post.id)
          return next
        })
      }, REVEAL_START_MS + index * STAGGER_MS),
    )

    return () => timers.forEach(clearTimeout)
  }, [visible, gridVisible, posts])

  const handleImageLoad = useCallback((id: string) => {
    if (!visible) return
    setLoadedIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [visible])

  const handleImageError = useCallback((id: string) => {
    if (!visible) return
    setFailedIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [visible])

  if (posts.length === 0) return null

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className={`instagram-bg-grid grid w-full gap-0.5${gridVisible ? " instagram-bg-grid--visible" : ""}`}
      >
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="instagram-bg-cell overflow-hidden"
            style={{ "--ig-delay": `${index * STAGGER_MS}ms` } as CSSProperties}
          >
            <img
              ref={(el) => { if (el?.complete && visible) handleImageLoad(post.id) }}
              src={post.imageUrl}
              alt=""
              className={`instagram-bg-img h-full w-full object-cover${
                loadedIds.has(post.id) ? " instagram-bg-img--loaded" : ""
              }${failedIds.has(post.id) ? " instagram-bg-img--failed" : ""}`}
              loading="eager"
              decoding="async"
              fetchPriority={index < 6 ? "high" : "low"}
              onLoad={() => handleImageLoad(post.id)}
              onError={() => handleImageError(post.id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
