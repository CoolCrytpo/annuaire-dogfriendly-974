import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPlaceBySlug, getPlaceSources } from '@/lib/db/queries'
import { SubmissionForm } from '@/components/public/SubmissionForm'
import { formatDate } from '@/lib/utils/slug'

interface PageProps {
  params: Promise<{ slug: string }>
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  restaurant: 'linear-gradient(135deg,#fee2e2,#fecaca)',
  cafe:        'linear-gradient(135deg,#fef3c7,#fde68a)',
  bar:         'linear-gradient(135deg,#ede9fe,#ddd6fe)',
  hotel:       'linear-gradient(135deg,#dbeafe,#bfdbfe)',
  gite:        'linear-gradient(135deg,#d1fae5,#a7f3d0)',
  plage:       'linear-gradient(135deg,#cffafe,#a5f3fc)',
  parc:        'linear-gradient(135deg,#dcfce7,#bbf7d0)',
  randonnee:   'linear-gradient(135deg,#d1fae5,#6ee7b7)',
  commerce:    'linear-gradient(135deg,#fce7f3,#fbcfe8)',
  veterinaire: 'linear-gradient(135deg,#dbeafe,#93c5fd)',
  toilettage:  'linear-gradient(135deg,#fae8ff,#e9d5ff)',
  pension:     'linear-gradient(135deg,#fef9c3,#fef08a)',
  activite:    'linear-gradient(135deg,#ffedd5,#fed7aa)',
  transport:   'linear-gradient(135deg,#f1f5f9,#e2e8f0)',
  autre:       'linear-gradient(135deg,#f3f4f6,#e5e7eb)',
}

const POLICY_CONFIG = {
  allowed:     {
    label: 'Chiens acceptés',
    icon: '✅',
    bg: '#f0fdf4',
    border: '#86efac',
    color: '#16a34a',
    desc: 'Les chiens sont les bienvenus dans cet établissement.',
  },
  conditional: {
    label: 'Sous conditions',
    icon: '⚠️',
    bg: '#fffbeb',
    border: '#fde68a',
    color: '#d97706',
    desc: 'Les chiens sont acceptés mais avec des restrictions.',
  },
  disallowed: {
    label: 'Chiens interdits',
    icon: '🚫',
    bg: '#fef2f2',
    border: '#fca5a5',
    color: '#dc2626',
    desc: 'Les chiens ne sont pas autorisés dans cet établissement.',
  },
  unknown: {
    label: 'Non renseigné',
    icon: '❓',
    bg: '#f8fafc',
    border: '#e2e8f0',
    color: '#64748b',
    desc: "La politique d'accueil des chiens n'est pas encore confirmée.",
  },
}

const CONFIDENCE_CONFIG = {
  high:   { label: 'Information fiable', color: '#16a34a', bg: '#f0fdf4', dot: '#22c55e' },
  medium: { label: 'Information indicative', color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
  low:    { label: 'À confirmer', color: '#64748b', bg: '#f8fafc', dot: '#94a3b8' },
}

const SOURCE_LABELS: Record<string, string> = {
  official_website: 'Site officiel',
  phone_call: 'Contact téléphonique',
  onsite_check: 'Visite terrain',
  manual: 'Vérification manuelle',
  google_places: 'Google Places',
  osm: 'OpenStreetMap',
  user_submission: 'Contribution utilisateur',
  partner_feed: 'Partenaire',
  social_page: 'Réseau social',
  booking_site: "Site de réservation",
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const place = await getPlaceBySlug(slug)
    if (!place) return {}
    return {
      title: `${place.name} — ${place.commune?.name ?? 'La Réunion'}`,
      description: place.short_description ?? `Politique chien et informations pratiques pour ${place.name}.`,
    }
  } catch { return {} }
}

