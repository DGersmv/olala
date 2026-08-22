import { NextResponse } from "next/server"
import {
  INSTAGRAM_FEED_SIZE,
  fetchInstagramPosts,
  toProxiedImageUrl,
} from "@/lib/instagram"
import { readInstagramFeed, rememberInstagramFeed } from "@/lib/instagram-feed-cache"

export const dynamic = "force-dynamic"
export const revalidate = 43200

function toResponse(posts: Awaited<ReturnType<typeof rememberInstagramFeed>>) {
  return NextResponse.json(
    {
      posts: posts.slice(0, INSTAGRAM_FEED_SIZE).map((post) => ({
        id: post.id,
        imageUrl: toProxiedImageUrl(post.imageUrl),
      })),
    },
    { headers: { "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400" } },
  )
}

export async function GET() {
  const username = process.env.INSTAGRAM_USERNAME?.trim()
  if (!username) {
    return NextResponse.json({ posts: [], error: "INSTAGRAM_USERNAME not configured" })
  }

  try {
    const fresh = await fetchInstagramPosts(username, INSTAGRAM_FEED_SIZE)
    const posts = await rememberInstagramFeed(fresh, INSTAGRAM_FEED_SIZE)
    return toResponse(posts)
  } catch (e) {
    console.error("[instagram/feed]", e)
    const cached = await readInstagramFeed()
    if (cached.length > 0) return toResponse(cached)
    return NextResponse.json({ posts: [], error: "Failed to fetch Instagram feed" })
  }
}
