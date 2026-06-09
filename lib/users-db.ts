import { query } from "./db"
import type { User } from "./database.types"

export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await query<User>("select * from users where id = $1", [id])
  return rows[0] ?? null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { rows } = await query<User>("select * from users where email = $1", [
    email.toLowerCase().trim(),
  ])
  return rows[0] ?? null
}

export async function createUser(data: {
  email: string
  name: string
  phone: string
  is_admin?: boolean
}): Promise<User> {
  const { rows } = await query<User>(
    `insert into users (email, name, phone, is_admin)
     values ($1, $2, $3, $4)
     returning *`,
    [data.email.toLowerCase(), data.name, data.phone, data.is_admin ?? false]
  )
  return rows[0]
}

export async function updateLastLogin(id: string): Promise<void> {
  await query("update users set last_login_at = now() where id = $1", [id])
}

export async function listNonAdminUsers(): Promise<
  Pick<User, "id" | "name" | "email" | "phone" | "created_at" | "last_login_at">[]
> {
  const { rows } = await query(
    `select id, name, email, phone, created_at, last_login_at
     from users
     where is_admin = false
     order by created_at desc`
  )
  return rows
}
