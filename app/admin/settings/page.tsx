'use client'

import { useState, useEffect } from 'react'

interface Setting {
  key: string
  value: string | null
  label: string
  description: string | null
}

const GROUPS = [
  {
    title: '🏷️ Identité du site',
    keys: ['site_name', 'site_tagline', 'site_description'],
  },
  {
    title: '📬 Contact',
    keys: ['contact_email'],
  },
  {
    title: '🗺️ Carte',
    keys: ['map_default_lat', 'map_default_lng', 'map_default_zoom'],
  },
  {
    title: '📱 Réseaux sociaux',
    keys: ['social_instagram', 'social_facebook'],
  },
  {
    title: '🛠️ Opérationnel',
    keys: ['maintenance_mode', 'contribution_delay'],
  },
]

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data: Setting[]) => {
        setSettings(data)
        const v: Record<string, string> = {}
        data.forEach((s) => { v[s.key] = s.value ?? '' })
        setValues(v)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const save = async (key: string) => {
    setSaving(key)
    setError(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: values[key] ?? '' }),
      })
      if (!res.ok) throw new Error()
      setSaved(key)
      setTimeout(() => setSaved(null), 2000)
    } catch {
      setError(key)
    } finally {
      setSaving(null)
    }
  }

  const getSetting = (key: string) => settings.find((s) => s.key === key)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-4xl mb-3">⚙️</div>
        <p className="text-stone-500">Chargement…</p>
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-stone-900" style={{ fontFamily: 'Nunito, sans-serif' }}>
          ⚙️ Paramètres du site
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Configurez l&apos;identité, le contenu et le comportement de l&apos;annuaire sans toucher au code.
        </p>
      </div>

      <div className="space-y-6">
        {GROUPS.map((group) => (
          <div
            key={group.title}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f5f5f4' }}
          >
            <div className="px-6 py-4 border-b" style={{ borderColor: '#f5f5f4', background: '#fafaf9' }}>
              <h2 className="font-black text-stone-800 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {group.title}
              </h2>
            </div>
            <div className="divide-y" style={{ borderColor: '#f5f5f4' }}>
              {group.keys.map((key) => {
                const s = getSetting(key)
                if (!s) return null
                const isBoolean = key === 'maintenance_mode'
                const isTextarea = key === 'site_description'

                return (
                  <div key={key} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <label
                          className="block text-sm font-bold text-stone-800 mb-0.5"
                          htmlFor={key}
                          style={{ fontFamily: 'Nunito, sans-serif' }}
                        >
                          {s.label}
                        </label>
                        {s.description && (
                          <p className="text-xs text-stone-400 mb-2">{s.description}</p>
                        )}
                        {isBoolean ? (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                setValues((v) => ({ ...v, [key]: v[key] === 'true' ? 'false' : 'true' }))
                                setTimeout(() => save(key), 0)
                              }}
                              className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
                              style={{
                                background: values[key] === 'true' ? '#f97316' : '#d6d3d1',
                              }}
                            >
                              <span
                                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                                style={{
                                  transform: values[key] === 'true' ? 'translateX(20px)' : 'translateX(0)',
                                }}
                              />
                            </button>
                            <span className="text-sm font-semibold" style={{ color: values[key] === 'true' ? '#ef4444' : '#78716c' }}>
                              {values[key] === 'true' ? '⚠️ Site en maintenance' : 'Site actif'}
                            </span>
                          </div>
                        ) : isTextarea ? (
                          <textarea
                            id={key}
                            rows={3}
                            value={values[key] ?? ''}
                            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                            className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none transition-all resize-none"
                            style={{
                              borderColor: 'rgba(249,115,22,0.2)',
                              background: '#fafaf9',
                            }}
                          />
                        ) : (
                          <input
                            id={key}
                            type="text"
                            value={values[key] ?? ''}
                            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && save(key)}
                            className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none transition-all"
                            style={{
                              borderColor: 'rgba(249,115,22,0.2)',
                              background: '#fafaf9',
                            }}
                          />
                        )}
                      </div>
                      {!isBoolean && (
                        <button
                          onClick={() => save(key)}
                          disabled={saving === key}
                          className="mt-6 flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                          style={{
                            background: saved === key ? '#f0fdf4' : error === key ? '#fef2f2' : 'linear-gradient(135deg, #f97316, #fb923c)',
                            color: saved === key ? '#16a34a' : error === key ? '#dc2626' : 'white',
                            fontFamily: 'Nunito, sans-serif',
                            opacity: saving === key ? 0.7 : 1,
                          }}
                        >
                          {saving === key ? '…' : saved === key ? '✓ Sauvegardé' : error === key ? '✕ Erreur' : 'Sauvegarder'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
