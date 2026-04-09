import Link from 'next/link'
import { getPlacesNeedingRecheck } from '@/lib/db/queries'
import { DogPolicyBadge } from '@/components/ui/DogPolicyBadge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { formatDateShort } from '@/lib/utils/slug'

export default async function AdminRechecksPage() {
  let places: Awaited<ReturnType<typeof getPlacesNeedingRecheck>> = []
  try {
    places = await getPlacesNeedingRecheck()
  } catch { /* DB non configurée */ }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">File de revalidation</h1>
      <p className="text-sm text-gray-500 mb-6">
        {places.length} fiche{places.length > 1 ? 's' : ''} à revérifier
      </p>

      {places.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-3xl mb-3">✅</p>
          <p>Aucune fiche en attente de revalidation.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {places.map((place) => {
            const overdue = place.next_review_at && new Date(place.next_review_at) < new Date()
            return (
              <div key={place.id} className="flex items-center justify-between px-4 py-3 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-gray-900 truncate">{place.name}</p>
                    {overdue && (
                      <span className="text-xs bg-red-100 text-red-700 px-1.5 rounded">En retard</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{place.commune?.name ?? '—'}</span>
                    <span>Score : {place.confidence_score}</span>
                    {place.next_review_at && (
                      <span>Prévu : {formatDateShort(place.next_review_at)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <DogPolicyBadge policy={place.dog_policy} size="sm" showIcon={false} />
                  <ConfidenceBadge level={place.confidence_level} showDate={false} />
                  <Link
                    href={`/admin/places/${place.id}`}
                    className="text-sm text-green-700 border border-green-300 rounded-lg px-3 py-1 hover:bg-green-50"
                  >
                    Traiter
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
