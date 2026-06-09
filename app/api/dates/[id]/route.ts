import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { deleteDate } from "@/lib/dates-db"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { id } = await params

  try {
    const ok = await deleteDate(user.id, id)
    if (!ok) return NextResponse.json({ error: "Дата не найдена" }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[dates DELETE]", err)
    return NextResponse.json({ error: "Ошибка базы данных" }, { status: 500 })
  }
}
