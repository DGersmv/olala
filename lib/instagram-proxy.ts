import nodeFetch, { type RequestInit as NodeFetchInit } from "node-fetch"
import { HttpsProxyAgent } from "https-proxy-agent"
import type { Agent } from "http"

const CDN_IMAGE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  Referer: "https://www.instagram.com/",
}

const IMAGE_RETRY_DELAYS_MS = [400, 1200, 2500]
const IMAGE_TIMEOUT_MS = 12000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableNetworkError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const code = (error as { code?: string }).code
  return (
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "ECONNREFUSED" ||
    code === "EAI_AGAIN" ||
    code === "UND_ERR_CONNECT_TIMEOUT"
  )
}

function buildProxyUrl(): string | null {
  const host = process.env.INSTAGRAM_PROXY_HOST
  const port = process.env.INSTAGRAM_PROXY_PORT
  if (!host || !port) return null

  const user = process.env.INSTAGRAM_PROXY_USER
  const pass = process.env.INSTAGRAM_PROXY_PASS
  if (user && pass) {
    return `http://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}`
  }
  return `http://${host}:${port}`
}

let proxyAgent: Agent | undefined

function getProxyAgent(): Agent | undefined {
  if (proxyAgent !== undefined) return proxyAgent
  const proxyUrl = buildProxyUrl()
  proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined
  return proxyAgent
}

function toHeaderRecord(headers?: RequestInit["headers"]): Record<string, string> {
  const out: Record<string, string> = {}
  if (!headers) return out
  if (headers instanceof Headers) {
    headers.forEach((value, key) => { out[key] = value })
    return out
  }
  if (Array.isArray(headers)) {
    for (const [key, value] of headers) out[key] = value
    return out
  }
  return { ...headers }
}

export async function fetchViaInstagramProxy(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const agent = getProxyAgent()
  const headers = toHeaderRecord(init?.headers)

  const nodeInit: NodeFetchInit = {
    method: init?.method,
    headers,
    body: init?.body as NodeFetchInit["body"],
    signal: init?.signal ?? undefined,
    agent,
  }

  const res = agent
    ? await nodeFetch(url, nodeInit)
    : await fetch(url, init)

  const body = await res.arrayBuffer()
  return new Response(body, {
    status: res.status,
    statusText: res.statusText,
    headers: Object.fromEntries(res.headers.entries()),
  })
}

export async function fetchInstagramCdnImage(url: string): Promise<Response> {
  let lastError: unknown

  for (let attempt = 0; attempt <= IMAGE_RETRY_DELAYS_MS.length; attempt++) {
    try {
      const res = await fetchViaInstagramProxy(url, {
        cache: "no-store",
        headers: CDN_IMAGE_HEADERS,
        signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
      })

      if (res.ok || res.status === 404 || res.status === 403) {
        return res
      }

      if (res.status >= 500 && attempt < IMAGE_RETRY_DELAYS_MS.length) {
        await sleep(IMAGE_RETRY_DELAYS_MS[attempt])
        continue
      }

      return res
    } catch (error) {
      lastError = error
      if (isRetryableNetworkError(error) && attempt < IMAGE_RETRY_DELAYS_MS.length) {
        await sleep(IMAGE_RETRY_DELAYS_MS[attempt])
        continue
      }
      throw error
    }
  }

  throw lastError ?? new Error("Failed to fetch Instagram CDN image")
}
