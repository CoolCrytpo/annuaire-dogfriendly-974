import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/public/Header'
import { Footer } from '@/components/public/Footer'

export const metadata: Metadata = {
  title: {
    default: 'Dog Friendly 974 — Lieux dog-friendly à La Réunion',
    template: '%s · Dog Friendly 974',
  },
  description: 'Trouvez les restaurants, plages, hôtels et commerces qui accueillent votre chien à La Réunion. Données vérifiées et sourcées.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://annuaire-dogfriendly-974.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Dog Friendly 974',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: 'var(--surface-bg)', color: 'var(--text-primary)' }}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
