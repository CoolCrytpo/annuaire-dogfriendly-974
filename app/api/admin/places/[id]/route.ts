import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { placeUpdateSchema } from '@/lib/validation/schemas'
import { logAudit } from '@/lib/audit'

interface Params { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const body = await request.json() as unknown
  const parsed = placeUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const setClauses: string[] = []
  const values: unknown[] = []
  let i = 1

  const fieldMap: Record<string, string> = {
    name: 'name', category_id: 'category_id', short_description: 'short_description',
    editorial_summary: 'editorial_summary', dog_policy: 'dog_policy',
    dog_conditions_text: 'dog_conditions_text', address_text: 'address_text',
    commune_id: 'commune_id', lat: 'lat', lng: 'lng',
    website_url: 'website_url', phone: 'phone', opening_hours_text: 'opening_hours_text',
  }

  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in data) {
      setClauses.push(`${col} = $${i}`)
      values.push(data[key as keyof typeof data] ?? null)
      i++
    }
  }

  // Mise à jour geom si lat/lng
  if (data.lat !== undefined && data.lng !== undefined) {
    setClauses.push(`geom = ST_SetSRID(ST_MakePoint($${i}, $${i+1}), 4326)`)
    values.push(data.lng, data.lat)
    i += 2
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
  }

  values.push(id)
  const result = await pool.query(
    `UPDATE places SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING id`,
    values
  )

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Fiche non trouvée' }, { status: 404 })
  }

  await logAudit({ user_id: user.id, entity_type: 'place', entity_id: id, action: 'update', after: data })
  return NextResponse.json({ ok: true })
}
