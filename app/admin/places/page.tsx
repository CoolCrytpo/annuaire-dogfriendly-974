import Link from 'next/link'
import { getAdminPlaces } from '@/lib/db/queries'

import { StatusBadge } from '@/components/ui/StatusBadge'
import { DogPolicyBadge } from '@/components/ui/DogPolicyBadge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import type { VerificationStatus } from '@/lib/types'
import { formatDateShort } from '@/lib/utils/slug'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tous statuts' },
  { value: 'published', label: 'Publiés' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'pending_review', label: 'En attente' },
  { value: 'needs_recheck', label: 'À revérifier' },
  { value: 'conflict', label: 'Conflits' },
  { value: 'archived', label: 'Archivés' },
]

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}

export default async function AdminPlacesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1'))

  let result: Awaited<ReturnType<typeof getAdminPlaces>> = { items: [], total: 0, page: 1, per_page: 30 }
  try {
    result = await getAdminPlaces({ q: sp.q, status: sp.status, page, per_page: 30 })
  } catch { /* DB non configurée */ }

  const totalPages = Math.ceil(result.total / result.per_page)

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">
          Fiches lieux <span className="text-sm font-normal text-gray-500">({result.total})</span>
        </h1>
        <Link
          href="/admin/places/new"
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg"
        >
          + Nouvelle fiche
        </Link>
      </div>

      {/* Filtres */}
      <form method="GET" className="flex gap-3 mb-5">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Rechercher…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          name="status"
          defaultValue={sp.status ?? ''}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button type="submit" className="bg-gray-800 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-gray-700">
          Filtrer
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Nom</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Commune</th>
              <th className="text-left px-4 py-3">Chiens</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Confiance</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Mis à jour</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {result.items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">Aucune fiche trouvée</td>
              </tr>
            )}
            {result.items.map((place) => (
              <tr key={place.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 truncate max-w-[200px]">{place.name}</p>
                  <p className="text-xs text-gray-400">{place.category?.label}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                  {place.commune?.name ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <DogPolicyBadge policy={place.dog_policy} size="sm" showIcon={false} />
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <ConfidenceBadge level={place.confidence_level} showDate={false} />
                  <span className="ml-1 text-xs text-gray-400">{place.confidence_score}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={place.verification_status as VerificationStatus} />
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                  {formatDateShort(place.updated_at)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/places/${place.id}`}
                    className="text-green-700 hover:underline text-xs font-medium"
                  >
                    Éditer
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams()
            if (sp.q) params.set('q', sp.q)
            if (sp.status) params.set('status', sp.status)
            params.set('page', String(p))
            return (
              <a
                key={p}
                href={`/admin/places?${params.toString()}`}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                  p === page ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
