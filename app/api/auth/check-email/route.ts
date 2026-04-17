import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: "Email обязателен" }, { status: 400 })

  const { data } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .single()

  return NextResponse.json({ exists: !!data })
}
