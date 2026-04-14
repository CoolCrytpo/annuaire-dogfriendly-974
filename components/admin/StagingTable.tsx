'use client'

import { useState, useCallback } from 'react'

interface StagingItem {
  id: string
  name: string
  category: string | null
  commune: string | null
  dog_policy: string
  confidence_score: number
  status: string
  source_domain: string | null
  source_url: string | null
  admin_notes: string | null
  dedupe_key: string | null
}

interface Props {
  items: StagingItem[]
}

const POLICY_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  allowed:     { label: 'Acceptés',    bg: '#f0fdf4', color: '#16a34a' },
  conditional: { label: 'Conditions',  bg: '#fff7ed', color: '#d97706' },
  disallowed:  { label: 'Interdits',   bg: '#fef2f2', color: '#dc2626' },
  unknown:     { label: 'unknown',     bg: '#f4f4f5', color: '#52525b' },
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  raw_import: { label: 'Import brut', bg: '#f4f4f5', color: '#52525b' },
  to_review:  { label: 'À revoir',    bg: '#eff6ff', color: '#2563eb' },
  accepted:   { label: 'Accepté',     bg: '#f0fdf4', color: '#16a34a' },
  rejected:   { label: 'Rejeté',      bg: '#fef2f2', color: '#dc2626' },
  duplicate:  { label: 'Doublon',     bg: '#fdf4ff', color: '#9333ea' },
}

const STATUS_OPTIONS = ['raw_import', 'to_review', 'accepted', 'rejected', 'duplicate']

export function StagingTable({ items: initial }: Props) {
  const [items, setItems] = useState(initial)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const allSelected = items.length > 0 && selected.size === items.length
  const toggleAll = useCallback(() => {
    setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)))
  }, [allSelected, items])
  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  const updateStatus = async (id: string, status: string) => {
    setLoading(id)
    await fetch(`/api/admin/staging/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i))
    setLoading(null)
  }

  const deleteOne = async (id: string) => {
    if (!confirm('Supprimer cette ligne ?')) return
    setLoading(id)
    await fetch(`/api/admin/staging/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== id))
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next })
    setLoading(null)
  }

  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`Supprimer ${selected.size} ligne(s) ?`)) return
    setLoading('bulk')
    await fetch('/api/admin/staging', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...selected] }),
    })
    const deleted = new Set(selected)
    setItems((prev) => prev.filter((i) => !deleted.has(i.id)))
    setSelected(new Set())
    setFeedback(`${deleted.size} ligne(s) supprimée(s)`)
    setLoading(null)
    setTimeout(() => setFeedback(null), 3000)
  }

  const bulkStatus = async (status: string) => {
    if (selected.size === 0) return
    setLoading('bulk')
    await Promise.all([...selected].map((id) =>
      fetch(`/api/admin/staging/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    ))
    const ids = new Set(selected)
    setItems((prev) => prev.map((i) => ids.has(i.id) ? { ...i, status } : i))
    setSelected(new Set())
    setFeedback(`${ids.size} ligne(s) mises à jour`)
    setLoading(null)
    setTimeout(() => setFeedback(null), 3000)
  }

  return (
    <>
      {/* Bulk toolbar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl flex-wrap"
          style={{ background: '#fff7ed', border: '1.5px solid #fed7aa' }}>
          <span className="text-sm font-bold" style={{ color: '#92400e' }}>
            {selected.size} sélectionné(s)
          </span>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => bulkStatus('accepted')} disabled={loading === 'bulk'}
              className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              ✅ Accepter
            </button>
            <button onClick={() => bulkStatus('rejected')} disabled={loading === 'bulk'}
              className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: '#fef2f2', color: '#dc2626' }}>
              ❌ Rejeter
            </button>
            <button onClick={() => bulkStatus('duplicate')} disabled={loading === 'bulk'}
              className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: '#fdf4ff', color: '#9333ea' }}>
              🔀 Doublon
            </button>
            <button onClick={bulkDelete} disabled={loading === 'bulk'}
              className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: '#fff1f2', color: '#e11d48' }}>
              🗑 Supprimer
            </button>
          </div>
          {feedback && <span className="text-xs font-semibold text-green-700">{feedback}</span>}
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-stone-400 hover:text-stone-600">
            Désélectionner
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-3 py-3 w-8">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
              </th>
              <th className="text-left px-3 py-3">Nom</th>
              <th className="text-left px-3 py-3 hidden md:table-cell">Commune</th>
              <th className="text-left px-3 py-3 hidden sm:table-cell">Catégorie</th>
              <th className="text-left px-3 py-3">Policy</th>
              <th className="text-left px-3 py-3 hidden sm:table-cell">Confiance</th>
              <th className="text-left px-3 py-3">Statut</th>
              <th className="text-left px-3 py-3 hidden lg:table-cell">Source</th>
              <th className="px-3 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr><td colSpan={9} className="text-center py-10 text-gray-400">Aucune ligne</td></tr>
            )}
            {items.map((item) => {
              const policy = POLICY_LABELS[item.dog_policy] ?? POLICY_LABELS.unknown
              const stat = STATUS_LABELS[item.status] ?? STATUS_LABELS.to_review
              const isSelected = selected.has(item.id)
              return (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors"
                  style={{ background: isSelected ? '#fff7ed' : undefined, opacity: loading === item.id ? 0.5 : 1 }}>
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={isSelected} onChange={() => toggle(item.id)} className="rounded" />
                  </td>
                  <td className="px-3 py-3 max-w-[200px]">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell text-gray-600 text-xs">{item.commune ?? '—'}</td>
                  <td className="px-3 py-3 hidden sm:table-cell text-gray-600 text-xs">{item.category ?? '—'}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: policy.bg, color: policy.color }}>
                      {policy.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell text-xs text-gray-500">{item.confidence_score}%</td>
                  <td className="px-3 py-3">
                    <select
                      value={item.status}
                      onChange={(e) => updateStatus(item.id, e.target.value)}
                      disabled={loading === item.id}
                      className="text-xs px-2 py-0.5 rounded-full font-semibold border-0 cursor-pointer"
                      style={{ background: stat.bg, color: stat.color }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]?.label ?? s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell text-xs text-gray-400">
                    {item.source_url ? (
                      <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                        className="hover:underline truncate block max-w-[120px]">
                        {item.source_domain ?? item.source_url}
                      </a>
                    ) : (item.source_domain ?? '—')}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => deleteOne(item.id)}
                      disabled={loading === item.id}
                      className="text-xs text-red-400 hover:text-red-600 font-medium"
                      title="Supprimer"
                    >
                      🗑
                    </button>
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
