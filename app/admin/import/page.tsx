'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface Candidate {
  id: string
  name: string
  category_slug: string | null
  commune_slug: string | null
  address_text: string | null
  dog_policy: string
  source_label: string | null
  source_url: string | null
  review_status: string
  created_at: string
}

interface Batch {
  id: string
  name: string
  source_type: string
  status: string
  total_count: number
  accepted_count: number
  rejected_count: number
  pending_count: number
  created_at: string
}

const DOG_POLICY_LABELS: Record<string, string> = {
  allowed: '✅ Acceptés',
  conditional: '⚠️ Sous conditions',
  disallowed: '🚫 Interdits',
  unknown: '❓ Non renseigné',
}

export default function AdminImportPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [batchName, setBatchName] = useState('')
  const [preview, setPreview] = useState<unknown[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadBatches = async () => {
    setLoadingBatches(true)
    try {
      const r = await fetch('/api/admin/import')
      const data = await r.json()
      setBatches(data.batches ?? [])
    } finally {
      setLoadingBatches(false)
    }
  }

  const loadCandidates = async (batchId: string) => {
    setSelectedBatch(batchId)
    const r = await fetch(`/api/admin/import?batch_id=${batchId}`)
    const data = await r.json()
    setCandidates(data.candidates ?? [])
  }

  function parseCsv(text: string): Record<string, unknown>[] {
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (lines.length < 2) return []
    const headers = lines[0].split(';').map(h => h.trim().replace(/^"|"$/g, ''))
    return lines.slice(1).map(line => {
      const values = line.split(';').map(v => v.trim().replace(/^"|"$/g, ''))
      const obj: Record<string, unknown> = {}
      headers.forEach((h, i) => { if (h) obj[h] = values[i] ?? null })
      return obj
    }).filter(r => String(r.name ?? '').trim())
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        let items: unknown[]
        if (file.name.toLowerCase().endsWith('.csv')) {
          items = parseCsv(text)
          if (items.length === 0) throw new Error('CSV vide ou format invalide')
        } else {
          const json = JSON.parse(text)
          items = Array.isArray(json) ? json : json.places ?? json.items ?? []
        }
        setPreview(items.slice(0, 5))
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fichier invalide.')
        setPreview(null)
      }
    }
    reader.readAsText(file)
  }

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file || !batchName) return
    setUploading(true)
    setError(null)
    try {
      const text = await file.text()
      let items: Record<string, unknown>[]
      if (file.name.toLowerCase().endsWith('.csv')) {
        items = parseCsv(text)
        if (items.length === 0) throw new Error('CSV vide ou format invalide')
      } else {
        const json = JSON.parse(text) as Record<string, unknown>
        const raw = Array.isArray(json) ? json : (json.places ?? json.items ?? [])
        items = raw as Record<string, unknown>[]
      }

      // Chunked upload: send max 500 items per request
      const CHUNK = 500
      for (let offset = 0; offset < items.length; offset += CHUNK) {
        const chunk = items.slice(offset, offset + CHUNK)
        const chunkName = items.length > CHUNK
          ? `${batchName} (${offset + 1}–${Math.min(offset + CHUNK, items.length)})`
          : batchName
        const res = await fetch('/api/admin/import/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: chunkName, items: chunk }),
        })
        if (!res.ok) {
          const body = await res.text()
          throw new Error(`Erreur import (chunk ${offset / CHUNK + 1}): ${body.slice(0, 120)}`)
        }
      }

      setBatchName('')
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      await loadBatches()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setUploading(false)
    }
  }

  const acceptCandidate = async (id: string) => {
    setActionLoading(id)
    await fetch(`/api/admin/import/candidates/${id}/accept`, { method: 'POST' })
    setCandidates((c) => c.map((x) => x.id === id ? { ...x, review_status: 'accepted' } : x))
    setActionLoading(null)
  }

  const rejectCandidate = async (id: string) => {
    setActionLoading(id)
    await fetch(`/api/admin/import/candidates/${id}/reject`, { method: 'POST' })
    setCandidates((c) => c.map((x) => x.id === id ? { ...x, review_status: 'rejected' } : x))
    setActionLoading(null)
  }

  const pendingCandidates = candidates.filter((c) => c.review_status === 'pending')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-stone-900" style={{ fontFamily: 'Nunito, sans-serif' }}>
          📥 Import de lieux
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Importez un fichier JSON ou CSV (séparateur <code>;</code>) de candidats. Chaque lieu doit être validé manuellement avant publication.
        </p>
      </div>

      {/* Format spec */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{ background: '#fafaf9', border: '1px solid #f5f5f4' }}
      >
        <details>
          <summary className="font-bold text-sm cursor-pointer text-stone-700" style={{ fontFamily: 'Nunito, sans-serif' }}>
            📋 Format JSON attendu (cliquez pour voir)
          </summary>
          <div className="mt-4">
            <p className="text-xs text-stone-500 mb-3">
              Le fichier doit contenir un tableau JSON (ou un objet avec une clé <code>places</code> ou <code>items</code>) :
            </p>
            <pre
              className="text-xs rounded-xl p-4 overflow-x-auto"
              style={{ background: '#1c1917', color: '#a8a29e', lineHeight: 1.6 }}
            >
{`[
  {
    "name": "Le Refuge",               // ← Obligatoire
    "category_slug": "restaurant",     // restaurant, cafe, plage, parc...
    "commune_slug": "saint-pierre",    // saint-denis, saint-paul...
    "address_text": "12 rue...",
    "lat": -21.341,
    "lng": 55.479,
    "website_url": "https://...",
    "phone": "0262 XX XX XX",
    "dog_policy": "conditional",       // allowed, conditional, disallowed, unknown
    "dog_conditions_text": "En terrasse, en laisse",
    "short_description": "Restaurant familial...",
    "source_type": "official_website", // manual, official_website, osm, google_places...
    "source_url": "https://...",
    "source_label": "Site officiel"
  }
]`}
            </pre>
            <div className="mt-3 flex gap-2">
              <Link
                href="/docs/import-template.json"
                className="text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ background: '#fff7ed', color: '#f97316' }}
              >
                ⬇️ Télécharger le template
              </Link>
            </div>
          </div>
        </details>
      </div>

      {/* Upload form */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: 'white', border: '1px solid #f5f5f4', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      >
        <h2 className="font-black text-stone-800 mb-4 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
          📤 Nouveau batch d&apos;import
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1.5" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Nom du batch *
            </label>
            <input
              type="text"
              placeholder="ex: OSM La Réunion - avril 2026"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none"
              style={{ borderColor: 'rgba(249,115,22,0.2)', background: '#fafaf9' }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1.5" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Fichier JSON *
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileChange}
              className="w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:cursor-pointer"
              style={{ color: '#78716c' }}
            />
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="mb-4 p-3 rounded-xl text-xs" style={{ background: '#f0fdf4', color: '#16a34a', fontFamily: 'monospace' }}>
            ✅ {preview.length} lignes prévisualisées (aperçu des 5 premières) — fichier valide
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-xl text-xs" style={{ background: '#fef2f2', color: '#dc2626' }}>
            ❌ {error}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading || !batchName || !fileRef.current?.files?.length}
          className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{
            background: uploading ? '#e5e7eb' : 'linear-gradient(135deg, #f97316, #fb923c)',
            color: uploading ? '#78716c' : 'white',
            fontFamily: 'Nunito, sans-serif',
            boxShadow: uploading ? 'none' : '0 2px 8px rgba(249,115,22,0.3)',
          }}
        >
          {uploading ? '⏳ Import en cours…' : '📥 Lancer l\'import'}
        </button>
      </div>

      {/* Historique batches */}
      <div
        className="rounded-2xl mb-6"
        style={{ background: 'white', border: '1px solid #f5f5f4', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#f5f5f4' }}>
          <h2 className="font-black text-stone-800 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
            📁 Historique des imports
          </h2>
          <button
            onClick={loadBatches}
            className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: '#fff7ed', color: '#f97316', fontFamily: 'Nunito, sans-serif' }}
          >
            {loadingBatches ? '…' : '↻ Actualiser'}
          </button>
        </div>
        {batches.length === 0 ? (
          <div className="px-6 py-8 text-center text-stone-400 text-sm">
            Aucun batch importé pour l&apos;instant
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#f5f5f4' }}>
            {batches.map((b) => (
              <div key={b.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-sm text-stone-800" style={{ fontFamily: 'Nunito, sans-serif' }}>{b.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {new Date(b.created_at).toLocaleDateString('fr-FR')} · {b.source_type} ·{' '}
                    <span style={{ color: '#22c55e' }}>{b.accepted_count} acceptés</span>
                    {' · '}
                    <span style={{ color: '#ef4444' }}>{b.rejected_count} rejetés</span>
                    {' · '}
                    <span style={{ color: '#f59e0b' }}>{b.pending_count} en attente</span>
                  </p>
                </div>
                <button
                  onClick={() => loadCandidates(b.id)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 transition-all"
                  style={{
                    background: selectedBatch === b.id ? '#f97316' : '#fff7ed',
                    color: selectedBatch === b.id ? 'white' : '#f97316',
                    fontFamily: 'Nunito, sans-serif',
                  }}
                >
                  Voir les candidats
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidates list */}
      {selectedBatch && (
        <div
          className="rounded-2xl"
          style={{ background: 'white', border: '1px solid #f5f5f4', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#f5f5f4' }}>
            <h2 className="font-black text-stone-800 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
              🔎 Candidats ({candidates.length}) — {pendingCandidates.length} en attente
            </h2>
            {pendingCandidates.length > 0 && (
              <button
                onClick={async () => {
                  for (const c of pendingCandidates) await acceptCandidate(c.id)
                }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ background: '#f0fdf4', color: '#16a34a', fontFamily: 'Nunito, sans-serif' }}
              >
                ✅ Tout accepter ({pendingCandidates.length})
              </button>
            )}
          </div>
          <div className="divide-y" style={{ borderColor: '#f5f5f4' }}>
            {candidates.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-sm text-stone-800" style={{ fontFamily: 'Nunito, sans-serif' }}>{c.name}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        background: c.review_status === 'accepted' ? '#f0fdf4' : c.review_status === 'rejected' ? '#fef2f2' : '#fff7ed',
                        color: c.review_status === 'accepted' ? '#16a34a' : c.review_status === 'rejected' ? '#dc2626' : '#d97706',
                      }}
                    >
                      {c.review_status === 'accepted' ? '✅ Accepté' : c.review_status === 'rejected' ? '❌ Rejeté' : '⏳ En attente'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    {[c.category_slug, c.commune_slug, DOG_POLICY_LABELS[c.dog_policy] ?? c.dog_policy].filter(Boolean).join(' · ')}
                    {c.address_text && ` · ${c.address_text}`}
                  </p>
                  {c.source_url && (
                    <a
                      href={c.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs hover:underline"
                      style={{ color: '#f97316' }}
                    >
                      {c.source_label ?? c.source_url}
                    </a>
                  )}
                </div>
                {c.review_status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => acceptCandidate(c.id)}
                      disabled={actionLoading === c.id}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: '#f0fdf4', color: '#16a34a', fontFamily: 'Nunito, sans-serif' }}
                    >
                      {actionLoading === c.id ? '…' : '✅ Accepter'}
                    </button>
                    <button
                      onClick={() => rejectCandidate(c.id)}
                      disabled={actionLoading === c.id}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: '#fef2f2', color: '#dc2626', fontFamily: 'Nunito, sans-serif' }}
                    >
                      ❌ Rejeter
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
