import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { toNormalizedName } from '@/lib/utils/slug'

export const maxDuration = 60

// Accepts { rows: [...] } (scraper format) or { name, items: [...] } (UI format)
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Support both formats
  const items = (Array.isArray(body.rows) ? body.rows : Array.isArray(body.items) ? body.items : []) as Record<string, unknown>[]
  const name = (body.name ?? body.batch_name ?? `Import ${new Date().toISOString().slice(0, 10)}`) as string

  if (items.length === 0) {
    return NextResponse.json({ error: 'No items' }, { status: 400 })
  }

  // Hard limit per request to stay under Vercel timeout
  const MAX = 500
  const valid = items.filter(i => String(i.name ?? '').trim()).slice(0, MAX)

  try {
    const batchResult = await pool.query(
      `INSERT INTO import_batches (name, source_type, total_count, pending_count)
       VALUES ($1, $2, $3, $3) RETURNING id`,
      [name, 'manual', valid.length]
    )
    const batchId = batchResult.rows[0].id

    const CHUNK = 100
    let insertedCount = 0

    for (let i = 0; i < valid.length; i += CHUNK) {
      const chunk = valid.slice(i, i + CHUNK)
      const params: unknown[] = []
      const placeholders = chunk.map((item, j) => {
        const base = j * 17
        params.push(
          batchId,
          String(item.name ?? '').trim(),
          toNormalizedName(String(item.name ?? '')),
          item.category_slug ?? item.category ?? null,
          item.commune_slug ?? item.commune ?? null,
          item.address_text ?? item.address ?? null,
          item.lat ?? null,
          item.lng ?? null,
          item.website_url ?? item.website ?? null,
          item.phone ?? null,
          item.dog_policy ?? 'unknown',
          item.dog_conditions_text ?? item.dog_policy_detail ?? null,
          item.short_description ?? null,
          item.source_type ?? 'manual',
          item.source_url ?? null,
          item.source_label ?? item.source_domain ?? null,
          JSON.stringify(item),
        )
        return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10},$${base+11},$${base+12},$${base+13},$${base+14},$${base+15},$${base+16},$${base+17})`
      }).join(',')

      await pool.query(
        `INSERT INTO place_candidates (
          import_batch_id, name, normalized_name, category_slug, commune_slug,
          address_text, lat, lng, website_url, phone,
          dog_policy, dog_conditions_text, short_description,
          source_type, source_url, source_label, raw_data
        ) VALUES ${placeholders}`,
        params
      )
      insertedCount += chunk.length
    }

    const truncated = items.length > MAX
    return NextResponse.json({
      batch_id: batchId,
      inserted: insertedCount,
      ...(truncated ? { warning: `Truncated to ${MAX} items. Send remaining items in a new request.` } : {}),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
