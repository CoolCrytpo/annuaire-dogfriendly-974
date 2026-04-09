'use client'

import { useState, useEffect } from 'react'

interface Sponsor {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  tagline: string | null
  is_active: boolean
  display_order: number
  starts_at: string | null
  ends_at: string | null
}

interface AdSlot {
  id: string
  slot_key: string
  label: string
  description: string | null
  is_active: boolean
  content_html: string | null
  link_url: string | null
  image_url: string | null
  position: string
}

export default function AdminSponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [adSlots, setAdSlots] = useState<AdSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'sponsors' | 'ads'>('sponsors')
  const [editSponsor, setEditSponsor] = useState<Partial<Sponsor> | null>(null)
  const [editSlot, setEditSlot] = useState<Partial<AdSlot> | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [sr, ar] = await Promise.all([
        fetch('/api/admin/sponsors').then((r) => r.json()),
        fetch('/api/admin/ad-slots').then((r) => r.json()),
      ])
      setSponsors(sr.sponsors ?? [])
      setAdSlots(ar.slots ?? [])
    } finally {
      setLoading(false)
    }
  }

  const toggleSponsor = async (id: string, is_active: boolean) => {
    await fetch(`/api/admin/sponsors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active }),
    })
    setSponsors((s) => s.map((x) => x.id === id ? { ...x, is_active } : x))
  }

  const toggleSlot = async (id: string, is_active: boolean) => {
    await fetch(`/api/admin/ad-slots/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active }),
    })
    setAdSlots((s) => s.map((x) => x.id === id ? { ...x, is_active } : x))
  }

  const saveSponsor = async () => {
    if (!editSponsor) return
    setSaving(true)
    try {
      if (editSponsor.id) {
        await fetch(`/api/admin/sponsors/${editSponsor.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editSponsor),
        })
      } else {
        await fetch('/api/admin/sponsors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editSponsor),
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      setEditSponsor(null)
      await loadAll()
    } finally {
      setSaving(false)
    }
  }

  const saveSlot = async () => {
    if (!editSlot?.id) return
    setSaving(true)
    try {
      await fetch(`/api/admin/ad-slots/${editSlot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editSlot),
      })
      setEditSlot(null)
      await loadAll()
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><div className="text-4xl mb-3">📣</div><p className="text-stone-500">Chargement…</p></div>
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-stone-900" style={{ fontFamily: 'Nunito, sans-serif' }}>
          📣 Sponsors & Publicités
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Gérez vos partenaires et emplacements publicitaires. Tout peut être activé/désactivé sans déploiement.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{ key: 'sponsors', label: '🤝 Sponsors' }, { key: 'ads', label: '📍 Emplacements pub' }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'sponsors' | 'ads')}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              fontFamily: 'Nunito, sans-serif',
              background: tab === t.key ? 'linear-gradient(135deg, #f97316, #fb923c)' : 'white',
              color: tab === t.key ? 'white' : '#78716c',
              boxShadow: tab === t.key ? '0 2px 8px rgba(249,115,22,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sponsors' ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-stone-500">{sponsors.length} sponsor(s)</p>
            <button
              onClick={() => setEditSponsor({ name: '', is_active: false, display_order: 0 })}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', color: 'white', fontFamily: 'Nunito, sans-serif' }}
            >
              + Ajouter un sponsor
            </button>
          </div>

          <div className="space-y-3">
            {sponsors.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: 'white', border: '1px solid #f5f5f4', opacity: s.is_active ? 1 : 0.6 }}
              >
                {s.logo_url ? (
                  <img src={s.logo_url} alt={s.name} className="w-12 h-12 rounded-xl object-contain border" style={{ borderColor: '#f5f5f4' }} />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: '#fff7ed' }}>
                    🏢
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-stone-800" style={{ fontFamily: 'Nunito, sans-serif' }}>{s.name}</p>
                  {s.tagline && <p className="text-xs text-stone-400 truncate">{s.tagline}</p>}
                  {s.website_url && (
                    <a href={s.website_url} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: '#f97316' }}>
                      {s.website_url}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditSponsor(s)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg"
                    style={{ background: '#f5f5f4', color: '#78716c', fontFamily: 'Nunito, sans-serif' }}
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => toggleSponsor(s.id, !s.is_active)}
                    className="relative w-10 h-5 rounded-full transition-all"
                    style={{ background: s.is_active ? '#f97316' : '#d6d3d1' }}
                    title={s.is_active ? 'Désactiver' : 'Activer'}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                      style={{ transform: s.is_active ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sponsor edit modal */}
          {editSponsor && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
              <div className="w-full max-w-md rounded-3xl p-6" style={{ background: 'white' }}>
                <h3 className="font-black text-stone-800 mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {editSponsor.id ? '✏️ Modifier le sponsor' : '+ Nouveau sponsor'}
                </h3>
                <div className="space-y-3">
                  {[
                    { key: 'name', label: 'Nom *', placeholder: 'Nom du sponsor' },
                    { key: 'tagline', label: 'Accroche', placeholder: 'Courte description' },
                    { key: 'website_url', label: 'URL site web', placeholder: 'https://...' },
                    { key: 'logo_url', label: 'URL logo', placeholder: 'https://...logo.png' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold text-stone-600 mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {f.label}
                      </label>
                      <input
                        type="text"
                        placeholder={f.placeholder}
                        value={(editSponsor as Record<string, string>)[f.key] ?? ''}
                        onChange={(e) => setEditSponsor((x) => ({ ...x, [f.key]: e.target.value }))}
                        className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none"
                        style={{ borderColor: 'rgba(249,115,22,0.2)', background: '#fafaf9' }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={saveSponsor}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', color: 'white', fontFamily: 'Nunito, sans-serif' }}
                  >
                    {saving ? '…' : '💾 Sauvegarder'}
                  </button>
                  <button
                    onClick={() => setEditSponsor(null)}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: '#f5f5f4', color: '#78716c', fontFamily: 'Nunito, sans-serif' }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Ad slots */
        <div className="space-y-3">
          <p className="text-sm text-stone-500 mb-4">
            Ces emplacements sont intégrés dans le site public. Activez-les et configurez leur contenu.
          </p>
          {adSlots.map((slot) => (
            <div
              key={slot.id}
              className="rounded-2xl p-5"
              style={{ background: 'white', border: '1px solid #f5f5f4', opacity: slot.is_active ? 1 : 0.65 }}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-bold text-sm text-stone-800" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {slot.label}
                    <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full" style={{ background: '#f5f5f4', color: '#78716c' }}>
                      {slot.position}
                    </span>
                  </p>
                  {slot.description && <p className="text-xs text-stone-400 mt-0.5">{slot.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditSlot(slot)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg"
                    style={{ background: '#f5f5f4', color: '#78716c', fontFamily: 'Nunito, sans-serif' }}
                  >
                    ✏️ Configurer
                  </button>
                  <button
                    onClick={() => toggleSlot(slot.id, !slot.is_active)}
                    className="relative w-10 h-5 rounded-full transition-all"
                    style={{ background: slot.is_active ? '#f97316' : '#d6d3d1' }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                      style={{ transform: slot.is_active ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>
              </div>
              {(slot.image_url || slot.link_url || slot.content_html) && slot.is_active && (
                <div className="text-xs p-3 rounded-xl" style={{ background: '#fafaf9', color: '#78716c' }}>
                  {slot.image_url && <p>🖼️ Image: <span className="font-mono">{slot.image_url}</span></p>}
                  {slot.link_url && <p>🔗 Lien: <span className="font-mono">{slot.link_url}</span></p>}
                  {slot.content_html && <p>📝 HTML: configuré</p>}
                </div>
              )}
            </div>
          ))}

          {/* Slot edit modal */}
          {editSlot && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
              <div className="w-full max-w-md rounded-3xl p-6" style={{ background: 'white' }}>
                <h3 className="font-black text-stone-800 mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  ✏️ Configurer l&apos;emplacement
                </h3>
                <p className="text-xs text-stone-400 mb-4">
                  Slot : <code className="font-mono">{editSlot.slot_key}</code> · Position : {editSlot.position}
                </p>
                <div className="space-y-3">
                  {[
                    { key: 'image_url', label: 'URL image', placeholder: 'https://...banner.jpg' },
                    { key: 'link_url', label: 'URL du lien', placeholder: 'https://...' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold text-stone-600 mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {f.label}
                      </label>
                      <input
                        type="text"
                        placeholder={f.placeholder}
                        value={(editSlot as Record<string, string>)[f.key] ?? ''}
                        onChange={(e) => setEditSlot((x) => ({ ...x, [f.key]: e.target.value }))}
                        className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none"
                        style={{ borderColor: 'rgba(249,115,22,0.2)', background: '#fafaf9' }}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Contenu HTML (optionnel)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="<div>...</div>"
                      value={editSlot.content_html ?? ''}
                      onChange={(e) => setEditSlot((x) => ({ ...x, content_html: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none resize-none font-mono"
                      style={{ borderColor: 'rgba(249,115,22,0.2)', background: '#fafaf9', fontSize: '11px' }}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={saveSlot}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', color: 'white', fontFamily: 'Nunito, sans-serif' }}
                  >
                    {saving ? '…' : '💾 Sauvegarder'}
                  </button>
                  <button
                    onClick={() => setEditSlot(null)}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: '#f5f5f4', color: '#78716c', fontFamily: 'Nunito, sans-serif' }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
