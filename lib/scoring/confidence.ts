import type { PlaceSource, ConfidenceDetail, ConfidenceLevel, ConfidenceSignal } from '@/lib/types'

// ─── Scoring de confiance — Annuaire Dog Friendly 974 ────────────────────────

const SOURCE_TYPE_WEIGHT: Record<string, number> = {
  official_website: 35,
  phone_call: 20,
  onsite_check: 20,
  manual: 15,
  partner_feed: 15,
  social_page: 10,
  booking_site: 10,
  google_places: 8,
  osm: 8,
  user_submission: 5,
}

function getFreshnessMultiplier(verifiedAt: Date | null): number {
  if (!verifiedAt) return 0.5
  const days = (Date.now() - verifiedAt.getTime()) / (1000 * 60 * 60 * 24)
  if (days < 90) return 1.0
  if (days < 180) return 0.85
  if (days < 365) return 0.65
  return 0.4
}

export function computeConfidence(
  sources: PlaceSource[],
  lastVerifiedAt: Date | null
): ConfidenceDetail {
  const signals: ConfidenceSignal[] = []
  let raw = 0

  const accepted = sources.filter((s) => s.review_status === 'accepted')
  const primary = accepted.find((s) => s.is_primary)
  const hasConflict = accepted.some((s) => s.is_conflicting)

  if (primary) {
    const w = SOURCE_TYPE_WEIGHT[primary.source_type] ?? 5
    raw += w
    signals.push({ label: `Source principale (${primary.source_type})`, delta: w })
  }

  if (accepted.length >= 2) {
    const coherent = accepted.filter((s) => !s.is_conflicting)
    if (coherent.length >= 2) {
      raw += 10
      signals.push({ label: 'Plusieurs sources cohérentes', delta: 10 })
    }
  }

  // Pénalités
  if (hasConflict) {
    raw -= 30
    signals.push({ label: 'Contradiction entre sources', delta: -30 })
  }

  if (!primary || primary.claim_dog_policy === 'unknown' || !primary.raw_excerpt) {
    raw -= 25
    signals.push({ label: 'Donnée déclarative sans preuve explicite', delta: -25 })
  }

  const primaryAge = primary?.published_or_seen_at
    ? (Date.now() - new Date(primary.published_or_seen_at).getTime()) / (1000 * 60 * 60 * 24)
    : null

  if (primaryAge !== null && primaryAge > 365) {
    raw -= 20
    signals.push({ label: 'Source principale > 1 an', delta: -20 })
  }

  const freshness = getFreshnessMultiplier(lastVerifiedAt)
  const final = Math.max(0, Math.min(100, Math.round(raw * freshness)))

  return {
    raw_score: raw,
    signals,
    freshness_multiplier: freshness,
  }
}

export function scoreToLevel(score: number): ConfidenceLevel {
  if (score >= 75) return 'high'
  if (score >= 45) return 'medium'
  return 'low'
}

export function computeFinalScore(detail: ConfidenceDetail): number {
  return Math.max(0, Math.min(100, Math.round(detail.raw_score * detail.freshness_multiplier)))
}
