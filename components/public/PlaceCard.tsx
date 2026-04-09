import Link from 'next/link'
import type { Place } from '@/lib/types'

interface Props {
  place: Place
}

const POLICY_CONFIG = {
  allowed:     { label: '✅ Acceptés',       bg: '#f0fdf4', border: '#86efac', color: '#16a34a' },
  conditional: { label: '⚠️ Sous conditions', bg: '#fffbeb', border: '#fde68a', color: '#d97706' },
  disallowed:  { label: '🚫 Interdits',       bg: '#fef2f2', border: '#fca5a5', color: '#dc2626' },
  unknown:     { label: '❓ Non renseigné',   bg: '#f8fafc', border: '#e2e8f0', color: '#64748b' },
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

const CONFIDENCE_DOT: Record<string, string> = {
  high:   '#22c55e',
  medium: '#f59e0b',
  low:    '#94a3b8',
}

export function PlaceCard({ place }: Props) {
  const policy = POLICY_CONFIG[place.dog_policy] ?? POLICY_CONFIG.unknown
  const catSlug = place.category?.slug ?? 'autre'
  const gradient = CATEGORY_GRADIENTS[catSlug] ?? CATEGORY_GRADIENTS.autre

  return (
    <Link
      href={`/lieux/${place.slug}`}
      className="group block rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: 'white',
        boxShadow: '0 2px 8px rgba(249,115,22,0.08), 0 1px 3px rgba(0,0,0,0.06)',
        border: '1px solid rgba(249,115,22,0.08)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.boxShadow = '0 8px 24px rgba(249,115,22,0.14), 0 4px 8px rgba(0,0,0,0.08)'
        el.style.transform = 'translateY(-3px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.boxShadow = '0 2px 8px rgba(249,115,22,0.08), 0 1px 3px rgba(0,0,0,0.06)'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Image area */}
      <div
        className="h-36 relative flex items-end p-3"
        style={{
          background: place.cover_image_url ? `url(${place.cover_image_url}) center/cover` : gradient,
        }}
      >
        {/* Policy badge top-right */}
        <div
          className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{
            background: policy.bg,
            border: `1.5px solid ${policy.border}`,
            color: policy.color,
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          {policy.label}
        </div>

        {/* Category icon bottom-left */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
          style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}
        >
          {place.category?.icon ?? '📌'}
        </div>

        {/* Featured star */}
        {place.is_featured && (
          <div className="absolute top-3 left-3 text-sm">⭐</div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs mb-1 font-semibold" style={{ color: '#a8a29e', fontFamily: 'Nunito, sans-serif' }}>
          {place.category?.label ?? ''}{place.commune?.name ? ` · ${place.commune.name}` : ''}
        </p>
        <h3
          className="text-base mb-2 leading-snug line-clamp-2"
          style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#1c1917' }}
        >
          {place.name}
        </h3>

        {place.short_description && (
          <p className="text-sm line-clamp-2 mb-3" style={{ color: '#78716c' }}>
            {place.short_description}
          </p>
        )}

        {place.dog_policy === 'conditional' && place.dog_conditions_text && (
          <p
            className="text-xs rounded-xl px-3 py-1.5 mb-3 line-clamp-2"
            style={{ background: '#fffbeb', color: '#d97706', fontStyle: 'italic' }}
          >
            {place.dog_conditions_text}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #f5f5f4' }}>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: CONFIDENCE_DOT[place.confidence_level] ?? '#94a3b8' }}
            />
            <span className="text-xs" style={{ color: '#a8a29e' }}>
              {place.confidence_level === 'high'   && 'Fiable'}
              {place.confidence_level === 'medium' && 'Indicatif'}
              {place.confidence_level === 'low'    && 'À confirmer'}
            </span>
            {place.last_verified_at && (
              <span className="text-xs" style={{ color: '#d6d3d1' }}>
                · {new Date(place.last_verified_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
          <span
            className="text-xs font-bold transition-colors group-hover:text-orange-500"
            style={{ color: '#d6d3d1', fontFamily: 'Nunito, sans-serif' }}
          >
            Voir →
          </span>
        </div>
      </div>
    </Link>
  )
}
