'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DogPolicyBadge } from '@/components/ui/DogPolicyBadge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import type { Place, VerificationStatus } from '@/lib/types'
import { formatDateShort } from '@/lib/utils/slug'

interface Props {
  places: Place[]
}

const BULK_ACTIONS = [
  { value: 'publish',       label: '✅ Publier',         color: '#16a34a' },
  { value: 'unpublish',     label: '📝 Dépublier',       color: '#78716c' },
  { value: 'needs_recheck', label: '🔄 Marquer recheck', color: '#f97316' },
  { value: 'archive',       label: '🗄️ Archiver',        color: '#ef4444' },
]

export function PlacesBulkTable({ places }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const allSelected = places.length > 0 && selected.size === places.length

  const toggleAll = useCallback(() => {
    setSelected(allSelected ? new Set() : new Set(places.map((p) => p.id)))
  }, [allSelected, places])

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const applyBulk = async (action: string) => {
    if (selected.size === 0) return
    setApplying(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/places/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected], action }),
      })
      const data = await res.json()
      setFeedback(`✅ ${data.updated ?? 0} fiche(s) mises à jour`)
      setSelected(new Set())
      // Reload page to reflect changes
      setTimeout(() => window.location.reload(), 800)
    } catch {
      setFeedback('❌ Erreur lors de l\'action')
    } finally {
      setApplying(false)
    }
  }

  return (
    <>
      {/* Bulk toolbar */}
      {selected.size > 0 && (
        <div
          className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl flex-wrap"
          style={{ background: '#fff7ed', border: '1.5px solid #fed7aa' }}
        >
          <span className="text-sm font-bold" style={{ color: '#92400e', fontFamily: 'Nunito, sans-serif' }}>
            {selected.size} sélectionné(s)
          </span>
          <div className="flex gap-2 flex-wrap">
            {BULK_ACTIONS.map((a) => (
              <button
                key={a.value}
                onClick={() => applyBulk(a.value)}
                disabled={applying}
                className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                style={{ background: 'white', color: a.color, border: `1.5px solid ${a.color}30`, fontFamily: 'Nunito, sans-serif' }}
              >
                {applying ? '…' : a.label}
              </button>
            ))}
          </div>
          {feedback && (
            <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>{feedback}</span>
          )}
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-stone-400 hover:text-stone-600"
          >
            Désélectionner
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded"
                  aria-label="Tout sélectionner"
                />
              </th>
              <th className="text-left px-4 py-3">Nom</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Commune</th>
              <th className="text-left px-4 py-3">Chiens</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Confiance</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Mis à jour</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {places.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-400">Aucune fiche trouvée</td>
              </tr>
            )}
            {places.map((place) => {
              const isSelected = selected.has(place.id)
              return (
                <tr
                  key={place.id}
                  className="hover:bg-gray-50 transition-colors"
                  style={{ background: isSelected ? '#fff7ed' : undefined }}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(place.id)}
                      className="rounded"
                      aria-label={`Sélectionner ${place.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 truncate max-w-[200px]">{place.name}</p>
                    <p className="text-xs text-gray-400">{place.category?.label}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                    {place.commune?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <DogPolicyBadge policy={place.dog_policy} size="sm" showIcon={false} />
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <ConfidenceBadge level={place.confidence_level} showDate={false} />
                    <span className="ml-1 text-xs text-gray-400">{place.confidence_score}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={place.verification_status as VerificationStatus} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                    {formatDateShort(place.updated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/places/${place.id}`}
                      className="text-green-700 hover:underline text-xs font-medium"
                    >
                      Éditer
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
