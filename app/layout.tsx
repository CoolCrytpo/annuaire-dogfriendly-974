import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/public/Header'
import { Footer } from '@/components/public/Footer'

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Dog Friendly 974 — Annuaire des lieux dog-friendly à La Réunion',
    template: '%s · Dog Friendly 974',
  },
  description: 'Trouvez les restaurants, plages, hôtels et commerces qui accueillent votre chien à La Réunion. Données vérifiées et sourcées.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://dogfriendly974.re'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
