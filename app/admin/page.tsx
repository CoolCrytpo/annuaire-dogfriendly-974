import Link from 'next/link'
import { getAdminStats } from '@/lib/db/queries'

export default async function AdminDashboard() {
  let stats = {
    published: 0, draft: 0, pending_review: 0, needs_recheck: 0, conflict: 0,
    pending_submissions: 0, pending_duplicates: 0,
  }
  try {
    stats = await getAdminStats()
  } catch { /* DB non configurée */ }

  const cards = [
    { label: 'Publiés', value: stats.published, href: '/admin/places?status=published', color: 'text-green-700', bg: 'bg-green-50' },
    { label: 'Brouillons', value: stats.draft, href: '/admin/places?status=draft', color: 'text-gray-700', bg: 'bg-gray-50' },
    { label: 'En attente', value: stats.pending_review, href: '/admin/places?status=pending_review', color: 'text-yellow-700', bg: 'bg-yellow-50' },
    { label: 'À revérifier', value: stats.needs_recheck, href: '/admin/rechecks', color: 'text-orange-700', bg: 'bg-orange-50' },
    { label: 'Conflits', value: stats.conflict, href: '/admin/places?status=conflict', color: 'text-red-700', bg: 'bg-red-50' },
    { label: 'Contributions', value: stats.pending_submissions, href: '/admin/submissions', color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Doublons', value: stats.pending_duplicates, href: '/admin/duplicates', color: 'text-purple-700', bg: 'bg-purple-50' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
        <Link
          href="/admin/places/new"
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nouvelle fiche
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`${c.bg} border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow`}
          >
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-sm text-gray-600 mt-0.5">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { title: 'Actions rapides', items: [
            { href: '/admin/places/new', label: '+ Créer une fiche' },
            { href: '/admin/submissions', label: 'Traiter les contributions' },
            { href: '/admin/duplicates', label: 'Résoudre les doublons' },
            { href: '/admin/rechecks', label: 'File de revalidation' },
          ]},
          { title: 'Navigation', items: [
            { href: '/admin/places', label: 'Toutes les fiches' },
            { href: '/admin/sources', label: 'Gestion des sources' },
            { href: '/', label: '← Site public' },
          ]},
        ].map((section) => (
          <div key={section.title} className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">{section.title}</h2>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-green-700 hover:underline block py-0.5">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
