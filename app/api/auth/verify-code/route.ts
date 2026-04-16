import { NextRequest, NextResponse } from "next/server"
import { verifyCode } from "@/lib/otp-store"
import { supabaseAdmin } from "@/lib/supabase"
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

  // 1. Проверяем OTP
  const result = verifyCode(email, String(code))
  if (result !== "ok") {
    return NextResponse.json({ error: MESSAGES[result] }, { status: 400 })
  }

  // 2. Ищем пользователя в Supabase
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .single()

  let user = existing

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

  if (!existing) {
    // Регистрация — создаём нового пользователя
    const { data: created, error } = await supabaseAdmin
      .from("users")
      .insert({
        email: email.toLowerCase(),
        name: name ?? email.split("@")[0],
        phone: phone ?? "",
        is_admin: false,
      })
      .select()
      .single()

    if (error || !created) {
      return NextResponse.json({ error: "Ошибка создания аккаунта" }, { status: 500 })
    }
    user = created
  } else {
    // Обновляем last_login_at
    await supabaseAdmin
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", existing.id)
  }

  // 3. Ставим session cookie и возвращаем данные
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
