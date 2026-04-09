import Link from 'next/link'
import { getAdminStats } from '@/lib/db/queries'

const STAT_CARDS = (s: Record<string, number>) => [
  { label: 'Publiés',       value: s.published,          href: '/admin/places?status=published',     color: '#22c55e',  bg: '#f0fdf4', icon: '✅' },
  { label: 'Brouillons',    value: s.draft,              href: '/admin/places?status=draft',         color: '#78716c',  bg: '#fafaf9', icon: '📝' },
  { label: 'En attente',    value: s.pending_review,     href: '/admin/places?status=pending_review',color: '#f59e0b',  bg: '#fffbeb', icon: '⏳' },
  { label: 'À revérifier',  value: s.needs_recheck,      href: '/admin/rechecks',                    color: '#f97316',  bg: '#fff7ed', icon: '🔄' },
  { label: 'Conflits',      value: s.conflict,           href: '/admin/places?status=conflict',      color: '#ef4444',  bg: '#fef2f2', icon: '⚠️' },
  { label: 'Contributions', value: s.pending_submissions,href: '/admin/submissions',                 color: '#0ea5e9',  bg: '#f0f9ff', icon: '📬' },
  { label: 'Doublons',      value: s.pending_duplicates, href: '/admin/duplicates',                  color: '#8b5cf6',  bg: '#faf5ff', icon: '🔀' },
]

const QUICK_ACTIONS = [
  { href: '/admin/places/new',   label: '+ Créer une fiche',        icon: '📍' },
  { href: '/admin/submissions',  label: 'Traiter les contributions', icon: '📬' },
  { href: '/admin/import',       label: 'Importer des lieux',        icon: '📥' },
  { href: '/admin/duplicates',   label: 'Résoudre les doublons',     icon: '🔀' },
  { href: '/admin/rechecks',     label: 'File de revalidation',      icon: '🔄' },
]

const SETTINGS_SHORTCUTS = [
  { href: '/admin/categories',   label: 'Catégories',      icon: '🗂️' },
  { href: '/admin/sponsors',     label: 'Sponsors & pubs', icon: '📣' },
  { href: '/admin/settings',     label: 'Paramètres site', icon: '⚙️' },
]

export default async function AdminDashboard() {
  let stats: Record<string, number> = {
    published: 0, draft: 0, pending_review: 0, needs_recheck: 0,
    conflict: 0, pending_submissions: 0, pending_duplicates: 0,
  }
  try {
    stats = await getAdminStats()
  } catch { /* DB non configurée */ }

  const statCards = STAT_CARDS(stats)
  const urgent = statCards.filter((c) => c.value > 0 && ['⏳','⚠️','📬','🔄'].includes(c.icon))

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-stone-900" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Tableau de bord
          </h1>
          <p className="text-sm text-stone-400 mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link
          href="/admin/places/new"
          className="px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', color: 'white', fontFamily: 'Nunito, sans-serif', boxShadow: '0 2px 8px rgba(249,115,22,0.3)' }}
        >
          + Nouvelle fiche
        </Link>
      </div>

      {/* Alertes urgentes */}
      {urgent.length > 0 && (
        <div
          className="rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center"
          style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}
        >
          <span className="text-sm font-black text-amber-700" style={{ fontFamily: 'Nunito, sans-serif' }}>
            🔔 À traiter :
          </span>
          {urgent.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105"
              style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}30` }}
            >
              {c.icon} {c.value} {c.label}
            </Link>
          ))}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {statCards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl p-4 transition-all hover:scale-105"
            style={{ background: c.bg, border: `1px solid ${c.color}20`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{c.icon}</span>
              <span
                className="text-2xl font-black"
                style={{ color: c.color, fontFamily: 'Nunito, sans-serif' }}
              >
                {c.value}
              </span>
            </div>
            <p className="text-xs font-bold" style={{ color: c.color, fontFamily: 'Nunito, sans-serif' }}>
              {c.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Actions rapides */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'white', border: '1px solid #f5f5f4', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: '#f5f5f4' }}>
            <h2 className="font-black text-stone-800 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
              ⚡ Actions rapides
            </h2>
          </div>
          <div className="p-2">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-orange-50"
                style={{ color: '#44403c', fontFamily: 'Nunito, sans-serif' }}
              >
                <span className="text-base w-6 text-center flex-shrink-0">{a.icon}</span>
                {a.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Paramétrage */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'white', border: '1px solid #f5f5f4', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: '#f5f5f4' }}>
            <h2 className="font-black text-stone-800 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
              🛠️ Paramétrage no-code
            </h2>
          </div>
          <div className="p-2">
            {SETTINGS_SHORTCUTS.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-orange-50"
                style={{ color: '#44403c', fontFamily: 'Nunito, sans-serif' }}
              >
                <span className="text-base w-6 text-center flex-shrink-0">{a.icon}</span>
                {a.label}
              </Link>
            ))}
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-orange-50"
              style={{ color: '#f97316', fontFamily: 'Nunito, sans-serif' }}
            >
              <span className="text-base w-6 text-center flex-shrink-0">↗️</span>
              Voir le site public
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
