import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/users-db"

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: "Email обязателен" }, { status: 400 })

  const user = await getUserByEmail(email)
  return NextResponse.json({ exists: !!user })
}
