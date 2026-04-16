import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabaseAdmin } from "@/lib/supabase"
import type { DateEntry } from "@/lib/olala-constants"

// DB snake_case → frontend camelCase
function toDateEntry(row: Record<string, unknown>): DateEntry {
  return {
    id: row.id as number,
    occasion: (row.occasion as string) ?? "",
    customName: (row.custom_name as string) ?? "",
    date: (row.date as string) ?? "",
    recipientName: (row.recipient_name as string) ?? "",
    recipientPhone: (row.recipient_phone as string) ?? "",
    recipientSocials: (row.recipient_socials as string) ?? "",
    address: (row.address as string) ?? "",
    budget: (row.budget as DateEntry["budget"]) ?? "medium",
    budgetMode: (row.budget_mode as DateEntry["budgetMode"]) ?? "florist_choice",
    selectedPhotoUrl: (row.selected_photo_url as string) ?? "",
    note: (row.note as string) ?? "",
  }
}

// GET /api/dates — список дат пользователя
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from("dates")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ dates: (data ?? []).map(toDateEntry) })
}

// POST /api/dates — добавить дату
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const body: Omit<DateEntry, "id"> = await req.json()

  const { data, error } = await supabaseAdmin
    .from("dates")
    .insert({
      user_id: user.id,
      occasion: body.occasion ?? "",
      custom_name: body.customName ?? "",
      date: body.date,
      recipient_name: body.recipientName ?? "",
      recipient_phone: body.recipientPhone ?? "",
      recipient_socials: body.recipientSocials ?? "",
      address: body.address ?? "",
      budget: body.budget,
      budget_mode: body.budgetMode,
      selected_photo_url: body.selectedPhotoUrl ?? "",
      note: body.note ?? "",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ date: toDateEntry(data as Record<string, unknown>) })
}
