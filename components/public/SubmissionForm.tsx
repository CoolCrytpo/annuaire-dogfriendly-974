'use client'

import { useState } from 'react'
import type { PlaceCategory, Commune, DogPolicy } from '@/lib/types'
import { DOG_POLICY_LABELS } from '@/lib/types'

interface Props {
  type: 'new_place' | 'correction'
  relatedPlaceId?: string
  relatedPlaceName?: string
  categories?: PlaceCategory[]
  communes?: Commune[]
}

const DOG_POLICIES: DogPolicy[] = ['allowed', 'conditional', 'disallowed', 'unknown']

export function SubmissionForm({ type, relatedPlaceId, relatedPlaceName, categories = [], communes = [] }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const form = e.currentTarget
    const data: Record<string, string> = { type }
    if (relatedPlaceId) data.related_place_id = relatedPlaceId

    new FormData(form).forEach((value, key) => {
      if (value && typeof value === 'string') data[key] = value
    })

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? 'Erreur serveur')
      }
      setStatus('success')
      form.reset()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-2xl mb-2">🐾</p>
        <p className="font-semibold text-green-800">Merci pour votre contribution !</p>
        <p className="text-sm text-green-700 mt-1">
          Votre {type === 'new_place' ? 'proposition' : 'correction'} a bien été reçue. Notre équipe la traitera prochainement.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {relatedPlaceName && (
        <div className="bg-gray-50 border rounded-lg px-4 py-3 text-sm text-gray-700">
          Correction pour : <strong>{relatedPlaceName}</strong>
        </div>
      )}

      {type === 'new_place' && (
        <>
          <div>
            <label htmlFor="submitted_name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom du lieu <span className="text-red-500">*</span>
            </label>
            <input
              id="submitted_name"
              name="submitted_name"
              type="text"
              required
              maxLength={200}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="submitted_category" className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                id="submitted_category"
                name="submitted_category"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">— Choisir —</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="submitted_commune" className="block text-sm font-medium text-gray-700 mb-1">Commune</label>
              <select
                id="submitted_commune"
                name="submitted_commune"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">— Choisir —</option>
                {communes.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="submitted_url" className="block text-sm font-medium text-gray-700 mb-1">Site web ou page (optionnel)</label>
            <input
              id="submitted_url"
              name="submitted_url"
              type="url"
              placeholder="https://"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </>
      )}

      <div>
        <label htmlFor="submitted_dog_policy" className="block text-sm font-medium text-gray-700 mb-1">
          Politique chiens (selon vous)
        </label>
        <select
          id="submitted_dog_policy"
          name="submitted_dog_policy"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">— Je ne sais pas —</option>
          {DOG_POLICIES.map((p) => (
            <option key={p} value={p}>{DOG_POLICY_LABELS[p]}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="submitted_conditions_text" className="block text-sm font-medium text-gray-700 mb-1">
          Conditions éventuelles
        </label>
        <input
          id="submitted_conditions_text"
          name="submitted_conditions_text"
          type="text"
          maxLength={500}
          placeholder="Ex : en terrasse uniquement, en laisse…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label htmlFor="submitted_message" className="block text-sm font-medium text-gray-700 mb-1">
          Message {type === 'correction' ? '/ justification' : ''} (optionnel)
        </label>
        <textarea
          id="submitted_message"
          name="submitted_message"
          rows={3}
          maxLength={1000}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>

      <div>
        <label htmlFor="submitter_email" className="block text-sm font-medium text-gray-700 mb-1">
          Votre e-mail (optionnel, pour suivi)
        </label>
        <input
          id="submitter_email"
          name="submitter_email"
          type="email"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2.5 transition-colors"
      >
        {status === 'loading' ? 'Envoi en cours…' : type === 'new_place' ? 'Proposer ce lieu' : 'Envoyer la correction'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Votre proposition sera examinée par notre équipe avant toute publication.
      </p>
    </form>
  )
}
