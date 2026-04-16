export type BudgetId = "small" | "medium" | "large" | "vip"
export type BudgetMode = "catalog" | "florist_choice"

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string            // uuid
          email: string
          name: string
          phone: string
          is_admin: boolean
          created_at: string
          last_login_at: string | null
        }
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>
      }
      dates: {
        Row: {
          id: string            // uuid
          user_id: string       // FK → users.id
          occasion: string
          custom_name: string
          date: string          // ISO date "YYYY-MM-DD"
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
        Insert: Omit<Database["public"]["Tables"]["dates"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["dates"]["Insert"]>
      }
    }
  }
}
