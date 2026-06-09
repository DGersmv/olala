import { Pool, type QueryResultRow } from "pg"

const g = globalThis as typeof globalThis & { _pgPool?: Pool }

function getPool(): Pool {
  if (!g._pgPool) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error("DATABASE_URL is not set")
    g._pgPool = new Pool({ connectionString: url })
  }
  return g._pgPool
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return getPool().query<T>(text, params)
}
