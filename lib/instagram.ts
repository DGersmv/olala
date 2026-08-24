import { fetchViaInstagramProxy } from "./instagram-proxy"

const IG_APP_ID = "936619743392459"
const IG_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
// embed-страница отдаёт посты только с коротким UA (полный Chrome → пустой shell)
const IG_EMBED_USER_AGENT = "Mozilla/5.0"

export const INSTAGRAM_FEED_SIZE = 8
const CAPTION_MAX_LENGTH = 140

export interface InstagramPost {
  id: string
  imageUrl: string
  caption?: string
}

type FeedCandidate = InstagramPost & { fillOnly?: boolean; shortcode?: string }

/** Stable id from CDN path so a post stays the same across cache refreshes. */
export function instagramPostKey(imageUrl: string): string {
  try {
    const raw = imageUrl.includes("/api/instagram/image")
      ? new URL(imageUrl, "http://local").searchParams.get("url") ?? imageUrl
      : imageUrl
    const pathname = new URL(raw).pathname
    const file = pathname.split("/").filter(Boolean).pop() ?? pathname
    return file.replace(/\.[a-z0-9]+$/i, "") || raw
  } catch {
    return imageUrl
  }
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

function isHashtagOnlyLine(line: string): boolean {
  const tokens = line.split(/\s+/).filter(Boolean)
  return tokens.length > 0 && tokens.every((token) => token.startsWith("#") || token.startsWith("@"))
}

function stripInstagramSymbols(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\p{Emoji_Modifier}/gu, "")
    .replace(/[\uFE0E\uFE0F\u200D\u20E3]/g, "")
    .replace(/[\u2190-\u21FF\u2300-\u23FF\u2460-\u24FF\u25A0-\u27BF\u2900-\u297F\u2B00-\u2BFF]/g, "")
    .replace(/[♥♡❥❣]/g, "")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/\s+([.,!?;:…])/g, "$1")
    .replace(/([.,!?;:…]){2,}/g, "$1")
    .trim()
}

