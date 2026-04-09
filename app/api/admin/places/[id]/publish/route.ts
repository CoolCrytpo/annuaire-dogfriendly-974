import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { getPlaceById, getPlaceSources } from '@/lib/db/queries'
import { computeConfidence, computeFinalScore, scoreToLevel } from '@/lib/scoring/confidence'
import { logAudit } from '@/lib/audit'

interface Params { params: Promise<{ id: string }> }

export async function POST(_request: NextRequest, { params }: Params) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const place = await getPlaceById(id)
  if (!place) return NextResponse.json({ error: 'Fiche non trouvée' }, { status: 404 })

  // Conditions minimales de publication
  if (!place.dog_policy || place.dog_policy === 'unknown') {
    return NextResponse.json({ error: 'La politique chien doit être renseignée pour publier' }, { status: 422 })
  }

  const sources = await getPlaceSources(id)
  if (sources.filter((s) => s.is_primary).length === 0) {
    return NextResponse.json({ error: 'Au moins une source principale est requise' }, { status: 422 })
  }

  // Recalcul scoring
  const detail = computeConfidence(sources, place.last_verified_at ? new Date(place.last_verified_at) : null)
  const score = computeFinalScore(detail)
  const level = scoreToLevel(score)

  await pool.query(
    `UPDATE places SET
       verification_status = 'published',
       published_at = COALESCE(published_at, now()),
       last_verified_at = COALESCE(last_verified_at, now()),
       next_review_at = now() + interval '90 days',
       confidence_score = $1,
       confidence_level = $2,
       confidence_detail = $3
     WHERE id = $4`,
    [score, level, JSON.stringify(detail), id]
  )

  await logAudit({ user_id: user.id, entity_type: 'place', entity_id: id, action: 'publish' })
  return NextResponse.json({ ok: true })
}
