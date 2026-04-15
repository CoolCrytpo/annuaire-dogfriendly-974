'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import type { PlaceCategory, Commune, DogPolicy } from '@/lib/types'

interface Props {
  categories: PlaceCategory[]
  communes: Commune[]
  basePath?: string
}

const POLICY_CHIPS: { value: DogPolicy | ''; label: string; icon: string; cls: string }[] = [
  { value: '',            label: 'Tous',           icon: '🐾',  cls: 'chip-default' },
  { value: 'allowed',    label: 'Acceptés',        icon: '✅',  cls: 'chip-allowed' },
  { value: 'conditional',label: 'Sous conditions', icon: '⚠️', cls: 'chip-conditional' },
  { value: 'disallowed', label: 'Interdits',       icon: '🚫', cls: 'chip-disallowed' },
  { value: 'unknown',    label: 'Non renseigné',   icon: '❓',  cls: 'chip-unknown' },
]

export function SearchFilters({ categories, communes, basePath = '/lieux' }: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const searchRef = useRef<HTMLInputElement>(null)
  const [showMoreFilters, setShowMoreFilters] = useState(false)

  const currentPolicy = sp.get('dog_policy') ?? ''
  const currentCat    = sp.get('category_slug') ?? ''
  const currentCommune = sp.get('commune_slug') ?? ''
  const currentQ      = sp.get('q') ?? ''

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      params.delete('page')
      router.push(`${basePath}?${params.toString()}`)
    },
    [router, sp, basePath]
  )

  const clearAll = () => {
    if (searchRef.current) searchRef.current.value = ''
    router.push(basePath)
  }

  const hasFilters = !!(currentPolicy || currentCat || currentCommune || currentQ)

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none" aria-hidden>🔍</span>
        <input
          ref={searchRef}
          type="search"
          placeholder="Rechercher un lieu, une plage, un restaurant…"
          defaultValue={currentQ}
          onKeyDown={(e) => {
            if (e.key === 'Enter') update('q', (e.target as HTMLInputElement).value)
          }}
          onBlur={(e) => {
            if (e.target.value !== currentQ) update('q', e.target.value)
          }}
          className="w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none transition-all"
          style={{
            background: 'white',
            border: '1.5px solid rgba(249,115,22,0.2)',
            boxShadow: '0 2px 8px rgba(249,115,22,0.08)',
            color: '#1c1917',
            fontFamily: 'Nunito, sans-serif',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#f97316'
            e.currentTarget.style.boxShadow = '0 2px 16px rgba(249,115,22,0.18)'
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(249,115,22,0.08)'
          }}
        />
      </div>

      {/* Policy chips — horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {POLICY_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => update('dog_policy', chip.value)}
            className={`chip flex-shrink-0 ${chip.cls} ${currentPolicy === chip.value ? 'chip-active' : ''}`}
          >
            <span aria-hidden>{chip.icon}</span>
            {chip.label}
          </button>
        ))}
      </div>

      {/* More filters toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className="text-sm font-bold flex items-center gap-1.5 transition-colors"
          style={{ color: showMoreFilters ? '#f97316' : '#78716c', fontFamily: 'Nunito, sans-serif' }}
        >
          <span>{showMoreFilters ? '▲' : '▼'}</span>
          {showMoreFilters ? 'Moins de filtres' : 'Plus de filtres'} (catégorie, commune)
        </button>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs font-bold px-3 py-1.5 rounded-full transition-all"
            style={{ color: '#ef4444', background: '#fef2f2', fontFamily: 'Nunito, sans-serif' }}
          >
            ✕ Effacer les filtres
          </button>
        )}
      </div>

      {/* Extended filters */}
      {showMoreFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Catégorie */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#78716c', fontFamily: 'Nunito, sans-serif' }}>
              Catégorie
            </label>
            <select
              value={currentCat}
              onChange={(e) => update('category_slug', e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none transition-all appearance-none cursor-pointer"
              style={{
                background: 'white',
                border: '1.5px solid rgba(249,115,22,0.2)',
                color: currentCat ? '#1c1917' : '#78716c',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              <option value="">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          {/* Commune */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#78716c', fontFamily: 'Nunito, sans-serif' }}>
              Commune
            </label>
            <select
              value={currentCommune}
              onChange={(e) => update('commune_slug', e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none transition-all appearance-none cursor-pointer"
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
          </div>
        </div>
      )}
    </div>
  )
}
