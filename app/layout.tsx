import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Raleway } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { TulipCursor } from '@/components/olala/tulip-cursor'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
})

const raleway = Raleway({
  subsets: ["latin", "cyrillic"],
  weight: ["200", "300", "400", "500"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: 'Olala Flower Shop — Никогда не забывайте важные даты',
  description: 'Зарегистрируйтесь, добавьте важные даты — и в нужный день ваши близкие получат авторский букет от нашего флориста. Без напоминаний, без забот.',
  openGraph: {
    title: 'Olala Flower Shop — Никогда не забывайте важные даты',
    description: 'Авторские букеты в нужный день — без напоминаний, без забот.',
    images: [{ url: '/og-image.png', width: 1376, height: 768, alt: 'Olala — авторские букеты' }],
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Olala Flower Shop',
    description: 'Авторские букеты в нужный день — без напоминаний, без забот.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#faf6f2',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${cormorant.variable} ${raleway.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <TulipCursor />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
