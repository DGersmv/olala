"use client"

import { useCallback, useEffect, useState, type CSSProperties } from "react"

interface FeedPost {
  id: string
  imageUrl: string
}

const STAGGER_MS = 120
const REVEAL_START_MS = 100

export function InstagramFeedWidget({ visible }: { visible: boolean }) {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [gridVisible, setGridVisible] = useState(false)
  const [loadedIds, setLoadedIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    let cancelled = false
    fetch("/api/instagram/feed")
      .then((res) => res.json())
      .then((data: { posts?: FeedPost[] }) => {
        if (cancelled || !Array.isArray(data.posts) || data.posts.length === 0) return
        setPosts(data.posts)
      })
      .catch(() => {})
    return () => { cancelled = true }
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
              className={`instagram-bg-img h-full w-full object-cover${loadedIds.has(post.id) ? " instagram-bg-img--loaded" : ""}`}
              loading="lazy"
              decoding="async"
              onLoad={() => handleImageLoad(post.id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
