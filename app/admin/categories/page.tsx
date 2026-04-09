'use client'

import { useState, useEffect } from 'react'

interface Category {
  id: number
  slug: string
  label: string
  icon: string | null
  sort_order: number
  is_active: boolean
}

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [editCat, setEditCat] = useState<Partial<Category> | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/categories')
      const data = await r.json()
      setCats(data.categories ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggleActive = async (cat: Category) => {
    setSaving(cat.id)
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !cat.is_active }),
    })
    setCats((c) => c.map((x) => x.id === cat.id ? { ...x, is_active: !cat.is_active } : x))
    setSaving(null)
  }

  const moveOrder = async (cat: Category, direction: 'up' | 'down') => {
    const sorted = [...cats].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex((c) => c.id === cat.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const other = sorted[swapIdx]
    const newOrderA = other.sort_order
    const newOrderB = cat.sort_order

    await Promise.all([
      fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: newOrderA }),
      }),
      fetch(`/api/admin/categories/${other.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: newOrderB }),
      }),
    ])

    setCats((c) => c.map((x) => {
      if (x.id === cat.id) return { ...x, sort_order: newOrderA }
      if (x.id === other.id) return { ...x, sort_order: newOrderB }
      return x
    }))
  }

  const saveEdit = async () => {
    if (!editCat) return
    setSavingEdit(true)
    try {
      if (editCat.id) {
        await fetch(`/api/admin/categories/${editCat.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: editCat.label, icon: editCat.icon }),
        })
        setCats((c) => c.map((x) => x.id === editCat.id ? { ...x, ...editCat } : x))
      } else {
        await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editCat),
        })
        await load()
      }
      setEditCat(null)
    } finally {
      setSavingEdit(false)
    }
  }

  const sorted = [...cats].sort((a, b) => a.sort_order - b.sort_order)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><div className="text-4xl mb-3">🗂️</div><p className="text-stone-500">Chargement…</p></div>
    </div>
  )

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900" style={{ fontFamily: 'Nunito, sans-serif' }}>
            🗂️ Catégories
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Gérez l&apos;ordre d&apos;affichage et l&apos;activation des catégories.
          </p>
        </div>
        <button
          onClick={() => setEditCat({ label: '', icon: '', sort_order: cats.length * 10 + 10, is_active: true })}
          className="px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', color: 'white', fontFamily: 'Nunito, sans-serif' }}
        >
          + Ajouter
        </button>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'white', border: '1px solid #f5f5f4', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      >
        <div className="px-5 py-3 border-b grid grid-cols-12 text-xs font-bold text-stone-400 uppercase tracking-wider" style={{ borderColor: '#f5f5f4', fontFamily: 'Nunito, sans-serif' }}>
          <span className="col-span-1">Ordre</span>
          <span className="col-span-1">Icône</span>
          <span className="col-span-5">Nom</span>
          <span className="col-span-2">Slug</span>
          <span className="col-span-1 text-center">Actif</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        <div className="divide-y" style={{ borderColor: '#f5f5f4' }}>
          {sorted.map((cat, idx) => (
            <div key={cat.id} className="px-5 py-3 grid grid-cols-12 items-center gap-2" style={{ opacity: cat.is_active ? 1 : 0.5 }}>
              {/* Order */}
              <div className="col-span-1 flex flex-col gap-0.5">
                <button
                  onClick={() => moveOrder(cat, 'up')}
                  disabled={idx === 0}
                  className="w-6 h-5 rounded text-xs flex items-center justify-center disabled:opacity-20 transition-colors hover:bg-orange-50"
                  style={{ color: '#f97316' }}
                >
                  ▲
                </button>
                <button
                  onClick={() => moveOrder(cat, 'down')}
                  disabled={idx === sorted.length - 1}
                  className="w-6 h-5 rounded text-xs flex items-center justify-center disabled:opacity-20 transition-colors hover:bg-orange-50"
                  style={{ color: '#f97316' }}
                >
                  ▼
                </button>
              </div>

              {/* Icon */}
              <div className="col-span-1 text-2xl">{cat.icon}</div>

              {/* Label */}
              <div className="col-span-5">
                <span className="text-sm font-bold text-stone-800" style={{ fontFamily: 'Nunito, sans-serif' }}>{cat.label}</span>
              </div>

              {/* Slug */}
              <div className="col-span-2">
                <code className="text-xs text-stone-400">{cat.slug}</code>
              </div>

              {/* Toggle */}
              <div className="col-span-1 flex justify-center">
                <button
                  onClick={() => toggleActive(cat)}
                  disabled={saving === cat.id}
                  className="relative w-10 h-5 rounded-full transition-all"
                  style={{ background: cat.is_active ? '#f97316' : '#d6d3d1' }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    style={{ transform: cat.is_active ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>

              {/* Edit */}
              <div className="col-span-2 flex justify-end">
                <button
                  onClick={() => setEditCat(cat)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: '#f5f5f4', color: '#78716c', fontFamily: 'Nunito, sans-serif' }}
                >
                  ✏️ Modifier
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit modal */}
      {editCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: 'white' }}>
            <h3 className="font-black text-stone-800 mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {editCat.id ? '✏️ Modifier la catégorie' : '+ Nouvelle catégorie'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>Nom *</label>
                <input
                  type="text" placeholder="ex: Restaurant"
                  value={editCat.label ?? ''}
                  onChange={(e) => setEditCat((x) => ({ ...x, label: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none"
                  style={{ borderColor: 'rgba(249,115,22,0.2)', background: '#fafaf9' }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>Icône (emoji)</label>
                <input
                  type="text" placeholder="🍽️"
                  value={editCat.icon ?? ''}
                  onChange={(e) => setEditCat((x) => ({ ...x, icon: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none"
                  style={{ borderColor: 'rgba(249,115,22,0.2)', background: '#fafaf9' }}
                />
              </div>
              {!editCat.id && (
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>Slug (unique, sans accent)</label>
                  <input
                    type="text" placeholder="restaurant"
                    value={editCat.slug ?? ''}
                    onChange={(e) => setEditCat((x) => ({ ...x, slug: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none font-mono"
                    style={{ borderColor: 'rgba(249,115,22,0.2)', background: '#fafaf9' }}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={saveEdit}
                disabled={savingEdit || !editCat.label}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', color: 'white', fontFamily: 'Nunito, sans-serif' }}
              >
                {savingEdit ? '…' : '💾 Sauvegarder'}
              </button>
              <button
                onClick={() => setEditCat(null)}
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
  )
}
