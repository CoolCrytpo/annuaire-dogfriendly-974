import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { toNormalizedName } from '@/lib/utils/slug'

export async function GET(req: NextRequest) {
  const batchId = req.nextUrl.searchParams.get('batch_id')

  try {
    if (batchId) {
      const result = await pool.query(
        `SELECT * FROM place_candidates WHERE import_batch_id = $1 ORDER BY created_at ASC`,
        [batchId]
      )
      return NextResponse.json({ candidates: result.rows })
    }

    const result = await pool.query(
      `SELECT * FROM import_batches ORDER BY created_at DESC LIMIT 50`
    )
    return NextResponse.json({ batches: result.rows })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, items } = await req.json() as {
      name: string
      items: Record<string, unknown>[]
    }

    if (!name || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Create batch
    const batchResult = await pool.query(
      `INSERT INTO import_batches (name, source_type, total_count, pending_count)
       VALUES ($1, $2, $3, $3) RETURNING id`,
      [name, 'manual', items.length]
    )
    const batchId = batchResult.rows[0].id

    // Insert candidates
    const inserted: unknown[] = []
    for (const item of items) {
      const candidateName = String(item.name ?? '')
      if (!candidateName) continue

      const r = await pool.query(
        `INSERT INTO place_candidates (
          import_batch_id, name, normalized_name, category_slug, commune_slug,
          address_text, lat, lng, website_url, phone,
          dog_policy, dog_conditions_text, short_description,
          source_type, source_url, source_label, raw_data
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        RETURNING id`,
        [
          batchId,
          candidateName,
          toNormalizedName(candidateName),
          item.category_slug ?? null,
          item.commune_slug ?? null,
          item.address_text ?? null,
          item.lat ?? null,
          item.lng ?? null,
          item.website_url ?? null,
          item.phone ?? null,
          item.dog_policy ?? 'unknown',
          item.dog_conditions_text ?? null,
          item.short_description ?? null,
          item.source_type ?? 'manual',
          item.source_url ?? null,
          item.source_label ?? null,
          JSON.stringify(item),
        ]
      )
      inserted.push(r.rows[0])
    }

    return NextResponse.json({ batch_id: batchId, inserted: inserted.length })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
