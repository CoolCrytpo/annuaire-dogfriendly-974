import Link from 'next/link'

export function Footer() {
  return (
    <footer style={{ background: '#1c1917', color: '#a8a29e' }} className="mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}
              >
                🐾
              </div>
              <div>
                <span
                  className="text-white text-base block leading-none"
                  style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800 }}
                >
                  Dog Friendly 974
                </span>
                <span className="text-xs tracking-widest" style={{ color: '#57534e' }}>LA RÉUNION</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#78716c' }}>
              L&apos;annuaire des lieux qui accueillent votre chien à La Réunion. Données vérifiées, sourcées et datées.
            </p>
          </div>

          {/* Explorer */}
          <div>
            <h3 className="text-white text-sm mb-4" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
              Explorer
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/annuaire', label: 'Annuaire' },
                { href: '/carte', label: 'Carte interactive' },
                { href: '/categories/restaurant', label: 'Restaurants' },
                { href: '/categories/plage', label: 'Plages' },
                { href: '/categories/hotel', label: 'Hébergements' },
                { href: '/categories/randonnee', label: 'Randonnées' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-orange-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Communes */}
          <div>
            <h3 className="text-white text-sm mb-4" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
              Communes
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { slug: 'saint-denis', name: 'Saint-Denis' },
                { slug: 'saint-paul', name: 'Saint-Paul' },
                { slug: 'saint-pierre', name: 'Saint-Pierre' },
                { slug: 'saint-gilles-les-bains', name: 'Saint-Gilles' },
                { slug: 'le-tampon', name: 'Le Tampon' },
                { slug: 'saint-leu', name: 'Saint-Leu' },
              ].map((c) => (
                <li key={c.slug}>
                  <Link href={`/communes/${c.slug}`} className="hover:text-orange-400 transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* À propos */}
          <div>
            <h3 className="text-white text-sm mb-4" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
              À propos
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/methodologie', label: 'Notre méthode' },
                { href: '/proposer', label: 'Proposer un lieu' },
                { href: '/contact', label: 'Contact' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-orange-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ borderColor: '#292524', color: '#57534e' }}>
          <p>© {new Date().getFullYear()} Dog Friendly 974 — La Réunion</p>
          <p>
            Données vérifiées manuellement ·{' '}
            <Link href="/methodologie" className="hover:text-orange-400 transition-colors underline">
              Notre méthode
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
