'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { PlaceCard } from '@/components/public/PlaceCard'
import type { Place, PlaceCategory, Commune } from '@/lib/types'

const MapView = dynamic(() => import('@/components/public/MapView').then(m => ({ default: m.MapView })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full" style={{ background: '#f8fafc' }}>
      <div className="text-center">
        <div className="text-4xl mb-3 animate-float">🗺️</div>
        <p className="text-sm" style={{ color: '#78716c' }}>Chargement de la carte…</p>
      </div>
    </div>
  ),
})

interface Props {
  places: Place[]
  total: number
  totalPages: number
  currentPage: number
  searchParamsStr: string
  categories: PlaceCategory[]
  communes: Commune[]
  children: React.ReactNode
  title?: string
  subtitle?: string
  basePath?: string // ex: '/lieux' ou '/spots'
}

export function AnnuaireView({
  places,
  total,
  totalPages,
  currentPage,
  searchParamsStr,
  children,
  title = 'Lieux dog-friendly',
  subtitle,
  basePath = '/lieux',
}: Props) {
  const [view, setView] = useState<'list' | 'map'>('list')

  const defaultSubtitle = (
    <>
      🏝️ La Réunion
      {total > 0 && (
        <> · <span style={{ fontWeight: 700, color: '#f97316' }}>{total}</span> lieu{total > 1 ? 'x' : ''}</>
      )}
    </>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl sm:text-3xl"
            style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, color: '#1c1917' }}
          >
            {title}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#78716c' }}>
            {subtitle ?? defaultSubtitle}
          </p>
        </div>

        {/* Toggle vue */}
        <div
          className="flex p-1 rounded-2xl"
          style={{ background: 'white', border: '1.5px solid rgba(249,115,22,0.12)', boxShadow: '0 2px 8px rgba(249,115,22,0.08)' }}
        >
          <button
            onClick={() => setView('list')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              fontFamily: 'Nunito, sans-serif',
              background: view === 'list' ? 'linear-gradient(135deg, #f97316, #fb923c)' : 'transparent',
              color: view === 'list' ? 'white' : '#78716c',
              boxShadow: view === 'list' ? '0 2px 8px rgba(249,115,22,0.3)' : 'none',
            }}
          >
            <span aria-hidden>☰</span>
            <span className="hidden sm:inline">Liste</span>
          </button>
          <button
            onClick={() => setView('map')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              fontFamily: 'Nunito, sans-serif',
              background: view === 'map' ? 'linear-gradient(135deg, #f97316, #fb923c)' : 'transparent',
              color: view === 'map' ? 'white' : '#78716c',
              boxShadow: view === 'map' ? '0 2px 8px rgba(249,115,22,0.3)' : 'none',
            }}
          >
            <span aria-hidden>🗺️</span>
            <span className="hidden sm:inline">Carte</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">{children}</div>

      {/* Content */}
      {view === 'list' ? (
        <>
          {places.length === 0 ? (
            <div
              className="text-center py-20 rounded-3xl"
              style={{ background: 'white', border: '1.5px dashed rgba(249,115,22,0.2)' }}
            >
              <p className="text-5xl mb-4 animate-float">🐾</p>
              <p
                className="text-lg mb-2"
                style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#1c1917' }}
              >
                Aucun lieu trouvé
              </p>
              <p className="text-sm mb-6" style={{ color: '#78716c' }}>
                Essayez d&apos;ajuster vos filtres, ou proposez ce lieu à notre équipe !
              </p>
              <a href="/proposer" className="btn-primary">
                ➕ Proposer un lieu
              </a>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {places.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => {
                    const params = new URLSearchParams(searchParamsStr)
                    params.set('page', String(p))
                    return (
                      <a
                        key={p}
                        href={`${basePath}?${params.toString()}`}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all"
                        style={{
                          fontFamily: 'Nunito, sans-serif',
                          background: p === currentPage
                            ? 'linear-gradient(135deg, #f97316, #fb923c)'
                            : 'white',
                          color: p === currentPage ? 'white' : '#78716c',
                          boxShadow: p === currentPage
                            ? '0 4px 12px rgba(249,115,22,0.3)'
                            : '0 1px 4px rgba(0,0,0,0.06)',
                          border: '1.5px solid',
                          borderColor: p === currentPage ? '#f97316' : 'rgba(249,115,22,0.1)',
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
        </>
      ) : (
        /* Carte */
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            height: 'calc(100vh - 220px)',
            minHeight: '400px',
            maxHeight: '700px',
            boxShadow: '0 4px 24px rgba(249,115,22,0.12)',
            border: '1.5px solid rgba(249,115,22,0.1)',
          }}
        >
          <MapView places={places} />
        </div>
      )}
    </div>
  )
}
