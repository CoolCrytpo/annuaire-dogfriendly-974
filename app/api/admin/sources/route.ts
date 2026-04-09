import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { sourceCreateSchema } from '@/lib/validation/schemas'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json() as unknown
  const parsed = sourceCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }

  const d = parsed.data

  // Si is_primary, déselectionner les autres sources primaires
  if (d.is_primary) {
    await pool.query('UPDATE place_sources SET is_primary = false WHERE place_id = $1', [d.place_id])
  }

  const result = await pool.query(
    `INSERT INTO place_sources (
       place_id, source_type, source_url, source_label, raw_excerpt,
       claim_dog_policy, claim_conditions_text, is_primary, published_or_seen_at, review_status
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'accepted') RETURNING id`,
    [
      d.place_id, d.source_type, d.source_url ?? null, d.source_label ?? null,
      d.raw_excerpt ?? null, d.claim_dog_policy ?? null, d.claim_conditions_text ?? null,
      d.is_primary, d.published_or_seen_at ?? null,
    ]
  )

  const sourceId = (result.rows[0] as { id: string }).id

  // Mettre à jour source_primary_id si nécessaire
  if (d.is_primary) {
    await pool.query('UPDATE places SET source_primary_id = $1 WHERE id = $2', [sourceId, d.place_id])
  }

  await logAudit({ user_id: user.id, entity_type: 'source', entity_id: sourceId, action: 'create', after: d })
  return NextResponse.json({ id: sourceId }, { status: 201 })
}
