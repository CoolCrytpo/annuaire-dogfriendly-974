import Link from 'next/link'
import { getAllCategories, getAdminStats } from '@/lib/db/queries'

const CATEGORY_GRADIENTS: Record<string, string> = {
  restaurant: 'linear-gradient(135deg,#fee2e2,#fecaca)',
  cafe:        'linear-gradient(135deg,#fef3c7,#fde68a)',
  bar:         'linear-gradient(135deg,#ede9fe,#ddd6fe)',
  hotel:       'linear-gradient(135deg,#dbeafe,#bfdbfe)',
  gite:        'linear-gradient(135deg,#d1fae5,#a7f3d0)',
  plage:       'linear-gradient(135deg,#cffafe,#a5f3fc)',
  parc:        'linear-gradient(135deg,#dcfce7,#bbf7d0)',
  randonnee:   'linear-gradient(135deg,#d1fae5,#6ee7b7)',
  commerce:    'linear-gradient(135deg,#fce7f3,#fbcfe8)',
  veterinaire: 'linear-gradient(135deg,#dbeafe,#93c5fd)',
  toilettage:  'linear-gradient(135deg,#fae8ff,#e9d5ff)',
  pension:     'linear-gradient(135deg,#fef9c3,#fef08a)',
  activite:    'linear-gradient(135deg,#ffedd5,#fed7aa)',
  transport:   'linear-gradient(135deg,#f1f5f9,#e2e8f0)',
  autre:       'linear-gradient(135deg,#f3f4f6,#e5e7eb)',
}

const HOW_IT_WORKS = [
  {
    icon: '🔍',
    color: '#dbeafe',
    title: 'On vérifie chaque lieu',
    desc: "Pas de publication automatique. Chaque fiche est vérifiée manuellement à partir de sources officielles, appels ou visites terrain.",
  },
  {
    icon: '📅',
    color: '#dcfce7',
    title: 'Daté et sourcé',
    desc: "Toute info affiche sa source et sa date. Si on ne sait pas avec certitude, on l'indique clairement — jamais d'invention.",
  },
  {
    icon: '🐾',
    color: '#fef3c7',
    title: 'La communauté contribue',
    desc: "Vous connaissez un endroit ? Proposez-le. Notre équipe vérifie et publie. Simple, rapide, utile pour tous.",
  },
]

export default async function HomePage() {
  let categories: Awaited<ReturnType<typeof getAllCategories>> = []
  let stats = { published: 0 }
  try {
    ;[categories, stats] = await Promise.all([getAllCategories(), getAdminStats()])
  } catch { /* DB not ready */ }

  return (
    <div>
      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #fff7ed 0%, #fef3c7 45%, #ecfdf5 100%)' }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #fb923c, transparent)' }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #34d399, transparent)' }}
        />

        <div className="max-w-5xl mx-auto px-4 py-20 sm:py-28 relative text-center">
          <div className="animate-fade-up">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6"
              style={{
                background: 'white',
                color: '#f97316',
                boxShadow: '0 2px 12px rgba(249,115,22,0.15)',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              <span>🏝️</span>
              <span>La Réunion — 974</span>
              {stats.published > 0 && (
                <>
                  <span style={{ color: '#e5e7eb' }}>·</span>
                  <span>{stats.published} lieux vérifiés</span>
                </>
              )}
            </div>

            <h1
              className="text-4xl sm:text-5xl md:text-6xl mb-6 leading-tight"
              style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, color: '#1c1917' }}
            >
              Sortez avec votre chien{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #f97316, #fbbf24)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                en toute confiance
              </span>{' '}
              🐾
            </h1>

            <p
              className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
              style={{ color: '#78716c' }}
            >
              Restaurants, plages, hôtels, randonnées… Découvrez les lieux dog-friendly à La Réunion.
              Données vérifiées, sourcées et datées par notre équipe.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/annuaire" className="btn-primary text-base px-8 py-3.5">
                🗺️ Explorer l&apos;annuaire
              </Link>
              <Link href="/carte" className="btn-secondary text-base px-8 py-3.5">
                📍 Voir sur la carte
              </Link>
            </div>
          </div>

          {/* Stats strip */}
          {stats.published > 0 && (
            <div className="mt-14 flex flex-wrap justify-center gap-6">
              {[
                { value: stats.published, label: 'Lieux répertoriés', icon: '📍' },
                { value: 24, label: 'Communes couvertes', icon: '🏘️' },
                { value: 15, label: 'Catégories', icon: '🗂️' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.7)', boxShadow: '0 2px 8px rgba(249,115,22,0.1)' }}
                >
                  <span className="text-xl">{s.icon}</span>
                  <div className="text-left">
                    <p className="font-display text-xl font-black leading-none" style={{ color: '#f97316', fontFamily: 'Nunito, sans-serif' }}>
                      {s.value}+
                    </p>
                    <p className="text-xs" style={{ color: '#78716c' }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Catégories ─────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2
                className="text-2xl sm:text-3xl"
                style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, color: '#1c1917' }}
              >
                Où emmener votre chien ?
              </h2>
              <p className="text-sm mt-1" style={{ color: '#78716c' }}>
                Explorez par type de lieu
              </p>
            </div>
            <Link href="/annuaire" className="btn-ghost text-sm hidden sm:inline-flex">
              Tout voir →
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all duration-200 group"
                style={{
                  background: CATEGORY_GRADIENTS[cat.slug] ?? 'linear-gradient(135deg,#f3f4f6,#e5e7eb)',
                  borderColor: 'rgba(0,0,0,0.06)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-200" aria-hidden>
                  {cat.icon}
                </span>
                <span
                  className="text-xs text-center leading-tight font-bold"
                  style={{ color: '#44403c', fontFamily: 'Nunito, sans-serif' }}
                >
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Comment ça marche ──────────────────────────────────────────── */}
      <section
        className="py-16 px-4"
        style={{ background: 'linear-gradient(135deg, #fffbf7, #f0fdf4)' }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-2xl sm:text-3xl mb-3"
              style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, color: '#1c1917' }}
            >
              Pourquoi nous faire confiance ?
            </h2>
            <p style={{ color: '#78716c' }}>
              Pas d&apos;inventions, pas d&apos;approximations. On vérifie avant de publier.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.title}
                className="card p-6"
                style={{ background: 'white' }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: item.color }}
                >
                  {item.icon}
                </div>
                <h3
                  className="text-lg mb-2"
                  style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#1c1917' }}
                >
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#78716c' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA contribution ───────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div
          className="max-w-2xl mx-auto rounded-3xl p-10 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #f97316, #fb923c, #fbbf24)',
            boxShadow: '0 20px 60px rgba(249,115,22,0.25)',
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
            style={{ background: 'white' }}
          />
          <div
            className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-20"
            style={{ background: 'white' }}
          />
          <p className="text-4xl mb-4 animate-float relative">🐶</p>
          <h2
            className="text-2xl sm:text-3xl text-white mb-3 relative"
            style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900 }}
          >
            Vous connaissez un endroit super ?
          </h2>
          <p className="text-orange-100 mb-8 relative leading-relaxed">
            Partagez-le avec la communauté. Notre équipe vérifie et publie sous 7 jours.
          </p>
          <Link
            href="/proposer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-orange-600 transition-all hover:scale-105 relative"
            style={{
              background: 'white',
              fontFamily: 'Nunito, sans-serif',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}
          >
            ➕ Proposer un lieu
          </Link>
        </div>
      </section>
    </div>
  )
}
