import Link from 'next/link'
import { getSubmissions } from '@/lib/db/queries'
import { DOG_POLICY_LABELS } from '@/lib/types'
import { formatDateShort } from '@/lib/utils/slug'

const STATUS_LABELS: Record<string, string> = {
  received: 'Reçu', triaged: 'Trié', accepted: 'Accepté', rejected: 'Rejeté', merged: 'Fusionné',
}
const STATUS_COLORS: Record<string, string> = {
  received: 'bg-blue-100 text-blue-800',
  triaged: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  merged: 'bg-gray-100 text-gray-600',
}

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function AdminSubmissionsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1'))

  let result: Awaited<ReturnType<typeof getSubmissions>> = { items: [], total: 0, page: 1, per_page: 30 }
  try {
    result = await getSubmissions({ status: sp.status, page, per_page: 30 })
  } catch { /* DB non configurée */ }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">
          Contributions <span className="text-sm font-normal text-gray-500">({result.total})</span>
        </h1>
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 mb-5">
        {['', 'received', 'triaged', 'accepted', 'rejected'].map((s) => (
          <Link
            key={s}
            href={s ? `/admin/submissions?status=${s}` : '/admin/submissions'}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              (sp.status ?? '') === s
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s ? STATUS_LABELS[s] : 'Toutes'}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {result.items.length === 0 && (
          <p className="text-center py-10 text-gray-400">Aucune contribution</p>
        )}
        {result.items.map((sub) => (
          <div key={sub.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[sub.status]}`}>
                    {STATUS_LABELS[sub.status]}
                  </span>
                  <span className="text-xs text-gray-400">
                    {sub.type === 'new_place' ? '+ Nouveau lieu' : '✏️ Correction'}
                  </span>
                  <span className="text-xs text-gray-400">{formatDateShort(sub.created_at)}</span>
                </div>

                {sub.submitted_name && (
                  <p className="font-medium text-gray-900">{sub.submitted_name}</p>
                )}
                {sub.related_place_id && (
                  <p className="text-sm text-gray-600">
                    Correction de :{' '}
                    <Link href={`/admin/places/${sub.related_place_id}`} className="text-green-700 hover:underline">
                      Voir la fiche
                    </Link>
                  </p>
                )}

                <div className="flex gap-4 mt-1 text-sm text-gray-600">
                  {sub.submitted_commune && <span>📍 {sub.submitted_commune}</span>}
                  {sub.submitted_category && <span>📂 {sub.submitted_category}</span>}
                  {sub.submitted_dog_policy && (
                    <span>🐾 {DOG_POLICY_LABELS[sub.submitted_dog_policy]}</span>
                  )}
                </div>

                {sub.submitted_message && (
                  <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded px-3 py-2 italic">
                    &ldquo;{sub.submitted_message}&rdquo;
                  </p>
                )}

                {sub.submitter_email && (
                  <p className="text-xs text-gray-400 mt-1">✉ {sub.submitter_email}</p>
                )}
              </div>

              {/* Actions */}
              {sub.status === 'received' && (
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <form action={`/api/admin/submissions/${sub.id}/accept`} method="POST">
                    <button className="w-full text-xs bg-green-600 text-white rounded px-3 py-1.5 hover:bg-green-700">
                      Accepter
                    </button>
                  </form>
                  <form action={`/api/admin/submissions/${sub.id}/reject`} method="POST">
                    <button className="w-full text-xs bg-red-100 text-red-800 rounded px-3 py-1.5 hover:bg-red-200">
                      Rejeter
                    </button>
                  </form>
                  {sub.type === 'new_place' && (
                    <Link
                      href={`/admin/places/new?from_submission=${sub.id}`}
                      className="text-xs bg-blue-100 text-blue-800 rounded px-3 py-1.5 hover:bg-blue-200 text-center"
                    >
                      Créer fiche
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
