import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabaseAdmin } from "@/lib/supabase"

// DELETE /api/dates/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { id } = await params

  const { error } = await supabaseAdmin
    .from("dates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id) // защита: только свои даты

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
