import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createDate, listDatesByUserId } from "@/lib/dates-db"
import type { DateEntry } from "@/lib/olala-constants"

function toIsoDate(value: unknown): string {
  if (!value) return ""
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const s = String(value)
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : s
}

function toDateEntry(row: Record<string, unknown>): DateEntry {
  return {
    id: row.id as number,
    occasion: (row.occasion as string) ?? "",
    customName: (row.custom_name as string) ?? "",
    date: toIsoDate(row.date),
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

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  try {
    const data = await listDatesByUserId(user.id)
    return NextResponse.json({ dates: data.map((row) => toDateEntry(row)) })
  } catch (err) {
    console.error("[dates GET]", err)
    return NextResponse.json({ error: "Ошибка базы данных" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const body: Omit<DateEntry, "id"> = await req.json()

  try {
    const data = await createDate(user.id, {
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
    return NextResponse.json({ date: toDateEntry(data) })
  } catch (err) {
    console.error("[dates POST]", err)
    return NextResponse.json({ error: "Ошибка базы данных" }, { status: 500 })
  }
}
