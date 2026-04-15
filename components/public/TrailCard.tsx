import Link from 'next/link'
import type { Place, TrailDifficulty, TrailDetails } from '@/lib/types'

interface Props {
  trail: Place
}

const DIFFICULTY_CONFIG: Record<TrailDifficulty, { label: string; color: string; bg: string; dot: string }> = {
  easy:     { label: 'Facile',    color: '#16a34a', bg: '#f0fdf4', dot: '🟢' },
  moderate: { label: 'Modéré',   color: '#d97706', bg: '#fffbeb', dot: '🟡' },
  hard:     { label: 'Difficile', color: '#dc2626', bg: '#fef2f2', dot: '🔴' },
  expert:   { label: 'Expert',    color: '#7c3aed', bg: '#faf5ff', dot: '🟣' },
}

const DOG_POLICY_CONFIG = {
  allowed:     { icon: '✅', color: '#16a34a' },
  conditional: { icon: '⚠️', color: '#d97706' },
  disallowed:  { icon: '🚫', color: '#dc2626' },
  unknown:     { icon: '❓', color: '#64748b' },
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
}

export function TrailCard({ trail }: Props) {
  const details = trail.trail_details as TrailDetails | null
  const difficulty = details?.difficulty ? DIFFICULTY_CONFIG[details.difficulty] : null
  const policy = DOG_POLICY_CONFIG[trail.dog_policy] ?? DOG_POLICY_CONFIG.unknown
  const catSlug = trail.category?.slug ?? 'randonnee'

  const heroGradient = catSlug === 'randonnee'
    ? 'linear-gradient(135deg,#d1fae5,#6ee7b7)'
    : 'linear-gradient(135deg,#dcfce7,#bbf7d0)'

  return (
    <Link
      href={`/balades/${trail.slug}`}
      className="block rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
      style={{
        background: 'white',
        border: '1.5px solid rgba(249,115,22,0.08)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Hero */}
      <div
        className="relative"
        style={{
          height: '140px',
          background: trail.cover_image_url
            ? `url(${trail.cover_image_url}) center/cover`
            : heroGradient,
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(28,25,23,0.4) 0%, transparent 60%)' }}
        />
        {/* Difficulty badge */}
        {difficulty && (
          <div
            className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.92)', color: difficulty.color, fontFamily: 'Nunito, sans-serif' }}
          >
            <span>{difficulty.dot}</span>
            <span>{difficulty.label}</span>
          </div>
        )}
        {/* Dog policy */}
        <div className="absolute top-2.5 right-2.5 text-lg" title={`Chiens : ${trail.dog_policy}`}>
          {policy.icon}
        </div>
        {/* Commune */}
        {trail.commune && (
          <div className="absolute bottom-2.5 left-2.5 text-xs font-semibold text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            📍 {trail.commune.name}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3
          className="font-black text-base mb-1 line-clamp-1"
          style={{ fontFamily: 'Nunito, sans-serif', color: '#1c1917' }}
        >
          {trail.name}
        </h3>
        {trail.short_description && (
          <p className="text-xs line-clamp-2 mb-3" style={{ color: '#78716c' }}>
            {trail.short_description}
          </p>
        )}

        {/* Stats row */}
        {details && (
          <div className="flex gap-3 flex-wrap">
            {details.distance_km != null && (
              <span className="text-xs font-bold flex items-center gap-1" style={{ color: '#44403c' }}>
                <span>📏</span> {details.distance_km} km
              </span>
            )}
            {details.elevation_m != null && (
              <span className="text-xs font-bold flex items-center gap-1" style={{ color: '#44403c' }}>
                <span>⛰️</span> +{details.elevation_m} m
              </span>
            )}
            {details.duration_minutes != null && (
              <span className="text-xs font-bold flex items-center gap-1" style={{ color: '#44403c' }}>
                <span>⏱️</span> {formatDuration(details.duration_minutes)}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          {details?.leash_required && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: '#fef3c7', color: '#92400e', fontFamily: 'Nunito, sans-serif' }}
            >
              Laisse obligatoire
            </span>
          )}
          {details?.has_water_points && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: '#dbeafe', color: '#1e40af', fontFamily: 'Nunito, sans-serif' }}
            >
              💧 Point d'eau
            </span>
          )}
          {details?.regulated_zones && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: '#fef2f2', color: '#dc2626', fontFamily: 'Nunito, sans-serif' }}
            >
              ⚠️ Zone réglementée
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
