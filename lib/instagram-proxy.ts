import nodeFetch, { type RequestInit as NodeFetchInit } from "node-fetch"
import { HttpsProxyAgent } from "https-proxy-agent"
import type { Agent } from "http"

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
