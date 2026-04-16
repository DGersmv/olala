// In-memory OTP store (per-process, survives hot-reload via globalThis)
const g = globalThis as typeof globalThis & {
  _otpStore?: Map<string, { code: string; expires: number; attempts: number }>
}

if (!g._otpStore) {
  g._otpStore = new Map()
}

export const otpStore = g._otpStore

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function setCode(email: string, code: string) {
  otpStore.set(email.toLowerCase(), {
    code,
    expires: Date.now() + 10 * 60 * 1000, // 10 минут
    attempts: 0,
  })
}

export function verifyCode(
  email: string,
  code: string
): "ok" | "invalid" | "expired" | "too_many" {
  const entry = otpStore.get(email.toLowerCase())
  if (!entry) return "invalid"
  if (Date.now() > entry.expires) {
    otpStore.delete(email.toLowerCase())
    return "expired"
  }
  if (entry.attempts >= 5) return "too_many"
  if (entry.code !== code) {
    entry.attempts++
    return "invalid"
  }
  otpStore.delete(email.toLowerCase())
  return "ok"
}
