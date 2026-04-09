'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { PlaceCategory, Commune, DogPolicy } from '@/lib/types'

interface Props {
  categories: PlaceCategory[]
  communes: Commune[]
}

const POLICY_OPTIONS: { value: DogPolicy | ''; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'allowed', label: '✅ Acceptés' },
  { value: 'conditional', label: '⚠️ Sous conditions' },
  { value: 'disallowed', label: '🚫 Interdits' },
  { value: 'unknown', label: '❓ Non renseigné' },
]

export function SearchFilters({ categories, communes }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`/annuaire?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      {/* Recherche */}
      <div className="flex-1 min-w-0">
        <label htmlFor="q" className="sr-only">Rechercher</label>
        <input
          id="q"
          type="search"
          placeholder="Rechercher un lieu…"
          defaultValue={searchParams.get('q') ?? ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter') update('q', (e.target as HTMLInputElement).value)
          }}
          onBlur={(e) => update('q', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Politique chien */}
      <select
        aria-label="Filtrer par politique chien"
        defaultValue={searchParams.get('dog_policy') ?? ''}
        onChange={(e) => update('dog_policy', e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
      >
        {POLICY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Catégorie */}
      <select
        aria-label="Filtrer par catégorie"
        defaultValue={searchParams.get('category_slug') ?? ''}
        onChange={(e) => update('category_slug', e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
      >
        <option value="">Toutes les catégories</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>
        ))}
      </select>

      {/* Commune */}
      <select
        aria-label="Filtrer par commune"
        defaultValue={searchParams.get('commune_slug') ?? ''}
        onChange={(e) => update('commune_slug', e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
      >
        <option value="">Toute La Réunion</option>
        {communes.map((c) => (
          <option key={c.slug} value={c.slug}>{c.name}</option>
        ))}
      </select>
    </div>
  )
}
