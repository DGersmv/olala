import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Браузерный клиент (только anon key, RLS работает)
export const supabase = createClient<Database>(url, anon)

// Серверный клиент (service role, обходит RLS — только для API routes)
export const supabaseAdmin = createClient<Database>(url, service)
