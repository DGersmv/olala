import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { listAllDatesWithUsers } from "@/lib/dates-db"

export async function GET() {
  const user = await getSession()
  if (!user?.is_admin) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
  }

  try {
    const dates = await listAllDatesWithUsers()
    return NextResponse.json({ dates })
  } catch (err) {
    console.error("[admin/dates]", err)
    return NextResponse.json({ error: "Ошибка базы данных" }, { status: 500 })
  }
}
