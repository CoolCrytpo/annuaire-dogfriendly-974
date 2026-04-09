import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPlaceById, getPlaceSources, getAllCategories, getAllCommunes } from '@/lib/db/queries'
import { PlaceEditor } from '@/components/admin/PlaceEditor'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DogPolicyBadge } from '@/components/ui/DogPolicyBadge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import type { VerificationStatus } from '@/lib/types'
import { formatDate, formatDateShort } from '@/lib/utils/slug'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminPlaceDetailPage({ params }: PageProps) {
  const { id } = await params
  let place = null
  let sources: Awaited<ReturnType<typeof getPlaceSources>> = []
  let categories: Awaited<ReturnType<typeof getAllCategories>> = []
  let communes: Awaited<ReturnType<typeof getAllCommunes>> = []

  try {
    ;[place, sources, categories, communes] = await Promise.all([
      getPlaceById(id),
      getPlaceSources(id),
      getAllCategories(),
      getAllCommunes(),
    ])
  } catch { /* DB non configurée */ }

  if (!place) return notFound()

  const sourceTypeLabels: Record<string, string> = {
    manual: 'Manuel', official_website: 'Site officiel', google_places: 'Google Places',
    osm: 'OpenStreetMap', user_submission: 'Contribution', phone_call: 'Appel',
    onsite_check: 'Terrain', partner_feed: 'Partenaire', social_page: 'Réseau social',
    booking_site: 'Réservation',
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-gray-500">
            <Link href="/admin/places" className="hover:text-gray-900">Fiches lieux</Link>
            <span>/</span>
            <span className="text-gray-900">{place.name}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{place.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={place.verification_status as VerificationStatus} />
            <DogPolicyBadge policy={place.dog_policy} size="sm" />
            <ConfidenceBadge level={place.confidence_level} date={place.last_verified_at} />
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {place.verification_status === 'published' ? (
            <Link
              href={`/lieux/${place.slug}`}
              target="_blank"
              className="text-sm text-green-700 border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-50"
            >
              Voir publique ↗
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Éditeur principal */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Édition</h2>
          <PlaceEditor place={place} categories={categories} communes={communes} />
        </div>

        {/* Panneau droit */}
        <div className="space-y-4">
          {/* Actions de statut */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Actions</h2>
            <div className="space-y-2">
              {place.verification_status !== 'published' && (
                <form action={`/api/admin/places/${place.id}/publish`} method="POST">
                  <button className="w-full text-sm bg-green-600 text-white rounded-lg px-3 py-2 hover:bg-green-700">
                    ✅ Publier
                  </button>
                </form>
              )}
              {place.verification_status === 'published' && (
                <form action={`/api/admin/places/${place.id}/unpublish`} method="POST">
                  <button className="w-full text-sm bg-yellow-100 text-yellow-800 rounded-lg px-3 py-2 hover:bg-yellow-200">
                    ⏸ Dépublier
                  </button>
                </form>
              )}
              <form action={`/api/admin/places/${place.id}/recheck`} method="POST">
                <button className="w-full text-sm bg-orange-100 text-orange-800 rounded-lg px-3 py-2 hover:bg-orange-200">
                  🔄 Marquer à revérifier
                </button>
              </form>
            </div>
          </div>

          {/* Scoring */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Score de confiance</h2>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900">{place.confidence_score}</span>
              <ConfidenceBadge level={place.confidence_level} showDate={false} />
            </div>
            {place.last_verified_at && (
              <p className="text-xs text-gray-500">Vérifié le {formatDate(place.last_verified_at)}</p>
            )}
            {place.next_review_at && (
              <p className="text-xs text-gray-500 mt-0.5">
                Prochain check : {formatDateShort(place.next_review_at)}
              </p>
            )}
          </div>

          {/* Sources */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Sources ({sources.length})</h2>
              <Link
                href={`/admin/sources?place_id=${place.id}`}
                className="text-xs text-green-700 hover:underline"
              >
                Gérer
              </Link>
            </div>
            <div className="space-y-2">
              {sources.map((s) => (
                <div key={s.id} className={`rounded-lg p-2.5 text-xs border ${
                  s.is_primary ? 'border-green-300 bg-green-50' :
                  s.is_conflicting ? 'border-red-300 bg-red-50' :
                  'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-medium">{sourceTypeLabels[s.source_type] ?? s.source_type}</span>
                    {s.is_primary && <span className="bg-green-200 text-green-800 px-1 rounded">Principal</span>}
                    {s.is_conflicting && <span className="bg-red-200 text-red-800 px-1 rounded">Conflit</span>}
                  </div>
                  {s.claim_dog_policy && (
                    <p className="text-gray-600">
                      Revendique : <strong>{s.claim_dog_policy}</strong>
                    </p>
                  )}
                  {s.source_url && (
                    <a href={s.source_url} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate block mt-0.5">
                      {s.source_url.slice(0, 50)}{s.source_url.length > 50 ? '…' : ''}
                    </a>
                  )}
                  <p className="text-gray-400 mt-0.5">{formatDateShort(s.collected_at)}</p>
                </div>
              ))}
              {sources.length === 0 && (
                <p className="text-xs text-gray-400">Aucune source</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
