import { cookies } from "next/headers"
import { supabaseAdmin } from "./supabase"
import type { Database } from "./database.types"

export type SessionUser = Database["public"]["Tables"]["users"]["Row"]

const COOKIE = "olala_uid"
const MAX_AGE = 60 * 60 * 24 * 30 // 30 дней

/** Читает сессию из cookie, возвращает пользователя или null */
export async function getSession(): Promise<SessionUser | null> {
  const uid = (await cookies()).get(COOKIE)?.value
  if (!uid) return null

  const { data } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", uid)
    .single()

  return data ?? null
}

/** Устанавливает cookie сессии (вызывать из Route Handler) */
export function sessionCookieOptions(userId: string) {
  return {
    name: COOKIE,
    value: userId,
    httpOnly: true,
    path: "/",
    maxAge: MAX_AGE,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  }
}

/** Очищает cookie сессии */
export function clearSessionCookie() {
  return { name: COOKIE, value: "", maxAge: 0, path: "/" }
}
