'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { TrailCard } from '@/components/public/TrailCard'
import type { Place, Commune } from '@/lib/types'

const DIFFICULTY_CHIPS = [
  { value: '',         label: 'Tous',      dot: '🐾' },
  { value: 'easy',    label: 'Facile',    dot: '🟢' },
  { value: 'moderate',label: 'Modéré',   dot: '🟡' },
  { value: 'hard',    label: 'Difficile', dot: '🔴' },
  { value: 'expert',  label: 'Expert',    dot: '🟣' },
]

function BaladesContent() {
  const sp = useSearchParams()
  const router = useRouter()

  const [trails, setTrails] = useState<Place[]>([])
  const [total, setTotal] = useState(0)
  const [communes, setCommunes] = useState<Commune[]>([])
  const [loading, setLoading] = useState(true)

  const currentDifficulty = sp.get('difficulty') ?? ''
  const currentCommune    = sp.get('commune_slug') ?? ''
  const currentQ          = sp.get('q') ?? ''
  const currentPage       = Math.max(1, parseInt(sp.get('page') ?? '1'))
  const PER_PAGE = 24

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`/balades?${params.toString()}`)
  }, [router, sp])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams(sp.toString())
    fetch(`/api/trails?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setTrails(data.items ?? [])
        setTotal(data.total ?? 0)
        setCommunes(data.communes ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sp])

  const totalPages = Math.ceil(total / PER_PAGE)
  const hasFilters = !!(currentDifficulty || currentCommune || currentQ)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl sm:text-3xl"
            style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, color: '#1c1917' }}
          >
            Balades & randonnées
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#78716c' }}>
            🥾 La Réunion
            {total > 0 && (
              <> · <span style={{ fontWeight: 700, color: '#f97316' }}>{total}</span> itinéraire{total > 1 ? 's' : ''}</>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">🔍</span>
          <input
            type="search"
            placeholder="Rechercher une balade, un cirque, une forêt…"
            defaultValue={currentQ}
            onKeyDown={(e) => { if (e.key === 'Enter') update('q', (e.target as HTMLInputElement).value) }}
            onBlur={(e) => { if (e.target.value !== currentQ) update('q', e.target.value) }}
            className="w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none"
            style={{
              background: 'white',
              border: '1.5px solid rgba(249,115,22,0.2)',
              boxShadow: '0 2px 8px rgba(249,115,22,0.08)',
              color: '#1c1917',
              fontFamily: 'Nunito, sans-serif',
            }}
          />
        </div>

        {/* Difficulty chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {DIFFICULTY_CHIPS.map((chip) => {
            const active = currentDifficulty === chip.value
            return (
              <button
                key={chip.value}
                onClick={() => update('difficulty', chip.value)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold transition-all"
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  background: active ? '#fff7ed' : '#f8fafc',
                  color: active ? '#f97316' : '#78716c',
                  border: `1.5px solid ${active ? '#f97316' : 'rgba(0,0,0,0.08)'}`,
                }}
              >
                <span>{chip.dot}</span>
                {chip.label}
              </button>
            )
          })}
        </div>

        {/* Commune + clear */}
        <div className="flex items-center gap-3">
          <select
            value={currentCommune}
            onChange={(e) => update('commune_slug', e.target.value)}
            className="flex-1 sm:flex-none rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none appearance-none"
            style={{
              background: 'white',
              border: '1.5px solid rgba(249,115,22,0.2)',
              color: currentCommune ? '#1c1917' : '#78716c',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            <option value="">🏝️ Toute La Réunion</option>
            {communes.map((c) => (
              <option key={c.slug} value={c.slug}>📍 {c.name}</option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={() => router.push('/balades')}
              className="text-xs font-bold px-3 py-2 rounded-full"
              style={{ color: '#ef4444', background: '#fef2f2', fontFamily: 'Nunito, sans-serif' }}
            >
              ✕ Effacer
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white animate-pulse" style={{ height: '280px', border: '1.5px solid rgba(249,115,22,0.08)' }} />
          ))}
        </div>
      ) : trails.length === 0 ? (
        <div
          className="text-center py-20 rounded-3xl"
          style={{ background: 'white', border: '1.5px dashed rgba(249,115,22,0.2)' }}
        >
          <p className="text-5xl mb-4 animate-float">🥾</p>
          <p className="text-lg mb-2" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#1c1917' }}>
            Aucune balade trouvée
          </p>
          <p className="text-sm mb-6" style={{ color: '#78716c' }}>
            Ajustez vos filtres ou proposez un itinéraire à notre équipe.
          </p>
          <a href="/proposer" className="btn-primary">➕ Proposer une balade</a>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trails.map((trail) => (
              <TrailCard key={trail.id} trail={trail} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => {
                const params = new URLSearchParams(sp.toString())
                params.set('page', String(p))
                return (
                  <a
                    key={p}
                    href={`/balades?${params.toString()}`}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{
                      fontFamily: 'Nunito, sans-serif',
                      background: p === currentPage ? 'linear-gradient(135deg, #f97316, #fb923c)' : 'white',
                      color: p === currentPage ? 'white' : '#78716c',
                      boxShadow: p === currentPage ? '0 4px 12px rgba(249,115,22,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                      border: `1.5px solid ${p === currentPage ? '#f97316' : 'rgba(249,115,22,0.1)'}`,
                    }}
                  >
                    {p}
                  </a>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function BaladesPage() {
  return (
    <Suspense>
      <BaladesContent />
    </Suspense>
  )
}
