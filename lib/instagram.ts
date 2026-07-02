import { fetchViaInstagramProxy } from "./instagram-proxy"

const IG_APP_ID = "936619743392459"
const IG_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
// embed-страница отдаёт посты только с коротким UA (полный Chrome → пустой shell)
const IG_EMBED_USER_AGENT = "Mozilla/5.0"

export interface InstagramPost {
  id: string
  imageUrl: string
}

const IG_HEADERS = {
  "User-Agent": IG_USER_AGENT,
  Accept: "*/*",
  "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
  "x-ig-app-id": IG_APP_ID,
  "x-requested-with": "XMLHttpRequest",
  Referer: "https://www.instagram.com/",
  Origin: "https://www.instagram.com",
}

const RETRY_DELAYS_MS = [2000, 5000, 10000]
const REQUEST_TIMEOUT_MS = 15000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function decodeJsonUrl(value: string): string {
  let out = value
  while (out.includes("\\/")) out = out.replace(/\\\//g, "/")
  return out.replace(/\\u0026/g, "&")
}

function parsePostsFromEdges(edges: unknown[]): InstagramPost[] {
  const posts: InstagramPost[] = []

  for (const edge of edges) {
    if (!edge || typeof edge !== "object" || !("node" in edge)) continue
    const node = (edge as { node: Record<string, unknown> }).node
    const id = typeof node.id === "string" ? node.id : null
    const rawUrl =
      (typeof node.display_url === "string" && node.display_url) ||
      (typeof node.thumbnail_src === "string" && node.thumbnail_src) ||
      null
    if (!id || !rawUrl) continue
    posts.push({ id, imageUrl: decodeJsonUrl(rawUrl) })
  }

  return posts
}

function isInstagramMediaUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url)
    if (protocol !== "https:") return false
    return (
      hostname.endsWith(".cdninstagram.com") ||
      hostname === "cdninstagram.com" ||
      hostname.endsWith(".fbcdn.net") ||
      hostname.startsWith("instagram.")
    )
  } catch {
    return false
  }
}

function addPost(posts: InstagramPost[], seen: Set<string>, rawUrl: string) {
  const imageUrl = decodeJsonUrl(rawUrl)
  if (!isInstagramMediaUrl(imageUrl) || seen.has(imageUrl)) return
  if (imageUrl.includes("static.cdninstagram.com")) return
  seen.add(imageUrl)
  posts.push({ id: String(posts.length + 1), imageUrl })
}

function parsePostsFromHtml(html: string): InstagramPost[] {
  const posts: InstagramPost[] = []
  const seen = new Set<string>()

  for (const chunk of html.split("display_url").slice(1)) {
    const normalized = chunk.replace(/\\+/g, "").replace(/"/g, "")
    const match = normalized.match(/https:\/\/[^\s,]+/)
    if (match) addPost(posts, seen, match[0])
    if (posts.length >= 24) break
  }

  const patterns = [
    /"display_url":"((?:\\.|[^"\\])*)"/g,
    /"thumbnail_src":"((?:\\.|[^"\\])*)"/g,
  ]

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      addPost(posts, seen, match[1])
      if (posts.length >= 24) break
    }
    if (posts.length >= 24) break
  }

  return posts
}

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let lastRes: Response | null = null

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const res = await fetchViaInstagramProxy(url, {
      ...init,
      cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (res.status !== 429) return res
    lastRes = res
    const delay = RETRY_DELAYS_MS[attempt]
    if (delay) await sleep(delay)
  }

  return lastRes!
}

async function fetchViaWebProfileApi(username: string): Promise<InstagramPost[]> {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`
  const res = await fetchWithRetry(url, { headers: IG_HEADERS })
  if (!res.ok) throw new Error(`web_profile_info ${res.status}`)

  const json = (await res.json()) as {
    data?: { user?: { edge_owner_to_timeline_media?: { edges?: unknown[] } } }
  }
  const edges = json.data?.user?.edge_owner_to_timeline_media?.edges ?? []
  return parsePostsFromEdges(edges)
}

async function fetchViaProfileHtml(username: string): Promise<InstagramPost[]> {
  const res = await fetchWithRetry(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
    headers: {
      "User-Agent": IG_USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": IG_HEADERS["Accept-Language"],
      Referer: "https://www.instagram.com/",
    },
  })
  if (!res.ok) throw new Error(`profile_html ${res.status}`)
  return parsePostsFromHtml(await res.text())
}

async function fetchViaEmbedPage(username: string): Promise<InstagramPost[]> {
  const res = await fetchViaInstagramProxy(
    `https://www.instagram.com/${encodeURIComponent(username)}/embed/`,
    {
      headers: { "User-Agent": IG_EMBED_USER_AGENT },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  )
  if (!res.ok) throw new Error(`embed_page ${res.status}`)
  return parsePostsFromHtml(await res.text())
}

export async function fetchInstagramPosts(username: string, limit = 20): Promise<InstagramPost[]> {
  try {
    const posts = await fetchViaEmbedPage(username)
    if (posts.length > 0) return posts.slice(0, limit)
  } catch {
    /* fall through */
  }

  for (const source of [fetchViaProfileHtml, fetchViaWebProfileApi]) {
    try {
      const posts = await source(username)
      if (posts.length > 0) return posts.slice(0, limit)
    } catch {
      /* try next source */
    }
  }

  return []
}

export function isAllowedInstagramImageUrl(url: string): boolean {
  return isInstagramMediaUrl(url)
}

export function toProxiedImageUrl(originalUrl: string): string {
  return `/api/instagram/image?url=${encodeURIComponent(originalUrl)}`
}
