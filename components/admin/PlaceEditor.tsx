'use client'

import { useState } from 'react'
import type { Place, PlaceCategory, Commune } from '@/lib/types'
import { DOG_POLICY_LABELS } from '@/lib/types'

interface Props {
  place?: Partial<Place>
  categories: PlaceCategory[]
  communes: Commune[]
  onSave?: (data: Partial<Place>) => Promise<void>
}

const DOG_POLICIES = Object.keys(DOG_POLICY_LABELS) as Array<keyof typeof DOG_POLICY_LABELS>

export function PlaceEditor({ place = {}, categories, communes, onSave }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const form = e.currentTarget
    const fd = new FormData(form)
    const data: Record<string, unknown> = {}
    fd.forEach((v, k) => { if (v !== '') data[k] = v })

    // Conversions numériques
    if (data.lat) data.lat = parseFloat(data.lat as string)
    if (data.lng) data.lng = parseFloat(data.lng as string)
    if (data.category_id) data.category_id = parseInt(data.category_id as string)
    if (data.commune_id) data.commune_id = parseInt(data.commune_id as string)
    if (data.price_level) data.price_level = parseInt(data.price_level as string)

    try {
      if (onSave) {
        await onSave(data as Partial<Place>)
        setSuccess(true)
      } else {
        const url = place.id ? `/api/admin/places/${place.id}` : '/api/admin/places'
        const method = place.id ? 'PATCH' : 'POST'
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) {
          const err = await res.json() as { error?: string }
          throw new Error(err.error ?? 'Erreur serveur')
        }
        setSuccess(true)
        if (!place.id) {
          const created = await res.json() as { id: string }
          window.location.href = `/admin/places/${created.id}`
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-800">
          Enregistré avec succès.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Identité */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Identité</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom <span className="text-red-500">*</span></label>
            <input name="name" defaultValue={place.name ?? ''} required maxLength={200}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select name="category_id" defaultValue={place.category_id ?? ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none">
              <option value="">— Choisir —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commune</label>
            <select name="commune_id" defaultValue={place.commune_id ?? ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none">
              <option value="">— Choisir —</option>
              {communes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description courte</label>
            <input name="short_description" defaultValue={place.short_description ?? ''} maxLength={300}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Résumé éditorial</label>
            <textarea name="editorial_summary" defaultValue={place.editorial_summary ?? ''} rows={4} maxLength={1000}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none resize-none" />
          </div>
        </div>
      </section>

      {/* Politique chien */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Politique chien</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut <span className="text-red-500">*</span></label>
            <select name="dog_policy" defaultValue={place.dog_policy ?? 'unknown'} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none">
              {DOG_POLICIES.map((p) => <option key={p} value={p}>{DOG_POLICY_LABELS[p]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conditions</label>
            <input name="dog_conditions_text" defaultValue={place.dog_conditions_text ?? ''} maxLength={500}
              placeholder="Ex : en terrasse, en laisse…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </div>
        </div>
      </section>

      {/* Localisation */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Localisation</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input name="address_text" defaultValue={place.address_text ?? ''} maxLength={300}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input name="lat" type="number" step="any" defaultValue={place.lat ?? ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input name="lng" type="number" step="any" defaultValue={place.lng ?? ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Contact</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
            <input name="website_url" type="url" defaultValue={place.website_url ?? ''} placeholder="https://"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input name="phone" defaultValue={place.phone ?? ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Horaires</label>
            <input name="opening_hours_text" defaultValue={place.opening_hours_text ?? ''} maxLength={300}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </div>
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
          {saving ? 'Enregistrement…' : place.id ? 'Mettre à jour' : 'Créer la fiche'}
        </button>
        <a href="/admin/places" className="px-5 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg border border-gray-300 hover:bg-gray-50">
          Annuler
        </a>
      </div>
    </form>
  )
}