export default async function PlacePage({ params }: PageProps) {
  const { slug } = await params

  let place = null
  let sources: Awaited<ReturnType<typeof getPlaceSources>> = []
  try {
    place = await getPlaceBySlug(slug)
    if (place) sources = await getPlaceSources(place.id)
  } catch { /* DB non configurée */ }

  if (!place) return notFound()

  const policy = POLICY_CONFIG[place.dog_policy] ?? POLICY_CONFIG.unknown
  const confidence = CONFIDENCE_CONFIG[place.confidence_level] ?? CONFIDENCE_CONFIG.low
  const primarySource = sources.find((s) => s.is_primary)
  const catSlug = place.category?.slug ?? 'autre'
  const heroGradient = CATEGORY_GRADIENTS[catSlug] ?? CATEGORY_GRADIENTS.autre

  return (
    <div>
      {/* Hero image */}
      <div
        className="w-full relative overflow-hidden"
        style={{
          height: '240px',
          background: place.cover_image_url
            ? `url(${place.cover_image_url}) center/cover`
            : heroGradient,
        }}
      >
        {/* Overlay for text readability */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(28,25,23,0.6) 0%, transparent 60%)' }}
        />

        {/* Breadcrumb */}
        <div className="absolute top-4 left-4 right-4 max-w-3xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <Link href="/annuaire" className="hover:text-white transition-colors">Annuaire</Link>
            <span>/</span>
            {place.commune && (
              <>
                <Link href={`/communes/${place.commune.slug}`} className="hover:text-white transition-colors">
                  {place.commune.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-white font-semibold truncate">{place.name}</span>
          </nav>
        </div>

        {/* Place name overlay */}
        <div className="absolute bottom-4 left-4 right-4 max-w-3xl mx-auto">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.9)', color: '#44403c', fontFamily: 'Nunito, sans-serif' }}
                >
                  {place.category?.icon} {place.category?.label}
                </span>
              </div>
              <h1
                className="text-2xl sm:text-3xl text-white"
                style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
              >
                {place.name}
              </h1>
              {(place.address_text || place.commune) && (
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  📍 {place.address_text ?? place.commune?.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Dog policy — bloc principal */}
        <div
          className="rounded-3xl p-6 mb-6 relative overflow-hidden"
          style={{
            background: policy.bg,
            border: `2px solid ${policy.border}`,
            boxShadow: `0 4px 20px ${policy.color}15`,
          }}
        >
          <div className="flex items-start gap-4">
            <span className="text-4xl flex-shrink-0" style={{ lineHeight: 1 }}>{policy.icon}</span>
            <div className="flex-1">
              <h2
                className="text-xl mb-1"
                style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, color: policy.color }}
              >
                {policy.label}
              </h2>
              {place.dog_conditions_text ? (
                <p className="text-sm leading-relaxed" style={{ color: '#44403c' }}>
                  {place.dog_conditions_text}
                </p>
              ) : (
                <p className="text-sm" style={{ color: '#78716c' }}>{policy.desc}</p>
              )}
              {place.dog_policy === 'unknown' && (
                <Link href="#corriger" className="mt-2 inline-block text-xs font-bold underline" style={{ color: '#64748b' }}>
                  Vous la connaissez ? Signalez-la →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {(place.short_description || place.editorial_summary) && (
          <div
            className="rounded-2xl p-5 mb-6"
            style={{ background: 'white', border: '1px solid rgba(249,115,22,0.1)', boxShadow: '0 2px 8px rgba(249,115,22,0.06)' }}
          >
            <p className="text-sm leading-relaxed" style={{ color: '#44403c' }}>
              {place.editorial_summary ?? place.short_description}
            </p>
          </div>
        )}

        {/* Infos pratiques */}
        {(place.address_text || place.phone || place.website_url || place.opening_hours_text || place.email_public) && (
          <div
            className="rounded-2xl p-5 mb-6"
            style={{ background: 'white', border: '1px solid rgba(249,115,22,0.1)', boxShadow: '0 2px 8px rgba(249,115,22,0.06)' }}
          >
            <h2
              className="text-sm font-bold mb-4 uppercase tracking-wider"
              style={{ color: '#f97316', fontFamily: 'Nunito, sans-serif' }}
            >
              Infos pratiques
            </h2>
            <div className="space-y-3">
              {place.address_text && (
                <div className="flex gap-3 text-sm">
                  <span className="text-lg flex-shrink-0" aria-hidden>📍</span>
                  <span style={{ color: '#44403c' }}>{place.address_text}</span>
                </div>
              )}
              {place.phone && (
                <div className="flex gap-3 text-sm">
                  <span className="text-lg flex-shrink-0" aria-hidden>📞</span>
                  <a href={`tel:${place.phone}`} className="font-semibold hover:underline" style={{ color: '#f97316' }}>
                    {place.phone}
                  </a>
                </div>
              )}
              {place.website_url && (
                <div className="flex gap-3 text-sm">
                  <span className="text-lg flex-shrink-0" aria-hidden>🌐</span>
                  <a
                    href={place.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold hover:underline truncate"
                    style={{ color: '#f97316' }}
                  >
                    {(() => { try { return new URL(place.website_url).hostname } catch { return place.website_url } })()}
                  </a>
                </div>
              )}
              {place.email_public && (
                <div className="flex gap-3 text-sm">
                  <span className="text-lg flex-shrink-0" aria-hidden>✉️</span>
                  <a href={`mailto:${place.email_public}`} className="font-semibold hover:underline" style={{ color: '#f97316' }}>
                    {place.email_public}
                  </a>
                </div>
              )}
              {place.opening_hours_text && (
                <div className="flex gap-3 text-sm">
                  <span className="text-lg flex-shrink-0" aria-hidden>🕐</span>
                  <span style={{ color: '#44403c' }}>{place.opening_hours_text}</span>
                </div>
              )}
            </div>

            {/* CTA directions */}
            {place.lat && place.lng && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #fb923c)',
                  color: 'white',
                  fontFamily: 'Nunito, sans-serif',
                  boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
                }}
              >
                🧭 Itinéraire Google Maps
              </a>
            )}
          </div>
        )}

        {/* Niveau de confiance */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: confidence.bg, border: `1.5px solid ${confidence.dot}30` }}
        >
          <h2
            className="text-sm font-bold mb-3 uppercase tracking-wider"
            style={{ color: confidence.dot, fontFamily: 'Nunito, sans-serif' }}
          >
            📊 Fiabilité de l&apos;information
          </h2>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: confidence.dot }} />
            <span className="font-bold text-sm" style={{ color: confidence.color, fontFamily: 'Nunito, sans-serif' }}>
              {confidence.label}
            </span>
            <span className="text-xs" style={{ color: '#a8a29e' }}>
              (score : {place.confidence_score}/100)
            </span>
          </div>
          {place.last_verified_at && (
            <p className="text-xs mb-2" style={{ color: '#78716c' }}>
              Dernière vérification : {formatDate(place.last_verified_at)}
            </p>
          )}
          {primarySource && (
            <div className="text-xs pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.08)', color: '#78716c' }}>
              <span className="font-semibold">Source principale :</span>{' '}
              {primarySource.source_url ? (
                <a
                  href={primarySource.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:underline"
                  style={{ color: '#f97316' }}
                >
                  {primarySource.source_label ?? SOURCE_LABELS[primarySource.source_type] ?? primarySource.source_type}
                </a>
              ) : (
                <span>{primarySource.source_label ?? SOURCE_LABELS[primarySource.source_type] ?? primarySource.source_type}</span>
              )}
              {primarySource.published_or_seen_at && (
                <span style={{ color: '#d6d3d1' }}> ({formatDate(primarySource.published_or_seen_at)})</span>
              )}
            </div>
          )}
          {sources.length > 1 && (
            <details className="mt-3">
              <summary className="text-xs font-semibold cursor-pointer" style={{ color: '#78716c' }}>
                Voir toutes les sources ({sources.length})
              </summary>
              <ul className="mt-2 space-y-1.5">
                {sources.map((s) => (
                  <li key={s.id} className="text-xs flex items-start gap-1.5" style={{ color: '#78716c' }}>
                    <span style={{ color: s.is_primary ? '#f97316' : '#d6d3d1' }}>{s.is_primary ? '★' : '·'}</span>
                    {s.source_url ? (
                      <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#f97316' }}>
                        {s.source_label ?? SOURCE_LABELS[s.source_type] ?? s.source_type}
                      </a>
                    ) : (
                      <span>{s.source_label ?? SOURCE_LABELS[s.source_type] ?? s.source_type}</span>
                    )}
                    {s.claim_dog_policy && <span style={{ color: '#d6d3d1' }}>→ {s.claim_dog_policy}</span>}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <Link
            href="/methodologie"
            className="mt-3 inline-block text-xs hover:underline"
            style={{ color: '#a8a29e' }}
          >
            Comment nous évaluons la fiabilité →
          </Link>
        </div>

        {/* Formulaire correction */}
        <div
          id="corriger"
          className="rounded-3xl p-6"
          style={{ background: 'white', border: '1px solid rgba(249,115,22,0.1)', boxShadow: '0 2px 8px rgba(249,115,22,0.06)' }}
        >
          <h2
            className="text-lg mb-1"
            style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, color: '#1c1917' }}
          >
            ✏️ Une information inexacte ?
          </h2>
          <p className="text-sm mb-5" style={{ color: '#78716c' }}>
            Signalez-le, notre équipe met à jour la fiche après vérification.
          </p>
          <SubmissionForm type="correction" relatedPlaceId={place.id} relatedPlaceName={place.name} />
        </div>
      </div>
    </div>
  )
}