/** Trim, drop trailing hashtag-only lines, cap length. Empty after cleanup → undefined. */
export function sanitizeInstagramCaption(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined
  let text = decodeCapturedJsonString(raw.replace(/\u00a0/g, " ").replace(/\r\n/g, "\n")).trim()
  if (!text) return undefined

  const lines = text.split("\n")
  while (lines.length > 0) {
    const last = lines[lines.length - 1]?.trim() ?? ""
    if (last === "" || isHashtagOnlyLine(last)) {
      lines.pop()
      continue
    }
    break
  }
  text = lines.join("\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim()
  text = text.replace(/(?:\s+#\S+)+\s*$/u, "").trim()
  text = stripInstagramSymbols(text)
  if (!text) return undefined

  if (text.length > CAPTION_MAX_LENGTH) {
    const cut = text.slice(0, CAPTION_MAX_LENGTH)
    const at = cut.lastIndexOf(" ")
    text = `${(at > CAPTION_MAX_LENGTH * 0.55 ? cut.slice(0, at) : cut).trim()}…`
  }

  return text || undefined
}

function decodeCapturedJsonString(raw: string): string {
  let text = raw
  for (let i = 0; i < 4; i++) {
    const next = text.replace(/\\u([0-9a-fA-F]{4})/gi, (_, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    )
    if (next === text) break
    text = next
  }
  text = text
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\//g, "/")
    .replace(/\\\\/g, "\\")
  return text.replace(/\\(?=[^\nrt"\\/])/g, "")
}

function unescapeJsonString(value: string): string {
  return decodeCapturedJsonString(value)
}

function captionFromEdgeList(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || !("edges" in value)) return undefined
  const edges = (value as { edges?: unknown }).edges
  const first = Array.isArray(edges) ? edges[0] : undefined
  if (!first || typeof first !== "object" || !("node" in first)) return undefined
  const text = (first as { node?: { text?: unknown } }).node?.text
  return typeof text === "string" ? sanitizeInstagramCaption(text) : undefined
}

function instagramMediaCacheKey(imageUrl: string): string | undefined {
  try {
    const raw = imageUrl.includes("/api/instagram/image")
      ? new URL(imageUrl, "http://local").searchParams.get("url") ?? imageUrl
      : imageUrl
    const value = new URL(raw).searchParams.get("ig_cache_key")
    if (!value) return undefined
    return decodeURIComponent(value).split(".")[0] || undefined
  } catch {
    return undefined
  }
}

function postLookupKeys(imageUrl: string): string[] {
  const keys = [instagramPostKey(imageUrl)]
  const cacheKey = instagramMediaCacheKey(imageUrl)
  if (cacheKey) keys.push(`ig:${cacheKey}`)
  return keys
}

function captionFromNode(node: Record<string, unknown>): string | undefined {
  const fromEdges = captionFromEdgeList(node.edge_media_to_caption)
  if (fromEdges) return fromEdges

  if (typeof node.caption === "string") {
    return sanitizeInstagramCaption(node.caption)
  }

  if (node.caption && typeof node.caption === "object") {
    const caption = node.caption as { text?: unknown; edges?: unknown }
    if (typeof caption.text === "string") return sanitizeInstagramCaption(caption.text)
    const nested = captionFromEdgeList(caption)
    if (nested) return nested
  }

  return undefined
}

function timelineEdgesFromProfileJson(json: unknown): unknown[] {
  const root = json as Record<string, unknown>
  const data = (root.data && typeof root.data === "object" ? root.data : root) as Record<string, unknown>
  const user = (
    data.user && typeof data.user === "object"
      ? data.user
      : (data as { graphql?: { user?: unknown } }).graphql?.user
  ) as Record<string, unknown> | undefined
  if (!user) return []

  const named = user.edge_owner_to_timeline_media
  if (named && typeof named === "object" && "edges" in named) {
    const edges = (named as { edges?: unknown }).edges
    if (Array.isArray(edges) && edges.length > 0) return edges
  }

  for (const value of Object.values(user)) {
    if (!value || typeof value !== "object" || !("edges" in value)) continue
    const edges = (value as { edges?: unknown }).edges
    if (!Array.isArray(edges) || edges.length === 0) continue
    const first = edges[0]
    const node =
      first && typeof first === "object" && "node" in first
        ? (first as { node?: Record<string, unknown> }).node
        : undefined
    if (node && (typeof node.display_url === "string" || typeof node.thumbnail_src === "string")) {
      return edges
    }
  }

  return []
}

function overlayCaptionsByOrder(
  posts: InstagramPost[],
  captionSource: FeedCandidate[],
): InstagramPost[] {
  const captions = captionSource
    .filter((post) => !post.fillOnly && post.caption)
    .map((post) => post.caption!)
  if (captions.length === 0) return posts

  return posts.map((post, index) => {
    if (post.caption) return post
    const caption = captions[index]
    return caption ? { ...post, caption } : post
  })
}

function toStoredPost(imageUrl: string, caption?: string, id?: string): InstagramPost {
  const key = id ?? instagramPostKey(imageUrl)
  return caption ? { id: key, imageUrl, caption } : { id: key, imageUrl }
}

function addMediaUrl(urls: string[], seen: Set<string>, value: unknown) {
  if (typeof value !== "string") return
  const imageUrl = decodeJsonUrl(value)
  const key = instagramPostKey(imageUrl)
  if (!key || seen.has(key)) return
  seen.add(key)
  urls.push(imageUrl)
}

function mediaUrlsFromNode(node: Record<string, unknown>): string[] {
  const urls: string[] = []
  const seen = new Set<string>()
  addMediaUrl(urls, seen, node.display_url)
  addMediaUrl(urls, seen, node.thumbnail_src)
  if (Array.isArray(node.thumbnail_resources)) {
    for (const item of node.thumbnail_resources) {
      if (item && typeof item === "object" && "src" in item) {
        addMediaUrl(urls, seen, (item as { src?: unknown }).src)
      }
    }
  }
  return urls
}

function parsePostsFromEdges(edges: unknown[]): FeedCandidate[] {
  const posts: FeedCandidate[] = []

  for (const edge of edges) {
    if (!edge || typeof edge !== "object" || !("node" in edge)) continue
    const node = (edge as { node: Record<string, unknown> }).node
    const urls = mediaUrlsFromNode(node)
    if (urls.length === 0) continue
    const caption = captionFromNode(node)
    const id = typeof node.id === "string" ? node.id : instagramPostKey(urls[0])
    urls.forEach((imageUrl, index) => {
      posts.push({ ...toStoredPost(imageUrl, caption, id), fillOnly: index > 0 })
    })
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

function captionNear(html: string, index: number): string | undefined {
  const window = html.slice(Math.max(0, index - 2500), Math.min(html.length, index + 3000))
  const match =
    window.match(
      /"edge_media_to_caption"\s*:\s*\{\s*"edges"\s*:\s*\[\s*(?:\{\s*"node"\s*:\s*\{\s*"text"\s*:\s*"((?:\\.|[^"\\])*)")/,
    ) || window.match(/"caption"\s*:\s*\{\s*"text"\s*:\s*"((?:\\.|[^"\\])*)"/)
  if (!match?.[1]) return undefined
  return sanitizeInstagramCaption(unescapeJsonString(match[1]))
}

function shortcodeNear(html: string, index: number): string | undefined {
  const window = html.slice(Math.max(0, index - 2000), Math.min(html.length, index + 2000))
  return (
    window.match(/"shortcode"\s*:\s*"([A-Za-z0-9_-]+)"/)?.[1] ||
    window.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/)?.[1]
  )
}

function captionFromOgDescription(html: string): string | undefined {
  const match =
    html.match(/property="og:description"\s+content="([^"]*)"/i) ||
    html.match(/content="([^"]*)"\s+property="og:description"/i)
  if (!match?.[1]) return undefined
  const decoded = match[1]
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
  const stripped = decoded.replace(/^[^:]+:\s*"?/, "").replace(/"$/, "").trim()
  return sanitizeInstagramCaption(stripped)
}

function addPost(
  posts: FeedCandidate[],
  seen: Set<string>,
  rawUrl: string,
  caption?: string,
  shortcode?: string,
) {
  const imageUrl = decodeJsonUrl(rawUrl)
  if (!isInstagramMediaUrl(imageUrl) || imageUrl.includes("static.cdninstagram.com")) return
  const key = instagramPostKey(imageUrl)
  const existing = posts.find((post) => instagramPostKey(post.imageUrl) === key)
  if (existing) {
    if (caption && !existing.caption) existing.caption = caption
    if (shortcode && !existing.shortcode) existing.shortcode = shortcode
    return
  }
  if (seen.has(imageUrl)) return
  seen.add(imageUrl)
  posts.push({
    ...toStoredPost(imageUrl, caption),
    ...(shortcode ? { shortcode } : {}),
  })
}

function parsePostsFromHtml(html: string): FeedCandidate[] {
  const posts: FeedCandidate[] = []
  const seen = new Set<string>()
  const normalized = html
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/\\"/g, '"')
  const patterns = [
    /"display_url":"((?:\\.|[^"\\])*)"/g,
    /"thumbnail_src":"((?:\\.|[^"\\])*)"/g,
  ]

  for (const pattern of patterns) {
    for (const match of normalized.matchAll(pattern)) {
      const index = match.index ?? 0
      addPost(
        posts,
        seen,
        match[1],
        captionNear(normalized, index),
        shortcodeNear(normalized, index),
      )
      if (posts.length >= 24) break
    }
    if (posts.length >= 24) break
  }

  if (posts.length > 0) return posts

  for (const chunk of normalized.split("display_url").slice(1)) {
    const stripped = chunk.replace(/\\+/g, "").replace(/"/g, "")
    const match = stripped.match(/https:\/\/[^\s,]+/)
    if (match) addPost(posts, seen, match[0])
    if (posts.length >= 24) break
  }

  return posts
}

async function captionFromShortcode(shortcode: string): Promise<string | undefined> {
  try {
    const res = await fetchViaInstagramProxy(
      `https://www.instagram.com/p/${encodeURIComponent(shortcode)}/embed/captioned/`,
      {
        headers: { "User-Agent": IG_EMBED_USER_AGENT },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    )
    if (!res.ok) return undefined
    const html = await res.text()
    const normalized = html
      .replace(/\\u0026/g, "&")
      .replace(/\\\//g, "/")
      .replace(/\\"/g, '"')
    return captionNear(normalized, 0) || captionFromOgDescription(html) || captionFromOgDescription(normalized)
  } catch {
    return undefined
  }
}

async function fillCaptionsFromShortcodes(posts: FeedCandidate[]): Promise<FeedCandidate[]> {
  const missing = posts.filter((post) => !post.caption && post.shortcode).slice(0, INSTAGRAM_FEED_SIZE)
  if (missing.length === 0) return posts

  const captions = new Map<string, string>()
  const concurrency = 2
  let cursor = 0

  async function worker() {
    while (cursor < missing.length) {
      const post = missing[cursor++]
      if (!post?.shortcode) continue
      const caption = await captionFromShortcode(post.shortcode)
      if (caption) captions.set(post.shortcode, caption)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, missing.length) }, () => worker()))
  console.info(`[instagram] captioned embeds: ${captions.size}/${missing.length} captions`)
  if (captions.size === 0) return posts

  return posts.map((post) => {
    if (post.caption || !post.shortcode) return post
    const caption = captions.get(post.shortcode)
    return caption ? { ...post, caption } : post
  })
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
    if (url.includes("web_profile_info")) {
      lastRes = res
      break
    }
    lastRes = res
    const delay = RETRY_DELAYS_MS[attempt]
    if (delay) await sleep(delay)
  }

  return lastRes!
}

async function fetchViaWebProfileApi(username: string): Promise<FeedCandidate[]> {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`
  const res = await fetchWithRetry(url, { headers: IG_HEADERS })
  if (!res.ok) throw new Error(`web_profile_info ${res.status}`)

  const json = await res.json()
  const edges = timelineEdgesFromProfileJson(json)
  if (edges.length === 0) {
    console.warn("[instagram] web_profile_info: no timeline edges")
  }
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

function mergePosts(groups: FeedCandidate[][], limit: number): InstagramPost[] {
  const captions = new Map<string, string>()
  for (const group of groups) {
    for (const post of group) {
      if (!post.caption) continue
      for (const lookup of postLookupKeys(post.imageUrl)) {
        if (!captions.has(lookup)) captions.set(lookup, post.caption)
      }
    }
  }

  const byKey = new Map<string, InstagramPost>()
  const order: string[] = []

  for (const group of groups) {
    for (const post of group) {
      const key = instagramPostKey(post.imageUrl)
      const existing = byKey.get(key)
      const caption =
        existing?.caption ||
        post.caption ||
        postLookupKeys(post.imageUrl)
          .map((lookup) => captions.get(lookup))
          .find(Boolean)
      if (existing) {
        if (caption && !existing.caption) byKey.set(key, { ...existing, caption })
        continue
      }
      if (post.fillOnly || order.length >= limit) continue
      order.push(key)
      byKey.set(key, toStoredPost(post.imageUrl, caption, key))
    }
  }

  return order.map((key) => byKey.get(key)!)
}

async function settledPosts(
  task: Promise<FeedCandidate[]>,
  label: string,
): Promise<FeedCandidate[]> {
  try {
    const posts = await task
    console.info(
      `[instagram] ${label}: ${posts.length} posts, ${posts.filter((post) => post.caption).length} with caption`,
    )
    return posts
  } catch (error) {
    console.warn(`[instagram] ${label} failed`, error)
    return []
  }
}

export async function fetchInstagramPosts(
  username: string,
  limit = INSTAGRAM_FEED_SIZE,
): Promise<InstagramPost[]> {
  const embedPosts = await settledPosts(fetchViaEmbedPage(username), "embed")
  console.info(
    `[instagram] embed shortcodes: ${embedPosts.filter((post) => post.shortcode).length}/${embedPosts.length}`,
  )
  const embedWithCaptions = await fillCaptionsFromShortcodes(embedPosts)
  const captionCount = embedWithCaptions.filter((post) => post.caption).length

  let apiPosts: FeedCandidate[] = []
  if (captionCount === 0) {
    apiPosts = await settledPosts(fetchViaWebProfileApi(username), "web_profile_info")
  }

  if (embedWithCaptions.length > 0) {
    return overlayCaptionsByOrder(mergePosts([embedWithCaptions, apiPosts], limit), apiPosts)
  }

  const groups: FeedCandidate[][] = []
  if (apiPosts.length === 0) {
    apiPosts = await settledPosts(fetchViaWebProfileApi(username), "web_profile_info")
  }
  if (apiPosts.length > 0) groups.push(apiPosts)

  const htmlPosts = await settledPosts(fetchViaProfileHtml(username), "profile_html")
  if (htmlPosts.length > 0) groups.push(htmlPosts)

  return overlayCaptionsByOrder(mergePosts(groups, limit), apiPosts)
}

export function isAllowedInstagramImageUrl(url: string): boolean {
  return isInstagramMediaUrl(url)
}

export function toProxiedImageUrl(originalUrl: string): string {
  return `/api/instagram/image?url=${encodeURIComponent(originalUrl)}`
}
