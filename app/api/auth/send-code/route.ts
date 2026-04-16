import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { generateCode, setCode } from "@/lib/otp-store"

async function verifyCaptcha(token: string, ip: string): Promise<boolean> {
  // Служебные токены: повторная отправка или капча недоступна (dev/fallback)
  if (token === "__resend__" || token === "__captcha_unavailable__") return true
  const serverKey = process.env.CAPTCHA_SERVER_KEY
  if (!serverKey) return true // в dev без ключа пропускаем
  try {
    const res = await fetch(
      `https://captcha-api.yandex.ru/validate?secret=${serverKey}&token=${token}&ip=${ip}`
    )
    const data = await res.json()
    return data.status === "ok"
  } catch {
    return false
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.mail.ru",
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, captchaToken } = body ?? {}

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Некорректный email" }, { status: 400 })
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "127.0.0.1"
  const captchaOk = await verifyCaptcha(captchaToken ?? "", ip)
  if (!captchaOk) {
    return NextResponse.json({ error: "Капча не пройдена" }, { status: 400 })
  }

  const code = generateCode()
  setCode(email, code)

  try {
    await transporter.sendMail({
      from: `"Olala Flower Shop" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
      to: email,
      subject: "Ваш код для входа в Olala",
      html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#faf6f2;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#fff;border:1px solid #e8d8cf;max-width:480px;">
          <tr>
            <td style="padding:40px 48px 32px;color:#3d2c2c;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:6px;
                         text-transform:uppercase;opacity:.4;font-family:sans-serif;">
                flower shop
              </p>
              <h1 style="margin:0 0 32px;font-weight:300;font-size:32px;">Olala</h1>
              <p style="margin:0 0 24px;font-size:15px;font-weight:300;line-height:1.6;">
                Ваш код подтверждения:
              </p>
              <div style="background:#faf6f2;border:1px solid #e8d8cf;padding:28px;
                          text-align:center;letter-spacing:14px;font-size:38px;
                          font-weight:300;color:#d4836b;font-family:Georgia,serif;">
                ${code}
              </div>
              <p style="margin:24px 0 0;font-size:12px;opacity:.45;
                         font-family:sans-serif;line-height:1.6;">
                Код действителен 10 минут.<br>
                Не передавайте его никому.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    })
  } catch (err) {
    console.error("[send-code] SMTP error:", err)
    return NextResponse.json({ error: "Ошибка отправки письма" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
