import { getAdminPlaces } from '@/lib/db/queries'
import { PlacesBulkTable } from '@/components/admin/PlacesBulkTable'
import Link from 'next/link'

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

      <PlacesBulkTable places={result.items} />

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
