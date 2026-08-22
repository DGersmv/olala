import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import {
  INSTAGRAM_FEED_SIZE,
  instagramPostKey,
  type InstagramPost,
} from "@/lib/instagram"

const CACHE_DIR = path.join(process.cwd(), "data")
const CACHE_FILE = path.join(CACHE_DIR, "instagram-feed.json")

type CacheFile = {
  updatedAt: string
  posts: InstagramPost[]
}

export function mergeInstagramFeed(
  fresh: InstagramPost[],
  previous: InstagramPost[],
  limit = INSTAGRAM_FEED_SIZE,
): InstagramPost[] {
  const merged: InstagramPost[] = []
  const seen = new Set<string>()

  for (const post of [...fresh, ...previous]) {
    const key = instagramPostKey(post.imageUrl)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push({ id: key, imageUrl: post.imageUrl })
    if (merged.length >= limit) break
  }

  return merged
}

export async function readInstagramFeed(): Promise<InstagramPost[]> {
  try {
    const raw = await readFile(CACHE_FILE, "utf8")
    const parsed = JSON.parse(raw) as CacheFile
    if (!Array.isArray(parsed.posts)) return []
    return parsed.posts.filter(
      (post): post is InstagramPost =>
        Boolean(post) &&
        typeof post.imageUrl === "string" &&
        post.imageUrl.startsWith("https://"),
    )
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
