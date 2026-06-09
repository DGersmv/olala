import { query } from "./db"
import type { BudgetId, BudgetMode, DateRow, DateWithUser } from "./database.types"

export async function listDatesByUserId(userId: string): Promise<DateRow[]> {
  const { rows } = await query<DateRow>(
    `select * from dates where user_id = $1 order by date asc`,
    [userId]
  )
  return rows
}

export async function createDate(
  userId: string,
  data: {
    occasion: string
    custom_name: string
    date: string
    recipient_name: string
    recipient_phone: string
    recipient_socials: string
    address: string
    budget: BudgetId
    budget_mode: BudgetMode
    selected_photo_url: string
    note: string
  }
): Promise<DateRow> {
  const { rows } = await query<DateRow>(
    `insert into dates (
       user_id, occasion, custom_name, date,
       recipient_name, recipient_phone, recipient_socials,
       address, budget, budget_mode, selected_photo_url, note
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     returning *`,
    [
      userId,
      data.occasion,
      data.custom_name,
      data.date,
      data.recipient_name,
      data.recipient_phone,
      data.recipient_socials,
      data.address,
      data.budget,
      data.budget_mode,
      data.selected_photo_url,
      data.note,
    ]
  )
  return rows[0]
}

export async function deleteDate(userId: string, dateId: string): Promise<boolean> {
  const { rowCount } = await query(
    `delete from dates where id = $1 and user_id = $2`,
    [dateId, userId]
  )
  return (rowCount ?? 0) > 0
}

export async function listAllDatesWithUsers(): Promise<DateWithUser[]> {
  const { rows } = await query<DateWithUser>(
    `select d.*,
            json_build_object(
              'id', u.id,
              'name', u.name,
              'email', u.email,
              'phone', u.phone
            ) as users
     from dates d
     join users u on u.id = d.user_id
     order by d.date asc`
  )
  return rows
}
