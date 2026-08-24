import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import {
  INSTAGRAM_FEED_SIZE,
  instagramPostKey,
  sanitizeInstagramCaption,
  type InstagramPost,
} from "@/lib/instagram"

const CACHE_DIR = path.join(process.cwd(), "data")
const CACHE_FILE = path.join(CACHE_DIR, "instagram-feed.json")

type CacheFile = {
  updatedAt: string
  posts: InstagramPost[]
}

function storedPost(post: InstagramPost, key: string, caption?: string): InstagramPost {
  const text = caption || post.caption
  return text ? { id: key, imageUrl: post.imageUrl, caption: text } : { id: key, imageUrl: post.imageUrl }
}

export function mergeInstagramFeed(
  fresh: InstagramPost[],
  previous: InstagramPost[],
  limit = INSTAGRAM_FEED_SIZE,
): InstagramPost[] {
  const byKey = new Map<string, InstagramPost>()
  const order: string[] = []

  for (const post of [...fresh, ...previous]) {
    const key = instagramPostKey(post.imageUrl)
    const existing = byKey.get(key)
    if (existing) {
      if (!existing.caption && post.caption) {
        byKey.set(key, storedPost(existing, key, post.caption))
      }
      continue
    }
    if (order.length >= limit) continue
    order.push(key)
    byKey.set(key, storedPost(post, key))
  }

  return order.map((key) => byKey.get(key)!)
}

export async function readInstagramFeed(): Promise<InstagramPost[]> {
  try {
    const raw = await readFile(CACHE_FILE, "utf8")
    const parsed = JSON.parse(raw) as CacheFile
    if (!Array.isArray(parsed.posts)) return []
    return parsed.posts.flatMap((post) => {
      if (!post || typeof post.imageUrl !== "string" || !post.imageUrl.startsWith("https://")) {
        return []
      }
      const caption =
        typeof post.caption === "string" ? sanitizeInstagramCaption(post.caption) : undefined
      return caption
        ? [{ id: post.id, imageUrl: post.imageUrl, caption }]
        : [{ id: post.id, imageUrl: post.imageUrl }]
    })
  } catch {
    return []
  }
}

async function writeInstagramFeed(posts: InstagramPost[]) {
  await mkdir(CACHE_DIR, { recursive: true })
  const payload: CacheFile = {
    updatedAt: new Date().toISOString(),
    posts,
  }
  const tmp = `${CACHE_FILE}.${process.pid}.tmp`
  await writeFile(tmp, JSON.stringify(payload, null, 2), "utf8")
  await rename(tmp, CACHE_FILE)
}

export async function rememberInstagramFeed(
  fresh: InstagramPost[],
  limit = INSTAGRAM_FEED_SIZE,
): Promise<InstagramPost[]> {
  const previous = await readInstagramFeed()
  if (fresh.length === 0) return previous.slice(0, limit)

  const merged = mergeInstagramFeed(fresh, previous, limit)
  await writeInstagramFeed(merged)
  return merged
}
