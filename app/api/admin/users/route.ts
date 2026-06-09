import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { listNonAdminUsers } from "@/lib/users-db"

export async function GET() {
  const user = await getSession()
  if (!user?.is_admin) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
  }

  try {
    const users = await listNonAdminUsers()
    return NextResponse.json({ users })
  } catch (err) {
    console.error("[admin/users]", err)
    return NextResponse.json({ error: "Ошибка базы данных" }, { status: 500 })
  }
}
