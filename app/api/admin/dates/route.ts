import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  const user = await getSession()
  if (!user?.is_admin) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
  }

  // Все даты с данными пользователя
  const { data, error } = await supabaseAdmin
    .from("dates")
    .select(`
      *,
      users (
        id,
        name,
        email,
        phone
      )
    `)
    .order("date", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ dates: data ?? [] })
}
