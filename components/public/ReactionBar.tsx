'use client'

import { useEffect, useState, useTransition } from 'react'

interface Props {
  placeId: string
  initialCounts?: { utile: number; merci: number; jadore: number; oups: number }
}

const REACTIONS = [
  { type: 'utile',  emoji: '👍', label: 'Utile' },
  { type: 'merci',  emoji: '🙏', label: 'Merci' },
  { type: 'jadore', emoji: '💛', label: "J'adore" },
  { type: 'oups',   emoji: '😬', label: 'Oups' },
] as const

type ReactionType = typeof REACTIONS[number]['type']

// Hash device anonyme — stable par navigateur, stocké en localStorage
function getAnonHash(): string {
  const KEY = 'df974_anon'
  let h = localStorage.getItem(KEY)
  if (!h) {
    h = Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(KEY, h)
  }
  return h
}

export function ReactionBar({ placeId, initialCounts }: Props) {
  const [counts, setCounts] = useState(initialCounts ?? { utile: 0, merci: 0, jadore: 0, oups: 0 })
  const [myReactions, setMyReactions] = useState<Set<ReactionType>>(new Set())
  const [, startTransition] = useTransition()

  // Charge les réactions de l'utilisateur depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`df974_rx_${placeId}`)
    if (stored) {
      try { setMyReactions(new Set(JSON.parse(stored) as ReactionType[])) } catch { /* ignore */ }
    }
  }, [placeId])

  const toggle = (type: ReactionType) => {
    const anonHash = getAnonHash()
    const isActive = myReactions.has(type)

    // Optimistic update
    const next = new Set(myReactions)
    if (isActive) next.delete(type)
    else next.add(type)
    setMyReactions(next)
    setCounts((prev) => ({ ...prev, [type]: Math.max(0, prev[type] + (isActive ? -1 : 1)) }))
    localStorage.setItem(`df974_rx_${placeId}`, JSON.stringify([...next]))

    startTransition(async () => {
      try {
        await fetch(`/api/reactions/${placeId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, anonHash, action: isActive ? 'remove' : 'add' }),
        })
      } catch {
        // Rollback on error
        setMyReactions(myReactions)
        setCounts((prev) => ({ ...prev, [type]: Math.max(0, prev[type] + (isActive ? 1 : -1)) }))
      }
    })
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'white', border: '1px solid rgba(249,115,22,0.1)', boxShadow: '0 2px 8px rgba(249,115,22,0.06)' }}
    >
      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#a8a29e', fontFamily: 'Nunito, sans-serif' }}>
        Cette fiche vous a été utile ?
      </p>
      <div className="flex gap-2 flex-wrap">
        {REACTIONS.map(({ type, emoji, label }) => {
          const active = myReactions.has(type)
          const count = counts[type]
          return (
            <button
              key={type}
              onClick={() => toggle(type)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold transition-all active:scale-95"
              style={{
                fontFamily: 'Nunito, sans-serif',
                background: active ? '#fff7ed' : '#f8fafc',
                color: active ? '#f97316' : '#78716c',
                border: `1.5px solid ${active ? '#f97316' : 'rgba(0,0,0,0.08)'}`,
                boxShadow: active ? '0 2px 8px rgba(249,115,22,0.2)' : 'none',
              }}
              aria-pressed={active}
              title={label}
            >
              <span className="text-base">{emoji}</span>
              <span>{label}</span>
              {count > 0 && (
                <span
                  className="ml-0.5 text-xs font-black"
                  style={{ color: active ? '#f97316' : '#a8a29e' }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
