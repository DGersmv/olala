import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  const user = await getSession()
  if (!user?.is_admin) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, phone, created_at, last_login_at")
    .eq("is_admin", false)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ users: data ?? [] })
}
