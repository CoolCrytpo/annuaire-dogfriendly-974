import Link from 'next/link'
import pool from '@/lib/db/client'
import { formatDateShort } from '@/lib/utils/slug'

interface PageProps {
  searchParams: Promise<{ place_id?: string }>
}

export default async function AdminSourcesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  let sources: Array<{
    id: string; place_id: string; source_type: string; source_url: string | null;
    source_label: string | null; claim_dog_policy: string | null;
    is_primary: boolean; is_conflicting: boolean; review_status: string;
    collected_at: string; place_name: string;
  }> = []

  try {
    let query = `
      SELECT ps.*, p.name AS place_name
      FROM place_sources ps
      JOIN places p ON ps.place_id = p.id
      WHERE 1=1
    `
    const values: string[] = []
    if (sp.place_id) {
      query += ' AND ps.place_id = $1'
      values.push(sp.place_id)
    }
    query += ' ORDER BY ps.collected_at DESC LIMIT 100'
    const result = await pool.query(query, values)
    sources = result.rows
  } catch { /* DB non configurée */ }

  const reviewLabels: Record<string, string> = {
    pending: 'En attente', accepted: 'Accepté', rejected: 'Rejeté',
  }
  const reviewColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">
        Sources{sp.place_id ? ' — filtrées' : ''}
        <span className="text-sm font-normal text-gray-500 ml-2">({sources.length})</span>
      </h1>

      {sp.place_id && (
        <div className="mb-4">
          <Link href="/admin/sources" className="text-sm text-gray-500 hover:text-gray-900">
            ← Toutes les sources
          </Link>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Lieu</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Politique revendiquée</th>
              <th className="text-left px-4 py-3">Statut review</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Collecté</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sources.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Aucune source</td></tr>
            )}
            {sources.map((s) => (
              <tr key={s.id} className={`hover:bg-gray-50 ${s.is_conflicting ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-2.5">
                  <Link href={`/admin/places/${s.place_id}`} className="text-green-700 hover:underline font-medium">
                    {s.place_name}
                  </Link>
                  <div className="flex gap-1 mt-0.5">
                    {s.is_primary && <span className="text-xs bg-green-100 text-green-700 px-1 rounded">Principal</span>}
                    {s.is_conflicting && <span className="text-xs bg-red-100 text-red-700 px-1 rounded">Conflit</span>}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-gray-600">{s.source_type}</td>
                <td className="px-4 py-2.5 hidden md:table-cell">
                  {s.claim_dog_policy ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${reviewColors[s.review_status] ?? ''}`}>
                    {reviewLabels[s.review_status] ?? s.review_status}
                  </span>
                </td>
                <td className="px-4 py-2.5 hidden lg:table-cell text-xs text-gray-400">
                  {formatDateShort(s.collected_at)}
                </td>
                <td className="px-4 py-2.5">
                  {s.source_url && (
                    <a href={s.source_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline">↗</a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
