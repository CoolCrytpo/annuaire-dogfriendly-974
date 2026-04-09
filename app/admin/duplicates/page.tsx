import Link from 'next/link'
import { getPendingDuplicates } from '@/lib/db/queries'
import { DogPolicyBadge } from '@/components/ui/DogPolicyBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { VerificationStatus } from '@/lib/types'

export default async function AdminDuplicatesPage() {
  let duplicates: Awaited<ReturnType<typeof getPendingDuplicates>> = []
  try {
    duplicates = await getPendingDuplicates()
  } catch { /* DB non configurée */ }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Doublons potentiels</h1>
      <p className="text-sm text-gray-500 mb-6">{duplicates.length} paire{duplicates.length > 1 ? 's' : ''} en attente de résolution</p>

      {duplicates.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-3xl mb-3">✅</p>
          <p>Aucun doublon en attente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {duplicates.map((dup) => (
            <div key={dup.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Score de similarité :</span>
                  <span className={`font-bold text-lg ${dup.similarity_score >= 0.8 ? 'text-red-600' : 'text-orange-600'}`}>
                    {Math.round(dup.similarity_score * 100)}%
                  </span>
                </div>
              </div>

              {/* Comparaison côte à côte */}
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {[dup.place_a, dup.place_b].map((place, i) => place && (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-gray-900">{place.name}</p>
                    <p className="text-gray-500 text-xs mb-2">{(place.commune as { name?: string } | null)?.name ?? '—'}</p>
                    <div className="flex gap-2 flex-wrap">
                      <DogPolicyBadge policy={place.dog_policy} size="sm" />
                      <StatusBadge status={place.verification_status as VerificationStatus} />
                    </div>
                    {place.address_text && (
                      <p className="text-xs text-gray-500 mt-2 truncate">📍 {place.address_text}</p>
                    )}
                    <Link
                      href={`/admin/places/${place.id}`}
                      className="mt-2 block text-xs text-green-700 hover:underline"
                    >
                      Voir la fiche →
                    </Link>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <form action={`/api/admin/duplicates/${dup.id}/merge`} method="POST">
                  <input type="hidden" name="keep" value={dup.place_id_a} />
                  <button className="text-sm bg-orange-100 text-orange-800 rounded-lg px-3 py-1.5 hover:bg-orange-200">
                    Fusionner (garder A)
                  </button>
                </form>
                <form action={`/api/admin/duplicates/${dup.id}/merge`} method="POST">
                  <input type="hidden" name="keep" value={dup.place_id_b} />
                  <button className="text-sm bg-orange-100 text-orange-800 rounded-lg px-3 py-1.5 hover:bg-orange-200">
                    Fusionner (garder B)
                  </button>
                </form>
                <form action={`/api/admin/duplicates/${dup.id}/dismiss`} method="POST">
                  <button className="text-sm bg-gray-100 text-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-200">
                    Pas un doublon
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
