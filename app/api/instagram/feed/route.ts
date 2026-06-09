import { NextResponse } from "next/server"
import { fetchInstagramPosts, toProxiedImageUrl } from "@/lib/instagram"

export const dynamic = "force-dynamic"
export const revalidate = 43200

export async function GET() {
  const username = process.env.INSTAGRAM_USERNAME?.trim()
  if (!username) {
    return NextResponse.json({ posts: [], error: "INSTAGRAM_USERNAME not configured" })
  }

  try {
    const posts = await fetchInstagramPosts(username, 20)
    return NextResponse.json(
      {
        posts: posts.map((post) => ({
          id: post.id,
          imageUrl: toProxiedImageUrl(post.imageUrl),
        })),
      },
      { headers: { "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400" } },
    )
  } catch (e) {
    console.error("[instagram/feed]", e)
    return NextResponse.json({ posts: [], error: "Failed to fetch Instagram feed" })
  }
}
