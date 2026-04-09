import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { toSlug } from '@/lib/utils/slug'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === 'production') {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const candidateResult = await pool.query(
      'SELECT * FROM place_candidates WHERE id = $1',
      [id]
    )
    const c = candidateResult.rows[0]
    if (!c) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    if (c.review_status !== 'pending') {
      return NextResponse.json({ error: 'Already reviewed' }, { status: 400 })
    }

    // Find category and commune IDs
    let categoryId: number | null = null
    let communeId: number | null = null
    if (c.category_slug) {
      const r = await pool.query('SELECT id FROM place_categories WHERE slug = $1', [c.category_slug])
      categoryId = r.rows[0]?.id ?? null
    }
    if (c.commune_slug) {
      const r = await pool.query('SELECT id FROM communes WHERE slug = $1', [c.commune_slug])
      communeId = r.rows[0]?.id ?? null
    }

    // Create place
    const slug = toSlug(c.name)
    const placeResult = await pool.query(
      `INSERT INTO places (
        slug, name, normalized_name, category_id, commune_id,
        address_text, lat, lng, website_url, phone,
        dog_policy, dog_conditions_text, short_description,
        verification_status, confidence_score, confidence_level
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'draft',20,'low')
      ON CONFLICT (slug) DO UPDATE SET updated_at = now()
      RETURNING id`,
      [
        slug, c.name, c.normalized_name, categoryId, communeId,
        c.address_text, c.lat, c.lng, c.website_url, c.phone,
        c.dog_policy, c.dog_conditions_text, c.short_description,
      ]
    )
    const placeId = placeResult.rows[0].id

    // Create source
    if (c.source_url || c.source_label || c.source_type !== 'manual') {
      const sourceResult = await pool.query(
        `INSERT INTO place_sources (
          place_id, source_type, source_url, source_label,
          claim_dog_policy, claim_confidence, is_primary, review_status
        ) VALUES ($1,$2,$3,$4,$5,40,true,'accepted') RETURNING id`,
        [placeId, c.source_type, c.source_url, c.source_label, c.dog_policy]
      )
      await pool.query(
        'UPDATE places SET source_primary_id = $1 WHERE id = $2',
        [sourceResult.rows[0].id, placeId]
      )
    }

    // Mark candidate as accepted
    await pool.query(
      `UPDATE place_candidates SET review_status = 'accepted', reviewed_at = now(), matched_place_id = $1 WHERE id = $2`,
      [placeId, id]
    )

    // Update batch counts
    await pool.query(
      `UPDATE import_batches
       SET accepted_count = accepted_count + 1, pending_count = GREATEST(0, pending_count - 1)
       WHERE id = $1`,
      [c.import_batch_id]
    )

    return NextResponse.json({ place_id: placeId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
