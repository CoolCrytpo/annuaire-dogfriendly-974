import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { placeCreateSchema } from '@/lib/validation/schemas'
import { toSlug, toNormalizedName } from '@/lib/utils/slug'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json() as unknown
  const parsed = placeCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const slug = toSlug(data.name)
  const normalized = toNormalizedName(data.name)

  // Vérifier unicité slug
  const existing = await pool.query('SELECT id FROM places WHERE slug = $1', [slug])
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: `Un lieu avec ce slug existe déjà : ${slug}` }, { status: 409 })
  }

  const result = await pool.query(
    `INSERT INTO places (
       slug, name, normalized_name, category_id, short_description, editorial_summary,
       dog_policy, dog_conditions_text, address_text, commune_id, postal_code,
       lat, lng, website_url, phone, email_public, opening_hours_text, price_level
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING id, slug`,
    [
      slug, data.name, normalized, data.category_id ?? null, data.short_description ?? null,
      data.editorial_summary ?? null, data.dog_policy, data.dog_conditions_text ?? null,
      data.address_text ?? null, data.commune_id ?? null, data.postal_code ?? null,
      data.lat ?? null, data.lng ?? null, data.website_url ?? null, data.phone ?? null,
      data.email_public ?? null, data.opening_hours_text ?? null, data.price_level ?? null,
    ]
  )

  const place = result.rows[0] as { id: string; slug: string }
  await logAudit({ user_id: user.id, entity_type: 'place', entity_id: place.id, action: 'create', after: data })

  return NextResponse.json(place, { status: 201 })
}
