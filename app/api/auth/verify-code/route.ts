import { NextRequest, NextResponse } from "next/server"
import { verifyCode } from "@/lib/otp-store"
import { createUser, getUserByEmail, updateLastLogin } from "@/lib/users-db"
import { sessionCookieOptions } from "@/lib/session"

const MESSAGES = {
  invalid: "Неверный код",
  expired: "Код устарел — запросите новый",
  too_many: "Слишком много попыток — запросите новый код",
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, code, mode, name, phone } = body ?? {}

  if (!email || !code) {
    return NextResponse.json({ error: "Параметры не указаны" }, { status: 400 })
  }

  const result = verifyCode(email, String(code))
  if (result !== "ok") {
    return NextResponse.json({ error: MESSAGES[result] }, { status: 400 })
  }

  const existing = await getUserByEmail(email)

  if (mode === "login" && !existing) {
    return NextResponse.json(
      { error: "Аккаунт не найден — сначала зарегистрируйтесь" },
      { status: 404 }
    )
  }

  if (mode === "admin") {
    if (!existing?.is_admin) {
      return NextResponse.json({ error: "Нет прав администратора" }, { status: 403 })
    }
  }

  let user = existing

  if (!existing) {
    try {
      user = await createUser({
        email,
        name: name ?? email.split("@")[0],
        phone: phone ?? "",
        is_admin: false,
      })
    } catch {
      return NextResponse.json({ error: "Ошибка создания аккаунта" }, { status: 500 })
    }
  } else {
    await updateLastLogin(existing.id)
  }

  const res = NextResponse.json({
    ok: true,
    user: {
      id: user!.id,
      email: user!.email,
      name: user!.name,
      phone: user!.phone,
      isAdmin: user!.is_admin,
    },
  })

  res.cookies.set(sessionCookieOptions(user!.id))
  return res
}
