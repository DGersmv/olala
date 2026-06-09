import { NextRequest, NextResponse } from "next/server"
import { fetchViaInstagramProxy } from "@/lib/instagram-proxy"
import { isAllowedInstagramImageUrl } from "@/lib/instagram"

export const revalidate = 86400

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url")
  if (!rawUrl || !isAllowedInstagramImageUrl(rawUrl)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  try {
    const upstream = await fetchViaInstagramProxy(rawUrl, { cache: "no-store" })
    if (!upstream.ok) {
      return new NextResponse("Upstream error", { status: upstream.status })
    }

    const bytes = await upstream.arrayBuffer()
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
      },
    })
  } catch (e) {
    console.error("[instagram/image]", e)
    return new NextResponse("Proxy error", { status: 502 })
  }
}
