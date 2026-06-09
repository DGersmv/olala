export type BudgetId = "small" | "medium" | "large" | "vip"
export type BudgetMode = "catalog" | "florist_choice"

export interface User {
  id: string
  email: string
  name: string
  phone: string
  is_admin: boolean
  created_at: string
  last_login_at: string | null
}

export interface DateRow {
  id: string
  user_id: string
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
  created_at: string
}

export interface DateWithUser extends DateRow {
  users: Pick<User, "id" | "name" | "email" | "phone">
}
