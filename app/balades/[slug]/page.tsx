import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPlaceBySlug, getPlaceSources, getReactionCounts } from '@/lib/db/queries'
import { ReactionBar } from '@/components/public/ReactionBar'
import { AdSlot } from '@/components/ui/AdSlot'
import { formatDate } from '@/lib/utils/slug'
import type { TrailDetails, TrailDifficulty } from '@/lib/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

const DIFFICULTY_CONFIG: Record<TrailDifficulty, { label: string; color: string; bg: string; border: string }> = {
  easy:     { label: 'Facile',    color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  moderate: { label: 'Modéré',   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  hard:     { label: 'Difficile', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  expert:   { label: 'Expert',    color: '#7c3aed', bg: '#faf5ff', border: '#d8b4fe' },
}

const POLICY_CONFIG = {
  allowed:     { label: 'Chiens acceptés',   icon: '✅', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  conditional: { label: 'Sous conditions',   icon: '⚠️', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  disallowed:  { label: 'Chiens interdits',  icon: '🚫', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  unknown:     { label: 'Non renseigné',     icon: '❓', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const place = await getPlaceBySlug(slug)
    if (!place) return {}
    return {
      title: `${place.name} — Balade dog-friendly`,
      description: place.short_description ?? `Itinéraire dog-friendly : ${place.name} à La Réunion.`,
    }
  } catch { return {} }
}

export default async function TrailPage({ params }: PageProps) {
  const { slug } = await params

  let place = null
  let sources: Awaited<ReturnType<typeof getPlaceSources>> = []
  let reactionCounts = { utile: 0, merci: 0, jadore: 0, oups: 0 }

  try {
    const { getPlaceSources: getSources } = await import('@/lib/db/queries')
    place = await getPlaceBySlug(slug)
    if (place) {
      ;[sources, reactionCounts] = await Promise.all([
        getSources(place.id),
        getReactionCounts(place.id),
      ])
    }
  } catch { /* DB non configurée */ }

  if (!place) return notFound()

  const details = place.trail_details as TrailDetails | null
  const policy = POLICY_CONFIG[place.dog_policy] ?? POLICY_CONFIG.unknown
  const difficulty = details?.difficulty ? DIFFICULTY_CONFIG[details.difficulty] : null
  const primarySource = sources.find((s) => s.is_primary)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LandmarksOrHistoricalBuildings',
    name: place.name,
    ...(place.short_description ? { description: place.short_description } : {}),
    ...(place.lat && place.lng ? { geo: { '@type': 'GeoCoordinates', latitude: place.lat, longitude: place.lng } } : {}),
    ...(place.cover_image_url ? { image: place.cover_image_url } : {}),
    ...(place.commune ? { containedInPlace: { '@type': 'Place', name: place.commune.name } } : {}),
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <div
        className="w-full relative overflow-hidden"
        style={{
          height: '240px',
          background: place.cover_image_url
            ? `url(${place.cover_image_url}) center/cover`
            : 'linear-gradient(135deg,#d1fae5,#6ee7b7)',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(28,25,23,0.6) 0%, transparent 60%)' }} />

        {/* Breadcrumb */}
        <div className="absolute top-4 left-4 right-4 max-w-3xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <Link href="/balades" className="hover:text-white transition-colors">Balades</Link>
            <span>/</span>
            {place.commune && (
              <>
                <span>{place.commune.name}</span>
                <span>/</span>
              </>
            )}
            <span className="text-white font-semibold truncate">{place.name}</span>
          </nav>
        </div>

        {/* Difficulty + title */}
        <div className="absolute bottom-4 left-4 right-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {difficulty && (
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.9)', color: difficulty.color, fontFamily: 'Nunito, sans-serif' }}
              >
                {details?.difficulty === 'easy' ? '🟢' : details?.difficulty === 'moderate' ? '🟡' : details?.difficulty === 'hard' ? '🔴' : '🟣'} {difficulty.label}
              </span>
            )}
            <span
              className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.9)', color: '#44403c', fontFamily: 'Nunito, sans-serif' }}
            >
              🥾 {place.category?.label ?? 'Randonnée'}
            </span>
          </div>
          <h1
            className="text-2xl sm:text-3xl text-white"
            style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
          >
            {place.name}
          </h1>
          {place.commune && (
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
              📍 {place.commune.name}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Stats rapides */}
        {details && (details.distance_km != null || details.elevation_m != null || details.duration_minutes != null) && (
          <div
            className="grid grid-cols-3 gap-3 mb-6"
            style={{ background: 'white', border: '1px solid rgba(249,115,22,0.1)', boxShadow: '0 2px 8px rgba(249,115,22,0.06)', borderRadius: '1rem', padding: '1.25rem' }}
          >
            {details.distance_km != null && (
              <div className="text-center">
                <div className="text-2xl mb-1">📏</div>
                <div className="text-xl font-black" style={{ fontFamily: 'Nunito, sans-serif', color: '#1c1917' }}>{details.distance_km} km</div>
                <div className="text-xs" style={{ color: '#78716c' }}>Distance</div>
              </div>
            )}
            {details.elevation_m != null && (
              <div className="text-center">
                <div className="text-2xl mb-1">⛰️</div>
                <div className="text-xl font-black" style={{ fontFamily: 'Nunito, sans-serif', color: '#1c1917' }}>+{details.elevation_m} m</div>
                <div className="text-xs" style={{ color: '#78716c' }}>Dénivelé</div>
              </div>
            )}
            {details.duration_minutes != null && (
              <div className="text-center">
                <div className="text-2xl mb-1">⏱️</div>
                <div className="text-xl font-black" style={{ fontFamily: 'Nunito, sans-serif', color: '#1c1917' }}>{formatDuration(details.duration_minutes)}</div>
                <div className="text-xs" style={{ color: '#78716c' }}>Durée</div>
              </div>
            )}
          </div>
        )}

        {/* Politique chiens */}
        <div
          className="rounded-3xl p-6 mb-6"
          style={{ background: policy.bg, border: `2px solid ${policy.border}`, boxShadow: `0 4px 20px ${policy.color}15` }}
        >
          <div className="flex items-start gap-4">
            <span className="text-4xl flex-shrink-0">{policy.icon}</span>
            <div>
              <h2 className="text-xl mb-1" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, color: policy.color }}>
                {policy.label}
              </h2>
              {place.dog_conditions_text ? (
                <p className="text-sm leading-relaxed" style={{ color: '#44403c' }}>{place.dog_conditions_text}</p>
              ) : (
                <p className="text-sm" style={{ color: '#78716c' }}>
                  {place.dog_policy === 'allowed' ? 'Les chiens sont les bienvenus sur ce parcours.' :
                   place.dog_policy === 'conditional' ? 'Les chiens sont acceptés avec certaines restrictions.' :
                   place.dog_policy === 'disallowed' ? 'Les chiens ne sont pas autorisés sur ce parcours.' :
                   "La politique d'accueil des chiens n'est pas encore confirmée."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Détails trail */}
        {details && (details.leash_required || details.has_water_points || details.water_points_desc || details.regulated_zones || details.terrain_type) && (
          <div
            className="rounded-2xl p-5 mb-6"
            style={{ background: 'white', border: '1px solid rgba(249,115,22,0.1)', boxShadow: '0 2px 8px rgba(249,115,22,0.06)' }}
          >
            <h2 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: '#f97316', fontFamily: 'Nunito, sans-serif' }}>
              Infos pour votre chien
            </h2>
            <div className="space-y-3">
              {details.leash_required != null && (
                <div className="flex gap-3 text-sm">
                  <span className="text-lg flex-shrink-0">🦮</span>
                  <span style={{ color: '#44403c' }}>
                    <strong>Laisse :</strong> {details.leash_required ? 'Obligatoire sur ce parcours' : 'Non obligatoire (vérifiez les zones)'}
                  </span>
                </div>
              )}
              {details.has_water_points && (
                <div className="flex gap-3 text-sm">
                  <span className="text-lg flex-shrink-0">💧</span>
                  <span style={{ color: '#44403c' }}>
                    <strong>Points d'eau :</strong> {details.water_points_desc ?? 'Présents sur le parcours'}
                  </span>
                </div>
              )}
              {details.regulated_zones && (
                <div className="flex gap-3 text-sm">
                  <span className="text-lg flex-shrink-0">⚠️</span>
                  <span style={{ color: '#44403c' }}>
                    <strong>Zones réglementées :</strong> {details.regulated_zones}
                  </span>
                </div>
              )}
              {details.terrain_type && (
                <div className="flex gap-3 text-sm">
                  <span className="text-lg flex-shrink-0">🌿</span>
                  <span style={{ color: '#44403c' }}>
                    <strong>Terrain :</strong> {{
                      forest: 'Forêt', coastal: 'Littoral', mountain: 'Montagne', mixed: 'Mixte'
                    }[details.terrain_type]}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {(place.short_description || place.editorial_summary) && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: 'white', border: '1px solid rgba(249,115,22,0.1)', boxShadow: '0 2px 8px rgba(249,115,22,0.06)' }}>
            <p className="text-sm leading-relaxed" style={{ color: '#44403c' }}>
              {place.editorial_summary ?? place.short_description}
            </p>
          </div>
        )}

        {/* Itinéraire CTA */}
        {place.lat && place.lng && (
          <div className="mb-6">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
              style={{
                background: 'linear-gradient(135deg, #f97316, #fb923c)',
                color: 'white',
                fontFamily: 'Nunito, sans-serif',
                boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
              }}
            >
              🧭 Accès au départ — Google Maps
            </a>
          </div>
        )}

        {/* Source + fiabilité */}
        {primarySource && (
          <div
            className="rounded-2xl p-4 mb-6 text-xs"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#78716c' }}
          >
            <span className="font-semibold">Source :</span>{' '}
            {primarySource.source_url ? (
              <a href={primarySource.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#f97316' }}>
                {primarySource.source_label ?? primarySource.source_type}
              </a>
            ) : (
              primarySource.source_label ?? primarySource.source_type
            )}
            {place.last_verified_at && (
              <span className="ml-2" style={{ color: '#d6d3d1' }}>· Vérifié le {formatDate(place.last_verified_at)}</span>
            )}
            <Link href="/methodologie" className="ml-2 hover:underline" style={{ color: '#a8a29e' }}>
              Notre méthode →
            </Link>
          </div>
        )}

        {/* Réactions */}
        <div className="mb-6">
          <ReactionBar placeId={place.id} initialCounts={reactionCounts} />
        </div>

        <AdSlot slotKey="balades_list_inline" className="mb-6" />

        {/* Correction */}
        <div className="rounded-2xl p-5 text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <p className="text-sm mb-3" style={{ color: '#78716c' }}>
            Une information inexacte ou un changement de réglementation ?
          </p>
          <Link
            href={`/proposer?type=correction&place=${place.id}`}
            className="text-sm font-bold underline"
            style={{ color: '#f97316' }}
          >
            Signaler une erreur →
          </Link>
        </div>
      </div>
    </div>
  )
}
