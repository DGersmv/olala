import { cookies } from "next/headers"
import { getUserById } from "./users-db"
import type { User } from "./database.types"

export type SessionUser = User

const COOKIE = "olala_uid"
const MAX_AGE = 60 * 60 * 24 * 30 // 30 дней

/** Читает сессию из cookie, возвращает пользователя или null */
export async function getSession(): Promise<SessionUser | null> {
  const uid = (await cookies()).get(COOKIE)?.value
  if (!uid) return null
  return getUserById(uid)
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
